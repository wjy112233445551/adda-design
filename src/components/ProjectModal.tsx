"use client";

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/projects";
import { projectImages } from "@/lib/project-images";
import gsap from "gsap";
import { ScrollReveal } from "@/components/ScrollReveal";

// 所有图片统一全宽展示，不再使用缩略图或混排模板
export function MagazineGallery({ images, title, captions = [], galleryOrder, coverPath }: { images: string[]; title: string; captions?: string[]; galleryOrder?: number[]; coverPath?: string }) {
  // images 已经去掉了封面 (调用方传 images.slice(1))
  // galleryOrder 是完整列表的索引: [0]=封面, [1..]=所有其余图片
  const galleryImages = images;
  const allImgs: string[] = [];

  if (galleryOrder && galleryOrder.length > 1) {
    const coverIdx = galleryOrder[0];
    const ordered: string[] = [];
    const used = new Set<number>();

    for (let i = 1; i < galleryOrder.length; i++) {
      const idx = galleryOrder[i];
      if (idx >= 0 && idx < images.length + 1 && !used.has(idx)) {
        const actualIdx = idx < coverIdx ? idx : idx - 1;
        if (actualIdx >= 0 && actualIdx < galleryImages.length) {
          ordered.push(galleryImages[actualIdx]);
          used.add(idx);
        }
      }
    }
    for (let i = 0; i < galleryImages.length; i++) {
      if (!ordered.includes(galleryImages[i])) ordered.push(galleryImages[i]);
    }
    allImgs.push(...ordered);
  } else {
    allImgs.push(...galleryImages);
  }

  return (
    <>
      {allImgs.map((img, i) => (
        <ScrollReveal key={i} delay={i * 100}>
          <div style={{ marginBottom: "clamp(56px, 9vw, 104px)" }}>
            <div style={{ overflow: "hidden", borderRadius: 0 }}>
              <img src={img} alt={`${title} ${i + 1}`}
                className="w-full h-auto"
                loading="lazy" />
            </div>
          </div>
        </ScrollReveal>
      ))}
    </>
  );
}

export function ProjectModal({
  project,
  cardRect,
  slideFrom,
  allProjects,
  onClose,
  onNavigate,
}: {
  project: Project;
  cardRect: DOMRect | null;
  slideFrom?: "left" | "right" | "top";
  allProjects: Project[];
  onClose: () => void;
  onNavigate: (p: Project) => void;
}) {
  const idx = allProjects.findIndex(p => p.slug === project.slug);
  const prev = idx > 0 ? allProjects[idx - 1] : null;
  const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null;

  const switchProject = (dir: "prev" | "next") => {
    const target = dir === "prev" ? prev : next;
    if (!target || animating.current) return;
    animating.current = true;

    const slide = slideRef.current;
    if (!slide) { onNavigate(target); return; }

    gsap.killTweensOf(slide);
    gsap.killTweensOf(contentRef.current);

    const outX = dir === "prev" ? "60%" : "-60%";
    (window as any).__switchDir = dir;

    gsap.to(slide, {
      x: outX,
      opacity: 0,
      duration: 0.35,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(slide, { x: 0 });
        window.scrollTo({ top: 0, behavior: "instant" });
        if (overlayRef.current) overlayRef.current.scrollTop = 0;
        onNavigate(target);
      },
    });
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const animating = useRef(false);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);

  // ── Copy link ──────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/projects/${project.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [project.slug]);

  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    // 先尝试映射表，没有则 API 加载
    const mapped = projectImages[project.folder];
    if (mapped && mapped.length > 0) {
      setImages(mapped);
    } else if (project.folder) {
      setImages([]); // 切换项目时先清空
      fetch(`/api/browse?folder=${encodeURIComponent(project.folder)}`, { cache: "no-store" })
        .then(r => r.json()).then(d => setImages(Array.isArray(d) ? d : [])).catch(() => {});
    } else {
      setImages([]);
    }
  }, [project.folder]);

  // Cleanup on unmount: restore nav
  useEffect(() => {
    return () => {
      const nav = document.querySelector("nav");
      if (nav) nav.style.display = "";
    };
  }, []);

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    // Hide main nav
    const nav = document.querySelector("nav");
    if (nav) nav.style.display = "none";

    const savedScroll = window.scrollY;
    (window as any).__modalSavedScroll = savedScroll;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (overlayRef.current) overlayRef.current.scrollTop = 0;

    const switchDir = (window as any).__switchDir;
    const dir = switchDir || slideFrom || "right";
    const switching = !!switchDir;

    let startX = "0%", startY = "0%";
    if (dir === "left") startX = "-25%";
    if (dir === "right") startX = "25%";
    if (dir === "top") startY = "-50%";

    gsap.killTweensOf(overlayRef.current);
    gsap.killTweensOf(contentRef.current);
    gsap.killTweensOf(heroRef.current);

    if (!slideRef.current) return;
    const slide = slideRef.current;

    if (switching) {
      gsap.set(overlayRef.current, { opacity: 1 });
      gsap.set(heroRef.current, { opacity: 0, scale: 0.97 });
      gsap.set(infoRef.current, { opacity: 0, y: 24 });
      gsap.set(galleryRef.current, { opacity: 0, y: 16 });
      gsap.set(slide, { x: startX, opacity: 1 });

      const tl = gsap.timeline();
      tl.to(slide, { x: "0%", duration: 0.4, ease: "expo.out" });
      tl.to(heroRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, "+=0.05");
      tl.to(infoRef.current, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "+=0.06");
      tl.to(galleryRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "+=0.04");
    } else {
      gsap.set(overlayRef.current, { opacity: 1 });
      gsap.set(heroRef.current, { opacity: 1 });
      gsap.set(slide, { x: startX, y: startY, opacity: 1 });
      gsap.to(slide, { x: "0%", y: "0%", duration: 0.5, ease: "expo.out" });
    }
    (window as any).__switchDir = null;
    setTimeout(() => { setReady(true); animating.current = false; }, 450);
  }, [cardRect, project.slug]);

  const handleClose = () => {
    gsap.killTweensOf(overlayRef.current);
    gsap.killTweensOf(contentRef.current);
    gsap.killTweensOf(heroRef.current);
    animating.current = false;
    const nav = document.querySelector("nav");
    if (nav) nav.style.display = "";
    const savedScroll = (window as any).__modalSavedScroll || 0;
    window.scrollTo({ top: savedScroll, behavior: "instant" });
    onClose();
  };

  // Modal 内滑动手势 — 切换项目
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - swipeStartX.current;
      const dy = e.changedTouches[0].clientY - swipeStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx < 0 && next) switchProject("next");
        else if (dx > 0 && prev) switchProject("prev");
      }
    };
    // Mouse drag
    let mouseDown = false;
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, a, img[data-no-swipe]")) return;
      swipeStartX.current = e.clientX;
      swipeStartY.current = e.clientY;
      mouseDown = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!mouseDown) return;
      mouseDown = false;
      const dx = e.clientX - swipeStartX.current;
      const dy = e.clientY - swipeStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
        if (dx < 0 && next) switchProject("next");
        else if (dx > 0 && prev) switchProject("prev");
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [project.slug, prev?.slug, next?.slug]);

  return (
    <div
      id="modal-overlay"
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-[#040404] overflow-y-auto"
      style={{ isolation: "isolate", opacity: 0 }}
    >
      {/* All Projects button */}
      {createPortal(
        <button
          type="button"
          onClick={handleClose}
          className="fixed top-6 left-6 z-[9997] text-white/60 hover:text-white text-[10px] tracking-[.3em] uppercase transition-colors px-4 py-2 rounded-full backdrop-blur-xl bg-white/5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ← All Projects
        </button>,
        document.body
      )}

      {/* Copy link button */}
      {createPortal(
        <button
          type="button"
          onClick={handleCopyLink}
          className="fixed top-6 right-6 z-[9997] text-white/50 hover:text-white text-[10px] tracking-[.2em] uppercase transition-all px-4 py-2 rounded-full backdrop-blur-xl bg-white/5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {copied ? "✓ Copied" : "🔗 Share"}
        </button>,
        document.body
      )}

      {/* Swipe hint — briefly shown */}
      {ready && (prev || next) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9997] text-white/15 text-[10px] tracking-[.2em] uppercase pointer-events-none"
          style={{ fontFamily: "var(--font-body)" }}>
          ← swipe →
        </div>
      )}

      <div ref={slideRef} style={{ paddingBottom: "80px" }}>
        <div className="max-w-[1400px] mx-auto px-6 pt-20 pb-16">

          {/* Hero — 图文叠加 */}
          <div className="relative mb-6 mt-4 overflow-hidden" style={{ height: "clamp(280px, 55vh, 600px)" }}>
            <img
              ref={heroRef}
              src={project.cover}
              alt={project.title}
              className="w-full h-full object-cover absolute inset-0"
              style={{ opacity: 0 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <h1 className="text-white mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 56px)" }}>{project.titleEn}</h1>
              <p className="text-white/70 mb-6" style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px, 1.3vw, 16px)" }}>{project.title}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {[
                  ["项目地点", project.city],
                  ["项目面积", project.area],
                  ["设计时间", project.year],
                  ["项目类型", project.category],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-white/40 text-[10px] tracking-[.1em] uppercase" style={{ fontFamily: "var(--font-body)" }}>{label}</span>
                    <span className="text-white/80 text-xs" style={{ fontFamily: "var(--font-body)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div ref={contentRef}>
            <div ref={infoRef} />

            {project.description && (
              <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 md:gap-16 mt-24 mb-16 max-w-[900px]">
                <div className="text-white/25 text-[10px] tracking-[.15em] uppercase pt-1" style={{ fontFamily: "var(--font-body)" }}>About</div>
                <div>
                  <p className="text-white/60 text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-body)" }}>{project.description}</p>
                  <p className="text-white/30 text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{project.descriptionEn}</p>
                </div>
              </div>
              </ScrollReveal>
            )}

            {/* 杂志风画廊 — 图文穿插 */}
            {images.length > 1 && (
              <div ref={galleryRef}>
                <MagazineGallery
                  images={images.filter((_, i) => i !== ((project as any).galleryOrder?.[0] ?? 0))}
                  title={project.title}
                  captions={(project as any).captions}
                  galleryOrder={(project as any).galleryOrder}
                  coverPath={project.cover}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
