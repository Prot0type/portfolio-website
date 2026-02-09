"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SiteShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", isActive: (pathname) => pathname === "/" },
  { href: "/projects", label: "Projects", isActive: (pathname) => pathname.startsWith("/projects") },
  { href: "/timeline", label: "Timeline", isActive: (pathname) => pathname === "/timeline" },
  { href: "/contact", label: "Contact", isActive: (pathname) => pathname === "/contact" }
];

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navState = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        active: item.isActive(pathname)
      })),
    [pathname]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="menu-button" aria-label="Open navigation menu" onClick={() => setOpen(true)}>
        <span />
        <span />
        <span />
      </button>

      <aside className={`nav-panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="nav-panel-inner">
          <p className="nav-title">Navigate</p>
          <nav>
            <ul>
              {navState.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={item.active ? "active" : ""}
                    onClick={(event) => {
                      if (item.active) {
                        event.preventDefault();
                        setOpen(false);
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {open ? <button type="button" className="nav-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}

      <div className="site-content">{children}</div>
    </>
  );
}

