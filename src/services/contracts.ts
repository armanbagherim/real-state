import { db } from "@/lib/db";
import { contractSchema } from "@/lib/validation";
import { propertyCanEditWhere, type CurrentUser } from "@/lib/access";
export function reminderDates(endDate: Date, days: number[]) {
  return days.map((day) => new Date(endDate.getTime() - day * 86400000));
}
export async function createContract(raw: unknown, user: CurrentUser) {
  const data = contractSchema.parse(raw);
  return db.$transaction(async (tx) => {
    // Serialize contracts for the same property, including concurrent renewals.
    await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${data.propertyId} FOR UPDATE`;
    const property = await tx.property.findFirstOrThrow({
      where: { id: data.propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    });
    if (property.transactionType !== "RENT")
      throw new Error("قرارداد اجاره فقط برای فایل اجاره ثبت می‌شود");
    const previous = data.previousContractId
      ? await tx.leaseContract.findUniqueOrThrow({
          where: { id: data.previousContractId },
        })
      : null;
    if (
      previous &&
      (previous.propertyId !== property.id ||
        !["ACTIVE", "EXPIRED"].includes(previous.status) ||
        data.startDate < previous.endDate)
    )
      throw new Error("تاریخ یا مرجع تمدید قرارداد معتبر نیست");
    const active = await tx.leaseContract.count({
      where: {
        propertyId: property.id,
        status: "ACTIVE",
        id: { not: previous?.id },
      },
    });
    if (active)
      throw new Error(
        "این ملک یک قرارداد فعال دارد؛ از گزینه تمدید استفاده کنید",
      );
    if (previous) {
      await tx.leaseContract.update({
        where: { id: previous.id },
        data: { status: "RENEWED" },
      });
      await tx.reminder.updateMany({
        where: { leaseContractId: previous.id, status: "PENDING" },
        data: { status: "DISMISSED" },
      });
    }
    const contract = await tx.leaseContract.create({
      data: {
        ...data,
        previousContractId: previous?.id ?? null,
        ownerId: property.ownerId,
      },
    });
    const settings = await tx.settings.findFirstOrThrow({
      where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
    });
    await tx.reminder.createMany({
      data: reminderDates(data.endDate, settings.reminderDays).map(
        (remindAt, i) => ({
          propertyId: property.id,
          ownerId: property.ownerId,
          leaseContractId: contract.id,
          title: `یادآوری ${settings.reminderDays[i]} روزه پایان قرارداد ${property.fileCode}`,
          remindAt,
          type: "CONTRACT_EXPIRY",
        }),
      ),
    });
    if (property.status !== "RENTED") {
      await tx.property.update({
        where: { id: property.id },
        data: { status: "RENTED" },
      });
      await tx.propertyStatusHistory.create({
        data: {
          propertyId: property.id,
          oldStatus: property.status,
          newStatus: "RENTED",
          changedByUserId: user.id,
          note: previous ? "تمدید قرارداد" : "ثبت قرارداد اجاره",
        },
      });
    }
    return contract;
  });
}
