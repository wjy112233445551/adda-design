"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import type { Project } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectModal } from "@/components/ProjectModal";
import gsap from "gsap";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroIntroRef = useRef<HTMLDivElement>(null);
  const heroCharsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [modalRect, setModalRect] = useState<DOMRect | null>(null);
  const [modalSlide, setModalSlide] = useState<"left" | "right" | "top">("right");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const api = category === "rendering" ? "/api/renderings" : "/api/projects";
    fetch(api).then(r => r.json()).then(setProjects);
  }, [category]);

  // Listen for close-modal event from nav ADDA click
  useEffect(() => {
    const handler = () => {
      setModalProject(null);
      setModalRect(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, []);

  const filtered = useMemo(() => {
    const list = projects.filter((p) => p.cover);
    if (category === "residential") return list.filter((p) => p.type === "residential");
    if (category === "commercial") return list.filter((p) => p.type === "commercial");
    return list;
  }, [category, projects]);

  const carouselProjects = filtered.slice(0, 5);
  const gridProjects = filtered; // All projects in grid

  // Hero 文字逐字弹出 — 点击 Enter 后触发，动画期间锁定滚动
  useEffect(() => {
    const onExit = () => {
      // 锁定滚动
      document.body.style.overflow = "hidden";

      if (!heroCharsRef.current) return;
      const chars = heroCharsRef.current.querySelectorAll<HTMLSpanElement>(".hero-char");

      gsap.fromTo(
        chars,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          delay: 0.6,
          ease: "power3.out",
          onComplete: () => {
            // 解锁滚动，通知导航栏渐显
            document.body.style.overflow = "";
            window.dispatchEvent(new CustomEvent("hero-animation-done"));
          },
        }
      );
    };

    window.addEventListener("preloader-exit", onExit);
    return () => window.removeEventListener("preloader-exit", onExit);
  }, []);

  useEffect(() => {
    if (carouselProjects.length === 0 || !heroRef.current) return;
    gsap.fromTo(
      heroRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, [carouselProjects]);

  // Carousel auto-play
  useEffect(() => {
    if (carouselProjects.length === 0 || modalProject) return;
    const el = document.getElementById("carousel");
    if (!el) return;

    let autoTimer: ReturnType<typeof setInterval>;
    let pauseTimer: ReturnType<typeof setTimeout>;
    let paused = false;

    const scrollNext = () => {
      if (paused) return;
      const step = el.offsetWidth;
      el.scrollBy({ left: step, behavior: "smooth" });
    };

    // Seamless loop: when reaching the cloned first card, jump back to real first
    const handleScroll = () => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.offsetWidth;
      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: "instant" });
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });

    const startAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(scrollNext, 4000);
    };

    const pause = () => {
      paused = true;
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => { paused = false; }, 2000);
    };

    // Pause on user interaction
    el.addEventListener("touchstart", pause);
    el.addEventListener("mousedown", pause);
    el.addEventListener("wheel", pause);

    startAuto();

    return () => {
      clearInterval(autoTimer);
      clearTimeout(pauseTimer);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("mousedown", pause);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [carouselProjects]);

  // Infinite scroll — auto load more when scrolling near bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || gridProjects.length <= visibleCount) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + 6, gridProjects.length));
            setLoading(false);
          }, 300);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, gridProjects.length, loading]);

  return (
    <>
      {/* ═══ Hero 大图 + 左下角简介（响应式） ═══ */}
      <section className="hero-section" style={{ height: "100dvh", minHeight: "100svh", position: "relative", overflow: "hidden" }}>
        {/* 主图背景 — 桌面 */}
        <div className="hero-bg hero-bg-desktop"
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(/hero.jpg)",
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        {/* 主图背景 — 手机 */}
        <div className="hero-bg-mobile"
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(/hero-mobile.jpg)",
            backgroundSize: "cover", backgroundPosition: "center",
            display: "none",
          }}
        />
        {/* 暗色渐变覆盖 */}
        <div className="hero-overlay"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
          }}
        />
        {/* 顶部渐变 — 桌面端隐藏，移动端显示（保证文字可读性） */}
        <div className="hero-overlay-top"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%)",
          }}
        />

        {/* 文案区 */}
        <div className="hero-copy"
          ref={heroIntroRef}
          style={{
            position: "absolute",
            left: "clamp(20px, 5vw, 80px)",
            right: "clamp(20px, 5vw, 80px)",
            bottom: "clamp(32px, 7vw, 100px)",
            maxWidth: "clamp(280px, 38vw, 540px)",
          }}
        >
          <h1 className="hero-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(16px, 2vw, 30px)",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#fff",
              marginBottom: "clamp(12px, 2vw, 20px)",
            }}
          >
            ADDA Architecture
          </h1>
          <div
            ref={heroCharsRef}
            className="hero-text"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(11px, 0.95vw, 14px)",
              lineHeight: 2.2,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {"人的一生大多数时间是在建筑室内空间度过的".split("").map((c, i) => (
              <span key={i} className="hero-char" style={{ display: "inline-block", opacity: 0 }}>
                {c === " " ? " " : c}
              </span>
            ))}
            <br />
            {"其中居住空间与我们的身心健康息息相关".split("").map((c, i) => (
              <span key={`l2-${i}`} className="hero-char" style={{ display: "inline-block", opacity: 0 }}>
                {c === " " ? " " : c}
              </span>
            ))}
            <br />
            {"邸岸倡导呼吸性、松弛感、自由度".split("").map((c, i) => (
              <span key={`l3-${i}`} className="hero-char" style={{ display: "inline-block", opacity: 0 }}>
                {c === " " ? " " : c}
              </span>
            ))}
            <br />
            {"人与空间共同成长的生活方式".split("").map((c, i) => (
              <span key={`l4-${i}`} className="hero-char" style={{ display: "inline-block", opacity: 0 }}>
                {c === " " ? " " : c}
              </span>
            ))}
          </div>
        </div>

      </section>

      {/* ═══ 项目内容 ═══ */}
      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-16">
      {/* Hero Carousel — 5 featured projects, horizontal scroll */}
      {carouselProjects.length > 0 && (
      <section ref={heroRef} className="opacity-0" style={{ marginBottom: "clamp(40px, 6vw, 96px)" }}>
        <div className="relative group/carousel">
          {/* Arrow buttons */}
          <button
            onClick={() => {
              const el = document.getElementById("carousel");
              if (el) el.scrollBy({ left: -el.offsetWidth, behavior: "smooth" });
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 rounded-full ml-2"
          >
            ←
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("carousel");
              if (el) el.scrollBy({ left: el.offsetWidth, behavior: "smooth" });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 rounded-full mr-2"
          >
            →
          </button>

          <div
            id="carousel"
            className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory"
          >
          {carouselProjects.map((project) => (
            <div
              key={project.slug}
              data-card={project.slug}
              className="shrink-0 w-full snap-center cursor-pointer group"
              onClick={(e) => {
                const img = e.currentTarget.querySelector("img");
                if (!img) return;
                setModalSlide("top");
                setModalProject(project);
                const r = img.getBoundingClientRect();
                setModalRect({ left: r.left, top: r.top, width: r.width, height: r.height, x: r.x, y: r.y } as DOMRect);
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={project.cover}
                  alt={project.title}
                  className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <h2
                    className="text-white text-xl md:text-3xl mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {project.titleEn}
                  </h2>
                  <p
                    className="text-white/60 text-xs md:text-sm tracking-[.1em]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {project.title} — {project.city} · {project.area}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {/* Clone first card at end for seamless loop */}
          {carouselProjects.length > 0 && (
            <div
              key={`${carouselProjects[0].slug}-clone`}
              data-card={carouselProjects[0].slug}
              className="shrink-0 w-full snap-center cursor-pointer group"
              onClick={(e) => {
                const img = e.currentTarget.querySelector("img");
                if (!img) return;
                setModalSlide("top");
                setModalProject(carouselProjects[0]);
                const r = img.getBoundingClientRect();
                setModalRect({ left: r.left, top: r.top, width: r.width, height: r.height, x: r.x, y: r.y } as DOMRect);
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={carouselProjects[0].cover}
                  alt={carouselProjects[0].title}
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-white text-xl md:text-3xl mb-1" style={{ fontFamily: "var(--font-display)" }}>{carouselProjects[0].titleEn}</h2>
                  <p className="text-white/60 text-xs md:text-sm tracking-[.1em]" style={{ fontFamily: "var(--font-body)" }}>{carouselProjects[0].title} — {carouselProjects[0].city} · {carouselProjects[0].area}</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center gap-2" style={{ marginTop: "clamp(8px, 1.5vw, 16px)" }}>
          {carouselProjects.map((_, i) => (
            <div key={i} className="w-6 h-[2px] bg-white/20 rounded-full" />
          ))}
        </div>
      </section>
      )}

      {/* Project Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "clamp(16px, 2vw, 32px)" }}>
        {gridProjects.slice(0, visibleCount).map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i % 6} onOpen={(p, r) => { setModalSlide(i % 2 === 0 ? "left" : "right"); setModalProject(p); setModalRect(r); }} />
        ))}
      </section>

      {/* Infinite scroll sentinel */}
      {gridProjects.length > visibleCount && (
        <div ref={sentinelRef} className="flex justify-center" style={{ marginTop: "clamp(24px, 4vw, 48px)", padding: "clamp(20px, 4vw, 40px) 0" }}>
          {loading && (
            <span className="text-white/15 text-xs tracking-[.2em] uppercase" style={{ fontFamily: "var(--font-body)" }}>
              Loading...
            </span>
          )}
        </div>
      )}

      {/* 详情页 modal — fade 动画 */}
      {modalProject && (
        <ProjectModal
          project={modalProject}
          cardRect={modalRect}
          slideFrom={modalSlide}
          allProjects={projects.filter((p: Project) => p.cover)}
          onClose={() => {
            setModalProject(null);
            setModalRect(null);
          }}
          onNavigate={(p: Project) => {
            setModalProject(p);
            setModalRect(null);
          }}
        />
      )}
      </div>
    </>
  );
}
