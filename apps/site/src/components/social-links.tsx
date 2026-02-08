const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/placeholder" },
  { label: "Behance", href: "https://www.behance.net/placeholder" },
  { label: "Instagram", href: "https://www.instagram.com/placeholder" },
  { label: "Email", href: "mailto:shardulchuri7@gmail.com" }
];

export function SocialLinks() {
  return (
    <section className="socials" id="connect">
      <div className="section-header">
        <p className="eyebrow">Connect</p>
        <h2>Find me online</h2>
      </div>
      <div className="social-grid">
        {LINKS.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}

