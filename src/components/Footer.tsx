export function Footer() {
  return (
    <>
      {/* Fixed logo at bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 mix-blend-difference">
        <img
          src="/logo.webp"
          alt="ADDA"
          className="w-auto"
          style={{ height: "clamp(32px, 4vw, 72px)" }}
        />
      </div>

      <footer className="py-12 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <p
              className="text-[#888] text-[10px] tracking-[.2em] uppercase mb-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              邸岸空间建筑设计
            </p>
          </div>

          <div className="flex flex-col gap-2 text-right">
            <p
              className="text-white/60 text-[10px] tracking-[.15em]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              邮箱 / Email:{" "}
              <a
                href="mailto:hello@adda.studio"
                className="text-white/50 hover:text-white transition-colors"
              >
                hello@adda.studio
              </a>
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener"
              className="text-white/40 hover:text-white transition-colors text-[10px] tracking-[.15em] uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
