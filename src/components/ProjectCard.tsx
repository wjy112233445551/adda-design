"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import type { Project } from "@/lib/projects";

export function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project, rect: DOMRect) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: index * 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 95%",
          toggleActions: "play none none none",
        },
      }
    );
  }, [index]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    onOpen(project, { left: r.left, top: r.top, width: r.width, height: r.height, x: r.x, y: r.y } as DOMRect);
  };

  const handleMouseEnter = () => {
    gsap.to(imgRef.current, {
      scale: 1.03,
      duration: 0.7,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(imgRef.current, {
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
    });
  };

  return (
    <div ref={cardRef} className="opacity-0" data-card={project.slug}>
      <div
        className="group block overflow-hidden cursor-pointer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden mb-4">
          <img
            ref={imgRef}
            src={project.cover}
            alt={project.title}
            loading="lazy"
            className="w-full aspect-[4/3] object-cover rounded-lg"
          />
        </div>

        <div className="flex justify-between items-baseline">
          <div>
            <h3
              className="text-white text-lg md:text-xl mb-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {project.titleEn}
            </h3>
            <p
              className="text-white/50 text-xs tracking-[.1em]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {project.title} · {project.city} · {project.area}
            </p>
          </div>
          <span
            className="text-white/30 text-xs tracking-[.15em] group-hover:text-white/60 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {project.year}
          </span>
        </div>
      </div>
    </div>
  );
}
