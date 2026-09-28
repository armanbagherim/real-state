import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { propertySchema } from "@/lib/validation";
import { propertyCanEditWhere, type CurrentUser } from "@/lib/access";
export async function saveProperty(raw: unknown, user: CurrentUser, id?: string) {
  const data = propertySchema.parse(raw);
  return db.$transaction(async (tx) => {
    if (id)
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${id} FOR UPDATE`;
    const settings = await tx.settings.findFirstOrThrow({
      where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
    });
    const old = id
      ? await tx.property.findFirstOrThrow({
          where: { id, deletedAt: null, AND: [propertyCanEditWhere(user)] },
        })
      : null;
    if (
      old &&
      (old.ownerId !== data.ownerId ||
        old.transactionType !== data.transactionType) &&
      (await tx.leaseContract.count({
        where: { propertyId: id, status: "ACTIVE" },
      }))
    )
      throw new Error(
        "مالک و نوع معامله ملک دارای قرارداد فعال قابل تغییر نیست",
      );
    const values = {
      ...data,
      conversionRate: data.isConvertible ? settings.conversionRate : null,
    };
    let property = old
      ? await tx.property.update({ where: { id }, data: values })
      : await tx.property.create({
          data: {
            ...values,
            fileCode: `pending-${randomUUID()}`,
            officeId: user.officeId,
            ownerUserId: user.id,
          },
        });
    if (!old)
      property = await tx.property.update({
        where: { id: property.id },
        data: { fileCode: `A-${1000 + property.sequence}` },
      });
    if (!old || old.status !== property.status)
      await tx.propertyStatusHistory.create({
        data: {
          propertyId: property.id,
          oldStatus: old?.status,
          newStatus: property.status,
          changedByUserId: user.id,
          note: old ? "ویرایش وضعیت فایل" : "ثبت فایل جدید",
        },
      });
    return property;
  });
}
