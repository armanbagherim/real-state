"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  House,
  LayoutDashboard,
  FolderOpen,
  KeyRound,
  Tags,
  Building2,
  Users,
  FileText,
  CalendarCheck,
  Bell,
  Settings,
  UserCog,
  LogOut,
  Menu,
  Search,
  ChevronLeft,
  Command,
  Download,
  Chrome,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { logout } from "@/actions/auth";
import { cn, dateFa } from "@/lib/utils";
const nav = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/properties", label: "همه فایل‌ها", icon: FolderOpen },
  { href: "/properties/sale", label: "فایل‌های فروش", icon: Tags },
  { href: "/properties/rent", label: "فایل‌های اجاره", icon: KeyRound },
  { href: "/properties/rented", label: "اجاره‌رفته‌ها", icon: Building2 },
  { href: "/properties/sold", label: "فروش‌رفته‌ها", icon: House },
  { href: "/owners", label: "مالکین", icon: Users },
  { href: "/contracts", label: "قراردادها", icon: FileText },
  { href: "/follow-ups", label: "پیگیری‌ها", icon: CalendarCheck },
  { href: "/reminders", label: "یادآوری‌ها", icon: Bell },
  { href: "/offices", label: "مدیریت املاک", icon: Building2, superAdminOnly: true },
  { href: "/users", label: "ادمین‌ها", icon: UserCog, superAdminOnly: true },
  { href: "/agents", label: "مشاورین", icon: UserCog, officeAdminOnly: true },
  { href: "/settings", label: "تنظیمات", icon: Settings },
  { href: "/extension", label: "راهنمای افزونه", icon: Chrome },
];
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Shell({
  children,
  name,
  officeName,
  role,
}: {
  children: React.ReactNode;
  name: string;
  officeName: string;
  role: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const active =
    nav.find((n) => n.href === path) ||
    nav.find((n) => path.startsWith(n.href));
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const sidebar = (
    <>
      <Link href="/dashboard" className="brand">
        <span className="brand-icon">
          <House size={27} />
        </span>
        <span>
          <b>
            آشیان<span className="brand-dot">.</span>
          </b>
          <small>دستیار هوشمند املاک شما</small>
        </span>
      </Link>
      <div className="office-label">
        <span className="office-avatar">آ</span>
        <div>
          <strong>{officeName}</strong>
          <small>فضای کاری دفتر املاک</small>
        </div>
        <ChevronLeft size={15} />
      </div>
      <p className="nav-caption">مدیریت دفتر</p>
      <nav aria-label="منوی اصلی">
        {nav
          .filter((item) =>
            item.superAdminOnly
              ? role === "SUPER_ADMIN"
              : item.officeAdminOnly
              ? role === "OFFICE_ADMIN"
              : true,
          )
          .map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "nav-link",
              path === href && "active",
              i === 6 && "nav-divider",
            )}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
            {path === href && <span className="active-dot" />}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="workspace-note">
          <span className="online-dot" /> همه‌چیز برای یک روز پربازده
        </div>
        {install && (
          <button
            className="install-button"
            onClick={async () => {
              await install.prompt();
              setInstall(null);
            }}
          >
            <Download size={17} /> نصب اپلیکیشن آشیان
          </button>
        )}
        <div className="profile">
          <span className="avatar">{name.charAt(0)}</span>
          <div>
            <strong>{name}</strong>
            <small>
              {role === "SUPER_ADMIN"
                ? "مدیر کل"
                : role === "OFFICE_ADMIN"
                ? "مدیر دفتر"
                : "مشاور املاک"}
            </small>
          </div>
          <form action={logout}>
            <button
              aria-label="خروج از حساب"
              className="btn btn-ghost btn-icon"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar desktop-sidebar">{sidebar}</aside>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="sidebar mobile-sidebar"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">منوی اصلی</Dialog.Title>
            <Dialog.Close aria-label="بستن منو" className="drawer-close">
              <X size={20} />
            </Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu btn btn-ghost btn-icon"
            aria-label="باز کردن منو"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumbs">
            فضای کاری <ChevronLeft size={13} />
            <strong>{active?.label ?? "جزئیات"}</strong>
          </div>
          <GlobalSearch />
          <div className="header-tools">
            <span className="header-date">{dateFa(new Date())}</span>
            <Link
              href="/reminders"
              className="notification-button"
              aria-label="یادآوری‌ها"
            >
              <Bell size={20} />
            </Link>
            <span className="avatar small-avatar">{name.charAt(0)}</span>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>آشیان؛ همراه روزهای کاری شما</span>
          <span>مدیریت ساده، تصمیم‌های بهتر</span>
        </footer>
      </div>
    </div>
  );
}
function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    {
      id: string;
      title: string;
      fileCode: string;
      owner: { fullName: string };
    }[]
  >([]);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error();
        setResults(await response.json());
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="global-search">
      <Search size={18} />
      <input
        aria-label="جستجوی سراسری"
        ref={input}
        placeholder="جستجوی فایل، مالک، شماره تماس…"
        value={query}
        onFocus={() => setActive(true)}
        onBlur={() => setTimeout(() => setActive(false), 180)}
        onChange={(e) => {
          setQuery(e.target.value);
          setResults([]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setActive(false);
          if (e.key === "Enter") {
            setActive(false);
            router.push(`/properties?q=${encodeURIComponent(query)}`);
          }
        }}
      />
      <kbd>
        <Command size={11} /> K
      </kbd>
      {active && query.length >= 2 && (
        <div className="search-results">
          {busy ? (
            <p>در حال جستجو…</p>
          ) : failed ? (
            <p>جستجو انجام نشد؛ دوباره تلاش کنید.</p>
          ) : results.length ? (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/properties/${r.id}`}
                onClick={() => setActive(false)}
              >
                <span>
                  <b>{r.title}</b>
                  <small>{r.owner.fullName}</small>
                </span>
                <span dir="ltr">{r.fileCode}</span>
              </Link>
            ))
          ) : (
            <p>نتیجه‌ای پیدا نشد.</p>
          )}
        </div>
      )}
    </div>
  );
}
