/**
 * 仅限本地开发环境使用的文件系统操作（浏览/导入项目图片）。
 *
 * 使用运行时拼接路径（而非编译时常量 path.join）来避免 Turbopack
 * 静态分析时将 public/projects/ 下 18816 个图片文件全部追踪打包。
 */
import fs from "fs";
import path from "path";

/** 运行时计算项目 public/projects/ 路径，编译期不可追踪 */
function projectsRoot(): string {
  // 从 cwd + 字符串拼接，避免常量折叠
  const base = process.cwd();
  return base + path.sep + "public" + path.sep + "projects";
}

export function browseLocalDir(dirPath: string) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({ name: e.name, type: "directory" as const }));
    const images = entries
      .filter((e) => e.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(e.name))
      .map((e) => ({ name: e.name, type: "image" as const }));
    return { dirs, images, path: dirPath };
  } catch {
    return { dirs: [], images: [], path: dirPath, error: "Cannot read directory" };
  }
}

export function importImagesFrom(sourcePath: string, folderName: string) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return { error: "Source not found" as const };
  }

  const destDir = projectsRoot() + path.sep + folderName;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  let count = 0;
  function copyImages(src: string) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const full = src + path.sep + e.name;
      if (e.isDirectory()) {
        copyImages(full);
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(e.name)) {
        const dest = destDir + path.sep + e.name;
        fs.copyFileSync(full, dest);
        count++;
      }
    }
  }
  copyImages(sourcePath);

  return { success: true as const, count, folder: folderName };
}

export function listProjectImages(folder: string): string[] | null {
  const folderPath = projectsRoot() + path.sep + folder;
  try {
    return fs
      .readdirSync(folderPath)
      .filter((f: string) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort()
      .map((f: string) => `/projects/${folder}/${f}`);
  } catch {
    return null;
  }
}
