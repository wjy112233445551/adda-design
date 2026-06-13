import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public", "projects");
const IS_VERCEL = !!process.env.VERCEL;

// Safe directory listing
function listDir(dirPath: string) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({ name: e.name, type: "directory" }));
    const images = entries
      .filter((e) => e.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(e.name))
      .map((e) => ({ name: e.name, type: "image" }));
    return { dirs, images, path: dirPath };
  } catch {
    return { dirs: [], images: [], path: dirPath, error: "Cannot read directory" };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // ── Vercel 不支持的功能 ──
  if (IS_VERCEL && (action === "browse" || action === "import")) {
    return NextResponse.json({ error: "本地文件浏览和导入仅在本地环境可用。请使用 localhost 管理后台导入项目，Vercel 版可管理已有项目。" }, { status: 400 });
  }

  // ── 浏览本地电脑目录 ──
  if (action === "browse") {
    const dirPath = searchParams.get("path") || "/Users";
    return NextResponse.json(listDir(dirPath));
  }

  // ── 导入文件夹 ──
  if (action === "import") {
    const sourcePath = searchParams.get("path");
    const folderName = searchParams.get("name") || path.basename(sourcePath || "");

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const destDir = path.join(PUBLIC_DIR, folderName);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    let count = 0;
    function copyImages(src: string) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(src, e.name);
        if (e.isDirectory()) {
          copyImages(full);
        } else if (/\.(jpg|jpeg|png|webp)$/i.test(e.name)) {
          const dest = path.join(destDir, e.name);
          fs.copyFileSync(full, dest);
          count++;
        }
      }
    }
    copyImages(sourcePath);

    return NextResponse.json({ success: true, count, folder: folderName });
  }

  // List project folders (for dropdown)
  const folder = searchParams.get("folder");
  if (!folder) {
    const dirs = fs.existsSync(PUBLIC_DIR)
      ? fs.readdirSync(PUBLIC_DIR).filter((f) => {
          const full = path.join(PUBLIC_DIR, f);
          return fs.statSync(full).isDirectory() && !f.startsWith(".");
        })
      : [];
    return NextResponse.json(dirs);
  }

  // List images in a folder — 与主站 page.tsx 顺序一致
  const folderPath = path.join(PUBLIC_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  // 优先用 projectImages（与主站一致），缺文件时补齐
  try {
    const { projectImages } = await import("@/lib/project-images");
    const mapped = (projectImages as Record<string, string[]>)[folder];
    if (mapped && mapped.length > 0) {
      const mappedFiles = new Set(mapped.map((f: string) => path.basename(f)));
      const fsFiles = new Set(fs.readdirSync(folderPath).filter((f: string) => /\.(jpg|jpeg|png|webp)$/i.test(f)));
      // 补齐文件系统中新增的图片
      const result = [...mapped];
      for (const f of fs.readdirSync(folderPath)) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(f) && !mappedFiles.has(f)) {
          result.push(`/projects/${folder}/${f}`);
        }
      }
      return NextResponse.json(result);
    }
  } catch {}

  const images = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f as string))
    .sort()
    .map((f) => `/projects/${folder}/${f as string}`);

  return NextResponse.json(images);
}
