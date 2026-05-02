import { PrismaClient } from "@prisma/client";
import { logger } from "@/modules/system/log/logger";
import {
  DEFAULT_SETTINGS,
  KNOWN_KEYS,
} from "@/modules/admin-manage/admin-system-settings/model/model";
import { defaultSettings } from "@/share/common/seed-setting";
import { defaultPartnerSettings } from "@/modules/partner-manage/partner-setting/model/model";

const BATCH = 500;

/**
 * seedSystemSettings
 *
 * Inserts any SystemSetting key that is missing from the DB using the
 * compile-time DEFAULT_SETTINGS map.  Existing rows are never overwritten so
 * admin-configured values are always preserved.
 */
async function seedSystemSettings(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.systemSetting.findMany({ select: { key: true } });
  const presentKeys = new Set(existing.map((r) => r.key));

  const missing = KNOWN_KEYS.filter((k) => !presentKeys.has(k));
  if (missing.length === 0) {
    logger.info("[Seed] SystemSetting — all keys present, nothing to seed");
    return;
  }

  await prisma.systemSetting.createMany({
    data: missing.map((key) => ({ key, value: DEFAULT_SETTINGS[key] })),
    skipDuplicates: true,
  });

  logger.info(`[Seed] SystemSetting — seeded ${missing.length} missing key(s)`, { keys: missing });
}

/**
 * seedUserSettings
 *
 * Creates a UserSetting row with defaults for every User that does not yet
 * have one.  Runs in batches to avoid memory issues on large datasets.
 */
async function seedUserSettings(prisma: PrismaClient): Promise<void> {
  // IDs of users that already have a setting row
  const existing = await prisma.userSetting.findMany({ select: { userId: true } });
  const covered = new Set(existing.map((r) => r.userId));

  let cursor: string | undefined;
  let total = 0;

  while (true) {
    const users = await prisma.user.findMany({
      select: { id: true },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (users.length === 0) break;

    const toCreate = users
      .filter((u) => !covered.has(u.id))
      .map((u) => ({ userId: u.id, ...defaultSettings }));

    if (toCreate.length > 0) {
      await prisma.userSetting.createMany({ data: toCreate, skipDuplicates: true });
      total += toCreate.length;
    }

    cursor = users[users.length - 1].id;
  }

  if (total > 0) {
    logger.info(`[Seed] UserSetting — created ${total} missing row(s)`);
  } else {
    logger.info("[Seed] UserSetting — all users covered, nothing to seed");
  }
}

/**
 * seedPartnerSettings
 *
 * Creates a PartnerSetting row with defaults for every Partner that does not
 * yet have one.
 */
async function seedPartnerSettings(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.partnerSetting.findMany({ select: { partnerId: true } });
  const covered = new Set(existing.map((r) => r.partnerId));

  let cursor: string | undefined;
  let total = 0;

  while (true) {
    const partners = await prisma.partner.findMany({
      select: { id: true },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (partners.length === 0) break;

    const toCreate = partners
      .filter((p) => !covered.has(p.id))
      .map((p) => ({ partnerId: p.id, ...defaultPartnerSettings }));

    if (toCreate.length > 0) {
      await prisma.partnerSetting.createMany({ data: toCreate, skipDuplicates: true });
      total += toCreate.length;
    }

    cursor = partners[partners.length - 1].id;
  }

  if (total > 0) {
    logger.info(`[Seed] PartnerSetting — created ${total} missing row(s)`);
  } else {
    logger.info("[Seed] PartnerSetting — all partners covered, nothing to seed");
  }
}

/**
 * seedDefaults
 *
 * Idempotent startup seed that ensures every entity has its required default
 * configuration rows.  Safe to call on every boot — only creates what is
 * missing, never overwrites existing data.
 */
export async function seedDefaults(prisma: PrismaClient): Promise<void> {
  logger.info("[Seed] Running default seed checks...");

  await Promise.all([
    seedSystemSettings(prisma),
    seedUserSettings(prisma),
    seedPartnerSettings(prisma),
  ]);

  logger.info("[Seed] Default seed checks complete");
}
