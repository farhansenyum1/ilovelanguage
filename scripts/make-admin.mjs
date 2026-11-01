import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/make-admin.mjs <email>");
  process.exit(1);
}

const db = new PrismaClient();
const user = await db.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No user with email ${email}. Sign in with Google first.`);
  await db.$disconnect();
  process.exit(1);
}
await db.user.update({ where: { email }, data: { role: "ADMIN" } });
console.log(`Promoted ${email} to ADMIN (id: ${user.id}).`);
await db.$disconnect();