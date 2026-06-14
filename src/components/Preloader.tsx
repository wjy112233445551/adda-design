"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * 判断当前设备是否需要加载移动端 hero（宽度 < 768px）
 * 在 preloader 阶段就开始预加载对应尺寸的 hero.webp，
 * 确保用户点击 Enter 后 hero 大图已在浏览器缓存中，即点即显。
 */
function preloadHeroImage() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const heroSrc = isMobile ? "/hero-mobile.webp" : "/hero.webp";

  // 仅预加载 WebP（99%+ 浏览器支持），不浪费 8.9MB 加载 JPEG 兜底
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = heroSrc;
  link.fetchPriority = "high";
  document.head.appendChild(link);

  // Image 对象双保险预加载
  const img = new Image();
  img.src = heroSrc;
}

export function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const exitTimeline = useRef<gsap.core.Timeline | null>(null);
  const doExitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (started.current) return;
    if (window.location.pathname === "/admin") {
      if (containerRef.current) containerRef.current.style.display = "none";
      return;
    }
    started.current = true;

    // 🚀 关键：在 preloader 展示阶段立即开始预加载 hero 大图
    preloadHeroImage();

    const doExit = () => {
      if (exitTimeline.current) return;
      window.dispatchEvent(new CustomEvent("preloader-exit"));
      exitTimeline.current = gsap.timeline({
        onComplete: () => {
          if (containerRef.current) containerRef.current.style.display = "none";
        },
      });
      exitTimeline.current.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power3.inOut",
      });
    };
    doExitRef.current = doExit;

    // Logo + Enter 淡入
    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }
    );
    tl.fromTo(
      enterRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      "-=0.2"
    );

    setTimeout(() => {
      if (containerRef.current && containerRef.current.style.display !== "none") {
        if (logoRef.current) { logoRef.current.style.opacity = "1"; logoRef.current.style.transform = "translateY(0)"; }
        if (enterRef.current) { enterRef.current.style.opacity = "1"; enterRef.current.style.transform = "translateY(0)"; }
      }
    }, 8000);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#040404] flex items-center justify-center"
      style={{ height: "100dvh" }}
      suppressHydrationWarning
    >
      <div ref={logoRef} className="opacity-0 flex flex-col items-center"
        style={{ gap: "clamp(16px, 3vw, 32px)" }}>
        <img src="/logo.webp" alt="ADDA" className="w-auto"
          style={{ height: "clamp(64px, 12vw, 144px)" }} />
        <div ref={enterRef} className="opacity-0">
          <button
            onClick={() => doExitRef.current()}
            className="text-white/50 hover:text-white border border-white/20 hover:border-white/40 uppercase tracking-[.3em] transition-all duration-300"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(10px, 1.2vw, 12px)",
              padding: "clamp(6px, 1vw, 12px) clamp(16px, 3vw, 32px)",
              background: "transparent",
            }}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
