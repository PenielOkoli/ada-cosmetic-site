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

function SubscribeForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Subscription failed");
      setStatus("success");
      setMessage("You’re on the list. We’ll be in touch.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form className={`subscribe-form ${dark ? "subscribe-dark" : ""}`} onSubmit={subscribe} noValidate>
      <div className="form-row">
        <label className="sr-only" htmlFor={dark ? "footer-email" : "hero-email"}>Email address</label>
        <input id={dark ? "footer-email" : "hero-email"} type="email" inputMode="email" autoComplete="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={status === "error"} />
        <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Joining…" : "Notify Me"}</button>
      </div>
      <p className={`form-message ${status}`} aria-live="polite">{message}</p>
    </form>
  );
}

function Countdown() {
  const [time, setTime] = useState({ days: "00", hours: "00", minutes: "00" });
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(LAUNCH_DATE).getTime() - Date.now());
      setTime({
        days: String(Math.floor(diff / 86400000)).padStart(2, "0"),
        hours: String(Math.floor((diff / 3600000) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((diff / 60000) % 60)).padStart(2, "0"),
      });
    };
    update();
    const interval = window.setInterval(update, 60000);
    return () => window.clearInterval(interval);
  }, []);
  return <div className="countdown" aria-label="Countdown to launch"><span><b>{time.days}</b>days</span><span><b>{time.hours}</b>hours</span><span><b>{time.minutes}</b>min</span></div>;
}

const campaignPhotos = [
  { src: "/images/campaign-2.jpg", alt: "GARDIN muse holding Baked Vanilla body oil" },
  { src: "/images/campaign-7.jpg", alt: "Two GARDIN muses with Baked Vanilla body care" },
  { src: "/images/campaign-8.jpg", alt: "GARDIN muse holding Honey Milk body butter" },
  { src: "/images/campaign-4.jpg", alt: "Hands holding GARDIN Baked Vanilla body oil" },
  { src: "/images/campaign-9.jpg", alt: "GARDIN muse with Baked Vanilla body butter" },
  { src: "/images/campaign-1.jpg", alt: "Two GARDIN muses with body butter" },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const updateNav = () => setScrolled(window.scrollY > 42);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    return () => window.removeEventListener("scroll", updateNav);
  }, []);

  return (
    <main>
      <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`} aria-label="Main navigation">
        <a href="#top" className="brand-link"><Brand /></a>
        <div className="nav-socials">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="GARDIN on Instagram"><InstagramIcon /></a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="GARDIN on TikTok"><TikTokIcon /></a>
        </div>
      </nav>

      <section className="hero" id="top">
        <Image className="hero-image" src="/images/product-baked-vanilla-butter.jpg" alt="GARDIN Baked Vanilla body butter among vanilla ice cream and caramel" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow">Gourmand body care, arriving soon</p>
          <h1>Indulge your<br /><em>every day.</em></h1>
          <p className="hero-copy">Baked Vanilla and Honey Milk body care, made for the richness of your skin.</p>
          <SubscribeForm />
        </div>
        <p className="scroll-note">Scroll to savour <span>↓</span></p>
      </section>

      <section className="products reveal" aria-labelledby="collections-title">
        <div className="section-heading"><p className="eyebrow">The first taste</p><h2 id="collections-title">A little something<br /><em>for your ritual.</em></h2></div>
        <div className="product-grid">
          <article className="product-card"><div className="product-image"><Image src="/images/product-baked-vanilla-oil.jpg" alt="GARDIN Baked Vanilla body oil" fill sizes="(max-width: 767px) 100vw, 50vw" /></div><div className="product-meta"><div><h3>Baked Vanilla</h3><p>Body butter + body oil</p></div><span>Coming soon</span></div></article>
          <article className="product-card"><div className="product-image"><Image src="/images/product-honey-milk-butter.jpg" alt="GARDIN Honey Milk body butter" fill sizes="(max-width: 767px) 100vw, 50vw" /></div><div className="product-meta"><div><h3>Honey Milk</h3><p>Body butter</p></div><span>Coming soon</span></div></article>
        </div>
      </section>

      <section className="story reveal" aria-labelledby="story-title">
        <div className="story-copy"><p className="eyebrow">Our invitation</p><h2 id="story-title">Softness is a<br /><em>whole mood.</em></h2><p>GARDIN turns your daily body ritual into a delicious pause. Deeply scented, beautifully indulgent care created with melanin-rich skin in mind.</p><p>For the glow you feel before anyone sees it.</p></div>
        <div className="story-image"><Image src="/images/campaign-5.jpg" alt="GARDIN muse holding Baked Vanilla body oil" fill sizes="(max-width: 767px) 100vw, 50vw" /></div>
      </section>

      <section className="community reveal" aria-labelledby="community-title">
        <div className="community-heading"><p className="eyebrow">GARDIN girls</p><h2 id="community-title">Made to be<br /><em>held close.</em></h2><p>Skin, scent, and the art of taking your time.</p></div>
        <div className="mosaic">
          {campaignPhotos.map((photo, index) => <figure className={`mosaic-item mosaic-${index + 1}`} key={photo.src}><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw" /></figure>)}
        </div>
      </section>

      <section className="launch reveal" aria-labelledby="launch-title">
        <div><p className="eyebrow">The table is set</p><h2 id="launch-title">See you<br /><em>at launch.</em></h2><p className="launch-date">Launching 14 November 2026</p><Countdown /></div>
        <div className="launch-form"><p>Be first to know when GARDIN is ready for your shelf.</p><SubscribeForm dark /><div className="launch-socials"><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></div></div>
      </section>

      <footer><Brand /><p>© 2026 GARDIN Cosmetics</p><div><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></div></footer>
    </main>
  );
}
