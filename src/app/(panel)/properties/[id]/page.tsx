import { getPropertyDetailData } from "@/repositories/office";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Pencil,
  Car,
  Package,
  ArrowUpDown,
  Sun,
  Plus,
} from "lucide-react";
import { dateFa, fa, money, propertyShareText, statuses } from "@/lib/utils";
import { canDeletePropertyImages } from "@/lib/access";
import { PropertyShare } from "@/components/property-share";
import { Badge, PageHeading } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { RecordAction } from "@/components/record-actions";
import { ImageUploader } from "@/components/image-uploader";
import { PropertyGallery } from "@/components/property-gallery";
import { RecordForm, type Field } from "@/components/forms";
import { MovePropertyButton } from "@/components/move-property-button";
import { PropertyFolderCard } from "@/components/property-folder-card";
import { PublicLinkCard } from "@/components/public-link-card";
import { AdCopyGenerator } from "@/components/ad-copy-generator";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id, p, shareUsers, user, folderOptions, publicLink, adCopies } =
    await getPropertyDetailData(params);
  const shareText = propertyShareText({
    title: p.title,
    fileCode: p.fileCode,
    transactionType: p.transactionType,
    propertyType: p.propertyType,
    area: p.area,
    bedrooms: p.bedrooms,
    city: p.city,
    district: p.district,
    neighborhood: p.neighborhood,
    salePrice: p.salePrice,
    mortgagePrice: p.mortgagePrice,
    rentPrice: p.rentPrice,
  });
  const shareFields: Field[] = [
    {
      name: "userId",
      label: "کاربر",
      type: "select",
      options: shareUsers.map((u) => ({
        value: u.id,
        label: `${u.name} · ${u.mobile}`,
      })),
      required: true,
    },
    {
      name: "permission",
      label: "سطح دسترسی",
      type: "select",
      options: [
        { value: "VIEW", label: "فقط مشاهده" },
        { value: "EDIT", label: "ویرایش اطلاعات" },
        { value: "MANAGE", label: "مدیریت کامل" },
      ],
    },
    { name: "canUploadImages", label: "اجازه افزودن عکس", type: "checkbox" },
    { name: "canDelete", label: "اجازه حذف فایل", type: "checkbox" },
  ];
  return (
    <>
      <PageHeading
        title={p.title}
        description={`${p.fileCode} · ثبت‌شده در ${dateFa(p.createdAt)}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={`/properties/${id}/edit`}>
            <Pencil size={15} />
            ویرایش فایل
          </Link>
        </Button>
        <MovePropertyButton
          propertyId={id}
          currentFolderId={p.folderId}
          folders={folderOptions}
          size="sm"
          label="تغییر پوشه"
        />
        <AdCopyGenerator propertyId={id} initialCopies={adCopies} size="sm" />
        <PropertyShare
          text={shareText}
          imageUrl={p.images[0]?.url}
          fileName={`${p.fileCode}.webp`}
        />
      </PageHeading>
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <div className="row-between">
              <div className="row-gap">
                <Badge value={p.status} />
                <span className="transaction">
                  {p.transactionType === "SALE" ? "فروش" : "رهن و اجاره"} ·{" "}
                  {p.propertyType}
                </span>
              </div>
              <ImageUploader propertyId={id} />
            </div>
            <PropertyGallery
              images={p.images.map(({ id, url }) => ({ id, url }))}
              title={p.title}
              canDelete={canDeletePropertyImages(user, p)}
            />
            <p className="row-gap muted">
              <MapPin size={17} />
              {p.city}، {p.district}، {p.neighborhood}، {p.address}
            </p>
            <div className="spec-grid">
              {[
                [fa(String(p.area)), "متر مربع"],
                [fa(p.bedrooms), "اتاق خواب"],
                [fa(p.floor), "طبقه"],
                [fa(p.buildingAge), "سال ساخت"],
                [fa(p.totalFloors), "تعداد طبقات"],
                [fa(p.unitsPerFloor), "واحد در طبقه"],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="amenities">
              {[
                { has: p.parking, label: "پارکینگ", Icon: Car },
                { has: p.storage, label: "انباری", Icon: Package },
                { has: p.elevator, label: "آسانسور", Icon: ArrowUpDown },
                { has: p.balcony, label: "بالکن", Icon: Sun },
              ].map(({ has, label, Icon }) => (
                <span key={label} className={has ? "" : "absent"}>
                  <Icon size={17} />
                  {label}
                  {!has ? " ندارد" : ""}
                </span>
              ))}
            </div>
            <PropertyFolderCard
              folder={p.folder}
              propertyId={id}
              folders={folderOptions}
            />
            <h3>توضیحات ملک</h3>{" "}
            <p className="preserve-space">
              {p.description || "توضیحی ثبت نشده است."}
            </p>
            {p.internalNotes && (
              <div className="info-box">
                <b>یادداشت داخلی</b>
                <p className="preserve-space">{p.internalNotes}</p>
              </div>
            )}
          </section>
          <section className="panel detail-panel">
            <div className="row-between">
              <h2>قراردادها و سوابق تمدید</h2>
              {p.transactionType === "RENT" && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/contracts/new?propertyId=${id}`}>
                    <Plus size={15} />
                    ثبت قرارداد
                  </Link>
                </Button>
              )}
            </div>
            {p.contracts.length ? (
              p.contracts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="activity-row"
                >
                  <div>
                    <strong>{c.tenantName}</strong>
                    <small>
                      {dateFa(c.startDate)} تا {dateFa(c.endDate)}
                    </small>
                  </div>
                  <Badge value={c.status} />
                </Link>
              ))
            ) : (
              <p className="muted">قراردادی برای این ملک ثبت نشده است.</p>
            )}
          </section>
          <section className="panel detail-panel">
            <h2>تاریخچه وضعیت</h2>
            <div className="timeline">
              {p.history.map((h) => (
                <div key={h.id}>
                  <span className="timeline-dot" />
                  <strong>
                    {h.oldStatus ? `${statuses[h.oldStatus]} ← ` : ""}
                    {statuses[h.newStatus]}
                  </strong>
                  <p>
                    {h.note} · {h.changedByUser.name}
                  </p>
                  <small>{dateFa(h.createdAt)}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside>
          <section className="panel detail-panel">
            <h2>اطلاعات مالی</h2>
            {p.transactionType === "SALE" ? (
              <div className="financial-value">
                <span>قیمت کل</span>
                <strong>{money(String(p.salePrice))}</strong>
              </div>
            ) : (
              <>
                <div className="financial-value">
                  <span>رهن</span>
                  <strong>{money(String(p.mortgagePrice))}</strong>
                </div>
                <div className="financial-value">
                  <span>اجاره ماهانه</span>
                  <strong>{money(String(p.rentPrice))}</strong>
                </div>
                {p.isConvertible && (
                  <div className="info-box">
                    قابل تبدیل · معادل اجاره کامل:
                    <br />
                    <b>
                      {money(
                        Math.round(
                          Number(p.mortgagePrice) * Number(p.conversionRate) +
                            Number(p.rentPrice),
                        ),
                      )}
                    </b>
                  </div>
                )}
              </>
            )}
          </section>
          <section className="panel detail-panel">
            <h2>اطلاعات مالک</h2>
            <Link href={`/owners/${p.owner.id}`} className="owner-identity">
              <span className="avatar">{p.owner.fullName[0]}</span>
              <strong>{p.owner.fullName}</strong>
            </Link>
            <a
              className="btn btn-outline full-width"
              href={`tel:${p.owner.mobile}`}
            >
              <Phone size={17} />
              <span dir="ltr">{p.owner.mobile}</span>
            </a>
            {p.owner.secondMobile && <p dir="ltr">{p.owner.secondMobile}</p>}
            <Button asChild variant="ghost">
              <Link href={`/owners/${p.owner.id}`}>مشاهده پرونده مالک ←</Link>
            </Button>
          </section>
          <PublicLinkCard
            propertyId={id}
            initialToken={publicLink?.token}
            showAddressDefault={publicLink?.showAddress}
            stats={
              publicLink
                ? {
                    views: publicLink.views,
                    phoneClicks: publicLink.phoneClicks,
                    visitRequests: publicLink.visitRequests,
                  }
                : undefined
            }
          />
          <section className="panel detail-panel">
            <h2>اشتراک‌گذاری فایل</h2>
            <p className="muted">
              فایل متعلق به {p.ownerUser?.name ?? "دفتر"} است. برای مشاور دیگر
              سطح دسترسی جدا تعریف کنید.
            </p>
            {p.shares.length ? (
              <div className="mini-list">
                {p.shares.map((share) => (
                  <div className="mini-record" key={share.id}>
                    <strong>{share.user.name}</strong>
                    <small>
                      {share.permission}
                      {share.canUploadImages ? " · عکس" : ""}
                      {share.canDelete ? " · حذف" : ""}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                این فایل هنوز با کسی اشتراک‌گذاری نشده است.
              </p>
            )}
            {shareUsers.length ? (
              <RecordForm
                kind="share"
                fields={shareFields}
                hidden={{ propertyId: id }}
              />
            ) : (
              <p className="muted">
                کاربر تأییدشده‌ای برای اشتراک‌گذاری وجود ندارد.
              </p>
            )}
          </section>
          <section className="panel detail-panel">
            <div className="row-between">
              <h2>پیگیری‌ها</h2>
              <Link
                href={`/follow-ups/new?propertyId=${id}`}
                className="text-link"
              >
                + افزودن
              </Link>
            </div>
            {p.followUps.length ? (
              p.followUps.map((f) => (
                <div className="mini-record" key={f.id}>
                  <strong>{f.note}</strong>
                  <div className="row-between">
                    <small>{dateFa(f.followUpDate)}</small>
                    <Badge value={f.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">پیگیری ثبت نشده است.</p>
            )}
          </section>
          <section className="panel detail-panel">
            <h2>یادآوری‌ها</h2>
            {p.reminders.length ? (
              p.reminders.map((r) => (
                <div className="mini-record" key={r.id}>
                  <strong>{r.title}</strong>
                  <small>{dateFa(r.remindAt)}</small>
                </div>
              ))
            ) : (
              <p className="muted">یادآوری فعالی وجود ندارد.</p>
            )}
          </section>
          <section className="panel detail-panel">
            <h2>مدیریت وضعیت</h2>
            <div className="action-wrap">
              {["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"]
                .filter(
                  (s) =>
                    s !== p.status &&
                    !(s === "RENTED" && p.transactionType === "SALE") &&
                    !(s === "SOLD" && p.transactionType === "RENT"),
                )
                .map((s) => (
                  <RecordAction
                    key={s}
                    kind="property"
                    id={id}
                    action={s}
                    confirm
                  >
                    {statuses[s]}
                  </RecordAction>
                ))}
              <RecordAction
                kind="property"
                id={id}
                action="delete"
                variant="destructive"
                confirm
              >
                حذف نرم فایل
              </RecordAction>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
