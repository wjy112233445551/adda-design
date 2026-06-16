import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";
const OWNER = "wjy112233445551";
const REPO = "adda-design";

/**
 * 云端 GitHub API 代理 — 替代本地文件系统操作
 *
 * ?action=read&path=data/renderings.json
 * ?action=write&path=data/renderings.json&token=xxx  (body: JSON content)
 * ?action=list&path=public/projects
 * ?action=delete&path=data/xxx&token=xxx
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const filepath = searchParams.get("path") || "";
  const token = searchParams.get("token") || "";

  if (!token) return NextResponse.json({ error: "Missing GitHub token" }, { status: 401 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    if (action === "read") {
      // 读取文件内容
      const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filepath}`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
      const data = await res.json();
      // 解码 base64 内容
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return NextResponse.json({
        content,
        sha: data.sha,
        path: filepath,
      });
    }

    if (action === "list") {
      // 列出目录或文件
      const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filepath}`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
      const data = await res.json();

      if (Array.isArray(data)) {
        const dirs = data.filter((e: any) => e.type === "dir").map((e: any) => e.name);
        const files = data.filter((e: any) => e.type === "file" && /\.(jpg|jpeg|png|webp|gif)$/i.test(e.name))
          .map((e: any) => ({
            name: e.name,
            path: e.path,
            download_url: e.download_url,
          }));
        return NextResponse.json({ dirs, files, path: filepath });
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const filepath = searchParams.get("path") || "";
  const token = searchParams.get("token") || "";
  let message = searchParams.get("message") || "admin: update";

  if (!token) return NextResponse.json({ error: "Missing GitHub token" }, { status: 401 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  try {
    if (action === "write") {
      // 写入 JSON 文件（带 SHA 以处理冲突）
      const { content, sha } = await req.json();
      const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filepath}`;

      const body: any = {
        message,
        content: Buffer.from(typeof content === "string" ? content : JSON.stringify(content, null, 2)).toString("base64"),
      };
      if (sha) body.sha = sha;

      const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json({ error: err.message }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json({ success: true, sha: data.content?.sha, path: filepath });
    }

    if (action === "delete") {
      const { sha } = await req.json();
      if (!sha) return NextResponse.json({ error: "Missing sha" }, { status: 400 });

      const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filepath}`;
      const body = { message, sha };

      const res = await fetch(url, { method: "DELETE", headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json({ error: err.message }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "commit-all") {
      // 批量提交：接收多个文件变更
      const { files } = await req.json();
      // files: [{ path, content, mode: "100644" }]

      // 1. 获取最新 commit
      const refUrl = `${GITHUB_API}/repos/${OWNER}/${REPO}/git/refs/heads/main`;
      const refRes = await fetch(refUrl, { headers });
      const refData = await refRes.json();
      const baseSha = refData.object?.sha;
      if (!baseSha) return NextResponse.json({ error: "Cannot get ref" }, { status: 500 });

      const baseCommitUrl = `${GITHUB_API}/repos/${OWNER}/${REPO}/git/commits/${baseSha}`;
      const bcRes = await fetch(baseCommitUrl, { headers });
      const bcData = await bcRes.json();
      const treeSha = bcData.tree?.sha;
      if (!treeSha) return NextResponse.json({ error: "Cannot get tree" }, { status: 500 });

      // 2. 创建 blobs
      const treeItems: any[] = [];
      for (const f of files) {
        const blobRes = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/git/blobs`, {
          method: "POST", headers,
          body: JSON.stringify({ content: f.content, encoding: f.encoding || "utf-8" }),
        });
        const blobData = await blobRes.json();
        treeItems.push({
          path: f.path,
          mode: f.mode || "100644",
          type: "blob",
          sha: blobData.sha,
        });
      }

      // 3. 创建新 tree
      const treeRes = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/git/trees`, {
        method: "POST", headers,
        body: JSON.stringify({ base_tree: treeSha, tree: treeItems }),
      });
      const treeData = await treeRes.json();

      // 4. 创建 commit
      const commitRes = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/git/commits`, {
        method: "POST", headers,
        body: JSON.stringify({ message, tree: treeData.sha, parents: [baseSha] }),
      });
      const commitData = await commitRes.json();

      // 5. 更新 ref
      await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
        method: "PATCH", headers,
        body: JSON.stringify({ sha: commitData.sha, force: false }),
      });

      return NextResponse.json({ success: true, message: "已提交并推送" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
