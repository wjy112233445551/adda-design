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
  // 先读当前 sha
  const getRes = await fetch(GITHUB, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    cache: "no-store",
  });
  const current = await getRes.json();
  const putRes = await fetch(GITHUB, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      sha: current.sha,
    }),
  });
  if (!putRes.ok) throw new Error((await putRes.json()).message);
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
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const body = await req.json();
  const list = readProjects();
  const newProject = {
    ...body,
    slug: body.slug || body.titleEn?.toLowerCase().replace(/\s+/g, "-") || `project-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.push(newProject);
  writeProjects(list);
  if (IS_VERCEL && token) {
    try { await saveViaGitHub(list, token, `admin: add project ${newProject.title || newProject.slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const body = await req.json();
  const list = readProjects();
  const idx = list.findIndex((p: { slug: string }) => p.slug === body.slug);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  list[idx] = { ...list[idx], ...body };
  writeProjects(list);
  if (IS_VERCEL && token) {
    try { await saveViaGitHub(list, token, `admin: update project ${body.title || body.slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json(list[idx]);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  let list = readProjects();
  const slug = body.slug;
  list = list.filter((p: { slug: string }) => p.slug !== slug);
  writeProjects(list);
  if (IS_VERCEL && token) {
    try { await saveViaGitHub(list, token, `admin: delete project ${slug}`); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }
  return NextResponse.json({ ok: true });
}
