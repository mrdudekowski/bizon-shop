import { SECTIONS } from "@/constants/sections";
import {
  SITE_CONTACT,
  contactEmailHref,
  contactPhoneHref,
} from "@/constants/contact";

/**
 * Секция контактов
 */
export const ContactSection = () => {
  const contacts = [
    {
      title: "Телефон",
      text: SITE_CONTACT.phone,
      href: contactPhoneHref(),
    },
    {
      title: "Email",
      text: SITE_CONTACT.email,
      href: contactEmailHref(),
    },
    {
      title: "География",
      text: SITE_CONTACT.geography,
    },
  ];

  return (
    <section id={SECTIONS.CONTACT} className="section">
      <h2 className="section-title">Контакты</h2>
      <p className="section-description">
        Свяжитесь с нами для расчёта, подбора шин или консультации по парку.
      </p>
      <div className="section-grid">
        {contacts.map((contact) => (
          <article key={contact.title} className="card-base info-card">
            <h3 className="info-card-title">{contact.title}</h3>
            {contact.href ? (
              <a href={contact.href} className="info-card-text underline">
                {contact.text}
              </a>
            ) : (
              <p className="info-card-text">{contact.text}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
