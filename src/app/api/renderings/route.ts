import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "renderings.json");
const IS_VERCEL = !!process.env.VERCEL;

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); }
  catch { return []; }
}

async function saveViaGitHub(data: unknown, token: string, message: string) {
  const GITHUB = "https://api.github.com/repos/wjy112233445551/adda-design/contents/data/renderings.json";
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

export async function GET() {
  return NextResponse.json(readData(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

async function writeAndSave(data: unknown, token: string, msg: string) {
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); } catch {}
  if (IS_VERCEL && token) await saveViaGitHub(data, token, msg);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const body = await req.json();
  const list = readData();
  const newProject = { ...body, slug: body.slug || `fx_${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
  list.push(newProject);
  await writeAndSave(list, token, `admin: add rendering ${newProject.title || newProject.slug}`);
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const body = await req.json();
  const list = readData();
  const idx = list.findIndex((p: any) => p.slug === body.slug);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  list[idx] = { ...list[idx], ...body };
  await writeAndSave(list, token, `admin: update rendering ${body.title || body.slug}`);
  return NextResponse.json(list[idx]);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const body = await req.json();
  let list = readData();
  list = list.filter((p: any) => p.slug !== body.slug);
  await writeAndSave(list, token, `admin: delete rendering ${body.slug}`);
  return NextResponse.json({ ok: true });
}
