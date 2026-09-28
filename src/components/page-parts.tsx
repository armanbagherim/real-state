import Link from "next/link";
import { ChevronLeft, FolderOpen, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { fa, statuses } from "@/lib/utils";
import type { SearchParams } from "@/repositories/properties";
export function PageHeading({
  title,
  description,
  action,
  href,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">
        {children}
        {action && href && (
          <Button asChild>
            <Link href={href}>
              <Plus size={18} />
              {action}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase()}`}>
      <span />
      {statuses[value] ?? value}
    </span>
  );
}
export function Empty({
  title = "هنوز اطلاعاتی ثبت نشده",
  description = "با ثبت اولین مورد، اطلاعات را اینجا خواهید دید.",
  href,
  action,
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <FolderOpen size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Button asChild>
          <Link href={href}>
            <Plus size={16} />
            {action ?? "ثبت مورد جدید"}
          </Link>
        </Button>
      )}
    </div>
  );
}
export function Pagination({
  page,
  pages,
  total,
  params = {},
}: {
  page: number;
  pages: number;
  total: number;
  params?: SearchParams;
}) {
  function url(p: number) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string") q.set(k, v);
    });
    q.set("page", String(p));
    return `?${q}`;
  }
  return (
    <div className="pagination">
      <span>
        {fa(total)} مورد · صفحه {fa(page)} از {fa(Math.max(1, pages))}
      </span>
      <div>
        {page > 1 && (
          <Button asChild variant="outline" size="sm">
            <Link href={url(page - 1)}>قبلی</Link>
          </Button>
        )}
        {page < pages && (
          <Button asChild variant="outline" size="sm">
            <Link href={url(page + 1)}>
              بعدی <ChevronLeft size={14} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
