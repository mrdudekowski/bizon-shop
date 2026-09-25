import { SITE_CONTACT, contactEmailHref } from "@/constants/contact";

/**
 * Футер сайта
 */
export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <span>BIZON Tires</span>
        <span>Premium heavy-duty solutions</span>
        <a href={contactEmailHref()} className="underline">
          {SITE_CONTACT.email}
        </a>
        <span>© {year}</span>
      </div>
    </footer>
  );
};
