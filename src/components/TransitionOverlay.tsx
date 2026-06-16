"use client";

import { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

let triggerNav: ((url: string) => void) | null = null;
export function navigateWithTransition(url: string) {
  triggerNav?.(url);
}

export function TransitionOverlay() {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const circleTween = useRef<gsap.core.Tween | null>(null);
  const busy = useRef(false);

  const navigateTo = useCallback(
    (url: string) => {
      if (busy.current) return;
      busy.current = true;

      const overlay = overlayRef.current;
      if (!overlay) return;

      // 1. 遮罩从上方落下，完全覆盖屏幕
      gsap.to(overlay, {
        y: "0%",
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => {
          // 2. 遮罩覆盖后切换路由
          router.push(url);

          // 3. 固定等待新页面渲染
          setTimeout(() => {
            // 4. 遮罩下滑露出新页面
            gsap.to(overlay, {
              y: "100%",
              duration: 0.7,
              ease: "power3.inOut",
              onComplete: () => {
                // 5. 归位
                gsap.set(overlay, { y: "-100%" });
                busy.current = false;
              },
            });
          }, 2000);
        },
      });
    },
    [router]
  );

  useEffect(() => {
    triggerNav = navigateTo;
    const overlay = overlayRef.current;
    if (overlay) gsap.set(overlay, { y: "-100%" });

    // GSAP 持续旋转+描边动画，不受 CSS 离屏暂停影响
    if (circleRef.current) {
      const circle = circleRef.current;
      circleTween.current = gsap.to(circle, {
        rotation: 360,
        duration: 3,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
        svgOrigin: "25 25",
      });
      // 同步的 dashoffset 动画
      gsap.fromTo(circle,
        { strokeDashoffset: 145 },
        { strokeDashoffset: -145, duration: 3, repeat: -1, ease: "none" }
      );
    }

    return () => {
      triggerNav = null;
      circleTween.current?.kill();
    };
  }, [navigateTo]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2147483647,
        background: "#040404",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transform: "translateY(-100%)",
      }}
    >
      <svg
        viewBox="0 0 50 50"
        style={{
          width: "clamp(2.5rem, 5vw, 4rem)",
          marginBottom: "clamp(0.8rem, 2vw, 1.5rem)",
          overflow: "visible",
        }}
      >
        <circle
          ref={circleRef}
          r="23"
          cx="25"
          cy="25"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="2"
          strokeDasharray="145"
          strokeDashoffset="145"
          style={{ transformOrigin: "25px 25px" }}
        />
      </svg>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(1rem, 2vw, 1.4rem)",
          color: "#e5e5e5",
          letterSpacing: "0.25em",
          fontWeight: 300,
        }}
      >
        ADDA
      </p>

    </div>
  );
}
