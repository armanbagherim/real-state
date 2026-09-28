import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>صفحه پیدا نشد</h1>
      <p>ممکن است این فایل حذف شده یا آدرس نادرست باشد.</p>
      <Link className="btn btn-primary" href="/dashboard">
        بازگشت به داشبورد
      </Link>
    </main>
  );
}
