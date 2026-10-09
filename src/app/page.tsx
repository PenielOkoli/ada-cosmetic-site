"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

const LAUNCH_DATE = "2026-11-14T10:00:00";

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
}

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.1a3.6 3.6 0 1 1-3-3.55" /><path d="M14 4c.55 2.7 2.25 4.3 5 4.55" /></svg>;
}

function Brand() {
  return <span className="brand" aria-label="GARDIN Cosmetics"><span>GARDIN</span><i>Cosmetics</i></span>;
}

function Socials() {
  return <div className="socials"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="GARDIN on Instagram"><InstagramIcon /></a><a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="GARDIN on TikTok"><TikTokIcon /></a></div>;
}

function SubscribeForm({ compact = false, collectName = false }: { compact?: boolean; collectName?: boolean }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (collectName && name.trim().length < 2) { setStatus("error"); setMessage("Please enter your name."); return; }
    if (collectName && !/^\+?[\d\s()\-]{7,}$/.test(whatsapp.trim())) { setStatus("error"); setMessage("Please enter a valid WhatsApp number."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setStatus("error"); setMessage("Please enter a valid email address."); return; }
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: collectName ? name.trim() : undefined, whatsapp: collectName ? whatsapp.trim() : undefined, email }) });
      if (!response.ok) throw new Error("Failed");
      setStatus("success"); setMessage("You’re on the list. We’ll be in touch."); setName(""); setEmail("");
      setWhatsapp("");
    } catch { setStatus("error"); setMessage("Something went wrong. Please try again."); }
  }
  return <form className={`subscribe-form ${compact ? "subscribe-compact" : ""}`} onSubmit={subscribe} noValidate>{collectName && <div className="form-details"><label className="sr-only" htmlFor="waitlist-name">Full name</label><input id="waitlist-name" type="text" autoComplete="name" placeholder="Your full name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={status === "error"} /><label className="sr-only" htmlFor="waitlist-whatsapp">WhatsApp number</label><input id="waitlist-whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="WhatsApp number" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} aria-invalid={status === "error"} /></div>}<div className="form-row"><label className="sr-only" htmlFor={compact ? "footer-email" : "hero-email"}>Email address</label><input id={compact ? "footer-email" : "hero-email"} type="email" inputMode="email" autoComplete="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={status === "error"} /><button type="submit" disabled={status === "sending"}>{status === "sending" ? "Joining…" : "Join the waitlist"}</button></div><p className={`form-message ${status}`} aria-live="polite">{message}</p></form>;
}

function Countdown() {
  const [time, setTime] = useState({ days: "00", hours: "00", minutes: "00" });
  useEffect(() => {
    const update = () => { const difference = Math.max(0, new Date(LAUNCH_DATE).getTime() - Date.now()); setTime({ days: String(Math.floor(difference / 86400000)).padStart(2, "0"), hours: String(Math.floor((difference / 3600000) % 24)).padStart(2, "0"), minutes: String(Math.floor((difference / 60000) % 60)).padStart(2, "0") }); };
    update(); const interval = window.setInterval(update, 60000); return () => window.clearInterval(interval);
  }, []);
  return <div className="countdown" aria-label="Countdown to launch"><span><b>{time.days}</b>days</span><span><b>{time.hours}</b>hours</span><span><b>{time.minutes}</b>mins</span></div>;
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  return <main>
    <div className="announcement">GARDIN COSMETICS <span>✦</span> COMING SOON</div>
    <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`} aria-label="Main navigation"><a href="#top" className="brand-link"><Brand /></a><Socials /></nav>

    <section className="hero" id="top">
      <video className="hero-video" src="/videos/gardin-hero-loop-v2.mp4" autoPlay loop muted playsInline preload="auto" aria-label="GARDIN Cosmetics campaign film" />
      <div className="hero-wash" />
      <div className="hero-content"><p className="eyebrow">Coming soon</p><p className="hero-copy hero-copy-short">A little care. A little sweetness.</p><a className="hero-cta" href="#waitlist">Join the waitlist <span>↓</span></a></div>
      <div className="coming-ruler" aria-hidden="true"><div className="coming-track">{Array.from({ length: 4 }, (_, index) => <span key={index}>GARDIN COSMETICS <i>✦</i> COMING SOON <i>✦</i> GARDIN COSMETICS <i>✦</i> COMING SOON <i>✦</i></span>)}</div></div>
    </section>

    <section className="promise reveal" aria-labelledby="promise-title">
      <div className="promise-copy"><p className="eyebrow">A GARDIN feeling</p><h2 id="promise-title">Moisture, lasting<br /><em>nourishment &amp; sweetness.</em></h2><p>Because skincare isn’t just about how your skin looks—it’s about how you feel.</p></div>
      <div className="promise-portrait"><Image src="/images/gardin-portrait-solo-clean.png" alt="GARDIN woman in a clean editorial portrait" fill sizes="(max-width: 767px) 100vw, 50vw" /></div>
    </section>

    <section className="together reveal" aria-labelledby="together-title"><div className="together-image"><Image src="/images/gardin-portrait-duo-clean.png" alt="Two GARDIN women together in a clean studio portrait" fill sizes="(max-width: 767px) 100vw, 48vw" /></div><div className="together-copy"><p className="eyebrow">Made with care</p><h2 id="together-title">For skin that<br /><em>deserves softness.</em></h2><p>From rich body butters to silky body oils, every GARDIN ritual is designed to bring warmth, moisture, and a touch of sweetness to your day.</p><p className="signature">With love,<br /><strong>GARDIN COSMETICS ✿</strong></p></div></section>

    <section className="waitlist reveal" id="waitlist" aria-labelledby="waitlist-title"><Image className="waitlist-image" src="/images/gardin-vanilla-hero.png" alt="Vanilla pods in warm light" fill sizes="100vw" /><div className="waitlist-wash" /><div className="waitlist-content"><p className="eyebrow">The waitlist is open</p><h2 id="waitlist-title">Something soft is<br /><em>coming your way.</em></h2><p>Be among the first to know when GARDIN arrives.</p><Countdown /><SubscribeForm compact collectName /></div></section>

    <footer><Brand /><p>© 2026 GARDIN Cosmetics</p><div className="footer-links"><a href="#top">Back to top</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></div></footer>
  </main>;
}
