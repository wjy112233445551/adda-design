"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const defaults = {
  zh: "邸岸空间建筑设计事务所由设计师Akon和Darren创立，致力于打造富有情感和深度的建筑体验，为人们的生活增添色彩。以创造力和平衡为核心，ADDA专注于将冒险精神与建筑传统相融合，致力于构建富有新鲜感的空间。我们强调团队的经验、天赋与信心，以创造引人入胜的环境为目标，提供超越视觉的全方位体验，赋予空间独特的生命力。",
  en: "ADDA architecture is a Nanjing-based design studio specializing in high-end residential, commercial, and cultural projects. We believe space is the container of life — every project is a narrative co-authored with our clients.",
  brand: [
    { label: "A", founder: "AKON" },
    { label: "D", founder: "DARREN" },
    { label: "D", meaning: "邸  ｜  高级居所  ｜  人与空间共同呼吸" },
    { label: "A", meaning: "岸  ｜  家的港湾  ｜  五感的自由与松弛" },
  ],
  location: "南京 · 中国",
  founded: "2020",
  projects: "50+",
  honors: [
    "2023 40-40 中国（南京）设计杰出青年",
    "2023 美国 MUSE 设计银奖",
    "2023 芒果设计全国住宅创意奖",
    "2023 第11届 HI-D 设计大赛全国优秀奖",
    "2023 小红书筑家有方奖",
    "2023 NCA 新商业空间设计师 TOP100",
    "2023 红棉设计室内大奖",
    "2024 40-40 中国（南京）设计杰出青年",
    "2024 美国 MUSE 设计金奖",
    "2024 第12届 HI-D 设计大赛全国金奖",
    "2024 设计星全国 36 强",
    "2024 ICS 色彩空间设计奖",
    "2024 亚洲青年设计之光中国内地 TOP100",
    "2024 星园奖-年度优秀造园师",
    "2024 IS 智能空间设计奖",
    "2024 入选中国室内设计年鉴",
  ],
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

  // 去掉年份前缀，只保留奖项名称
  const honors = (data.honors || []).map((h: string) => h.replace(/^20\d{2}\s*/, ""));

  const statStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
  };

  return (
    <div ref={containerRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(80px, 10vw, 160px) 24px 96px", opacity: 0 }}>
      {/* ── 标题 ── */}
      <p className="text-white/20 text-[10px] tracking-[.3em] uppercase mb-6" style={{ fontFamily: "var(--font-body)" }}>About</p>
      <h1 className="text-white leading-none mb-20 md:mb-28" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 7vw, 80px)", letterSpacing: "-0.015em" }}>
        Elevating Spaces,<br />Defining Aesthetics
      </h1>

      {/* ── 正文 + 数据：不对称双栏 ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-y-16 gap-x-20 md:gap-x-28 mb-24 md:mb-36">
        {/* 左栏：正文 */}
        <div style={{ maxWidth: 580 }}>
          <p className="text-white/50 leading-loose mb-12" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px, 1.05vw, 16px)", lineHeight: 2.1 }}>
            {data.zh}
          </p>

          {/* ADDA 品牌含义 — 诗意排版 */}
          {data.brand && data.brand.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              {data.brand.map((item: any, i: number) => {
                const isHeader = !!item.founder;
                return (
                  <div key={i} style={{
                    display: "flex",
                    gap: "clamp(12px, 2vw, 24px)",
                    paddingTop: i === 0 ? 0 : "clamp(12px, 1.5vw, 18px)",
                    paddingBottom: "clamp(12px, 1.5vw, 18px)",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(18px, 2vw, 28px)",
                      color: isHeader ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.3)",
                      lineHeight: 1,
                      flexShrink: 0,
                      width: "clamp(24px, 3vw, 36px)",
                    }}>
                      {item.label}
                    </span>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(12px, 0.9vw, 13px)",
                      color: isHeader ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.3)",
                      lineHeight: 1.7,
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>
                      {item.founder || item.meaning}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-white/25 leading-relaxed italic" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 0.85vw, 13px)", lineHeight: 1.9 }}>
            {data.en}
          </p>
        </div>

        {/* 右栏：数据 — 纵向列表 */}
        <div className="space-y-10 md:space-y-12" style={{ minWidth: "clamp(140px, 18vw, 200px)" }}>
          {[
            { label: "Location", value: data.location },
            { label: "Founded", value: data.founded },
            { label: "Projects", value: data.projects },
            { label: "Awards", value: `${data.honors?.length || 0} 项` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ ...statStyle, color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
                {label}
              </p>
              <p style={{ ...statStyle, color: "rgba(255,255,255,0.55)", fontSize: "clamp(13px, 0.95vw, 15px)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 荣誉奖项 ── */}
      {honors.length > 0 && (
        <div style={{ marginBottom: "clamp(64px, 8vw, 120px)" }}>
          <p className="text-white/15 text-[10px] tracking-[.3em] uppercase mb-10" style={{ fontFamily: "var(--font-body)" }}>
            Honors &amp; Awards
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-2.5">
            {honors.map((h: string, i: number) => (
              <p key={i} className="text-white/35" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 0.85vw, 13px)", lineHeight: 1.8 }}>
                {h}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── 大图 — 全宽无边距 ── */}
      <div className="-mx-6 md:-mx-0" style={{ marginBottom: "clamp(64px, 8vw, 120px)" }}>
        <img src="/about-image.webp" alt="ADDA Architecture" className="w-full" loading="lazy" />
      </div>

      {/* ── 创始人入口 — 精简 ── */}
      <Link
        href="/about/founder"
        className="group flex items-center justify-between py-8 border-t border-white/[0.06] text-white/25 hover:text-white/50 transition-colors"
        style={{ textDecoration: "none" }}
      >
        <span className="text-[10px] tracking-[.25em] uppercase" style={{ fontFamily: "var(--font-body)" }}>People</span>
        <span className="text-xs tracking-[.2em] uppercase" style={{ fontFamily: "var(--font-display)" }}>
          Founders <span className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity">→</span>
        </span>
      </Link>
    </div>
  );
}
