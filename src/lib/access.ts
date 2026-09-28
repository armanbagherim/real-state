import { Prisma, type User } from "@prisma/client";

export type CurrentUser = Pick<
  User,
  "id" | "role" | "status" | "officeId"
> & {
  office?: { adminsCanViewAgentFiles: boolean } | null;
};

export function isSuperAdmin(user: CurrentUser) {
  return user.role === "SUPER_ADMIN";
}

export function isOfficeAdmin(user: CurrentUser) {
  return user.role === "OFFICE_ADMIN";
}

export function canManageUsers(user: CurrentUser) {
  return isSuperAdmin(user) || isOfficeAdmin(user);
}

export function propertyAccessWhere(
  user: CurrentUser,
): Prisma.PropertyWhereInput {
  if (isSuperAdmin(user)) return {};
  const shared: Prisma.PropertyWhereInput = { shares: { some: { userId: user.id } } };
  if (isOfficeAdmin(user) && user.officeId && user.office?.adminsCanViewAgentFiles)
    return { OR: [{ officeId: user.officeId }, shared] };
  return { OR: [{ ownerUserId: user.id }, shared] };
}

export function ownerAccessWhere(user: CurrentUser): Prisma.OwnerWhereInput {
  if (isSuperAdmin(user)) return {};
  if (isOfficeAdmin(user) && user.officeId && user.office?.adminsCanViewAgentFiles)
    return { officeId: user.officeId };
  return {
    OR: [
      { createdByUserId: user.id },
      { properties: { some: propertyAccessWhere(user) } },
    ],
  };
}

export function propertyCanEditWhere(
  user: CurrentUser,
): Prisma.PropertyWhereInput {
  if (isSuperAdmin(user)) return {};
  if (isOfficeAdmin(user) && user.officeId && user.office?.adminsCanViewAgentFiles)
    return { officeId: user.officeId };
  return {
    OR: [
      { ownerUserId: user.id },
      { shares: { some: { userId: user.id, permission: { in: ["EDIT", "MANAGE"] } } } },
    ],
  };
}

export function propertyCanDeleteWhere(
  user: CurrentUser,
): Prisma.PropertyWhereInput {
  if (isSuperAdmin(user)) return {};
  if (isOfficeAdmin(user) && user.officeId && user.office?.adminsCanViewAgentFiles)
    return { officeId: user.officeId };
  return {
    OR: [
      { ownerUserId: user.id },
      { shares: { some: { userId: user.id, canDelete: true } } },
    ],
  };
}

export function propertyCanUploadImageWhere(
  user: CurrentUser,
): Prisma.PropertyWhereInput {
  if (isSuperAdmin(user)) return {};
  if (isOfficeAdmin(user) && user.officeId && user.office?.adminsCanViewAgentFiles)
    return { officeId: user.officeId };
  return {
    OR: [
      { ownerUserId: user.id },
      { shares: { some: { userId: user.id, canUploadImages: true } } },
    ],
  };
}
