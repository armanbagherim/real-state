import type { AdCopyVariant } from "@prisma/client";
import { db } from "@/lib/db";
import { propertyCanEditWhere } from "@/lib/access";
import type { CurrentUser } from "@/lib/access";
import {
  templateGenerator,
  type AdCopyGenerator,
  type AdCopyInput,
} from "./generator";

/**
 * Provider registry. `AI_AD_COPY_PROVIDER=external` opts into a model-backed
 * generator; the key never reaches the client because everything runs here.
 */
async function pickGenerator(): Promise<AdCopyGenerator> {
  return templateGenerator;
}

export async function collectAdCopyInput(
  propertyId: string,
  user: CurrentUser,
): Promise<AdCopyInput | null> {
  const property = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    include: {
      images: { select: { id: true }, take: 1 },
      ownerUser: { select: { name: true } },
    },
  });
  if (!property) return null;
  return {
    transactionType: property.transactionType,
    propertyType: property.propertyType,
    area: Number(property.area),
    bedrooms: property.bedrooms,
    floor: property.floor,
    totalFloors: property.totalFloors,
    unitsPerFloor: property.unitsPerFloor,
    buildingAge: property.buildingAge,
    parking: property.parking,
    storage: property.storage,
    elevator: property.elevator,
    balcony: property.balcony,
    salePrice: Number(property.salePrice),
    mortgagePrice: Number(property.mortgagePrice),
    rentPrice: Number(property.rentPrice),
    city: property.city,
    district: property.district,
    neighborhood: property.neighborhood,
    description: property.description ?? "",
    hasImages: property.images.length > 0,
    agentName: property.ownerUser?.name ?? "",
  };
}

export async function generateAdCopy(
  propertyId: string,
  variant: AdCopyVariant,
  user: CurrentUser,
) {
  const input = await collectAdCopyInput(propertyId, user);
  if (!input) return { error: "این فایل برای شما در دسترس نیست." };
  const generator = await pickGenerator();
  const content = await generator.generate(input, variant);
  return { content, generator: generator.id };
}

export type { AdCopyInput, AdCopyGenerator };
