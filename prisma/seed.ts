/**
 * Prisma seed script
 *
 * Run:  npx prisma db seed
 * Or:   npx tsx prisma/seed.ts
 *
 * Seeds in order:
 *   1. Admin user (from ADMIN_INIT_EMAIL / ADMIN_INIT_PASSWORD env)
 *   2. Email templates
 *   3. SystemSetting defaults (insert-only, preserves admin changes)
 *   4. UserSetting defaults  (insert-only for uncovered users)
 *   5. PartnerSetting defaults (insert-only for uncovered partners)
 */

import { config } from "dotenv";
config();

import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { DEFAULT_SETTINGS, KNOWN_KEYS } from "../src/modules/admin-system-settings/model/model";
import { defaultPartnerSettings } from "../src/modules/partner-setting/model/model";
import { defaultSettings as defaultUserSettings } from "../src/share/common/seed-setting";
import { seedEmailTemplates } from "../src/modules/notification/shared/seed";

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(`  ${msg}\n`);
}

// ── 1. Admin user ─────────────────────────────────────────────────────────────

async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_INIT_EMAIL;
  const password = process.env.ADMIN_INIT_PASSWORD;

  if (!email || !password) {
    log("⚠  ADMIN_INIT_EMAIL / ADMIN_INIT_PASSWORD not set — skipping admin bootstrap");
    return;
  }

  const existing = await prisma.user.findFirst({ where: { email, role: Role.ADMIN } });
  if (existing) {
    log(`✓  Admin user '${email}' already exists`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: "System Admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      provider: "local",
    },
  });

  // Seed admin's UserSetting
  await prisma.userSetting.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, ...defaultUserSettings },
  });

  log(`✓  Created admin user '${email}'`);
}

// ── 2. Email templates ────────────────────────────────────────────────────────

async function runSeedEmailTemplates(): Promise<void> {
  await seedEmailTemplates(prisma);
}

// ── 3. SystemSetting defaults ─────────────────────────────────────────────────

async function seedSystemSettings(): Promise<void> {
  const existing = await prisma.systemSetting.findMany({ select: { key: true } });
  const presentKeys = new Set(existing.map((r) => r.key));
  const missing = KNOWN_KEYS.filter((k) => !presentKeys.has(k));

  if (missing.length === 0) {
    log("✓  SystemSetting — all keys present");
    return;
  }

  await prisma.systemSetting.createMany({
    data: missing.map((key) => ({ key, value: DEFAULT_SETTINGS[key] })),
    skipDuplicates: true,
  });
  log(`✓  SystemSetting — seeded ${missing.length} key(s): ${missing.join(", ")}`);
}

// ── 4. UserSetting defaults ───────────────────────────────────────────────────

async function seedUserSettings(): Promise<void> {
  const covered = new Set(
    (await prisma.userSetting.findMany({ select: { userId: true } })).map((r) => r.userId),
  );

  const users = await prisma.user.findMany({ select: { id: true } });
  const toCreate = users
    .filter((u) => !covered.has(u.id))
    .map((u) => ({ userId: u.id, ...defaultUserSettings }));

  if (toCreate.length === 0) {
    log("✓  UserSetting — all users covered");
    return;
  }

  await prisma.userSetting.createMany({ data: toCreate, skipDuplicates: true });
  log(`✓  UserSetting — created ${toCreate.length} missing row(s)`);
}

// ── 5. PartnerSetting defaults ────────────────────────────────────────────────

async function seedPartnerSettings(): Promise<void> {
  const covered = new Set(
    (await prisma.partnerSetting.findMany({ select: { partnerId: true } })).map((r) => r.partnerId),
  );

  const partners = await prisma.partner.findMany({ select: { id: true } });
  const toCreate = partners
    .filter((p) => !covered.has(p.id))
    .map((p) => ({ partnerId: p.id, ...defaultPartnerSettings }));

  if (toCreate.length === 0) {
    log("✓  PartnerSetting — all partners covered");
    return;
  }

  await prisma.partnerSetting.createMany({ data: toCreate, skipDuplicates: true });
  log(`✓  PartnerSetting — created ${toCreate.length} missing row(s)`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write("\n🌱 Running Prisma seed...\n\n");

  await seedAdminUser();
  await runSeedEmailTemplates();
  await seedSystemSettings();
  await seedUserSettings();
  await seedPartnerSettings();

  process.stdout.write("\n✅ Seed complete\n\n");
}

main()
  .catch((err) => {
    process.stderr.write(`\n❌ Seed failed: ${err.message}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
