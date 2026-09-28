import { config } from "dotenv";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
config({ path: ".env.local" });
const { db } = await import("../src/lib/db");
const { saveProperty } = await import("../src/services/properties");
const { createContract } = await import("../src/services/contracts");
const tag = `integration-${randomUUID()}`;
let ownerId: string | undefined;
const propertyIds: string[] = [];
try {
  const user = await db.user.findFirstOrThrow({ where: { role: "SUPER_ADMIN" } });
  const owner = await db.owner.create({
    data: {
      fullName: tag,
      mobile: "09120000002",
      description: "Temporary automated verification fixture",
    },
  });
  ownerId = owner.id;
  const input = {
    title: tag,
    ownerId: owner.id,
    transactionType: "RENT",
    propertyType: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù†",
    status: "ACTIVE",
    city: "ØªÙ‡Ø±Ø§Ù†",
    district: "Û±",
    neighborhood: "Ø¢Ø²Ù…ÙˆÙ†",
    address: "Temporary automated verification fixture",
    area: 120,
    bedrooms: 2,
    floor: 1,
    totalFloors: 4,
    unitsPerFloor: 2,
    buildingAge: 5,
    parking: true,
    storage: true,
    elevator: true,
    balcony: false,
    salePrice: 0,
    mortgagePrice: 500000000,
    rentPrice: 10000000,
    isConvertible: true,
    description: "",
    internalNotes: "",
  };
  const created = await Promise.all([
    saveProperty(input, user),
    saveProperty({ ...input, title: tag + "-2" }, user),
  ]);
  propertyIds.push(...created.map((p) => p.id));
  assert.notEqual(created[0].fileCode, created[1].fileCode);
  let property = await saveProperty(
    { ...input, title: tag + "-edited" },
    user,
    created[0].id,
  );
  assert.equal(property.title, tag + "-edited");
  assert.equal(property.ownerId, owner.id);
  assert.equal(Number(property.conversionRate), 0.03);
  const now = Date.now();
  const data = {
    propertyId: property.id,
    tenantName: "Ù…Ø³ØªØ£Ø¬Ø± Ø¢Ø²Ù…ÙˆÙ†",
    tenantMobile: "09120000003",
    startDate: new Date(now),
    endDate: new Date(now + 365 * 86400000),
    mortgageAmount: 500000000,
    rentAmount: 10000000,
    description: "Temporary automated verification fixture",
    previousContractId: "",
  };
  const c = await createContract(data, user);
  assert.equal(
    await db.reminder.count({ where: { leaseContractId: c.id } }),
    4,
  );
  property = await db.property.findUniqueOrThrow({
    where: { id: property.id },
  });
  assert.equal(property.status, "RENTED");
  await assert.rejects(() => createContract(data, user));
  const renewed = await createContract(
    {
      ...data,
      previousContractId: c.id,
      startDate: c.endDate,
      endDate: new Date(c.endDate.getTime() + 365 * 86400000),
    },
    user,
  );
  assert.equal(renewed.previousContractId, c.id);
  assert.equal(
    (await db.leaseContract.findUniqueOrThrow({ where: { id: c.id } })).status,
    "RENEWED",
  );
  assert.equal(
    await db.reminder.count({
      where: { leaseContractId: c.id, status: "PENDING" },
    }),
    0,
  );
  assert.equal(
    await db.reminder.count({
      where: { leaseContractId: renewed.id, status: "PENDING" },
    }),
    4,
  );
  await db.property.update({
    where: { id: created[1].id },
    data: { deletedAt: new Date() },
  });
  assert.equal(
    await db.property.count({ where: { id: created[1].id, deletedAt: null } }),
    0,
  );
  assert.ok(
    (await db.propertyStatusHistory.count({
      where: { propertyId: property.id },
    })) >= 2,
  );
  console.log(
    "PASS: owner relation, concurrent unique codes, property create/read/update/soft-delete, contract, duplicate protection, renewal history, reminder lifecycle, status history.",
  );
} finally {
  // Remove only fixtures created by this invocation; never touch seed or user records.
  if (ownerId)
    await db.$transaction(async (tx) => {
      await tx.reminder.deleteMany({ where: { ownerId } });
      await tx.followUp.deleteMany({ where: { ownerId } });
      await tx.leaseContract.updateMany({
        where: { ownerId },
        data: { previousContractId: null },
      });
      await tx.leaseContract.deleteMany({ where: { ownerId } });
      await tx.propertyStatusHistory.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      await tx.property.deleteMany({ where: { ownerId } });
      await tx.owner.delete({ where: { id: ownerId } });
    });
  await db.$disconnect();
}

