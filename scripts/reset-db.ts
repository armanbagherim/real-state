import { config } from "dotenv";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

const { db } = await import("../src/lib/db");

const username = process.env.RESET_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
const password = process.env.RESET_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("Set RESET_ADMIN_USERNAME and RESET_ADMIN_PASSWORD.");
  process.exit(1);
}

try {
  const passwordHash = await hash(password, 12);
  await db.$transaction(
    async (tx) => {
      await tx.propertyShare.deleteMany();
      await tx.propertyStatusHistory.deleteMany();
      await tx.propertyImage.deleteMany();
      await tx.reminder.deleteMany();
      await tx.followUp.deleteMany();
      await tx.leaseContract.updateMany({ data: { previousContractId: null } });
      await tx.leaseContract.deleteMany();
      await tx.property.deleteMany();
      await tx.owner.deleteMany();
      await tx.session.deleteMany();
      await tx.loginAttempt.deleteMany();
      await tx.userApproval.deleteMany();
      await tx.user.deleteMany();
      await tx.settings.deleteMany();
      await tx.office.deleteMany();
      await tx.$executeRawUnsafe(`ALTER SEQUENCE "Property_sequence_seq" RESTART WITH 1`);

      const office = await tx.office.create({
        data: {
          id: "office-default",
          name: "املاک آشیان",
          phone: "",
          address: "",
          adminsCanViewAgentFiles: true,
        },
      });
      await tx.settings.create({
        data: {
          id: "office",
          officeId: office.id,
          officeName: office.name,
          officePhone: office.phone,
          officeAddress: office.address,
        },
      });
      await tx.user.create({
        data: {
          name: "Arman",
          username,
          mobile: "09000000000",
          passwordHash,
          role: "SUPER_ADMIN",
          status: "APPROVED",
          officeId: office.id,
        },
      });
    },
    { timeout: 20000 },
  );
  console.log("Database reset complete. Admin account was recreated.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Reset failed");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
