import { messengerMark } from "@/components/brand/messengerMark";
import {
  PLACEHOLDER_SITE_PROFILE,
  contactCardChannels,
  contactHref,
  type SiteProfile,
} from "@/lib/content/siteProfile";

import styles from "./ContactCard.module.css";

export function ContactCard({
  profile,
  notice,
  className,
}: {
  profile: SiteProfile | null;
  notice?: string;
  className?: string;
}) {
  const contacts = profile ?? PLACEHOLDER_SITE_PROFILE;
  const phone = contacts.phone.trim() || PLACEHOLDER_SITE_PROFILE.phone;
  const email = contacts.email.trim() || PLACEHOLDER_SITE_PROFILE.email;
  const rows = [
    { label: "Телефон", value: phone, href: contactHref("phone", contacts.phone) },
    { label: "Email", value: email, href: contactHref("email", contacts.email) },
  ];
  const channels = contactCardChannels(contacts.channels);

  return (
    <section className={[styles.card, className].filter(Boolean).join(" ")} aria-label="Контакты BIZON">
      <h2>Контакты</h2>
      <div className={styles.contacts}>
        {rows.map((row) => (
          <div className={styles.row} key={row.label}>
            <span className={styles.label}>{row.label}</span>
            {row.href ? <a className={styles.value} href={row.href}>{row.value}</a> : <span className={styles.value}>{row.value}</span>}
          </div>
        ))}
      </div>
      {channels.length > 0 ? (
        <div className={styles.channels}>
          {channels.map((channel) => (
            <a
              key={channel.id}
              className={`btn-secondary ${styles.channel}`}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {messengerMark(channel.id)}
              {channel.label}
            </a>
          ))}
        </div>
      ) : null}
      {notice ? <p className={styles.notice}>{notice}</p> : null}
    </section>
  );
}
