"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ownerSchema,
  followUpSchema,
  reminderSchema,
  settingsSchema,
} from "@/lib/validation";
import {
  propertyAccessWhere,
  propertyCanDeleteWhere,
  propertyCanEditWhere,
} from "@/lib/access";
import { saveProperty } from "@/services/properties";
import { createContract } from "@/services/contracts";

export type ActionResult = {
  error?: string;
  fields?: Record<string, string[]>;
  success?: string;
  redirect?: string;
  values?: Record<string, string>;
};
const formValues = (form: FormData) =>
  Object.fromEntries(
    Array.from(form.entries())
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value)]),
  );

export async function saveRecord(
  kind: string,
  id: string | undefined,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const raw = Object.fromEntries(form);
  const values = formValues(form);
  let path = "";
  try {
    switch (kind) {
      case "property": {
        const row = await saveProperty(raw, user, id);
        path = `/properties/${row.id}`;
        break;
      }
      case "owner": {
        const data = ownerSchema.parse(raw);
        const row = id
          ? await db.owner.update({ where: { id }, data })
          : await db.owner.create({
              data: { ...data, officeId: user.officeId, createdByUserId: user.id },
            });
        path = `/owners/${row.id}`;
        break;
      }
      case "contract": {
        const row = await createContract(raw, user);
        path = `/contracts/${row.id}`;
        break;
      }
      case "follow-up": {
        const data = followUpSchema.parse(raw);
        await db.$transaction(async (tx) => {
          const property = data.propertyId
            ? await tx.property.findFirstOrThrow({
                where: {
                  id: data.propertyId,
                  deletedAt: null,
                  AND: [propertyAccessWhere(user)],
                },
              })
            : null;
          await tx.followUp.create({
            data: {
              ...data,
              propertyId: property?.id ?? null,
              ownerId: property?.ownerId || data.ownerId || null,
              userId: user.id,
            },
          });
          if (property)
            await tx.property.update({
              where: { id: property.id },
              data: { lastFollowUpAt: new Date() },
            });
        });
        path = "/follow-ups";
        break;
      }
      case "reminder": {
        const data = reminderSchema.parse(raw);
        const property = data.propertyId
          ? await db.property.findFirstOrThrow({
              where: {
                id: data.propertyId,
                deletedAt: null,
                AND: [propertyAccessWhere(user)],
              },
            })
          : null;
        await db.reminder.create({
          data: {
            ...data,
            propertyId: property?.id ?? null,
            ownerId: property?.ownerId || data.ownerId || null,
          },
        });
        path = "/reminders";
        break;
      }
      case "settings": {
        if (!["SUPER_ADMIN", "OFFICE_ADMIN"].includes(user.role))
          throw new Error("فقط مدیر اجازه تغییر تنظیمات را دارد.");
        const data = settingsSchema.parse(raw);
        await db.$transaction(async (tx) => {
          if (user.officeId)
            await tx.office.update({
              where: { id: user.officeId },
              data: {
                name: data.officeName,
                phone: data.officePhone,
                address: data.officeAddress,
                adminsCanViewAgentFiles: raw.adminsCanViewAgentFiles === "on",
              },
            });
          await tx.settings.upsert({
            where: user.officeId ? { officeId: user.officeId } : { id: "office" },
            create: {
              ...data,
              id: user.officeId ? `office-${user.officeId}` : "office",
              officeId: user.officeId,
            },
            update: data,
          });
        });
        break;
      }
      case "share": {
        const data = z
          .object({
            propertyId: z.string().min(1),
            userId: z.string().min(1),
            permission: z.enum(["VIEW", "EDIT", "MANAGE"]),
            canUploadImages: z.preprocess((v) => v === "on", z.boolean()),
            canDelete: z.preprocess((v) => v === "on", z.boolean()),
          })
          .parse(raw);
        const property = await db.property.findFirst({
          where: {
            id: data.propertyId,
            deletedAt: null,
            AND: [propertyCanEditWhere(user)],
          },
        });
        if (!property) throw new Error("اجازه اشتراک‌گذاری این فایل را ندارید.");
        await db.propertyShare.upsert({
          where: {
            propertyId_userId: {
              propertyId: data.propertyId,
              userId: data.userId,
            },
          },
          create: data,
          update: {
            permission: data.permission,
            canUploadImages: data.canUploadImages,
            canDelete: data.canDelete,
          },
        });
        path = `/properties/${data.propertyId}`;
        break;
      }
      case "user": {
        if (!["SUPER_ADMIN", "OFFICE_ADMIN"].includes(user.role))
          throw new Error("اجازه مدیریت کاربران را ندارید.");
        const data = z
          .object({
            userId: z.string().min(1),
            status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
            role: z.enum(["OFFICE_ADMIN", "AGENT"]),
            officeId: z.string().optional(),
          })
          .parse(raw);
        const target = await db.user.findFirst({
          where:
            user.role === "SUPER_ADMIN"
              ? { id: data.userId }
              : { id: data.userId, officeId: user.officeId },
        });
        if (!target) throw new Error("کاربر پیدا نشد.");
        await db.$transaction([
          db.user.update({
            where: { id: target.id },
            data: {
              status: data.status,
              role: data.role,
              officeId:
                user.role === "SUPER_ADMIN"
                  ? data.officeId || target.officeId
                  : target.officeId,
            },
          }),
          db.userApproval.create({
            data: {
              userId: target.id,
              approvedByUserId: user.id,
              status: data.status,
            },
          }),
          ...(data.status === "APPROVED"
            ? []
            : [db.session.deleteMany({ where: { userId: target.id } })]),
        ]);
        path = "/users";
        break;
      }
      default:
        throw new Error("درخواست نامعتبر است.");
    }
    revalidatePath("/", "layout");
    return {
      success: "اطلاعات با موفقیت ذخیره شد.",
      redirect: path || undefined,
    };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        error: "لطفاً فیلدهای مشخص‌شده را بررسی کنید.",
        fields: z.flattenError(error).fieldErrors as Record<string, string[]>,
        values,
      };
    if (error instanceof Prisma.PrismaClientKnownRequestError)
      return {
        error:
          error.code === "P2002"
            ? "این اطلاعات قبلاً ثبت شده است."
            : "ذخیره اطلاعات ممکن نشد؛ ارتباط و اطلاعات مرتبط را بررسی کنید.",
        values,
      };
    return {
      error:
        error instanceof Error ? error.message : "خطا در ذخیره اطلاعات رخ داد.",
      values,
    };
  }
}

export async function updateRecord(
  kind: string,
  id: string,
  action: string,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    if (kind === "property") {
      if (action === "delete") {
        const property = await db.property.findFirst({
          where: { id, deletedAt: null, AND: [propertyCanDeleteWhere(user)] },
        });
        if (!property) throw new Error("حذف این فایل برای شما مجاز نیست.");
        if (
          await db.leaseContract.count({
            where: { propertyId: id, status: "ACTIVE" },
          })
        )
          throw new Error("ابتدا قرارداد فعال این فایل را لغو یا پایان دهید.");
        await db.property.update({ where: { id }, data: { deletedAt: new Date() } });
      } else {
        const status = z
          .enum(["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"])
          .parse(action);
        await db.$transaction(async (tx) => {
          const old = await tx.property.findFirstOrThrow({
            where: { id, deletedAt: null, AND: [propertyCanEditWhere(user)] },
          });
          if (
            (status === "RENTED" && old.transactionType !== "RENT") ||
            (status === "SOLD" && old.transactionType !== "SALE")
          )
            throw new Error("وضعیت با نوع معامله سازگار نیست.");
          await tx.property.update({ where: { id }, data: { status } });
          await tx.propertyStatusHistory.create({
            data: {
              propertyId: id,
              oldStatus: old.status,
              newStatus: status,
              changedByUserId: user.id,
            },
          });
        });
      }
    } else if (kind === "follow-up") {
      const status = z.enum(["COMPLETED", "CANCELLED", "PENDING"]).parse(action);
      await db.followUp.update({
        where: { id },
        data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
      });
    } else if (kind === "contract") {
      const status = z.enum(["CANCELLED", "EXPIRED"]).parse(action);
      await db.$transaction(async (tx) => {
        const contract = await tx.leaseContract.findFirstOrThrow({
          where: { id, property: { is: propertyCanEditWhere(user) } },
        });
        await tx.leaseContract.updateMany({
          where: { id: contract.id, status: "ACTIVE" },
          data: { status },
        });
        await tx.reminder.updateMany({
          where: { leaseContractId: contract.id, status: "PENDING" },
          data: { status: "DISMISSED" },
        });
      });
    } else if (kind === "reminder") {
      const choice = z
        .enum([
          "COMPLETED",
          "DISMISSED",
          "CALLED",
          "NO_ANSWER",
          "CALL_BACK",
          "RENEW_INTENT",
          "SALE_INTENT",
          "REFILE",
        ])
        .parse(action);
      await db.$transaction(async (tx) => {
        const reminder = await tx.reminder.findUniqueOrThrow({ where: { id } });
        if (reminder.propertyId) {
          await tx.property.findFirstOrThrow({
            where: {
              id: reminder.propertyId,
              deletedAt: null,
              AND: [propertyAccessWhere(user)],
            },
          });
        }
        if (["COMPLETED", "DISMISSED"].includes(choice)) {
          await tx.reminder.update({
            where: { id },
            data: { status: choice as "COMPLETED" | "DISMISSED" },
          });
          return;
        }
        const labels = {
          CALLED: "تماس گرفته شد",
          NO_ANSWER: "پاسخ نداد",
          CALL_BACK: "تماس مجدد",
          RENEW_INTENT: "مالک قصد تمدید دارد",
          SALE_INTENT: "مالک قصد فروش دارد",
          REFILE: "ملک دوباره فایل شد",
        };
        await tx.followUp.create({
          data: {
            propertyId: reminder.propertyId,
            ownerId: reminder.ownerId,
            userId: user.id,
            type: "CALL",
            status: ["CALL_BACK", "NO_ANSWER"].includes(choice)
              ? "PENDING"
              : "COMPLETED",
            completedAt: ["CALL_BACK", "NO_ANSWER"].includes(choice)
              ? null
              : new Date(),
            note: labels[choice as keyof typeof labels],
            followUpDate: new Date(
              Date.now() +
                (["CALL_BACK", "NO_ANSWER"].includes(choice) ? 86400000 : 0),
            ),
          },
        });
        if (choice === "REFILE" && reminder.propertyId) {
          const old = await tx.property.findFirstOrThrow({
            where: { id: reminder.propertyId, deletedAt: null },
          });
          await tx.property.update({
            where: { id: old.id },
            data: { status: "ACTIVE" },
          });
          await tx.propertyStatusHistory.create({
            data: {
              propertyId: old.id,
              oldStatus: old.status,
              newStatus: "ACTIVE",
              changedByUserId: user.id,
              note: "فایل مجدد از یادآوری",
            },
          });
        }
        await tx.reminder.update({ where: { id }, data: { status: "COMPLETED" } });
      });
    } else throw new Error("درخواست نامعتبر است.");
    revalidatePath("/", "layout");
    return { success: "تغییرات ثبت شد." };
  } catch (error) {
    return {
      error:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? "عملیات انجام نشد؛ دوباره تلاش کنید."
          : error instanceof Error
          ? error.message
          : "خطا در انجام عملیات",
    };
  }
}
