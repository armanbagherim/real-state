import { PropertiesPage } from "@/components/properties-page";
import type { SearchParams } from "@/repositories/properties";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <PropertiesPage
      searchParams={searchParams}
      title="اجاره‌رفته‌ها"
      preset={{ status: "RENTED", transactionType: "RENT" }}
    />
  );
}
