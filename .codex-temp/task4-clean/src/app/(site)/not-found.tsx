import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-inner text-center py-20">
      <h1 className="section-title">404</h1>
      <p className="section-description">Страница не найдена.</p>
      <Link href="/" className="btn-accent inline-flex mt-8">
        На главную
      </Link>
    </div>
  );
}
