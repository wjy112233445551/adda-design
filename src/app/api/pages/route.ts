import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "pages.json");
const IS_VERCEL = !!process.env.VERCEL;

function read() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")); }
  catch { return {}; }
}

async function saveViaGitHub(data: unknown, token: string, message: string) {
  const GITHUB = "https://api.github.com/repos/wjy112233445551/adda-design/contents/data/pages.json";
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" };

  const getRes = await fetch(GITHUB, { headers, cache: "no-store" });
  if (!getRes.ok) {
    const err = await getRes.json().catch(() => ({ message: "auth failed" }));
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

export async function GET() {
  return NextResponse.json(read());
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const token = searchParams.get("token") || "";
  const body = await req.json();

  // 本地模式：直接写文件
  try { fs.writeFileSync(DATA_PATH, JSON.stringify(body, null, 2)); } catch {}

  // Vercel 模式：通过 GitHub API
  if (IS_VERCEL) {
    if (!token) return NextResponse.json({ error: "缺少 GitHub Token，请在 Deploy 页面设置" }, { status: 400 });
    try { await saveViaGitHub(body, token, "admin: update pages"); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  return NextResponse.json({ success: true });
}
