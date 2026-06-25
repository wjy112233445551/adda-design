import { NextResponse } from "next/server";
import { projects } from "@/lib/projects";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "projects.json");
const IS_VERCEL = !!process.env.VERCEL;

function readProjects() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); }
  catch { return projects; }
}

async function saveViaGitHub(data: unknown, token: string, message: string) {
  const GITHUB = "https://api.github.com/repos/wjy112233445551/adda-design/contents/data/projects.json";
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" };

  // 先读当前 sha
  const getRes = await fetch(GITHUB, { headers, cache: "no-store" });
  if (!getRes.ok) {
    const err = await getRes.json().catch(() => ({ message: "GitHub auth failed" }));
    throw new Error(`GitHub GET: ${err.message || getRes.statusText} (${getRes.status})`);
  }
  const current = await getRes.json();

  const putRes = await fetch(GITHUB, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      sha: current.sha,
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({ message: "Unknown" }));
    throw new Error(`GitHub PUT: ${err.message || putRes.statusText} (${putRes.status})`);
  }
}

function writeProjects(data: unknown) {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }
  catch { /* Vercel 只读，忽略 */ }
}

export async function GET() {
  return NextResponse.json(readProjects(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const token = searchParams.get("token") || "";
  const body = await req.json();

  // —— reorder action ——
  if (body.action === "reorder" && Array.isArray(body.slugs)) {
    const list = readProjects();
    const map = new Map(list.map((p: any) => [p.slug, p]));
    const reordered = body.slugs.map((s: string) => map.get(s)).filter(Boolean);
    // 保留不在 slugs 中的项目（防御性）
    for (const p of list) { if (!body.slugs.includes(p.slug)) reordered.push(p); }
    writeProjects(reordered);
    if (IS_VERCEL) {
      if (!token) return NextResponse.json({ error: "缺少 GitHub Token" }, { status: 400 });
      try { await saveViaGitHub(reordered, token, "admin: reorder projects"); }
      catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
    }
    return NextResponse.json({ ok: true, count: reordered.length });
  }

  // —— create action ——
  const list = readProjects();
  const newProject = {
    ...body,
    slug: body.slug || body.titleEn?.toLowerCase().replace(/\s+/g, "-") || `project-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newProject);
  writeProjects(list);
  if (IS_VERCEL) {
    if (!token) return NextResponse.json({ error: "缺少 GitHub Token，请在 Deploy 页面设置" }, { status: 400 });
    try { await saveViaGitHub(list, token, `admin: add project ${newProject.title || newProject.slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const token = searchParams.get("token") || "";
  const body = await req.json();
  const list = readProjects();
  const idx = list.findIndex((p: { slug: string }) => p.slug === body.slug);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  list[idx] = { ...list[idx], ...body };
  writeProjects(list);
  if (IS_VERCEL) {
    if (!token) return NextResponse.json({ error: "缺少 GitHub Token" }, { status: 400 });
    try { await saveViaGitHub(list, token, `admin: update project ${body.title || body.slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json(list[idx]);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const token = searchParams.get("token") || "";
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  let list = readProjects();
  const slug = body.slug;
  list = list.filter((p: { slug: string }) => p.slug !== slug);
  writeProjects(list);
  if (IS_VERCEL) {
    if (!token) return NextResponse.json({ error: "缺少 GitHub Token" }, { status: 400 });
    try { await saveViaGitHub(list, token, `admin: delete project ${slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json({ ok: true });
}
