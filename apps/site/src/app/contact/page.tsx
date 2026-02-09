import Link from "next/link";

import { ContactStack } from "@/components/contact-stack";

export default function ContactPage() {
  return (
    <main className="page-shell contact-page-shell">
      <div className="static-frame-corners" aria-hidden>
        <div className="frame-piece frame-piece-top-right static-frame-top-right">
          <div className="frame-piece-h" />
          <div className="frame-piece-v" />
        </div>
        <div className="frame-piece frame-piece-bottom-left static-frame-bottom-left">
          <div className="frame-piece-h" />
          <div className="frame-piece-v" />
        </div>
      </div>

      <Link href="/" className="corner-back-button" aria-label="Back to home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/back-circle-chevron-left.svg" alt="" />
      </Link>

      <section className="contact-page-inner">
        <header className="page-header">
          <p className="kicker">Contact</p>
          <h1 className="contact-title">let&apos;s connect</h1>
          <p>Choose any channel below to reach Ishani.</p>
        </header>

        <ContactStack />
      </section>
    </main>
  );
}
