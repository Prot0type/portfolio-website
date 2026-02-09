import { SOCIAL_LINKS } from "@/lib/socials";

export function SocialIconRow() {
  return (
    <div className="social-row">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.id}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className="social-icon-link"
          aria-label={social.label}
          title={social.label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={social.icon} alt={social.label} />
        </a>
      ))}
    </div>
  );
}
