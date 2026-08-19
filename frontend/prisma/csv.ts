/**
 * CSV helpers for the seed script. Kept in its own module so the parser can be
 * exercised without importing seed.ts, which connects to the database on load.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Role } from '@prisma/client';

export const EMPLOYEE_CSV = path.join(__dirname, 'employees.csv');
export const EMPLOYEE_CSV_EXAMPLE = path.join(__dirname, 'employees.example.csv');

export interface SeedEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  phone: string | null;
  role: Role;
}

/** Minimal RFC-4180 parser: handles quoted fields, embedded commas and "" escapes. */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  return rows;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Environment variable ${name} is not set. Seeding is aborted so that no ` +
        `account is ever created with a password baked into the repository. ` +
        `Set ${name} in frontend/.env before running the seed.`,
    );
  }
  return value;
}

export function readEmployees(): SeedEmployee[] {
  if (!fs.existsSync(EMPLOYEE_CSV)) {
    throw new Error(
      `${EMPLOYEE_CSV} was not found. Real employee records are deliberately kept ` +
        `out of version control. Copy ${EMPLOYEE_CSV_EXAMPLE} to employees.csv and ` +
        `fill it with the roster you want to seed.`,
    );
  }

  const rows = parseCsv(fs.readFileSync(EMPLOYEE_CSV, 'utf-8'));
  if (rows.length < 2) {
    throw new Error(`${EMPLOYEE_CSV} contains a header but no employee rows.`);
  }

  const header = rows[0].map((h) => h.trim());
  const required = ['employeeCode', 'firstName', 'lastName', 'department', 'email', 'phone', 'role'];
  const missing = required.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw new Error(`${EMPLOYEE_CSV} is missing required column(s): ${missing.join(', ')}`);
  }

  const validRoles = Object.values(Role) as string[];

  return rows.slice(1).map((cells, index) => {
    const record: Record<string, string> = {};
    header.forEach((column, i) => {
      record[column] = (cells[i] ?? '').trim();
    });

    const role = record.role.toUpperCase();
    if (!validRoles.includes(role)) {
      throw new Error(
        `Row ${index + 2} of employees.csv has an unknown role "${record.role}". ` +
          `Expected one of: ${validRoles.join(', ')}.`,
      );
    }

    return {
      employeeCode: record.employeeCode,
      firstName: record.firstName,
      lastName: record.lastName,
      department: record.department,
      email: record.email,
      phone: record.phone === '' ? null : record.phone,
      role: role as Role,
    };
  });
}
