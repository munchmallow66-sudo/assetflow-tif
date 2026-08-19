import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import {
  CSRF_COOKIE,
  csrfCookieOptions,
  generateCsrfToken,
  isCsrfValid,
  isSameOrigin,
  requiresCsrfCheck,
} from '@/lib/csrf';
import { safeRedirectPath } from '@/lib/redirect';

const isDev = process.env.NODE_ENV === 'development';

/** Pages anyone may open without a session. */
const PUBLIC_PAGES = ['/', '/login', '/scan'];

/** Pages restricted to particular roles. Longest matching prefix wins. */
const ROLE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/users', roles: ['ADMIN'] },
  { prefix: '/returns/new', roles: ['ADMIN', 'STAFF', 'APPROVER'] },
];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.includes(pathname) || pathname.startsWith('/scan/');
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced bootstrap script load its own chunks,
    // which is what removes the need for 'unsafe-inline' here. Dev also needs
    // 'unsafe-eval': React uses eval there to rebuild server error stacks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Styles keep 'unsafe-inline'. Tailwind and the framework both emit style
    // tags without a nonce, and injected CSS is not script execution.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://res.cloudinary.com https://api.qrserver.com",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp(nonce);

  // Next re-reads the nonce from the forwarded request headers and stamps it
  // onto the scripts it emits, so it has to travel with the request as well as
  // with the response.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const forward = () => NextResponse.next({ request: { headers: requestHeaders } });

  // ---- CSRF: every mutating API call echoes its cookie back in a header ----
  if (requiresCsrfCheck(request)) {
    if (!isSameOrigin(request)) {
      return withCsp(
        NextResponse.json({ message: 'คำขอถูกปฏิเสธ เนื่องจากต้นทางของคำขอไม่ถูกต้อง' }, { status: 403 }),
        csp,
      );
    }
    if (!isCsrfValid(request)) {
      return withCsp(
        NextResponse.json(
          { message: 'คำขอถูกปฏิเสธ เนื่องจากโทเคนความปลอดภัยไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่' },
          { status: 403 },
        ),
        csp,
      );
    }
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  let response: NextResponse;

  if (isApi) {
    // Route handlers answer 401/403 themselves, with their own messages and
    // per-role rules, so this only forwards. The ones that legitimately run
    // without a session (login, logout, scan-public) simply never call
    // getAuthUser, or tolerate it returning null.
    response = forward();
  } else if (isPublicPage(pathname)) {
    response =
      payload && pathname === '/login'
        ? NextResponse.redirect(new URL('/dashboard', request.url))
        : forward();
  } else if (!payload) {
    // Deciding here, before the page renders, is the point of this file: an
    // unauthenticated browser never receives the protected page at all, so it
    // cannot flash on screen ahead of a client-side redirect. An expired token
    // arrives here too, because verifyToken rejects it.
    const loginUrl = new URL('/login', request.url);
    // Validated on the way out as well as on the way back: the value becomes
    // attacker-controllable the moment it is in the URL, so neither end trusts
    // the other to have checked it.
    const from = safeRedirectPath(pathname);
    if (from) loginUrl.searchParams.set('from', from);
    response = NextResponse.redirect(loginUrl);
    // Expire the dead cookie so the browser stops replaying it.
    response.cookies.set(AUTH_COOKIE, '', {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } else {
    const rule = ROLE_RULES.filter((r) => pathname.startsWith(r.prefix)).sort(
      (a, b) => b.prefix.length - a.prefix.length,
    )[0];

    response =
      rule && !rule.roles.includes(payload.role)
        ? NextResponse.redirect(new URL('/dashboard', request.url))
        : forward();
  }

  // Minted on the first request that lacks one, so a token is already in the
  // jar before any form is submitted, the login form included.
  if (!request.cookies.get(CSRF_COOKIE)?.value) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions());
  }

  return withCsp(response, csp);
}

/** Only the CSP is set here; the request-independent headers live in next.config.ts. */
function withCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's build output and static files, which are served
     * from disk and need neither a session check nor a nonce.
     *
     * Prefetches are deliberately NOT excluded: this file is the auth guard, and
     * letting a prefetch skip it would render protected pages for a browser that
     * has no session.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$).*)',
  ],
};
