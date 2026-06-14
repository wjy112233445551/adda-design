import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IS_VERCEL = !!process.env.VERCEL;

/**
 * 从 project-images.ts + projects.ts 静态导入获取所有合法项目文件夹名。
 * 完全避免在编译时常量上做 path.join(PUBLIC_DIR, unknown)，从而避开
 * Turbopack 将 public/projects/ 下 18816 个文件全部追踪打包的问题。
 */
let _folderWhitelist: Set<string> | null = null;
async function getValidFolders(): Promise<Set<string>> {
  if (_folderWhitelist) return _folderWhitelist;
  _folderWhitelist = new Set();
  try {
    const { projectImages } = await import("@/lib/project-images");
    for (const k of Object.keys(projectImages as Record<string, string[]>)) {
      _folderWhitelist.add(k);
    }
  } catch { /* 文件不存在则跳过 */ }
  try {
    const { projects } = await import("@/lib/projects");
    for (const p of projects as Array<{ folder: string }>) {
      _folderWhitelist.add(p.folder);
    }
  } catch { /* 文件不存在则跳过 */ }
  return _folderWhitelist;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // ── 本地专属：浏览电脑目录 / 导入文件夹 ──
  // Turbopack 不会追踪动态 require 内部的 fs 调用
  if (action === "browse" || action === "import") {
    if (IS_VERCEL) {
      return NextResponse.json(
        { error: "本地文件浏览和导入仅在本地环境可用。请使用 localhost 管理后台导入项目，Vercel 版可管理已有项目。" },
        { status: 400 }
      );
    }
    // 动态 require，编译期不可追踪
    const localFs = require("./local-fs");
    if (action === "browse") {
      const dirPath = searchParams.get("path") || "/Users";
      return NextResponse.json(localFs.browseLocalDir(dirPath));
    }
    if (action === "import") {
      const sourcePath = searchParams.get("path");
      const folderName = searchParams.get("name") || "";
      const result = localFs.importImagesFrom(sourcePath, folderName);
      if ("error" in result) {
        return NextResponse.json(result, { status: 404 });
      }
      // 清除白名单缓存
      _folderWhitelist = null;
      return NextResponse.json(result);
    }
  }

  // ══════════════════════════════════════════════
  // 以下为生产环境调用，全部走静态导入，无动态 fs 路径
  // ══════════════════════════════════════════════

  const folder = searchParams.get("folder");

  // ── 列出所有项目文件夹 ──
  if (!folder) {
    const validFolders = await getValidFolders();
    return NextResponse.json([...validFolders].sort());
  }

  // ── 列出文件夹内图片 ──
  // 先通过静态导入 projectImages 获取
  try {
    const { projectImages } = await import("@/lib/project-images");
    const mapped = (projectImages as Record<string, string[]>)[folder];
    if (mapped && mapped.length > 0) {
      return NextResponse.json(mapped);
    }
  } catch { /* 文件不存在则跳过 */ }

  // 安全兜底：验证 folder 在白名单中
  const validFolders = await getValidFolders();
  if (!validFolders.has(folder)) {
    return NextResponse.json(
      { error: "Folder not found", folder },
      { status: 404 }
    );
  }

  // 只有在此兜底分支才会读文件系统，且 folder 已通过白名单校验
  const localFs = require("./local-fs");
  const images = localFs.listProjectImages(folder);
  if (!images) {
    return NextResponse.json({ error: "Cannot read folder", folder }, { status: 500 });
  }
  return NextResponse.json(images);
}
