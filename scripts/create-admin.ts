import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Usage: tsx scripts/create-admin.ts <email> <password>");
    process.exitCode = 1;
    return;
  }
  if (PASSWORD.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: { isAdmin: true },
    create: {
      email: EMAIL,
      passwordHash,
      name: "Admin",
      isAdmin: true,
      minutesBalance: 999,
    },
  });

  console.log(`Admin pronto: ${user.email} / senha: ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
