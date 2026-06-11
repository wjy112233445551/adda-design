"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const defaultFounders = [
  {
    name: "周大仁",
    nameEn: "Darren",
    role: "创始人 / 设计总监",
    roleEn: "Founder & Design Director",
    bio: "毕业于南京林业大学室内设计专业。拥有十余年高端住宅与商业空间设计经验，作品以极简暗黑风格著称，善于在克制中营造戏剧性的空间叙事。",
    bioEn: "Graduate of Nanjing Forestry University in Interior Design. With over a decade of experience in high-end residential and commercial spaces, his work is known for its dark-minimalist aesthetic — crafting dramatic spatial narratives within rigorous restraint.",
  },
  {
    name: "唐铖",
    nameEn: "Akon",
    role: "创始人 / 创意总监",
    roleEn: "Founder & Creative Director",
    bio: "深耕空间设计领域多年，擅长从建筑、艺术与生活中提取灵感，将跨学科思维融入设计实践。致力于为每一个项目找到独特的表达语言。",
    bioEn: "A seasoned spatial designer who draws inspiration from architecture, art, and everyday life, integrating cross-disciplinary thinking into design practice. Dedicated to finding a unique expressive language for every project.",
  },
];

export default function FounderPage() {
  const [founders, setFounders] = useState(defaultFounders);
  useEffect(() => {
    fetch("/api/pages").then(r => r.json()).then(d => {
      if (d.founders?.length >= 2) setFounders(d.founders);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(48px, 8vw, 128px) 24px 64px" }}>
      <Link
        href="/about"
        className="text-white/30 hover:text-white/60 text-[10px] tracking-[.3em] uppercase transition-colors inline-block"
        style={{ fontFamily: "var(--font-display)", marginBottom: "clamp(40px, 6vw, 80px)" }}
      >
        ← About
      </Link>

      <p className="text-white/20 text-[10px] tracking-[.3em] uppercase mb-4" style={{ fontFamily: "var(--font-body)" }}>About · People</p>
      <h1 className="text-white leading-none mb-12" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 7vw, 80px)", letterSpacing: "-0.02em" }}>
        Founders
      </h1>

      {/* 合照 */}
      <div className="mb-20 md:mb-28">
        <img
          src="/hezhao.jpg"
          alt="ADDA Founders"
          className="w-full object-cover"
          style={{ maxHeight: "70vh" }}
          loading="lazy"
        />
      </div>

      {/* 创始人介绍 — 双栏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {founders.map((f: any) => (
          <div key={f.name}>
            <h2 className="text-white leading-tight mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3vw, 32px)" }}>
              {f.nameEn}
            </h2>
            <p className="text-white/50 mb-1" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px, 1.1vw, 15px)" }}>
              {f.name}
            </p>
            <p className="text-white/20 text-[10px] tracking-[.1em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>
              {f.role} / {f.roleEn}
            </p>
            <div className="space-y-4" style={{ maxWidth: 460 }}>
              <p className="text-white/55 leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px, 1vw, 14px)" }}>
                {f.bio}
              </p>
              <p className="text-white/30 leading-relaxed italic" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(11px, 0.9vw, 13px)" }}>
                {f.bioEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
