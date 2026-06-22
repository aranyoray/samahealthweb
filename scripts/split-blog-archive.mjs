// Splits content/_source/blog-archive.md into individual posts at content/blog/<slug>.md.
//
// The archive is a single file containing a preamble (HTML comments + a site-wide
// JSON-LD block) followed by repeating posts. Each post is:
//   ---\n<yaml front matter>\n---\n<markdown body, ending in a per-post JSON-LD <script>>
//
// For each post we:
//   * keep the front matter (title/slug/date/description/keywords/tags/...);
//   * strip the per-post JSON-LD <script> and HTML comments from the body (the Next
//     pages regenerate JSON-LD from front matter, so it stays consistent);
//   * read the in-body "*Related: ...*" line, resolve each link to a real slug, then
//     top up with tag/category-based matches, and write the result as `related:` in
//     the front matter so the site can render cross-links below every post.
//
// Re-run any time the source archive changes:  node scripts/split-blog-archive.mjs

import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] || path.resolve("content/_source/blog-archive.md");
const OUT = path.resolve("content/blog");

const raw = fs.readFileSync(SRC, "utf8");
const lines = raw.split("\n");

// 1. Locate every `---` delimiter line. They come in pairs that wrap front matter.
const delims = [];
lines.forEach((l, i) => {
  if (l.trim() === "---") delims.push(i);
});
if (delims.length % 2 !== 0) {
  throw new Error(`Expected an even number of '---' delimiters, found ${delims.length}`);
}

// 2. Carve out each post: front matter between a pair, body until the next pair opens.
const rawPosts = [];
for (let k = 0; k + 1 < delims.length; k += 2) {
  const open = delims[k];
  const close = delims[k + 1];
  const fmLines = lines.slice(open + 1, close);
  const bodyStart = close + 1;
  const bodyEnd = k + 2 < delims.length ? delims[k + 2] : lines.length;
  const bodyLines = lines.slice(bodyStart, bodyEnd);
  rawPosts.push({ fm: parseFrontMatter(fmLines), body: bodyLines.join("\n") });
}

// 3. Build lookups used to resolve cross-links.
const posts = rawPosts.map((p) => ({
  ...p.fm,
  body: p.body,
  relatedTexts: extractRelatedTexts(p.body),
}));
const bySlug = new Map(posts.map((p) => [p.slug, p]));

// 4. Resolve related links + top up from tags/category, then write each file.
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith(".md")) fs.rmSync(path.join(OUT, f));
}

let written = 0;
for (const post of posts) {
  const related = resolveRelated(post, posts);
  const body = cleanBody(post.body);
  const fm = serializeFrontMatter({
    title: post.title,
    slug: post.slug,
    date: post.date,
    description: post.description,
    keywords: post.keywords || [],
    tags: post.tags || [],
    author: post.author || "SamaHealth Team",
    category: post.category || "Public Health",
    image: post.image || "",
    imageAlt: post.imageAlt || "",
    sdg: post.sdg || [],
    related,
  });
  fs.writeFileSync(path.join(OUT, `${post.slug}.md`), `---\n${fm}---\n\n${body}\n`);
  written++;
}

console.log(`Wrote ${written} posts to ${path.relative(process.cwd(), OUT)}`);
const orphans = posts.filter((p) => resolveRelated(p, posts).length === 0);
if (orphans.length) console.log(`WARNING: ${orphans.length} posts have no related links:`, orphans.map((p) => p.slug));

// ---------------------------------------------------------------- helpers

function parseFrontMatter(fmLines) {
  const out = {};
  for (const line of fmLines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith("[")) {
      // flow sequence: ["a","b"] or [3, 5]
      try {
        out[key] = JSON.parse(val);
        continue;
      } catch {
        out[key] = val
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        continue;
      }
    }
    out[key] = val.replace(/^["']|["']$/g, "");
  }
  return out;
}

function extractRelatedTexts(body) {
  const m = body.match(/^\*Related:(.*)\*\s*$/m);
  if (!m) return [];
  const linkRe = /\[([^\]]+)\]\([^)]*\)/g;
  const out = [];
  let lm;
  while ((lm = linkRe.exec(m[1])) !== null) out.push(lm[1].trim());
  return out;
}

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function compact(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// Map a "Related" link text (often a shortened title) onto a real post slug.
function matchText(text, posts, selfSlug) {
  const t = compact(text);
  if (!t) return null;
  const cands = posts.filter((p) => p.slug !== selfSlug);
  let hit = cands.find((p) => compact(p.title) === t);
  if (!hit) hit = cands.find((p) => compact(p.title).startsWith(t) || t.startsWith(compact(p.title)));
  if (!hit) hit = cands.find((p) => compact(p.title).includes(t) || t.includes(compact(p.title)));
  if (!hit) {
    const ts = norm(text).replace(/\s+/g, "-");
    hit = cands.find((p) => p.slug === ts || p.slug.includes(ts) || ts.includes(p.slug));
  }
  return hit ? hit.slug : null;
}

function resolveRelated(post, posts) {
  const out = [];
  const seen = new Set([post.slug]);
  // 1. explicit in-body related links, resolved to slugs
  for (const text of post.relatedTexts || []) {
    const slug = matchText(text, posts, post.slug);
    if (slug && !seen.has(slug)) {
      out.push(slug);
      seen.add(slug);
    }
  }
  // 2. top up to 4 with shared tags / same category, newest first
  if (out.length < 4) {
    const tags = new Set(post.tags || []);
    const scored = posts
      .filter((p) => !seen.has(p.slug))
      .map((p) => {
        const shared = (p.tags || []).filter((t) => tags.has(t)).length;
        const cat = p.category === post.category ? 1 : 0;
        return { slug: p.slug, date: p.date || "", score: shared * 2 + cat };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1));
    for (const s of scored) {
      if (out.length >= 4) break;
      out.push(s.slug);
      seen.add(s.slug);
    }
  }
  return out;
}

function cleanBody(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/^\*Related:.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function serializeFrontMatter(obj) {
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) out += `${k}: ${JSON.stringify(v)}\n`;
    else out += `${k}: ${JSON.stringify(v ?? "")}\n`;
  }
  return out;
}
