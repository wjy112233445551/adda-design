"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const defaults = {
  zh: "邸岸空间建筑设计事务所成立于南京，专注于高端住宅、商业空间及文化项目的室内设计与建筑改造。我们相信空间是生活的容器，每一个项目都是与业主共同书写的叙事。",
  en: "ADDA architecture is a Nanjing-based design studio specializing in high-end residential, commercial, and cultural projects. We believe space is the container of life — every project is a narrative co-authored with our clients.",
  location: "南京 · 中国",
  founded: "2020",
  projects: "50+",
  clients: "保利 · 滨江 · 招商",
};

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(defaults);

  useEffect(() => {
    fetch("/api/pages").then(r => r.json()).then(d => {
      if (d.about) setData({ ...defaults, ...d.about });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.5, ease: "power2.out" });
  }, []);

  return (
    <div ref={containerRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(48px, 8vw, 128px) 24px 64px", opacity: 0 }}>
      {/* 标题区 */}
      <p className="text-white/20 text-[10px] tracking-[.3em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>About</p>
      <h1 className="text-white leading-[1.05] mb-8 md:mb-12" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 72px)", letterSpacing: "-0.01em" }}>
        Elevating Spaces,<br />Defining Aesthetics
      </h1>

      {/* 内容区 — 双栏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-16 md:mb-24">
        <div className="space-y-6">
          <p className="text-white/60 leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px, 1.1vw, 16px)" }}>
            {data.zh}
          </p>
          <p className="text-white/35 leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 0.95vw, 14px)", fontStyle: "italic" }}>
            {data.en}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 content-start">
          {[["Location", data.location], ["Founded", data.founded], ["Projects", data.projects], ["Clients", data.clients]].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-white/25 text-[10px] tracking-[.2em] uppercase mb-1.5" style={{ fontFamily: "var(--font-body)" }}>{label}</p>
              <p className="text-white/65 text-sm" style={{ fontFamily: "var(--font-body)" }}>{value as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 大图 */}
      <div className="-mx-6 md:mx-0">
        <img src="/about-image.webp" alt="ADDA Architecture" className="w-full" loading="lazy" />
      </div>

      {/* Founder 入口 */}
      <div className="mt-16 md:mt-24 pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <p className="text-white/15 text-[10px] tracking-[.2em] uppercase" style={{ fontFamily: "var(--font-body)" }}>People</p>
        <Link
          href="/about/founder"
          className="text-white/40 hover:text-white/70 text-xs tracking-[.2em] uppercase transition-colors"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Founders →
        </Link>
      </div>
    </div>
  );
}
