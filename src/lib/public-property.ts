import type { Prisma } from "@prisma/client";

/**
 * The ONLY shape allowed to leave the server for an anonymous visitor.
 * Deliberately narrow: no owner data, no internal notes, no file code, no
 * CRM fields, no other properties. Adding a field here is a public decision.
 */
export type PublicProperty = {
  token: string;
  title: string;
  propertyType: string;
  transactionType: "RENT" | "SALE";
  status: string;
  area: number;
  bedrooms: number;
  floor: number;
  totalFloors: number;
  unitsPerFloor: number;
  buildingAge: number;
  parking: boolean;
  storage: boolean;
  elevator: boolean;
  balcony: boolean;
  salePrice: number;
  mortgagePrice: number;
  rentPrice: number;
  city: string;
  district: string;
  neighborhood: string;
  /** Empty unless the sharing consultant explicitly allowed it. */
  address: string;
  description: string;
  images: { id: string; url: string }[];
  agent: { name: string; mobile: string };
  office: { name: string; phone: string };
  createdAt: string;
};

type LinkWithProperty = Prisma.PropertyPublicLinkGetPayload<{
  include: {
    property: {
      include: {
        images: { orderBy: { sortOrder: "asc" } };
        ownerUser: { select: { name: true; mobile: true } };
        office: { select: { name: true; phone: true } };
      };
    };
  };
}>;

/**
 * Maps a link + its property into the public DTO, dropping every internal field.
 * `property.status` is intentionally reduced to ACTIVE/RENTED/SOLD/... without
 * any office-specific metadata.
 */
export function toPublicProperty(
  link: LinkWithProperty,
): PublicProperty {
  const p = link.property;
  return {
    token: link.token,
    title: p.title,
    propertyType: p.propertyType,
    transactionType: p.transactionType,
    status: p.status,
    area: Number(p.area),
    bedrooms: p.bedrooms,
    floor: p.floor,
    totalFloors: p.totalFloors,
    unitsPerFloor: p.unitsPerFloor,
    buildingAge: p.buildingAge,
    parking: p.parking,
    storage: p.storage,
    elevator: p.elevator,
    balcony: p.balcony,
    salePrice: Number(p.salePrice),
    mortgagePrice: Number(p.mortgagePrice),
    rentPrice: Number(p.rentPrice),
    city: p.city,
    district: p.district,
    neighborhood: p.neighborhood,
    address: link.showAddress ? p.address : "",
    description: p.description ?? "",
    images: p.images.map(({ id, url }) => ({ id, url })),
    agent: {
      name: p.ownerUser?.name ?? "",
      mobile: link.showPhone ? (p.ownerUser?.mobile ?? "") : "",
    },
    office: { name: p.office?.name ?? "املاک آشیان", phone: p.office?.phone ?? "" },
    createdAt: p.createdAt.toISOString(),
  };
}
