import { AssetStatus, ConditionStatus } from '@prisma/client';
import { prisma } from './prisma';

/** SystemSetting is a singleton row; this is its fixed id. */
export const SETTINGS_ID = 'default-settings-id';

/**
 * The system settings, creating the row with its schema defaults on first use.
 *
 * Shared so that the screens which display a setting and the code which enforces
 * it read the same row. maxBorrowDays and autoMaintenanceOnDamaged were
 * previously editable but ignored, which is exactly what a second source of
 * truth produces.
 */
export async function getSystemSettings() {
  const existing = await prisma.systemSetting.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;

  return prisma.systemSetting.create({ data: { id: SETTINGS_ID } });
}

/**
 * What a returned asset's status becomes, given the condition it came back in.
 *
 * Both return paths go through here - the admin recording a return directly and
 * the admin approving one a staff member submitted - so the
 * autoMaintenanceOnDamaged setting cannot apply to one and not the other.
 *
 * A lost asset is marked LOST regardless: that is a fact about the asset, not a
 * policy choice. Only the damaged case is configurable.
 */
export function assetStatusAfterReturn(
  condition: ConditionStatus,
  autoMaintenanceOnDamaged: boolean,
): AssetStatus {
  if (condition === ConditionStatus.LOST) return AssetStatus.LOST;
  if (condition === ConditionStatus.DAMAGED) {
    return autoMaintenanceOnDamaged ? AssetStatus.MAINTENANCE : AssetStatus.AVAILABLE;
  }
  return AssetStatus.AVAILABLE;
}
