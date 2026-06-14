"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// ====== 防止原生 select 下拉导致弹窗误关闭 ======
function useModalBackdrop() {
  const interactingRef = useRef(false);
  const onSelectMouseDown = useCallback(() => { interactingRef.current = true; }, []);
  const onBackdropClick = useCallback((callback: () => void) => {
    if (interactingRef.current) { interactingRef.current = false; return; }
    callback();
  }, []);
  return { onSelectMouseDown, onBackdropClick };
}

// ====== Types ======
interface Project {
  slug: string; folder: string; title: string; titleEn: string;
  city: string; area: string; year: string; category: string;
  type: string; cover: string; description: string; descriptionEn: string;
  captions?: string[]; galleryOrder?: number[];
}

// ====== Auth Gate ======
export default function AdminPage() {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  if (!ok) return (
    <div style={{ minHeight:"100vh", background:"#040404", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <form onSubmit={e => { e.preventDefault(); if(pw==="adda2024") setOk(true); }}
        style={{ display:"flex", flexDirection:"column", gap:16, width:260 }}>
        <h1 style={{ fontFamily:"var(--font-display)", color:"rgba(255,255,255,0.4)", fontSize:12, textAlign:"center", letterSpacing:"0.3em", textTransform:"uppercase" }}>Admin</h1>
        <input autoFocus type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
          style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", padding:"8px 12px", color:"#fff", textAlign:"center", outline:"none", fontFamily:"var(--font-body)" }} />
        <button type="submit" style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", padding:"8px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase" }}>Enter</button>
      </form>
    </div>
  );
  return <Dashboard />;
}

// ====== Dashboard ======
type View = "projects" | "renderings" | "about" | "contact" | "join" | "founders" | "deploy" | "editor";
function Dashboard() {
  const [view, setView] = useState<View>("projects");
  const [prevView, setPrevView] = useState<View>("projects");
  const [editProject, setEditProject] = useState<Project | null>(null);

  useEffect(() => {
    const nav = document.querySelector("nav") as HTMLElement;
    const footer = document.querySelector("footer") as HTMLElement;
    if (nav) nav.style.display = "none";
    if (footer) footer.style.display = "none";
    return () => {
      if (nav) nav.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  if (view === "editor" && editProject) {
    return createPortal(
      <LayoutEditor project={editProject} onBack={() => { setEditProject(null); setView(prevView); }} />,
      document.body
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#040404", display:"flex" }}>
      {/* Sidebar */}
      <nav style={{ width:180, flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.05)", padding:"24px 16px", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ marginBottom:32 }}>
          <p style={{ fontFamily:"var(--font-display)", color:"rgba(255,255,255,0.5)", fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase" }}>ADDA</p>
          <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:9, letterSpacing:"0.1em", marginTop:4 }}>Admin</p>
        </div>
        {[
          ["projects","项目管理","Projects"],
          ["renderings","效果图","Renderings"],
          ["about","关于页面","About"],
          ["contact","联系页面","Contact"],
          ["join","加入我们","Join Us"],
          ["founders","创始人","Founders"],
          ["deploy","部署上线","Deploy"],
        ].map(([id, zh, en]) => (
          <button key={id} onClick={() => { setView(id as View); setEditProject(null); }}
            style={{
              textAlign:"left", padding:"8px 0", border:"none", background:"none", cursor:"pointer",
              color: view===id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
              fontFamily:"var(--font-body)", fontSize:12, letterSpacing:"0.1em", transition:"color 0.2s",
              borderLeft: view===id ? "2px solid rgba(255,255,255,0.4)" : "2px solid transparent",
              paddingLeft:12, marginLeft:-16,
            }}>
            {zh}<br/><span style={{ fontSize:9, color:"rgba(255,255,255,0.1)" }}>{en}</span>
          </button>
        ))}
        <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <a href="/" style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:10, textDecoration:"none", letterSpacing:"0.1em" }}>← 返回网站</a>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex:1, padding:"32px 40px", overflow:"auto" }}>
        {view === "projects" && <ProjectsPanel onEdit={(p) => { setEditProject(p); setPrevView("projects"); setView("editor"); }} />}
        {view === "renderings" && <RenderingsPanel onEdit={(p) => { setEditProject(p); setPrevView("renderings"); setView("editor"); }} />}
        {view === "about" && <PageForm page="about" />}
        {view === "contact" && <PageForm page="contact" />}
        {view === "join" && <JoinForm />}
        {view === "founders" && <FoundersForm />}
        {view === "deploy" && <DeployBtn />}
      </main>
    </div>
  );
}

// ====== Projects Panel ======
function ProjectsPanel({ onEdit }: { onEdit: (p: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Project>>({});
  const [folders, setFolders] = useState<string[]>([]);
  const [folderImgs, setFolderImgs] = useState<string[]>([]);

  const { onSelectMouseDown, onBackdropClick } = useModalBackdrop();
  const load = async () => {
    const [p, f] = await Promise.all([fetch("/api/projects", { cache: "no-store" }), fetch("/api/browse", { cache: "no-store" })]);
    setProjects(await p.json()); setFolders(await f.json());
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ slug:"p-"+Date.now(), folder:"", title:"", titleEn:"", city:"", area:"", year:"", category:"住宅", type:"residential", cover:"", description:"", descriptionEn:"" }); setShowForm(true); };
  const openEdit = (p: Project) => { setForm({...p}); setShowForm(true); setFolderImgs([]); };
  const save = async () => {
    if (!form.slug) return;
    const isNew = !projects.find(p=>p.slug===form.slug);
    await fetch("/api/projects", { method: isNew?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setShowForm(false); load();
  };
  const del = async (s: string) => { if(confirm("确认删除？")) { await fetch("/api/projects",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:s})}); load(); }};

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:20, margin:0 }}>项目管理</h2>
          <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.2)", fontSize:10, marginTop:4 }}>{projects.length} projects</p>
        </div>
        <button onClick={openNew} style={{ fontFamily:"var(--font-body)", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.6)", padding:"8px 16px", fontSize:11, letterSpacing:"0.1em", cursor:"pointer", textTransform:"uppercase" }}>+ 新建</button>
      </div>

      {/* Project List */}
      {projects.map(p => (
        <div key={p.slug} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", border:"1px solid rgba(255,255,255,0.04)", marginBottom:4, cursor:"pointer" }}
          onClick={() => openEdit(p)}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {p.cover && <img src={p.cover} style={{ width:56, height:36, objectFit:"cover" }} alt="" />}
            <div>
              <span style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:14 }}>{p.titleEn}</span>
              <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:11, marginLeft:12 }}>{p.title}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.2)", fontSize:10 }}>{p.city} · {p.area}</span>
            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", padding:"4px 10px", fontSize:10, cursor:"pointer", letterSpacing:"0.1em" }}>排版</button>
          </div>
        </div>
      ))}

      {/* Edit Form Modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:40, overflow:"auto" }}
          onClick={() => onBackdropClick(() => setShowForm(false))}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", padding:32, width:"100%", maxWidth:640, maxHeight:"85vh", overflow:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:18, margin:"0 0 24px" }}>{projects.find(p=>p.slug===form.slug) ? "编辑项目" : "新建项目"}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[["title","中文名称"],["titleEn","English"],["city","城市"],["area","面积"],["year","年份"],["slug","URL"]].map(([k,lab]) => (
                <div key={k}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{lab}</label>
                  <input value={(form as any)[k]||""} onChange={e => setForm({...form,[k]:e.target.value})}
                    style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }} />
                </div>
              ))}
              {/* Folder + Cover */}
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>图片文件夹</label>
                <div style={{ display:"flex", gap:8 }}>
                  <select value={form.folder||""} onMouseDown={onSelectMouseDown} onChange={async e => { setForm({...form,folder:e.target.value,cover:""}); const r=await fetch(`/api/browse?folder=${encodeURIComponent(e.target.value)}`); setFolderImgs(await r.json()); }}
                    style={{ flex:1, background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)" }}>
                    <option value="">已导入的项目...</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <FileBrowser onImport={(folderName:string) => { setForm({...form,folder:folderName,cover:""}); }}>
                    <span style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", padding:"8px 12px", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>📁 浏览电脑文件夹...</span>
                  </FileBrowser>
                </div>
              </div>
              {form.folder && folderImgs.length > 0 && (
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:8, textTransform:"uppercase" }}>封面图</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6, maxHeight:200, overflow:"auto", padding:8, border:"1px solid rgba(255,255,255,0.06)" }}>
                    {folderImgs.map((img,i) => (
                      <div key={i} onClick={() => setForm({...form,cover:img})}
                        style={{ aspectRatio:"1", overflow:"hidden", cursor:"pointer", border:form.cover===img?"2px solid rgba(255,255,255,0.6)":"2px solid transparent" }}>
                        <img src={img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4 }}>Category</label>
                <select value={form.category||"住宅"} onMouseDown={onSelectMouseDown} onChange={e => setForm({...form,category:e.target.value})}
                  style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)" }}>
                  <option>住宅</option><option>商业</option><option>办公空间</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4 }}>Type</label>
                <select value={form.type||"residential"} onMouseDown={onSelectMouseDown} onChange={e => setForm({...form,type:e.target.value})}
                  style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)" }}>
                  <option value="residential">住宅</option><option value="commercial">商业</option>
                </select>
              </div>
              {["description","descriptionEn"].map(k => (
                <div key={k} style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{k==="description"?"中文描述":"English Description"}</label>
                  <textarea value={(form as any)[k]||""} onChange={e => setForm({...form,[k]:e.target.value})} rows={3}
                    style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", resize:"vertical", boxSizing:"border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => del(form.slug||"")} style={{ fontFamily:"var(--font-body)", background:"none", border:"none", color:"rgba(255,80,80,0.6)", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>删除</button>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={() => setShowForm(false)} style={{ fontFamily:"var(--font-body)", background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", padding:"8px 16px", fontSize:11, cursor:"pointer", textTransform:"uppercase" }}>取消</button>
                <button onClick={save} style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"8px 24px", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Layout Editor (全屏，完全对齐主站 GallerySection 模板) ======
// 模板: 宽图→双图→宽图→三图→宽图→双图→缩略图
const GALLERY_TEMPLATE = [
  { type: "full" as const, count: 1, label: "宽图①" },
  { type: "two" as const, count: 2, label: "双图②③" },
  { type: "full" as const, count: 1, label: "宽图④" },
  { type: "three" as const, count: 3, label: "三图⑤⑥⑦" },
  { type: "full" as const, count: 1, label: "宽图⑧" },
  { type: "two" as const, count: 2, label: "双图⑨⑩" },
];
const TOTAL_SLOTS = GALLERY_TEMPLATE.reduce((s, t) => s + t.count, 0); // 10

function LayoutEditor({ project, onBack }: { project: Project; onBack: () => void }) {
  const [allImgs, setAllImgs] = useState<string[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  const apiUrl = project.type === "rendering" ? "/api/renderings" : "/api/projects";

  useEffect(() => {
    if (project.folder) {
      fetch(`/api/browse?folder=${encodeURIComponent(project.folder)}`, { cache: "no-store" })
        .then(r => r.json()).then(d => {
          const imgs = (Array.isArray(d) ? d : []) as string[];
          setAllImgs(imgs);
          if (project.galleryOrder && project.galleryOrder.length > 0) {
            // 补齐缺失的图片索引，确保 order 包含所有图片
            const used = new Set(project.galleryOrder.filter((i: number) => i >= 0 && i < imgs.length));
            const full = [...project.galleryOrder];
            for (let i = 0; i < imgs.length; i++) {
              if (!used.has(i)) full.push(i);
            }
            setOrder(full);
          } else {
            setOrder(imgs.map((_, i) => i));
          }
        }).catch(() => {});
    }
  }, [project.folder]);

  // order[0] = cover | order[1..10] = template slots | order[11..] = thumbs
  const coverIdx = order.length > 0 ? order[0] : -1;
  const slotOrder = order.slice(1, 1 + TOTAL_SLOTS);
  const thumbOrder = order.slice(1 + TOTAL_SLOTS);

  // Partition slotOrder into template groups
  const slotGroups: number[][] = [];
  let cursor = 0;
  for (const t of GALLERY_TEMPLATE) {
    slotGroups.push(slotOrder.slice(cursor, cursor + t.count));
    cursor += t.count;
  }

  const swapSlot = (slotIdx: number, imgIdx: number) => {
    const next = [...order];
    const oldIdx = next[slotIdx];
    const existingSlot = next.indexOf(imgIdx);
    if (existingSlot >= 0) next.splice(existingSlot, 1);
    next[slotIdx] = imgIdx;
    if (oldIdx >= 0 && oldIdx !== imgIdx && !next.includes(oldIdx)) {
      next.push(oldIdx);
    }
    setOrder(next);
    setPickerSlot(null);
  };

  const save = async () => {
    const coverImg = coverIdx >= 0 && coverIdx < allImgs.length ? allImgs[coverIdx] : project.cover;
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...project, cover: coverImg, galleryOrder: order }),
    });
    if (res.ok) { setMsg("保存成功，刷新项目页查看"); setTimeout(() => setMsg(""), 3000); }
    else setMsg("保存失败");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex" }}>
      {/* Left: Image Library */}
      <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", background: "#040404" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={onBack} style={{ fontFamily: "var(--font-display)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#aaa", padding: "4px 12px", cursor: "pointer", fontSize: 13, letterSpacing: "0.1em" }}>← 返回</button>
          <span style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: 14 }}>图片库 ({allImgs.length})</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {allImgs.map((img, i) => {
              const slot = order.indexOf(i);
              const isCover = slot === 0;
              const isSlot = slot >= 1 && slot <= TOTAL_SLOTS;
              return (
                <button key={i} onClick={() => {
                  if (pickerSlot !== null) swapSlot(pickerSlot, i);
                }}
                  style={{
                    aspectRatio: "1", background: "none",
                    border: isCover ? "2px solid rgba(255,200,100,0.7)" : isSlot ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                    padding: 0, cursor: pickerSlot !== null ? "pointer" : "default",
                    opacity: (isCover || isSlot) ? 0.5 : 1, position: "relative",
                  }}>
                  <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "rgba(0,0,0,0.4)" }} alt="" />
                  <span style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.5)", fontSize: 8, padding: "1px 3px" }}>{i}</span>
                  {isCover && <span style={{ position: "absolute", top: 0, left: 0, background: "rgba(255,200,100,0.8)", color: "#000", fontSize: 7, padding: "1px 3px", fontWeight: 700 }}>封面</span>}
                  {isSlot && <span style={{ position: "absolute", top: 0, left: 0, background: "rgba(255,255,255,0.5)", color: "#000", fontSize: 7, padding: "1px 3px", fontWeight: 700 }}>{slot}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {pickerSlot !== null && (
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.6)", fontSize: 10, margin: 0 }}>
              点击左侧图片替换{pickerSlot === 0 ? "封面" : `大图 ${pickerSlot}`}
              <span onClick={() => setPickerSlot(null)} style={{ color: "rgba(255,80,80,0.6)", cursor: "pointer", textDecoration: "underline", marginLeft: 8 }}>取消</span>
            </p>
          </div>
        )}
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-body)", color: msg.includes("失败") ? "rgba(255,80,80,0.6)" : "rgba(100,255,100,0.6)", fontSize: 10 }}>{msg}</span>
          <button onClick={save} style={{ fontFamily: "var(--font-body)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "6px 20px", fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>保存</button>
        </div>
      </div>

      {/* Right: Live Preview — 完全对齐主站 page.tsx */}
      <div style={{ flex: 1, overflow: "auto", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px 64px" }}>

          {/* ← All Projects */}
          <p style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 16px" }}>← All Projects</p>

          {/* Hero — 图文叠加 (与主站完全一致) */}
          <div style={{ position: "relative", marginBottom: 64, overflow: "hidden", background: "#18181b", height: "clamp(320px, 60vh, 700px)" }}>
            {coverIdx >= 0 && coverIdx < allImgs.length ? (
              <img src={allImgs[coverIdx]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0 }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button onClick={() => setPickerSlot(0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.3)", padding: "12px 24px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12 }}>
                  点击选择封面图片
                </button>
              </div>
            )}
            {/* 渐变遮罩 (与主站完全一致) */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3), rgba(0,0,0,0.1))" }} />
            {/* 文字叠加层 (与主站完全一致) */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 40px" }}>
              <h1 style={{ fontFamily: "var(--font-display)", color: "#fff", margin: "0 0 8px", fontSize: "clamp(22px, 4vw, 56px)" }}>{project.titleEn}</h1>
              <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.7)", margin: "0 0 24px", fontSize: "clamp(13px, 1.3vw, 16px)" }}>{project.title}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 32px" }}>
                {[["项目地点", project.city], ["项目面积", project.area], ["设计时间", project.year], ["项目类型", project.category]].map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label as string}</span>
                    <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{value as string || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 封面换图按钮 */}
            <button onClick={() => setPickerSlot(0)}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "var(--font-body)" }}>
              更换封面
            </button>
          </div>

          {/* About 描述 (与主站完全一致) */}
          {project.description && (
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "32px 64px", marginBottom: 80, maxWidth: 900 }}>
              <div style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", paddingTop: 4 }}>About</div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>{project.description}</p>
                {project.descriptionEn && <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.25)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{project.descriptionEn}</p>}
              </div>
            </div>
          )}

          {/* 模板排版区 — 宽图→双图→宽图→三图→宽图→双图 */}
          {slotGroups.map((group, gi) => {
            const t = GALLERY_TEMPLATE[gi];
            const isFull = t.type === "full";
            const globalSlot = GALLERY_TEMPLATE.slice(0, gi).reduce((s, x) => s + x.count, 0);
            const cols = t.type === "three" ? "1fr 1fr 1fr" : t.type === "two" ? "1fr 1fr" : "";

            return (
              <div key={gi} style={{ marginBottom: 80 }}>
                {/* Slot label */}
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.12)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>{t.label}</span>
                </div>

                {isFull ? (
                  <button onClick={() => setPickerSlot(globalSlot + 1)}
                    style={{
                      width: "100%", display: "block", background: group[0] >= 0 ? "none" : "rgba(255,255,255,0.02)",
                      border: pickerSlot === globalSlot + 1 ? "1px solid rgba(255,255,255,0.4)" : "1px solid transparent",
                      padding: 0, cursor: "pointer", minHeight: group[0] >= 0 ? 0 : 120,
                    }}>
                    {group[0] >= 0 && group[0] < allImgs.length ? (
                      <img src={allImgs[group[0]]} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                    ) : (
                      <div style={{ padding: 40, textAlign: "center" }}>
                        <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>点击选择</span>
                      </div>
                    )}
                  </button>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px 16px" }}>
                    {group.map((imgIdx, i) => {
                      const slot = globalSlot + i + 1;
                      return (
                        <button key={i} onClick={() => setPickerSlot(slot)}
                          style={{
                            width: "100%", display: "block", background: imgIdx >= 0 ? "none" : "rgba(255,255,255,0.02)",
                            border: pickerSlot === slot ? "1px solid rgba(255,255,255,0.4)" : "1px solid transparent",
                            padding: 0, cursor: "pointer", minHeight: imgIdx >= 0 ? 0 : 80,
                          }}>
                          {imgIdx >= 0 && imgIdx < allImgs.length ? (
                            <img src={allImgs[imgIdx]} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                          ) : (
                            <div style={{ padding: 30, textAlign: "center" }}>
                              <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.1)", fontSize: 10 }}>空</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 缩略图 (与主站完全一致) */}
          {thumbOrder.length > 0 && (
            <div style={{ paddingTop: 48, marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.15)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 20px" }}>All images</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
                {thumbOrder.map((imgIdx, i) => {
                  const img = imgIdx >= 0 && imgIdx < allImgs.length ? allImgs[imgIdx] : null;
                  return img ? (
                    <img key={i} src={img} alt="" style={{ height: "80px", width: "auto", objectFit: "contain", background: "rgba(255,255,255,0.02)" }} />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Prev/Next (与主站一致) */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 32, marginTop: 48, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.15)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>← Prev</span>
            <span style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.15)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>Next →</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ====== Renderings Panel ======
function RenderingsPanel({ onEdit }: { onEdit: (p: Project) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Partial<Project>>({});
  const [folderImgs, setFolderImgs] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const { onSelectMouseDown: rmOnSelect, onBackdropClick: rmBackdrop } = useModalBackdrop();
  const load = async () => {
    const [p, f] = await Promise.all([fetch("/api/renderings", { cache: "no-store" }), fetch("/api/browse", { cache: "no-store" })]);
    setProjects(await p.json());
    setFolders(await f.json());
  };
  useEffect(() => { load(); }, []);

  const openEdit = async (p: Project) => {
    setEditing(p);
    setForm({...p});
    if (p.folder) {
      const r = await fetch(`/api/browse?folder=${encodeURIComponent(p.folder)}`, { cache: "no-store" });
      setFolderImgs(await r.json());
    }
  };

  const changeFolder = async (newFolder: string) => {
    const r = await fetch(`/api/browse?folder=${encodeURIComponent(newFolder)}`, { cache: "no-store" });
    const imgs = await r.json();
    setFolderImgs(imgs);
    setForm({...form, folder: newFolder, cover: imgs.length > 0 ? imgs[0] : "", galleryOrder: []});
    setMsg(`已切换到 ${newFolder}，${imgs.length} 张图片`);
  };

  const openNew = () => {
    setEditing({} as Project);
    setForm({ slug: "fx_" + Date.now().toString(36), folder: "", title: "", titleEn: "", city: "", area: "", year: "", category: "效果图", type: "rendering", cover: "", description: "", descriptionEn: "", galleryOrder: [] });
    setFolderImgs([]);
    setMsg("");
  };

  const save = async () => {
    if (!form.slug) return;
    const isNew = !projects.find(p => p.slug === form.slug);
    const res = await fetch("/api/renderings", {
      method: isNew ? "POST" : "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(form),
    });
    if (res.ok) { setMsg(isNew ? "已创建" : "已保存"); setEditing(null); load(); }
    else setMsg("保存失败");
  };

  const del = async (slug: string) => {
    if (!confirm("确认删除？此操作不可撤销。")) return;
    const res = await fetch("/api/renderings", { method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ slug }) });
    if (res.ok) { setEditing(null); load(); }
    else setMsg("删除失败");
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <h2 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:20, margin:0 }}>效果图管理</h2>
          <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.2)", fontSize:10, marginTop:4 }}>{projects.length} renderings</p>
        </div>
        <button onClick={openNew} style={{ fontFamily:"var(--font-body)", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.6)", padding:"8px 16px", fontSize:11, letterSpacing:"0.1em", cursor:"pointer", textTransform:"uppercase" }}>+ 新建</button>
      </div>

      {projects.map(p => (
        <div key={p.slug} onClick={() => openEdit(p)}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", border:"1px solid rgba(255,255,255,0.04)", marginBottom:4, cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {p.cover && <img src={p.cover} style={{ width:56, height:36, objectFit:"contain", background:"rgba(0,0,0,0.3)" }} alt="" />}
            <div>
              <span style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:14 }}>{p.titleEn}</span>
              <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:11, marginLeft:12 }}>{p.title}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:9, letterSpacing:"0.05em" }}>📁 {p.folder}</span>
            <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.2)", fontSize:10 }}>{p.city}</span>
            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", padding:"4px 10px", fontSize:10, cursor:"pointer", letterSpacing:"0.1em" }}>排版</button>
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:40, overflow:"auto" }}
          onClick={() => rmBackdrop(() => { setEditing(null); setMsg(""); })}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", padding:32, width:"100%", maxWidth:720, maxHeight:"85vh", overflow:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:18, margin:"0 0 4px" }}>{form.titleEn}</h3>
            <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:11, margin:"0 0 24px" }}>{form.title} <span style={{ color:"rgba(255,255,255,0.1)" }}>slug: {form.slug}</span></p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Folder switcher */}
              <div style={{ gridColumn:"1/-1", padding:16, border:"1px solid rgba(255,255,255,0.08)", borderRadius:4 }}>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>图片文件夹</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:11, background:"rgba(255,255,255,0.04)", padding:"4px 8px", borderRadius:3 }}>{form.folder || "未设置"}</span>
                  <select value="" onMouseDown={rmOnSelect} onChange={e => { if(e.target.value) changeFolder(e.target.value); }}
                    style={{ flex:1, background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)" }}>
                    <option value="">切换文件夹...</option>
                    {folders.filter(f => f !== form.folder).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Cover picker */}
              {folderImgs.length > 0 && (
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:8, textTransform:"uppercase" }}>封面图 ({folderImgs.length} 张)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:4, maxHeight:200, overflow:"auto", padding:8, border:"1px solid rgba(255,255,255,0.06)" }}>
                    {folderImgs.map((img,i) => (
                      <div key={i} onClick={() => setForm({...form, cover:img})}
                        style={{ aspectRatio:"1", overflow:"hidden", cursor:"pointer", border:form.cover===img?"2px solid rgba(255,255,255,0.6)":"2px solid transparent", background:"rgba(0,0,0,0.3)" }}>
                        <img src={img} style={{ width:"100%", height:"100%", objectFit:"contain" }} alt="" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text fields */}
              {[["title","中文名称"],["titleEn","English"],["city","城市"],["area","面积"],["year","年份"]].map(([k,lab]) => (
                <div key={k}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{lab}</label>
                  <input value={(form as any)[k]||""} onChange={e => setForm({...form,[k]:e.target.value})}
                    style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }} />
                </div>
              ))}
              {["description","descriptionEn"].map(k => (
                <div key={k} style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{k==="description"?"中文描述":"English Description"}</label>
                  <textarea value={(form as any)[k]||""} onChange={e => setForm({...form,[k]:e.target.value})} rows={2}
                    style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", resize:"vertical", boxSizing:"border-box" }} />
                </div>
              ))}
            </div>

            {/* Gallery order */}
            <div style={{ marginTop:16, padding:16, border:"1px solid rgba(255,255,255,0.08)", borderRadius:4 }}>
              <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:8, textTransform:"uppercase" }}>排列顺序 (galleryOrder)</label>
              <textarea value={JSON.stringify((form as any).galleryOrder || [])} onChange={e => {
                try { const v=JSON.parse(e.target.value); setForm({...form,galleryOrder:v}); } catch {}
              }} rows={2}
                style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.6)", fontSize:11, outline:"none", fontFamily:"monospace", resize:"vertical", boxSizing:"border-box" }} />
              <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:9, margin:"4px 0 0" }}>JSON 数组，如 [17,28,27,0,1,2,...] 指定前几张图的顺序。留空 [] 按文件名排序。</p>
            </div>

            {msg && <p style={{ fontFamily:"var(--font-body)", color:msg.includes("失败")?"rgba(255,80,80,0.6)":"rgba(100,255,100,0.6)", fontSize:10, marginTop:12 }}>{msg}</p>}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => del(form.slug||"")} style={{ fontFamily:"var(--font-body)", background:"none", border:"none", color:"rgba(255,80,80,0.6)", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>删除</button>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={() => { setEditing(null); setMsg(""); }} style={{ fontFamily:"var(--font-body)", background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", padding:"8px 16px", fontSize:11, cursor:"pointer", textTransform:"uppercase" }}>取消</button>
                <button onClick={save} style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"8px 24px", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Page Forms ======
function PageForm({ page }: { page: "about" | "contact" }) {
  const [data, setData] = useState<Record<string,string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/pages").then(r=>r.json()).then(d => {
      if (d[page]) setData(d[page]);
    }).catch(()=>{});
  }, [page]);

  const fields = page === "about"
    ? [["zh","中文介绍","textarea"],["en","English Intro","textarea"],["location","Location","text"],["founded","Founded","text"],["projects","Projects","text"],["clients","Clients","text"]]
    : [["email","Email","text"],["wechat","WeChat","text"]];

  const save = async () => {
    const cur = await fetch("/api/pages").then(r=>r.json()).catch(()=>({}));
    await fetch("/api/pages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...cur,[page]:data}) });
    setMsg("✅ 已保存"); setTimeout(()=>setMsg(""),3000);
  };

  return (
    <div style={{ maxWidth:500 }}>
      <h2 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:20, margin:"0 0 24px" }}>{page==="about"?"关于页面":"联系页面"}</h2>
      {fields.map(([k,lab,type]) => (
        <div key={k} style={{ marginBottom:16 }}>
          <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:6, textTransform:"uppercase" }}>{lab}</label>
          {type==="textarea" ? (
            <textarea value={data[k]||""} onChange={e=>setData({...data,[k]:e.target.value})} rows={3}
              style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", resize:"vertical", boxSizing:"border-box" }} />
          ) : (
            <input value={data[k]||""} onChange={e=>setData({...data,[k]:e.target.value})}
              style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }} />
          )}
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={save} style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"8px 24px", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>保存</button>
        {msg && <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.4)", fontSize:10 }}>{msg}</span>}
      </div>
    </div>
  );
}

// ====== Founders Form ======
function FoundersForm() {
  const [founders, setFounders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/pages").then(r=>r.json()).then(d => {
      if(d.founders) setFounders(d.founders);
    }).catch(()=>{});
  }, []);

  const save = async () => {
    const cur = await fetch("/api/pages").then(r=>r.json()).catch(()=>({}));
    await fetch("/api/pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...cur,founders})});
    setMsg("✅ 已保存"); setTimeout(()=>setMsg(""),3000);
  };

  return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:20, margin:"0 0 24px" }}>创始人页面</h2>
      {founders.map((f,i) => (
        <div key={i} style={{ marginBottom:24, padding:20, border:"1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ fontFamily:"var(--font-display)", color:"rgba(255,255,255,0.5)", fontSize:14, margin:"0 0 16px" }}>创始人 {i+1}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {["name","nameEn","role","roleEn","image"].map(k => (
              <div key={k} style={k==="image"?{gridColumn:"1/-1"}:{}}>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{k}</label>
                <input value={f[k]||""} onChange={e => { const n=[...founders]; n[i]={...n[i],[k]:e.target.value}; setFounders(n); }}
                  style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", boxSizing:"border-box" }} />
              </div>
            ))}
            {["bio","bioEn"].map(k => (
              <div key={k} style={{ gridColumn:"1/-1" }}>
                <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:4, textTransform:"uppercase" }}>{k}</label>
                <textarea value={f[k]||""} onChange={e => { const n=[...founders]; n[i]={...n[i],[k]:e.target.value}; setFounders(n); }} rows={3}
                  style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"var(--font-body)", resize:"vertical", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={save} style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"8px 24px", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em" }}>保存</button>
        {msg && <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.4)", fontSize:10 }}>{msg}</span>}
      </div>
    </div>
  );
}

// ====== Join Form ======
function JoinForm() {
  const [positions, setPositions] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/pages").then(r=>r.json()).then(d => {
      if (d.join) {
        if (d.join.positions) setPositions(d.join.positions);
        if (d.join.email) setEmail(d.join.email);
      }
    }).catch(()=>{});
  }, []);

  const save = async () => {
    const cur = await fetch("/api/pages").then(r=>r.json()).catch(()=>({}));
    await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cur, join: { positions, email } })
    });
    setMsg("✅ 已保存"); setTimeout(() => setMsg(""), 3000);
  };

  const addPosition = () => {
    setPositions([...positions, { title: "", titleEn: "", desc: "", descEn: "" }]);
  };
  const removePosition = (i: number) => {
    setPositions(positions.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: 20, margin: "0 0 24px" }}>加入我们页面</h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)", fontSize: 10, display: "block", marginBottom: 6, textTransform: "uppercase" }}>投递邮箱</label>
        <input value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", color: "rgba(255,255,255,0.8)", fontSize: 13, outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>招聘职位 ({positions.length})</h3>
        <button onClick={addPosition}
          style={{ fontFamily: "var(--font-body)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 12px", fontSize: 10, cursor: "pointer", textTransform: "uppercase" }}>+ 添加</button>
      </div>

      {positions.map((pos, i) => (
        <div key={i} style={{ marginBottom: 24, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-display)", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>职位 {i + 1}</span>
            <button onClick={() => removePosition(i)}
              style={{ fontFamily: "var(--font-body)", background: "none", border: "none", color: "rgba(255,0,0,0.5)", fontSize: 10, cursor: "pointer" }}>删除</button>
          </div>
          {["title","titleEn","desc","descEn"].map(k => (
            <div key={k} style={{ marginBottom: 10 }}>
              <label style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)", fontSize: 10, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{k}</label>
              {k.startsWith("desc") ? (
                <textarea value={pos[k] || ""} onChange={e => { const n = [...positions]; n[i] = { ...n[i], [k]: e.target.value }; setPositions(n); }} rows={3}
                  style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", color: "rgba(255,255,255,0.8)", fontSize: 13, outline: "none", fontFamily: "var(--font-body)", resize: "vertical", boxSizing: "border-box" }} />
              ) : (
                <input value={pos[k] || ""} onChange={e => { const n = [...positions]; n[i] = { ...n[i], [k]: e.target.value }; setPositions(n); }}
                  style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 12px", color: "rgba(255,255,255,0.8)", fontSize: 13, outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
        <button onClick={save} style={{ fontFamily: "var(--font-body)", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "8px 24px", fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>保存</button>
        {msg && <span style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{msg}</span>}
      </div>
    </div>
  );
}

// ====== GitHub API upload helper ======
async function uploadFolderToGitHub(files: FileList, folderName: string, token: string): Promise<string> {
  const GITHUB_API = "https://api.github.com/repos/wjy112233445551/adda-design";
  const headers = { "Authorization": `token ${token}`, "Accept": "application/vnd.github+json" };

  // 获取当前 head ref
  const refResp = await fetch(`${GITHUB_API}/git/refs/heads/main`, { headers });
  const refData = await refResp.json();
  const baseSha = refData.object.sha;
  const baseCommitResp = await fetch(`${GITHUB_API}/git/commits/${baseSha}`, { headers });
  const baseCommit = await baseCommitResp.json();
  const baseTreeSha = baseCommit.tree.sha;

  // 逐个文件创建 blob
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
  let done = 0;

  for (const file of Array.from(files)) {
    // 跳过非图片
    if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) continue;
    const content = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
    const blobResp = await fetch(`${GITHUB_API}/git/blobs`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ content, encoding: "base64" }),
    });
    const blobData = await blobResp.json();
    if (blobData.sha) {
      treeItems.push({ path: `public/projects/${folderName}/${file.name}`, mode: "100644", type: "blob", sha: blobData.sha });
      done++;
    }
  }

  if (treeItems.length === 0) throw new Error("没有找到图片文件");

  // 创建 tree
  const treeResp = await fetch(`${GITHUB_API}/git/trees`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  const treeData = await treeResp.json();

  // 创建 commit
  const commitResp = await fetch(`${GITHUB_API}/git/commits`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `admin: upload ${folderName} (${done} images)`,
      tree: treeData.sha,
      parents: [baseSha],
    }),
  });
  const commitData = await commitResp.json();

  // 更新 ref
  await fetch(`${GITHUB_API}/git/refs/heads/main`, {
    method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commitData.sha, force: false }),
  });

  return `✅ 已上传 ${done} 张图片到 GitHub（${folderName}），Vercel 将自动部署`;
}

// ====== File Browser ======
function FileBrowser({ children, onImport }: { children: React.ReactNode; onImport: (folder: string) => void }) {
  const { onSelectMouseDown: fbSelect, onBackdropClick: fbBackdrop } = useModalBackdrop();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("/Users");
  const [dirs, setDirs] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("adda_github_token") || "";
    return "";
  });

  const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";

  // ── localhost: filesystem browse ──
  const browse = async (p: string) => {
    try {
      const r = await fetch(`/api/browse?action=browse&path=${encodeURIComponent(p)}`);
      const d = await r.json();
      setPath(d.path || p);
      setDirs(d.dirs?.map((x:any) => x.name) || []);
      setImages(d.images?.map((x:any) => x.name) || []);
      setMsg("");
    } catch { setMsg("读取失败"); }
  };

  const importF = async (p: string) => {
    setMsg("导入中...");
    const name = p.split("/").pop() || "project";
    const r = await fetch(`/api/browse?action=import&path=${encodeURIComponent(p)}&name=${encodeURIComponent(name)}`);
    const d = await r.json();
    if (d.success) { onImport(d.folder); setOpen(false); setMsg(""); }
    else setMsg("导入失败");
  };

  // ── Vercel: GitHub API upload ──
  const handleVercelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!token) { setMsg("请先在 Deploy 页面设置 GitHub Token"); return; }

    // 取第一个文件的父文件夹名
    const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
    const folderName = firstPath.includes("/") ? firstPath.split("/")[0] : prompt("输入项目文件夹名:") || "new-project";

    setUploading(true);
    setUploadProgress(`上传中... 0/${files.length}`);
    try {
      const result = await uploadFolderToGitHub(files, folderName, token);
      setMsg(result);
      setUploadProgress("");
      onImport(folderName);
      setOpen(false);
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    }
    setUploading(false);
    e.target.value = "";
  };

  const saveToken = () => { localStorage.setItem("adda_github_token", token); setMsg("Token 已保存"); };

  return (
    <>
      <span onClick={() => { setOpen(true); if (isLocal) browse(path); }}>{children}</span>
      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => fbBackdrop(() => setOpen(false))}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", width:700, maxHeight:"80vh", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.6)", fontSize:12, margin:0 }}>
                {isLocal ? "选择图片文件夹" : "上传图片文件夹（通过 GitHub）"}
              </h3>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>

            {isLocal ? (
              <>
                {/* localhost mode */}
                <div style={{ padding:"8px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", gap:4, flexWrap:"wrap" }}>
                  {path.split("/").filter(Boolean).reduce((acc: string[], p: string) => [...acc, (acc.length ? acc[acc.length-1]+"/"+p : "/"+p)], [] as string[]).map((p, i) => (
                    <span key={p} style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, cursor:"pointer" }} onClick={() => browse(p)}>
                      {i > 0 && <span style={{ color:"rgba(255,255,255,0.1)", margin:"0 2px" }}>/</span>}
                      {p.split("/").pop()}
                    </span>
                  ))}
                </div>
                <div style={{ flex:1, overflow:"auto", padding:16 }}>
                  {dirs.map(d => (
                    <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", cursor:"pointer" }}
                      onClick={() => browse(path + "/" + d)}>
                      <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.6)", fontSize:13 }}>📁 {d}</span>
                      <button onClick={e => { e.stopPropagation(); importF(path + "/" + d); }}
                        style={{ fontFamily:"var(--font-body)", background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:10, padding:"4px 8px", cursor:"pointer", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                        导入此文件夹
                      </button>
                    </div>
                  ))}
                  {images.length > 0 && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, marginTop:8 }}>
                      {images.slice(0, 24).map(img => (
                        <div key={img} style={{ aspectRatio:"1", background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <img src={`/api/preview?path=${encodeURIComponent(path+"/"+img)}`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {dirs.length === 0 && images.length === 0 && (
                    <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.2)", fontSize:12, textAlign:"center", padding:32 }}>空文件夹</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Vercel mode: GitHub token + folder picker */}
                <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:10, display:"block", marginBottom:6, textTransform:"uppercase" }}>
                      GitHub Personal Access Token
                    </label>
                    <div style={{ display:"flex", gap:8 }}>
                      <input type="password" value={token} onChange={e => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        style={{ flex:1, background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"8px 12px", color:"rgba(255,255,255,0.8)", fontSize:12, outline:"none", fontFamily:"monospace" }} />
                      <button onClick={saveToken}
                        style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"8px 12px", fontSize:11, cursor:"pointer" }}>保存</button>
                    </div>
                    <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.15)", fontSize:9, margin:"6px 0 0" }}>
                      在 <a href="https://github.com/settings/tokens" target="_blank" style={{ color:"rgba(255,255,255,0.4)" }}>github.com/settings/tokens</a> 生成 classic token，勾选 repo 权限
                    </p>
                  </div>

                  <label
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      padding:"32px", border:"2px dashed rgba(255,255,255,0.15)", borderRadius:8,
                      cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.5 : 1,
                    }}>
                    <input type="file" accept="image/*"
                      // @ts-expect-error webkitdirectory is non-standard but widely supported
                      webkitdirectory=""
                      multiple
                      style={{ display:"none" }}
                      disabled={uploading}
                      onChange={handleVercelUpload} />
                    <span style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.4)", fontSize:13 }}>
                      {uploading ? `⏳ ${uploadProgress}` : "📁 选择一个图片文件夹"}
                    </span>
                  </label>
                </div>
              </>
            )}

            {msg && (
              <div style={{ padding:"8px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily:"var(--font-body)", color: msg.startsWith("✅") ? "rgba(100,255,100,0.6)" : msg.startsWith("❌") ? "rgba(255,80,80,0.6)" : "rgba(255,255,255,0.4)", fontSize:10, margin:0 }}>{msg}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ====== Deploy ======
function DeployBtn() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const deploy = async () => {
    setLoading(true); setMsg("部署中...");
    try {
      const r = await fetch("/api/deploy",{method:"POST"});
      const d = await r.json();
      setMsg(d.success ? `✅ ${d.message}` : `❌ ${d.message}`);
    } catch { setMsg("❌ 失败"); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth:400 }}>
      <h2 style={{ fontFamily:"var(--font-display)", color:"#fff", fontSize:20, margin:"0 0 16px" }}>部署上线</h2>
      <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.3)", fontSize:11, lineHeight:1.6, marginBottom:24 }}>
        编辑内容并保存后，点击按钮提交到 GitHub 并自动部署到 Vercel。
      </p>
      <button onClick={deploy} disabled={loading}
        style={{ fontFamily:"var(--font-body)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", padding:"10px 32px", fontSize:11, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.2em", width:"100%", opacity:loading?0.5:1 }}>
        {loading ? "部署中..." : "推送到 GitHub →"}
      </button>
      {msg && <p style={{ fontFamily:"var(--font-body)", color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:12 }}>{msg}</p>}
    </div>
  );
}
