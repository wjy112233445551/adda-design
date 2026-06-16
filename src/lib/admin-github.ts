/**
 * Admin 页面 GitHub API 数据操作工具
 *
 * 云端（Vercel/Cloudflare）通过 GitHub API 读写数据和浏览文件
 * 本地（localhost）保持原有文件系统 API
 */

const GITHUB_API = "https://api.github.com/repos/wjy112233445551/adda-design";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("adda_github_token") || "";
}

export function isLocal(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost";
}

// ── 数据文件操作 ──

export async function loadJsonFile(filename: string): Promise<any> {
  if (isLocal()) {
    const res = await fetch(`/api/${filename.replace(".json","")}`, { cache: "no-store" });
    return res.json();
  }
  const token = getToken();
  const res = await fetch(`/api/github?action=read&path=data/${filename}&token=${token}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return JSON.parse(data.content);
}

export async function saveJsonFile(filename: string, content: any, message?: string): Promise<void> {
  const c = JSON.stringify(content, null, 2);
  if (isLocal()) {
    const endpoint = `/api/${filename.replace(".json","")}`;
    // 对于单个项目，用 POST/PUT；对于整批替换，需要特殊处理
    // 本地模式维持原样
    return;
  }
  const token = getToken();
  // 获取当前 sha
  const readRes = await fetch(`/api/github?action=read&path=data/${filename}&token=${token}`);
  const { sha } = await readRes.json();

  const res = await fetch(`/api/github?action=write&path=data/${filename}&token=${token}&message=${encodeURIComponent(message || "admin: update "+filename)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: c, sha }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
}

// ── 文件夹浏览 ──

export async function listProjectFolders(): Promise<string[]> {
  if (isLocal()) {
    const res = await fetch("/api/browse", { cache: "no-store" });
    return res.json();
  }
  const token = getToken();
  const res = await fetch(`/api/github?action=list&path=public/projects&token=${token}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.dirs || []).sort();
}

export async function listFolderImages(folder: string): Promise<string[]> {
  if (isLocal()) {
    const res = await fetch(`/api/browse?folder=${encodeURIComponent(folder)}`, { cache: "no-store" });
    return res.json();
  }
  const token = getToken();
  const res = await fetch(`/api/github?action=list&path=public/projects/${encodeURIComponent(folder)}&token=${token}`, { cache: "no-store" });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.files || []).map((f: any) => `/projects/${folder}/${f.name}`);
}
