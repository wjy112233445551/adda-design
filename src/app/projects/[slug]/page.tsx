"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Project } from "@/lib/projects";
import { projectImages } from "@/lib/project-images";
import gsap from "gsap";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

// ── Aspect-aware gallery image ──────────────────────────────────────────
function GalleryImage({
  src,
  alt,
  index,
  total,
}: {
  src: string;
  alt: string;
  index: number;
  total: number;
}) {
  const [state, setState] = useState<"loading" | "horizontal" | "vertical">("loading");

  return (
    <figure className="mb-20 md:mb-32">
      {/* Skeleton placeholder while loading */}
      {state === "loading" && (
        <div
          className="w-full bg-white/[0.02] animate-pulse"
          style={{ aspectRatio: "16/9" }}
        />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          const img = e.currentTarget;
          setState(img.naturalWidth >= img.naturalHeight ? "horizontal" : "vertical");
        }}
        className={
          state === "horizontal"
            ? "w-full h-auto object-contain"
            : state === "vertical"
              ? "max-h-[80vh] w-auto max-w-full mx-auto block object-contain"
              : "hidden"
        }
        style={
          state === "vertical"
            ? { maxWidth: "100%" }
            : undefined
        }
      />

      {/* Subtle image counter */}
      <figcaption
        className="text-white/10 text-[10px] tracking-[.15em] uppercase mt-3 text-center"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {index} / {total}
      </figcaption>
    </figure>
  );
}

// ── Main gallery section ────────────────────────────────────────────────
// 所有图片统一全宽展示，不再使用缩略图或混排模板
function GallerySection({
  images,
  title,
  description,
  descriptionEn,
}: {
  images: string[];
  title: string;
  description?: string;
  descriptionEn?: string;
}) {
  const total = images.length;

  return (
    <div>
      {/* Project description block */}
      {description && (
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 md:gap-16 mb-20 md:mb-32 max-w-[900px]">
            <div className="text-white/20 text-[10px] tracking-[.15em] uppercase pt-1" style={{ fontFamily: "var(--font-body)" }}>About</div>
            <div>
              <p className="text-white/55 text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-body)" }}>{description}</p>
              {descriptionEn && <p className="text-white/25 text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{descriptionEn}</p>}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* 所有图片统一全宽展示 */}
      {images.map((img, i) => (
        <ScrollReveal key={i} delay={i * 50}>
          <GalleryImage src={img} alt={`${title} - ${i + 1}`} index={i + 1} total={total} />
        </ScrollReveal>
      ))}
    </div>
  );
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      const t = Date.now();
      Promise.all([
        fetch(`/api/projects?_t=${t}`, { cache: "no-store" }).then(r => r.json()),
        fetch(`/api/renderings?_t=${t}`, { cache: "no-store" }).then(r => r.json().catch(() => [])),
      ]).then(([main, ren]) => {
        setProjects([...(Array.isArray(main)?main:[]), ...(Array.isArray(ren)?ren:[])]);
      }).catch(() => {
        fetch(`/api/projects?_t=${Date.now()}`, { cache: "no-store" }).then(r => r.json()).then(setProjects);
      });
    };
    load();
    // 从 admin 切回时自动刷新（切换标签页 + 窗口聚焦）
    const onVisibility = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", load);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", load);
    };
  }, []);

  const project = projects.find((p) => p.slug === slug);
  const idx = projects.findIndex((p) => p.slug === slug);

  const heroRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!project || projects.length === 0) return;

    // Try FLIP animation from card position
    const stored = sessionStorage.getItem("card-transition");
    if (stored && heroRef.current) {
      const card = JSON.parse(stored);
      sessionStorage.removeItem("card-transition");

      const hero = heroRef.current;
      const finalRect = hero.getBoundingClientRect();

      // Calculate the transform from card position to hero position
      const scaleX = card.w / finalRect.width;
      const scaleY = card.h / finalRect.height;
      const translateX = card.x - finalRect.left;
      const translateY = card.y - finalRect.top - (card.scrollY - window.scrollY);

      // Start: hero at card position, container hidden
      gsap.set(hero, {
        transformOrigin: "top left",
        scaleX, scaleY,
        x: translateX, y: translateY,
        borderRadius: "8px",
      });
      gsap.set(containerRef.current, { opacity: 0 });

      // Animate hero to final position with gentle easing
      gsap.to(hero, {
        scaleX: 1, scaleY: 1, x: 0, y: 0, borderRadius: "0px",
        duration: 0.7,
        ease: "power2.out",
      });

      // Fade in the rest of content with a slight delay
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      });
    } else {
      // No transition data — simple fade in
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [project, projects]);

  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    async function load() {
      const mapped = project?.folder ? projectImages[project.folder] : undefined;
      let imgs: string[] = [];
      if (mapped && mapped.length > 0) {
        imgs = mapped;
      } else if (project?.folder) {
        try {
          const r = await fetch(`/api/browse?folder=${encodeURIComponent(project.folder)}`);
          const d = await r.json();
          imgs = Array.isArray(d) ? d : [];
        } catch { imgs = []; }
      }

      // Apply galleryOrder if present
      if (project?.galleryOrder && project.galleryOrder.length > 0) {
        const ordered: string[] = [];
        const used = new Set<number>();
        for (const idx of project.galleryOrder) {
          if (idx >= 0 && idx < imgs.length && !used.has(idx)) {
            ordered.push(imgs[idx]);
            used.add(idx);
          }
        }
        // Append remaining in original order
        for (let i = 0; i < imgs.length; i++) {
          if (!used.has(i)) ordered.push(imgs[i]);
        }
        setImages(ordered);
      } else {
        setImages(imgs);
      }
    }
    load();
  }, [project?.folder, project?.galleryOrder]);

  if (!project) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 pt-32 pb-16 text-center">
        <p className="text-white/40">Project not found.</p>
        <Link href="/" className="text-white/60 hover:text-white text-xs tracking-[.2em] uppercase mt-4 inline-block" style={{ fontFamily: "var(--font-display)" }}>← Back</Link>
      </div>
    );
  }
  const prev = idx > 0 ? projects[idx - 1] : null;
  const next = idx < projects.length - 1 ? projects[idx + 1] : null;

  return (
    <div ref={containerRef} className={`max-w-[1400px] mx-auto px-6 pt-20 pb-16 ${!project ? '' : 'opacity-0'}`}>
      <Link href="/" className="text-white/30 hover:text-white/60 text-[10px] tracking-[.3em] uppercase transition-colors mb-4 inline-block" style={{ fontFamily: "var(--font-display)" }}>← All Projects</Link>

      {/* Hero — 图文叠加 */}
      <div className="relative mb-16 overflow-hidden bg-zinc-900" style={{ height: "clamp(320px, 60vh, 700px)" }}>
        <img
          ref={heroRef}
          src={project.cover}
          alt={project.title}
          className="w-full h-full object-contain absolute inset-0"
        />
        {/* 渐变遮罩确保文字可读 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        {/* 文字叠加层 */}
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

      {images.length > 1 && (
        <ScrollReveal>
          <GallerySection
            images={images.slice(1)}
            title={project.title}
            description={project.description}
            descriptionEn={project.descriptionEn}
          />
        </ScrollReveal>
      )}

      <ScrollReveal delay={200}>
      <div className="flex justify-between pt-8 mt-12 border-t border-white/10">
        {prev?.cover ? (
          <Link href={`/projects/${prev.slug}`} className="text-white/40 hover:text-white/70 text-xs tracking-[.2em] uppercase transition-colors" style={{ fontFamily: "var(--font-display)" }}>← {prev.titleEn}</Link>
        ) : <span />}
        {next?.cover ? (
          <Link href={`/projects/${next.slug}`} className="text-white/40 hover:text-white/70 text-xs tracking-[.2em] uppercase transition-colors" style={{ fontFamily: "var(--font-display)" }}>{next.titleEn} →</Link>
        ) : <span />}
      </div>
      </ScrollReveal>
    </div>
  );
}
