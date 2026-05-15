import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin User",
      role: UserRole.ADMIN,
    },
  });

  console.info("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
