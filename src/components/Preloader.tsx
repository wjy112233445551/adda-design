"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import BlobCursor from "@/components/BlobCursor/BlobCursor";

export function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const leftTextRef = useRef<HTMLSpanElement>(null);
  const rightTextRef = useRef<HTMLSpanElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const exitTimeline = useRef<any>(null);
  const doExitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (started.current) return;
    // 后台页面跳过倒计时
    if (window.location.pathname === "/admin") {
      if (containerRef.current) containerRef.current.style.display = "none";
      return;
    }
    started.current = true;

    const doExit = () => {
      if (exitTimeline.current) return;
      exitTimeline.current = gsap.timeline({
        onComplete: () => {
          if (containerRef.current) containerRef.current.style.display = "none";
        },
      });
      exitTimeline.current.to([logoRef.current, enterRef.current], { opacity: 0, duration: 0.4 });
      exitTimeline.current.to(containerRef.current, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, "-=0.2");
    };
    doExitRef.current = doExit;

    const tl = gsap.timeline();

    // Phase 1: Counter animation (0 → 100)
    const counterObj = { value: 0 };
    tl.to(counterObj, {
      value: 100,
      duration: 1.5,
      ease: "none",
      snap: { value: 1 },
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(counterObj.value);
        }
      },
    });

    // Phase 1 parallel: Text & lines fade in
    tl.fromTo(
      [leftTextRef.current, rightTextRef.current],
      { opacity: 0.3 },
      { opacity: 0.5, duration: 0.6, ease: "power2.out" },
      0
    );

    tl.fromTo(
      [leftLineRef.current, rightLineRef.current],
      { scaleY: 0 },
      { scaleY: 1, duration: 0.8, ease: "power3.out" },
      0
    );

    // Phase 2: Text brightens at end
    tl.to(
      [leftTextRef.current, rightTextRef.current],
      { opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );

    // Phase 3: Counter row fades out
    tl.to(counterRowRef.current, { opacity: 0, duration: 0.5, ease: "power3.in" });

    // Phase 4: Logo appears
    tl.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.9, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    // Phase 5: Enter button fades in below logo
    tl.fromTo(
      enterRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Fallback: 如果 5 秒后动画还没完成，强制显示 Enter 按钮
    setTimeout(() => {
      if (containerRef.current && containerRef.current.style.display !== "none") {
        if (counterRowRef.current) counterRowRef.current.style.opacity = "0";
        if (logoRef.current) { logoRef.current.style.opacity = "1"; logoRef.current.style.transform = "scale(1)"; }
        if (enterRef.current) { enterRef.current.style.opacity = "1"; enterRef.current.style.transform = "translateY(0)"; }
      }
    }, 6000);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#040404] flex items-center justify-center" style={{ height: "100dvh" }}
      suppressHydrationWarning
    >
      <div className="relative w-full h-full grid" style={{ placeItems: "center" }}>
        {/* 光标 blob 交互 */}
        <BlobCursor fillColor="#f5faff" trailCount={3} sizes={[100,180,120]} innerSizes={[30,50,38]} innerColor="rgba(255,255,255,0.95)" opacities={[0.55,0.35,0.2]} zIndex={90} />
        {/* Counter — center of screen, fades out */}
        <div ref={counterRowRef} className="flex flex-col md:flex-row items-center justify-center gap-y-3 md:gap-y-0 px-4"
          style={{ gap: "clamp(6px, 2vw, 32px)" }}>
          <span
            ref={leftTextRef}
            className="text-[#888] uppercase leading-tight opacity-30 text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(11px, 2.5vw, 48px)",
              letterSpacing: "clamp(0.1em, 0.25vw, 0.3em)",
            }}
          >
            Thinking Things
          </span>

          <div className="flex items-center">
            <div
              ref={leftLineRef}
              className="bg-white/10 hidden md:block"
              style={{ width: "clamp(1.5px, 0.4vw, 3px)", height: "clamp(20px, 5vw, 56px)", marginRight: "clamp(8px, 1.5vw, 24px)" }}
            />
            <span
              ref={counterRef}
              className="text-white tabular-nums text-center leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 10vw, 108px)",
                minWidth: "clamp(3rem, 10vw, 11rem)",
                display: "inline-block",
                transform: "translateY(-12px)",
              }}
            >
              0
            </span>
            <div
              ref={rightLineRef}
              className="bg-white/10 hidden md:block"
              style={{ width: "clamp(1.5px, 0.4vw, 3px)", height: "clamp(20px, 5vw, 56px)", marginLeft: "clamp(8px, 1.5vw, 24px)" }}
            />
          </div>

          <span
            ref={rightTextRef}
            className="text-[#888] uppercase leading-tight opacity-30 text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(11px, 2.5vw, 48px)",
              letterSpacing: "clamp(0.1em, 0.25vw, 0.3em)",
            }}
          >
            Into Existence
          </span>
        </div>

        {/* Logo + Enter button — same center position */}
        <div ref={logoRef} className="absolute inset-0 opacity-0 flex flex-col items-center justify-center"
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
              }}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
