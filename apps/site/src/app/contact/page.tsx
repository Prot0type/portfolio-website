import { ContactStack } from "@/components/contact-stack";

export default function ContactPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="kicker">Contact</p>
        <h1 className="script-heading">feel free to reach out!</h1>
        <p>Hover a card to focus on one channel and dim the others.</p>
      </header>

      <ContactStack />
    </main>
  );
}

