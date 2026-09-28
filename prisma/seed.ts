import { config } from "dotenv";
import { hash } from "bcryptjs";
config({ path: ".env.local" });
const { db } = await import("../src/lib/db");
const { saveProperty } = await import("../src/services/properties");
const { createContract } = await import("../src/services/contracts");
try {
  const username = process.env.ADMIN_USERNAME,
    password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 10)
    throw new Error(
      "Set ADMIN_USERNAME and a strong ADMIN_PASSWORD in .env.local",
    );
  const user = await db.user.upsert({
    where: { username },
    create: {
      username,
      name: "Ù…Ø¯ÛŒØ± Ø¯ÙØªØ±",
      passwordHash: await hash(password, 12),
      role: "SUPER_ADMIN",
      status: "APPROVED",
      mobile: username,
    },
    update: {},
  });
  await db.settings.upsert({
    where: { id: "office" },
    create: { id: "office" },
    update: {},
  });
  const owner = await db.owner.upsert({
    where: { id: "seed-owner" },
    create: {
      id: "seed-owner",
      fullName: "Ù…Ø§Ù„Ú© Ù†Ù…ÙˆÙ†Ù‡",
      mobile: "09120000000",
      description:
        "Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù†Ù…ÙˆÙ†Ù‡ Ø¨Ø±Ø§ÛŒ Ø¢Ø´Ù†Ø§ÛŒÛŒ Ø¨Ø§ Ø¨Ø±Ù†Ø§Ù…Ù‡Ø› Ø´Ù…Ø§Ø±Ù‡ ØªÙ…Ø§Ø³ ÙˆØ§Ù‚Ø¹ÛŒ Ù†ÛŒØ³Øª.",
    },
    update: {},
  });
  if (!(await db.property.count())) {
    const samples = [
      {
        title: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù† Ø±ÙˆØ´Ù† Ø¨Ø§ ØªØ±Ø§Ø³ Ø¨Ø²Ø±Ú¯",
        neighborhood: "Ø³Ø¹Ø§Ø¯Øªâ€ŒØ¢Ø¨Ø§Ø¯",
        transactionType: "SALE",
        area: 145,
        bedrooms: 3,
        salePrice: 18500000000,
      },
      {
        title: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù† Ù†ÙˆØ³Ø§Ø²ØŒ Ø¯Ø³ØªØ±Ø³ÛŒ Ø¹Ø§Ù„ÛŒ",
        neighborhood: "ÛŒÙˆØ³Ùâ€ŒØ¢Ø¨Ø§Ø¯",
        transactionType: "RENT",
        area: 110,
        bedrooms: 2,
        mortgagePrice: 800000000,
        rentPrice: 24000000,
      },
      {
        title: "ÙˆØ§Ø­Ø¯ Ø¯Ù„Ø¨Ø§Ø² Ø¨Ø§ Ú†Ø´Ù…â€ŒØ§Ù†Ø¯Ø§Ø² Ø´Ù‡Ø±",
        neighborhood: "Ù¾Ø§Ø³Ø¯Ø§Ø±Ø§Ù†",
        transactionType: "SALE",
        area: 180,
        bedrooms: 3,
        salePrice: 27000000000,
      },
      {
        title: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù† Ø¯ÙˆØ®ÙˆØ§Ø¨ Ø®ÙˆØ´â€ŒÙ†Ù‚Ø´Ù‡",
        neighborhood: "Ø¬Ù†Øªâ€ŒØ¢Ø¨Ø§Ø¯",
        transactionType: "RENT",
        area: 95,
        bedrooms: 2,
        mortgagePrice: 600000000,
        rentPrice: 18000000,
      },
      {
        title: "ÙˆØ§Ø­Ø¯ Ø¨Ø§Ø²Ø³Ø§Ø²ÛŒâ€ŒØ´Ø¯Ù‡ Ø¯Ø± Ù…Ø­Ù„Ù‡â€ŒØ§ÛŒ Ø¢Ø±Ø§Ù…",
        neighborhood: "Ø´Ù‡Ø±Ú© ØºØ±Ø¨",
        transactionType: "RENT",
        area: 130,
        bedrooms: 2,
        mortgagePrice: 1200000000,
        rentPrice: 30000000,
      },
      {
        title: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù† Ù†Ù‚Ù„ÛŒ Ù…Ù†Ø§Ø³Ø¨ Ø³Ø±Ù…Ø§ÛŒÙ‡â€ŒÚ¯Ø°Ø§Ø±ÛŒ",
        neighborhood: "Ù¾ÙˆÙ†Ú©",
        transactionType: "SALE",
        area: 75,
        bedrooms: 1,
        salePrice: 7800000000,
      },
    ];
    const properties = [];
    for (const sample of samples)
      properties.push(
        await saveProperty(
          {
            ownerId: owner.id,
            propertyType: "Ø¢Ù¾Ø§Ø±ØªÙ…Ø§Ù†",
            status: "ACTIVE",
            city: "ØªÙ‡Ø±Ø§Ù†",
            district: "",
            address: "Ø¢Ø¯Ø±Ø³ Ù†Ù…ÙˆÙ†Ù‡ â€” Ø¨Ø±Ø§ÛŒ Ø¢Ø´Ù†Ø§ÛŒÛŒ Ø¨Ø§ Ø¨Ø±Ù†Ø§Ù…Ù‡",
            floor: 2,
            totalFloors: 5,
            unitsPerFloor: 2,
            buildingAge: 3,
            parking: true,
            storage: true,
            elevator: true,
            balcony: true,
            salePrice: 0,
            mortgagePrice: 0,
            rentPrice: 0,
            isConvertible: true,
            description:
              "Ø§ÛŒÙ† ÙØ§ÛŒÙ„ Ù†Ù…ÙˆÙ†Ù‡ Ø§Ø³Øª Ùˆ ÛŒÚ© Ø¢Ú¯Ù‡ÛŒ ÙˆØ§Ù‚Ø¹ÛŒ Ù†ÛŒØ³Øª. Ù¾Ø³ Ø§Ø² Ø¢Ø´Ù†Ø§ÛŒÛŒ Ø¨Ø§ Ø¨Ø±Ù†Ø§Ù…Ù‡ Ù…ÛŒâ€ŒØªÙˆØ§Ù†ÛŒØ¯ Ø¢Ù† Ø±Ø§ Ø­Ø°Ù Ú©Ù†ÛŒØ¯.",
            internalNotes: "Ø¯Ø§Ø¯Ù‡ Ù†Ù…ÙˆÙ†Ù‡ Ø§ÙˆÙ„ÛŒÙ‡",
            ...sample,
          },
          user,
        ),
      );
    const now = Date.now();
    for (const [i, property] of properties
      .filter((p) => p.transactionType === "RENT")
      .entries())
      await createContract(
        {
          propertyId: property.id,
          tenantName: "Ù…Ø³ØªØ£Ø¬Ø± Ù†Ù…ÙˆÙ†Ù‡",
          tenantMobile: "09120000001",
          startDate: new Date(now - 330 * 86400000),
          endDate: new Date(now + (12 + i * 19) * 86400000),
          mortgageAmount: String(property.mortgagePrice),
          rentAmount: String(property.rentPrice),
          description: "Ù‚Ø±Ø§Ø±Ø¯Ø§Ø¯ Ù†Ù…ÙˆÙ†Ù‡",
          previousContractId: "",
        },
        user,
      );
    for (const [i, note] of [
      "ØªÙ…Ø§Ø³ Ø¨Ø§ Ù…Ø§Ù„Ú© Ø¨Ø±Ø§ÛŒ Ù‡Ù…Ø§Ù‡Ù†Ú¯ÛŒ Ø¨Ø§Ø²Ø¯ÛŒØ¯",
      "Ù¾ÛŒÚ¯ÛŒØ±ÛŒ Ù‚ÛŒÙ…Øª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ÛŒ Ù…Ù„Ú©",
      "Ù‡Ù…Ø§Ù‡Ù†Ú¯ÛŒ ØªÙ…Ø¯ÛŒØ¯ Ù‚Ø±Ø§Ø±Ø¯Ø§Ø¯",
    ].entries())
      await db.followUp.create({
        data: {
          propertyId: properties[i].id,
          ownerId: owner.id,
          userId: user.id,
          type: "CALL",
          note,
          followUpDate: new Date(now + i * 3600000),
        },
      });
  }
  console.log(
    "Seed complete: admin, settings, sample owner and sample properties are ready. Credentials remain in .env.local.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

