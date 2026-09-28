import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "آشیان | مدیریت املاک", template: "%s | آشیان" },
  description: "مدیریت فایل‌های املاک، مالکین، قراردادها و پیگیری‌های دفتر",
  applicationName: "آشیان",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "آشیان" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#147d70",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <a className="skip-link" href="#main">
          رفتن به محتوای اصلی
        </a>
        {children}
        <Toaster position="bottom-left" dir="rtl" richColors closeButton />
      </body>
    </html>
  );
}
