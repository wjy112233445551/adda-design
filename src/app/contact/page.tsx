"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState({ email: "hello@adda.studio", wechat: "ADDAdesign" });

  useEffect(() => {
    fetch("/api/pages").then(r => r.json()).then(d => {
      if (d.contact) setInfo({ ...info, ...d.contact });
    }).catch(() => {});
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1, delay: 3, ease: "power2.out" });
  }, []);

  return (
    <div ref={containerRef} className="max-w-[1400px] mx-auto px-6 pt-32 pb-16 opacity-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
        <div>
          <h1 className="text-white text-5xl md:text-7xl leading-[1.1] mb-12" style={{ fontFamily: "var(--font-display)" }}>
            Get in<br />Touch
          </h1>
          <div className="space-y-4">
            <div>
              <p className="text-white/30 text-[10px] tracking-[.2em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>邮箱 / Email</p>
              <a href={`mailto:${info.email}`} className="text-white/70 text-sm hover:text-white transition-colors" style={{ fontFamily: "var(--font-body)" }}>{info.email}</a>
            </div>
            <div>
              <p className="text-white/30 text-[10px] tracking-[.2em] uppercase mb-1" style={{ fontFamily: "var(--font-body)" }}>微信 / WeChat</p>
              <p className="text-white/70 text-sm" style={{ fontFamily: "var(--font-body)" }}>{info.wechat}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          {sent ? (
            <div className="text-white/70 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              <p className="text-lg mb-2">感谢留言 / Thank you.</p>
              <p>我们会尽快回复 / We&rsquo;ll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-6">
              {[
                ["姓名 / Name", "name"],
                ["邮箱 / Email", "email"],
                ["项目类型 / Project Type", "project"],
                ["留言 / Message", "message"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-white/30 text-[10px] tracking-[.2em] uppercase mb-2" style={{ fontFamily: "var(--font-body)" }}>{label}</label>
                  {key === "message" ? (
                    <textarea rows={3} className="w-full bg-transparent border-b border-white/10 pb-3 text-white/80 text-sm outline-none focus:border-white/40 transition-colors resize-none" style={{ fontFamily: "var(--font-body)" }} />
                  ) : (
                    <input type={key === "email" ? "email" : "text"} required={key !== "project"} className="w-full bg-transparent border-b border-white/10 pb-3 text-white/80 text-sm outline-none focus:border-white/40 transition-colors" style={{ fontFamily: "var(--font-body)" }} placeholder={key === "project" ? "住宅 / 商业 / 其他" : ""} />
                  )}
                </div>
              ))}
              <button type="submit" className="text-white/60 hover:text-white text-xs tracking-[.3em] uppercase transition-colors pt-4" style={{ fontFamily: "var(--font-display)" }}>发送 / Send →</button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
