"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const LanyardCard = dynamic(() => import("@/components/LanyardCard"), { ssr: false });

interface Position {
  title: string; titleEn: string; desc: string; descEn: string;
}

const fallback: Position[] = [
  { title: "主案设计师", titleEn: "Senior Interior Designer",
    desc: "负责项目全案设计，从概念到落地。5年以上室内设计经验，能独立带领项目团队。",
    descEn: "Lead full-scope design from concept to completion. 5+ years interior design experience, capable of independently leading project teams." },
  { title: "辅案设计师", titleEn: "Interior Designer",
    desc: "协助主案完成方案深化与施工图绘制。2年以上设计经验，熟练使用CAD、SU、3DMax。",
    descEn: "Support senior designers in design development and construction drawings. 2+ years experience, proficient in CAD, SketchUp, and 3DMax." },
  { title: "设计师助理", titleEn: "Design Assistant",
    desc: "参与项目前期调研、素材整理、图纸绘制等工作。应届或有实习经验均可，对空间设计有热情。",
    descEn: "Participate in project research, material organization, and drafting. Fresh graduates or those with internship experience welcome. Passion for spatial design required." },
  { title: "实习生", titleEn: "Intern",
    desc: "建筑/室内设计相关专业在读或应届，每周到岗不少于4天。提供转正机会。",
    descEn: "Currently enrolled or recent graduate in architecture/interior design. Minimum 4 days/week. Opportunity for full-time conversion." },
];

export default function JoinPage() {
  const [positions, setPositions] = useState<Position[]>(fallback);
  const [email, setEmail] = useState("hr@adda.studio");

  useEffect(() => {
    fetch("/api/pages")
      .then(r => r.json())
      .then(d => {
        if (d.join?.positions?.length) setPositions(d.join.positions);
        if (d.join?.email) setEmail(d.join.email);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-16"
      style={{ paddingTop: "clamp(48px, 8vw, 128px)" }}>
      <Link href="/contact"
        className="text-white/30 hover:text-white/60 text-[10px] tracking-[.3em] uppercase transition-colors inline-block"
        style={{ fontFamily: "var(--font-display)", marginBottom: "clamp(32px, 6vw, 64px)" }}>
        ← Contact
      </Link>

      <h1 className="text-white leading-[1.1]"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 6vw, 72px)", marginBottom: "clamp(8px, 1vw, 16px)" }}>
        Join Us
      </h1>
      <p className="text-white/40"
        style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 1.2vw, 14px)", marginBottom: "clamp(32px, 5vw, 64px)" }}>
        加入我们 / We're Hiring
      </p>

      <div>
        {positions.map((pos) => (
          <div key={pos.title}
            className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-3 md:gap-8 items-start border-t border-white/10"
            style={{ paddingTop: "clamp(14px, 2vw, 32px)", paddingBottom: "clamp(14px, 2vw, 32px)" }}>
            <div>
              <h3 className="text-white"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px, 1.5vw, 18px)", marginBottom: "clamp(2px, 0.5vw, 4px)" }}>
                {pos.titleEn}
              </h3>
              <p className="text-white/50"
                style={{ fontFamily: "var(--font-body)", fontSize: "clamp(11px, 1vw, 12px)" }}>
                {pos.title}
              </p>
            </div>
            <p className="text-white/50 leading-relaxed"
              style={{ fontFamily: "var(--font-body)", fontSize: "clamp(12px, 1vw, 14px)" }}>
              {pos.desc}
            </p>
            <p className="text-white/30 leading-relaxed"
              style={{ fontFamily: "var(--font-body)", fontSize: "clamp(10px, 0.9vw, 12px)" }}>
              {pos.descEn}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10"
        style={{ paddingTop: "clamp(20px, 4vw, 48px)", marginTop: "clamp(16px, 3vw, 32px)" }}>
        <p className="text-white/40 mb-2"
          style={{ fontFamily: "var(--font-body)", fontSize: "clamp(11px, 1vw, 12px)" }}>
          请将简历与作品集发送至 / Please send your CV and portfolio to:
        </p>
        <a href={`mailto:${email}`}
          className="text-white/70 hover:text-white transition-colors"
          style={{ fontFamily: "var(--font-body)", fontSize: "clamp(13px, 1.1vw, 14px)" }}>
          {email}
        </a>
      </div>

      <div className="mt-16 -mx-6">
        <LanyardCard />
      </div>
    </div>
  );
}
