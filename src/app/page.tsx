"use client";

import Image from "next/image";
import { FormEvent, useState, useSyncExternalStore } from "react";

// Pre-launch begins on 30 October in Lagos (WAT).
const LAUNCH_DATE = "2026-10-30T00:00:00+01:00";

function PrelaunchDate() {
  return <p className="prelaunch-date"><span>PRE-LAUNCH DATE</span><time dateTime={LAUNCH_DATE}>30th Oct, 2026</time></p>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
}

function Brand() {
  return <span className="brand" aria-label="GARDIN Cosmetics"><span>GARDIN</span><i>Cosmetics</i></span>;
}

function Socials() {
  return <div className="socials"><a href="https://www.instagram.com/gardincosmetics/" target="_blank" rel="noreferrer" aria-label="GARDIN on Instagram"><InstagramIcon /></a></div>;
}

function SubscribeForm({ compact = false, collectName = false }: { compact?: boolean; collectName?: boolean }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const websiteField = event.currentTarget.elements.namedItem("website") as HTMLInputElement | null;
    const website = websiteField?.value || "";
    if (collectName && name.trim().length < 2) { setStatus("error"); setMessage("Please enter your name."); return; }
    if (collectName && (!/^\+?[\d\s()\-]+$/.test(whatsapp.trim()) || !/^\d{7,15}$/.test(whatsapp.replace(/\D/g, "")))) { setStatus("error"); setMessage("Please enter a valid WhatsApp number."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setStatus("error"); setMessage("Please enter a valid email address."); return; }
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: collectName ? name.trim() : undefined, whatsapp: collectName ? whatsapp.trim() : undefined, email: email.trim(), website }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) { setStatus("error"); setMessage(result.error || "Something went wrong. Please try again."); return; }
      setStatus("success"); setMessage("You’re on the list. We’ll be in touch."); setName(""); setEmail("");
      setWhatsapp("");
    } catch { setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return <form className={`subscribe-form ${compact ? "subscribe-compact" : ""}`} onSubmit={subscribe} noValidate aria-busy={status === "sending"}><div className="sr-only" aria-hidden="true"><label htmlFor={compact ? "footer-website" : "hero-website"}>Leave this field empty</label><input id={compact ? "footer-website" : "hero-website"} name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={200} /></div>{collectName && <div className="form-details"><label className="sr-only" htmlFor="waitlist-name">Full name</label><input id="waitlist-name" name="name" type="text" maxLength={200} required autoComplete="name" placeholder="Your full name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={status === "error"} /><label className="sr-only" htmlFor="waitlist-whatsapp">WhatsApp number</label><input id="waitlist-whatsapp" name="whatsapp" type="tel" maxLength={32} required inputMode="tel" autoComplete="tel" placeholder="WhatsApp number" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} aria-invalid={status === "error"} /></div>}<div className="form-row"><label className="sr-only" htmlFor={compact ? "footer-email" : "hero-email"}>Email address</label><input id={compact ? "footer-email" : "hero-email"} type="email" name="email" maxLength={254} required inputMode="email" autoComplete="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={status === "error"} /><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Joining…" : "Join the waitlist"}</button></div><p className={`form-message ${status}`} aria-live="polite">{message}</p></form>;
}

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60000);
  return () => window.clearInterval(timer);
}

function Countdown() {
  const now = useSyncExternalStore<number | null>(subscribeToClock, () => Math.floor(Date.now() / 60000) * 60000, () => null);
  const difference = now === null ? null : Math.max(0, new Date(LAUNCH_DATE).getTime() - now);
  const units = difference === null ? ["—", "—", "—"] : [
    String(Math.floor(difference / 86400000)).padStart(2, "0"),
    String(Math.floor((difference / 3600000) % 24)).padStart(2, "0"),
    String(Math.floor((difference / 60000) % 60)).padStart(2, "0"),
  ];
  return <div className="countdown" aria-label="Countdown to launch"><span><b>{units[0]}</b>days</span><span><b>{units[1]}</b>hours</span><span><b>{units[2]}</b>mins</span></div>;
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export default function Home() {
  const scrolled = useSyncExternalStore(subscribeToScroll, () => window.scrollY > 24, () => false);
  return <main>
    <div className="announcement">GARDIN COSMETICS <span>✦</span> COMING SOON</div>
    <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`} aria-label="Main navigation"><a href="#top" className="brand-link"><Brand /></a><Socials /></nav>

    <section className="hero" id="top">
      <video className="hero-video" src="/videos/gardin-hero-loop-v2.mp4" autoPlay loop muted playsInline preload="auto" aria-label="GARDIN Cosmetics campaign film" />
      <div className="hero-wash" />
      <div className="hero-content"><p className="eyebrow">Coming soon</p><p className="hero-copy hero-copy-short">A little care. A little sweetness.</p><PrelaunchDate /><a className="hero-cta" href="#waitlist">Join the waitlist <span>↓</span></a></div>
      <div className="coming-ruler" aria-hidden="true"><div className="coming-track">{Array.from({ length: 4 }, (_, index) => <span key={index}>GARDIN COSMETICS <i>✦</i> COMING SOON <i>✦</i> GARDIN COSMETICS <i>✦</i> COMING SOON <i>✦</i></span>)}</div></div>
    </section>

    <section className="promise reveal" aria-labelledby="promise-title">
      <div className="promise-copy"><p className="eyebrow">A GARDIN feeling</p><h2 id="promise-title">Moisture, lasting<br /><em>nourishment &amp; sweetness.</em></h2><p>We understand that some skin needs a little extra attention, which is why we focus on creating formulas that leave your skin feeling deeply hydrated and beautifully cared for.</p></div>
      <div className="promise-portrait"><Image src="/images/gardin-portrait-solo-clean.png" alt="GARDIN woman in a clean editorial portrait" fill sizes="(max-width: 1023px) 100vw, 50vw" /></div>
    </section>

    <section className="together reveal" aria-labelledby="together-title"><div className="together-image"><Image src="/images/gardin-portrait-duo-clean.png" alt="Two GARDIN women together in a clean studio portrait" fill sizes="(max-width: 1023px) 100vw, 50vw" /></div><div className="together-copy"><p className="eyebrow">Made with care</p><h2 id="together-title">For a skin that<br /><em>deserves all the nourishment.</em></h2><p>From rich body butters to silky body oils, every GARDIN ritual is designed to bring warmth, moisture, and a touch of sweetness to your day.</p><p className="signature">With love,<br /><strong>GARDIN COSMETICS ✿</strong></p></div></section>

    <section className="waitlist reveal" id="waitlist" aria-labelledby="waitlist-title"><Image className="waitlist-image" src="/images/gardin-vanilla-hero.png" alt="Vanilla pods in warm light" fill sizes="100vw" /><div className="waitlist-wash" /><div className="waitlist-content"><p className="eyebrow">The waitlist is open</p><h2 id="waitlist-title">Something soft is<br /><em>coming your way.</em></h2><p>Be among the first to know when GARDIN arrives.</p><PrelaunchDate /><Countdown /><SubscribeForm compact collectName /></div></section>

    <footer><Brand /><p>© 2026 GARDIN Cosmetics</p><div className="footer-links"><a href="#top">Back to top</a><a href="https://www.instagram.com/gardincosmetics/" target="_blank" rel="noreferrer">Instagram</a></div></footer>
  </main>;
}
