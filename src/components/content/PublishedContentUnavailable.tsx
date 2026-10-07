import Link from "next/link";

export function PublishedContentUnavailable({
  title = "Каталог временно недоступен",
  message = "Не получилось загрузить товары. Попробуйте ещё раз через минуту.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="section-inner min-h-[55vh] py-16" role="alert">
      <h1 className="section-title">{title}</h1>
      <p className="section-description">{message}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <form>
          <button className="btn-secondary" type="submit">
            Попробовать ещё раз
          </button>
        </form>
        <Link className="btn-secondary" href="/">
          На главную
        </Link>
      </div>
    </main>
  );
}
