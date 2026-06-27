"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { navigateWithTransition } from "./TransitionOverlay";
import { SearchBar } from "./SearchBar";

type NavLink = {
  num: string; label: string; href: string;
  hasDropdown?: boolean;
  dropdownItems?: { label: string; labelEn: string; href: string }[];
};

const links: NavLink[] = [
  { num: "01", label: "Work", href: "/", hasDropdown: true },
  { num: "02", label: "About", href: "/about", hasDropdown: true, dropdownItems: [
    { label: "ADDA", labelEn: "Studio", href: "/about" },
    { label: "创始人", labelEn: "Founder", href: "/about/founder" },
  ]},
  { num: "03", label: "Contact", href: "/contact", hasDropdown: true, dropdownItems: [
    { label: "联系我们", labelEn: "Contact", href: "/contact" },
    { label: "加入我们", labelEn: "Join Us", href: "/contact/join" },
  ]},
];

const categories = [
  { label: "全部", labelEn: "All", value: "" },
  { label: "住宅", labelEn: "Residential", value: "residential" },
  { label: "商业", labelEn: "Commercial", value: "commercial" },
  { label: "在建项目", labelEn: "Under Construction", value: "rendering" },
];

export function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navRef = useRef<HTMLElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const currentCategory = searchParams.get("category") || "";

  useEffect(() => {
    gsap.fromTo(navRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.8, ease: "power3.out" });
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 bg-black opacity-0">
      <div className="max-w-[1400px] mx-auto flex items-center"
        style={{ padding: "clamp(14px, 2vw, 28px) clamp(20px, 3vw, 36px)" }}>
        <a href="/" onClick={(e) => { e.preventDefault(); document.getElementById("modal-overlay") ? window.dispatchEvent(new CustomEvent("close-modal")) : navigateWithTransition("/"); }}
          className="cursor-pointer flex-shrink-0">
          <img src="/logo.webp" alt="ADDA" className="w-auto" style={{ height: "clamp(24px, 3vw, 42px)" }} />
        </a>

        {/* 占位 — 保持导航左右平衡 */}
        <div className="flex-1" />

        <div className="flex items-center flex-shrink-0" style={{ gap: "clamp(12px, 2.5vw, 36px)" }}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return link.hasDropdown ? (
              <div key={link.href} className="relative" style={{ paddingBottom: 24, marginBottom: -24 }}
                onMouseEnter={() => setOpenDropdown(link.num)}
                onMouseLeave={() => setOpenDropdown(null)}>
                <span className="group flex items-center gap-1.5 cursor-pointer"
                  style={{ fontSize: "clamp(10px, 1.3vw, 13px)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span className={`transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
                    style={{ fontFamily: "var(--font-display)", opacity: 0.65, fontSize: "0.85em" }}>{link.num}</span>
                  <span className={`transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
                    style={{ fontFamily: "var(--font-body)" }}>{link.label}</span>
                  {isActive && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.4)", marginLeft: -2 }} />}
                </span>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-1.5 pb-1.5 min-w-[150px] transition-all duration-200 ${openDropdown === link.num ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"}`}
                  style={{ background: "rgba(18,18,18,0.92)", backdropFilter: "blur(20px)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  {(link.num === "01" ? categories : link.dropdownItems || []).map((item: any) => {
                    const href = link.num === "01" ? `/?category=${item.value}` : item.href;
                    const itemActive = link.num === "01" ? currentCategory === item.value : false;
                    return (
                      <a key={item.label} href={href}
                        className={`block px-4 py-2 transition-colors hover:text-white cursor-pointer ${itemActive ? "text-white" : "text-white/60"}`}
                        style={{ fontFamily: "var(--font-body)", fontSize: "clamp(10px, 1vw, 12px)", letterSpacing: "0.05em" }}
                        onClick={(e) => { e.preventDefault(); setOpenDropdown(null); navigateWithTransition(href); }}>
                        {item.label} <span style={{ opacity: 0.25 }}>/</span> {item.labelEn || item.value}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              <a key={link.href} href={link.href}
                className="group flex items-center gap-1.5 cursor-pointer"
                style={{ fontSize: "clamp(10px, 1.3vw, 13px)", letterSpacing: "0.1em", textTransform: "uppercase" }}
                onClick={(e) => { e.preventDefault(); navigateWithTransition(link.href); }}>
                <span className={`transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
                  style={{ fontFamily: "var(--font-display)", opacity: 0.65, fontSize: "0.85em" }}>{link.num}</span>
                <span className={`transition-colors ${isActive ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
                  style={{ fontFamily: "var(--font-body)" }}>{link.label}</span>
              </a>
            );
          })}

          {/* Icons */}
          <div className="flex items-center" style={{ gap: "clamp(10px, 2vw, 24px)" }}>
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
