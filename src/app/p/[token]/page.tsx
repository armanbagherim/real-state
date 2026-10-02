import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivePublicListing } from "@/repositories/public-listings";
import { toPublicProperty } from "@/lib/public-property";
import {
  ListingAmenities,
  ListingDescription,
  ListingGallery,
  ListingMeta,
  ListingPrices,
  ListingStats,
  ListingTracker,
} from "@/components/public/listing-parts";
import { ListingCta } from "@/components/public/listing-cta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const link = await getActivePublicListing((await params).token);
  if (!link) return { title: "آگهی در دسترس نیست" };
  const p = toPublicProperty(link);
  const location = [p.neighborhood, p.district, p.city].filter(Boolean).join("، ");
  const title = `${p.propertyType} ${p.area} متری${location ? ` در ${location}` : ""}`;
  return {
    title,
    description: p.description.slice(0, 160) || title,
    // Shared listings stay out of search engines; they are for named customers.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: p.description.slice(0, 160) || title,
      images: p.images[0] ? [p.images[0].url] : [],
      type: "website",
    },
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const link = await getActivePublicListing((await params).token);
  if (!link) notFound();
  const p = toPublicProperty(link);

  return (
    <main className="listing-page" id="main">
      <ListingTracker token={p.token} hasImages={p.images.length > 1} />
      <header className="listing-header">
        <span className="listing-brand">آشیان</span>
        <span className="listing-office">{p.office.name}</span>
      </header>

      <ListingGallery p={p} />

      <div className="listing-body">
        <ListingStats p={p} />
        <ListingPrices p={p} />
        <ListingAmenities p={p} />
        {p.address && (
          <section className="listing-block">
            <h2>نشانی</h2>
            <p>{p.address}</p>
          </section>
        )}
        <ListingDescription p={p} />
        <ListingMeta p={p} />
      </div>

      <div className="listing-sticky-cta">
        <ListingCta
          token={p.token}
          agentName={p.agent.name}
          mobile={p.agent.mobile}
          officeName={p.office.name}
        />
      </div>

      <footer className="listing-footer">
        <p>
          ساخته‌شده با <Link href="/">آشیان</Link>
        </p>
      </footer>
    </main>
  );
}