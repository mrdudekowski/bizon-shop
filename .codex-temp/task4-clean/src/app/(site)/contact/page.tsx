import { ContactSection } from "@/components/ContactSection/ContactSection.jsx";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/catalog/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata = createPageMetadata({
  title: "Контакты",
  description: "Свяжитесь с BIZON для расчёта, подбора шин или консультации по парку.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <div className="section-inner">
        <PageHeader
          title="Контакты"
          description="Расчёт, подбор шин и консультация для fleet-операторов."
          breadcrumbs={[
            { href: "/", label: "Главная" },
            { href: "/contact", label: "Контакты" },
          ]}
        />
        <ContactForm />
      </div>
      <ContactSection />
    </>
  );
}
