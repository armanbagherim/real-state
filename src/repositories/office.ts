import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tehranDayRange, normalizeDigits } from "@/lib/utils";
import {
  ownerAccessWhere,
  propertyAccessWhere,
  propertyCanEditWhere,
} from "@/lib/access";
import { listProperties, str, type SearchParams } from "./properties";

function scopedProperty(user: Awaited<ReturnType<typeof requireUser>>) {
  return { deletedAt: null, AND: [propertyAccessWhere(user)] };
}

export async function getDashboardData() {
  const user = await requireUser();
  const now = new Date();
  const { start, end } = tehranDayRange(now);
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const scope = propertyAccessWhere(user);
  const base = scopedProperty(user);
  const [
    active,
    sale,
    rent,
    rented,
    sold,
    due,
    soon30,
    soon60,
    properties,
    tasks,
    contracts,
    reminders,
    recentFollowUps,
    monthly,
  ] = await Promise.all([
    db.property.count({ where: { ...base, status: "ACTIVE" } }),
    db.property.count({
      where: { ...base, status: "ACTIVE", transactionType: "SALE" },
    }),
    db.property.count({
      where: { ...base, status: "ACTIVE", transactionType: "RENT" },
    }),
    db.property.count({ where: { ...base, status: "RENTED" } }),
    db.property.count({ where: { ...base, status: "SOLD" } }),
    db.followUp.count({
      where: {
        status: "PENDING",
        followUpDate: { gte: start, lt: end },
        OR: [{ propertyId: null }, { property: { is: scope } }],
      },
    }),
    db.leaseContract.count({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: in30 },
        property: { is: scope },
      },
    }),
    db.leaseContract.count({
      where: {
        status: "ACTIVE",
        endDate: { gte: now, lte: in60 },
        property: { is: scope },
      },
    }),
    db.property.findMany({
      where: base,
      include: { owner: true, images: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.followUp.findMany({
      where: {
        status: "PENDING",
        followUpDate: { lt: end },
        OR: [{ propertyId: null }, { property: { is: scope } }],
      },
      include: { owner: true, property: true },
      orderBy: { followUpDate: "asc" },
      take: 4,
    }),
    db.leaseContract.findMany({
      where: { status: "ACTIVE", endDate: { lte: in60 }, property: { is: scope } },
      include: { owner: true, property: true },
      orderBy: { endDate: "asc" },
      take: 3,
    }),
    db.reminder.findMany({
      where: {
        status: "PENDING",
        remindAt: { lte: end },
        OR: [{ propertyId: null }, { property: { is: scope } }],
      },
      include: { owner: true },
      orderBy: { remindAt: "asc" },
      take: 3,
    }),
    db.followUp.findMany({
      where: { OR: [{ propertyId: null }, { property: { is: scope } }] },
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.property.groupBy({
      by: ["transactionType"],
      where: {
        ...base,
        createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
      },
      _count: true,
    }),
  ]);
  return {
    user,
    now,
    start,
    active,
    sale,
    rent,
    rented,
    sold,
    due,
    soon30,
    soon60,
    properties,
    tasks,
    contracts,
    reminders,
    recentFollowUps,
    monthly,
  };
}

export async function getNewPropertyData() {
  const user = await requireUser();
  const [owners, settings] = await Promise.all([
    db.owner.findMany({
      where: ownerAccessWhere(user),
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 20,
    }),
    db.settings.findFirstOrThrow({
      where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
    }),
  ]);
  return { owners, settings };
}

export async function getPropertyEditData(params: Promise<{ id: string }>) {
  const user = await requireUser();
  const { id } = await params;
  const [property, owners, settings] = await Promise.all([
    db.property.findFirst({
      where: { id, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    }),
    db.owner.findMany({
      where: ownerAccessWhere(user),
      select: { id: true, fullName: true },
      take: 20,
      orderBy: { fullName: "asc" },
    }),
    db.settings.findFirstOrThrow({
      where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
    }),
  ]);
  if (!property) notFound();
  return { id, property, owners, settings };
}

export async function getPropertyDetailData(params: Promise<{ id: string }>) {
  const user = await requireUser();
  const { id } = await params;
  const p = await db.property.findFirst({
    where: { id, deletedAt: null, AND: [propertyAccessWhere(user)] },
    include: {
      owner: true,
      ownerUser: { select: { id: true, name: true } },
      shares: { include: { user: { select: { id: true, name: true, mobile: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      history: {
        include: { changedByUser: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      contracts: { orderBy: { createdAt: "desc" }, take: 30 },
      followUps: { orderBy: { createdAt: "desc" }, take: 20 },
      reminders: {
        where: { status: "PENDING" },
        orderBy: { remindAt: "asc" },
        take: 20,
      },
    },
  });
  if (!p) notFound();
  const shareUsers = await db.user.findMany({
    where: {
      status: "APPROVED",
      id: { not: user.id },
      ...(user.role === "SUPER_ADMIN" ? {} : { officeId: user.officeId }),
    },
    select: { id: true, name: true, mobile: true },
    orderBy: { name: "asc" },
    take: 100,
  });
  return { id, p, shareUsers, user };
}

export async function getOwnersData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const q = normalizeDigits(str(params, "q")).slice(0, 200);
  const page = Math.max(1, parseInt(str(params, "page")) || 1);
  const where: Prisma.OwnerWhereInput = {
    AND: [
      ownerAccessWhere(user),
      {
        OR: [
          { fullName: { contains: q } },
          { mobile: { contains: q } },
          {
            properties: {
              some: {
                deletedAt: null,
                fileCode: { contains: q, mode: "insensitive" },
              },
            },
          },
        ],
      },
    ],
  };
  const [owners, total] = await Promise.all([
    db.owner.findMany({
      where,
      include: {
        _count: { select: { properties: { where: { deletedAt: null } } } },
      },
      take: 12,
      skip: (page - 1) * 12,
      orderBy: { createdAt: "desc" },
    }),
    db.owner.count({ where }),
  ]);
  return { params, q, page, owners, total };
}

export async function getOwnerDetailData(
  params: Promise<{ id: string }>,
  searchParams: Promise<SearchParams>,
) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const [owner, properties] = await Promise.all([
    db.owner.findFirst({ where: { id, AND: [ownerAccessWhere(user)] } }),
    listProperties({ ...query, ownerId: id }, user),
  ]);
  if (!owner) notFound();
  return { id, query, owner, properties };
}

export async function getContractsData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, parseInt(str(params, "page")) || 1);
  const status = str(params, "status");
  const where: Prisma.LeaseContractWhereInput = {
    property: { is: propertyAccessWhere(user) },
  };
  if (["ACTIVE", "EXPIRED", "RENEWED", "CANCELLED"].includes(status))
    where.status = status as "ACTIVE";
  if (status === "ACTIVE") where.endDate = { gte: new Date() };
  if (status === "EXPIRED") {
    delete where.status;
    where.OR = [
      { status: "EXPIRED" },
      { status: "ACTIVE", endDate: { lt: new Date() } },
    ];
  }
  if (str(params, "expiring")) {
    delete where.OR;
    where.status = "ACTIVE";
    where.endDate = {
      gte: new Date(),
      lte: new Date(new Date().getTime() + 60 * 86400000),
    };
  }
  const [items, total] = await Promise.all([
    db.leaseContract.findMany({
      where,
      include: { owner: true, property: true },
      orderBy: { endDate: "asc" },
      take: 15,
      skip: (page - 1) * 15,
    }),
    db.leaseContract.count({ where }),
  ]);
  return { params, page, status, items, total };
}

export async function getNewContractData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const previousId = str(params, "previousContractId");
  const previous = previousId
    ? await db.leaseContract.findFirst({
        where: { id: previousId, property: { is: propertyCanEditWhere(user) } },
      })
    : null;
  const properties = await db.property.findMany({
    where: {
      transactionType: "RENT",
      deletedAt: null,
      AND: [propertyCanEditWhere(user)],
    },
    select: { id: true, title: true, fileCode: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { params, previous, properties };
}

export async function getContractDetailData(params: Promise<{ id: string }>) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.leaseContract.findFirst({
    where: { id, property: { is: propertyAccessWhere(user) } },
    include: {
      property: true,
      owner: true,
      reminders: { orderBy: { remindAt: "asc" } },
      previousContract: true,
      nextContract: true,
    },
  });
  if (!c) notFound();
  return { id, c };
}

export async function getFollowUpsData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, parseInt(str(params, "page")) || 1);
  const status = str(params, "status") || "PENDING";
  const { start, end } = tehranDayRange();
  const where: Prisma.FollowUpWhereInput = {
    OR: [{ propertyId: null }, { property: { is: propertyAccessWhere(user) } }],
  };
  if (["PENDING", "COMPLETED", "CANCELLED"].includes(status))
    where.status = status as "PENDING";
  if (str(params, "today")) where.followUpDate = { gte: start, lt: end };
  const [items, total] = await Promise.all([
    db.followUp.findMany({
      where,
      include: {
        owner: true,
        property: true,
        user: { select: { name: true } },
      },
      orderBy: { followUpDate: "asc" },
      take: 15,
      skip: (page - 1) * 15,
    }),
    db.followUp.count({ where }),
  ]);
  return { params, page, status, items, total };
}

export async function getNewFollowUpData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const [properties, owners] = await Promise.all([
    db.property.findMany({
      where: { deletedAt: null, AND: [propertyAccessWhere(user)] },
      select: { id: true, title: true, fileCode: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    db.owner.findMany({
      where: ownerAccessWhere(user),
      select: { id: true, fullName: true },
      take: 20,
      orderBy: { fullName: "asc" },
    }),
  ]);
  return { params, properties, owners };
}

export async function getRemindersData(searchParams: Promise<SearchParams>) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, parseInt(str(params, "page")) || 1);
  const status = str(params, "status") || "PENDING";
  const where: Prisma.ReminderWhereInput = {
    OR: [{ propertyId: null }, { property: { is: propertyAccessWhere(user) } }],
  };
  if (["PENDING", "COMPLETED", "DISMISSED"].includes(status))
    where.status = status as "PENDING";
  const [items, total] = await Promise.all([
    db.reminder.findMany({
      where,
      include: { owner: true, property: true, leaseContract: true },
      orderBy: { remindAt: "asc" },
      take: 12,
      skip: (page - 1) * 12,
    }),
    db.reminder.count({ where }),
  ]);
  return { params, page, status, items, total };
}

export async function getNewReminderData() {
  const user = await requireUser();
  const [properties, owners] = await Promise.all([
    db.property.findMany({
      where: { deletedAt: null, AND: [propertyAccessWhere(user)] },
      select: { id: true, title: true, fileCode: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    db.owner.findMany({
      where: ownerAccessWhere(user),
      select: { id: true, fullName: true },
      take: 20,
      orderBy: { fullName: "asc" },
    }),
  ]);
  return { properties, owners };
}

export async function getSettingsData() {
  const user = await requireUser();
  const settings = await db.settings.findFirstOrThrow({
    where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
  });
  return { user, settings };
}

export async function getUsersData() {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "OFFICE_ADMIN"].includes(user.role)) notFound();
  const users = await db.user.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { officeId: user.officeId },
    include: { office: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const offices = await db.office.findMany({
    orderBy: { name: "asc" },
    take: 200,
  });
  return { user, users, offices };
}
