import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const IS_VERCEL = !!process.env.VERCEL;

interface DeployConfig {
  method: "git" | "build-only";
  gitRemote: string;
  gitBranch: string;
  buildCommand: string;
  postBuild: string;
  note: string;
}

function readConfig(): DeployConfig {
  const configPath = path.join(process.cwd(), "data", "deploy.json");
  try { return JSON.parse(fs.readFileSync(configPath, "utf-8")); }
  catch { return { method: "git", gitRemote: "origin", gitBranch: "main", buildCommand: "npm run build", postBuild: "", note: "" }; }
}

export async function GET() {
  return NextResponse.json({ ...readConfig(), isVercel: IS_VERCEL });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const token = searchParams.get("token") || "";
  const body = await req.json().catch(() => ({}));
  const cwd = process.cwd();

  // ── 保存配置 ──
  if (body.gitRemote !== undefined || body.method !== undefined) {
    const configPath = path.join(cwd, "data", "deploy.json");
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true, message: "配置已保存" });
  }

  // ── Vercel 模式：通过 GitHub API 触发重新部署 ──
  if (IS_VERCEL) {
    if (!token) return NextResponse.json({ success: false, message: "需要 GitHub Token，请在 Deploy 页面设置" }, { status: 400 });

    try {
      // 创建一个空的 dispatch 事件触发 Vercel 重新部署
      // 或者直接创建一个空的 commit
      const GITHUB = "https://api.github.com/repos/wjy112233445551/adda-design";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      // 用 repository_dispatch 触发 workflow（如果配置了的话）
      // 或者创建一个空 commit 强制触发 Vercel 重新部署
      const refRes = await fetch(`${GITHUB}/git/refs/heads/main`, { headers });
      const refData = await refRes.json();
      const baseSha = refData.object?.sha;
      if (!baseSha) return NextResponse.json({ success: false, message: "无法获取 main 分支" }, { status: 500 });

      const commitRes = await fetch(`${GITHUB}/git/commits/${baseSha}`, { headers });
      const commitData = await commitRes.json();

      // 创建一个空的 tree（基于当前 tree）
      const treeRes = await fetch(`${GITHUB}/git/trees`, {
        method: "POST", headers,
        body: JSON.stringify({ base_tree: commitData.tree.sha, tree: [] }),
      });
      const treeData = await treeRes.json();

      // 创建一个空 commit（仅为了触发 Vercel 重新部署）
      const newCommitRes = await fetch(`${GITHUB}/git/commits`, {
        method: "POST", headers,
        body: JSON.stringify({
          message: "admin: trigger redeploy",
          tree: treeData.sha,
          parents: [baseSha],
        }),
      });
      const newCommitData = await newCommitRes.json();

      // 更新 ref
      await fetch(`${GITHUB}/git/refs/heads/main`, {
        method: "PATCH", headers,
        body: JSON.stringify({ sha: newCommitData.sha, force: false }),
      });

      return NextResponse.json({ success: true, message: "✅ 已触发 GitHub → Vercel 自动部署" });
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
  }

  // ── 本地模式：git push ──
  const config = readConfig();
  try {
    try { await execAsync("git add -A", { cwd }); await execAsync('git commit -m "admin: update content"', { cwd }); }
    catch (e: any) { if (!e.message?.includes("nothing to commit")) throw e; }

    if (config.method === "git") {
      const remote = config.gitRemote || "origin";
      const branch = config.gitBranch || "main";
      try {
        const { stdout } = await execAsync(`git push ${remote} ${branch}`, { cwd });
        return NextResponse.json({ success: true, message: `✅ 已推送到 ${remote}/${branch}`, detail: stdout.slice(-200) });
      } catch (e: any) {
        return NextResponse.json({ success: true, message: "✅ 本地已提交，但推送失败", detail: e.message?.slice(0, 300) || "" });
      }
    } else {
      try { await execAsync(config.buildCommand || "npm run build", { cwd }); return NextResponse.json({ success: true, message: "✅ 构建完成" }); }
      catch (e: any) { return NextResponse.json({ success: true, message: "✅ 已提交，但构建失败", detail: e.message?.slice(0, 300) || "" }); }
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || "部署失败" });
  }
}
