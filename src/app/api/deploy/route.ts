import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

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
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {
      method: "git",
      gitRemote: "origin",
      gitBranch: "main",
      buildCommand: "npm run build",
      postBuild: "",
      note: "",
    };
  }
}

export async function GET() {
  return NextResponse.json(readConfig());
}

export async function POST(req: Request) {
  const body = await req.json();
  const cwd = process.cwd();

  // 如果 body 包含 config，先保存配置
  if (body.gitRemote !== undefined || body.method !== undefined) {
    const configPath = path.join(cwd, "data", "deploy.json");
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true, message: "配置已保存" });
  }

  const config = readConfig();

  try {
    // Step 1: Git commit
    try {
      await execAsync("git add -A", { cwd });
      await execAsync('git commit -m "admin: update content"', { cwd });
    } catch (e: any) {
      if (!e.message?.includes("nothing to commit")) throw e;
    }

    // Step 2: Deploy based on method
    if (config.method === "git") {
      // 推送到 Git 远程仓库（GitHub / Gitee / 自建 GitLab）
      const remote = config.gitRemote || "origin";
      const branch = config.gitBranch || "main";
      try {
        const { stdout } = await execAsync(`git push ${remote} ${branch}`, { cwd });
        return NextResponse.json({
          success: true,
          message: `✅ 已推送到 ${remote}/${branch}`,
          detail: stdout.slice(-200),
        });
      } catch (e: any) {
        return NextResponse.json({
          success: true,
          message: "✅ 本地已提交，但推送失败（请检查网络和远程仓库配置）",
          detail: e.message?.slice(0, 300) || "",
        });
      }
    } else if (config.method === "build-only") {
      // 仅构建，不推送（适用于服务器直接在本地部署的场景）
      try {
        await execAsync(config.buildCommand || "npm run build", { cwd });
        return NextResponse.json({
          success: true,
          message: "✅ 构建完成，输出在 .next 目录",
        });
      } catch (e: any) {
        return NextResponse.json({
          success: true,
          message: "✅ 已提交，但构建失败",
          detail: e.message?.slice(0, 300) || "",
        });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || "部署失败" });
  }
}
