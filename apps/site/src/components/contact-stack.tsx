import { SOCIAL_LINKS } from "@/lib/socials";

export function ContactStack() {
  return (
    <section className="contact-stack">
      {SOCIAL_LINKS.map((social) => (
        <a key={social.id} href={social.href} target="_blank" rel="noreferrer" className="contact-card">
          <div className="contact-icon-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={social.icon} alt={social.label} />
          </div>
          <div className="contact-copy">
            <p className="contact-label">{social.label}</p>
            <p className="contact-handle">{social.handle}</p>
          </div>
        </a>
      ))}
    </section>
  );
}
