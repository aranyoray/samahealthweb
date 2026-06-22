import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  description: string;
  keywords: string[];
  tags: string[];
  author: string;
  category: string;
  image: string;
  imageAlt: string;
  sdg: number[];
  related: string[];
};

export type Faq = { q: string; a: string };

export type Post = PostMeta & {
  body: string;
  html: string;
  faq: Faq[];
  readingMinutes: number;
};

marked.setOptions({ gfm: true, breaks: false });

function readRaw(slug: string) {
  return fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8");
}

function toMeta(slug: string, data: Record<string, unknown>): PostMeta {
  return {
    title: String(data.title ?? slug),
    slug: String(data.slug ?? slug),
    date: String(data.date ?? ""),
    description: String(data.description ?? ""),
    keywords: (data.keywords as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
    author: String(data.author ?? "SamaHealth Team"),
    category: String(data.category ?? "Public Health"),
    image: String(data.image ?? ""),
    imageAlt: String(data.imageAlt ?? ""),
    sdg: (data.sdg as number[]) ?? [],
    related: (data.related as string[]) ?? [],
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPostsMeta(): PostMeta[] {
  return getAllSlugs()
    .map((slug) => toMeta(slug, matter(readRaw(slug)).data))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPostBySlug(slug: string): Post {
  const { data, content } = matter(readRaw(slug));
  const meta = toMeta(slug, data);
  const html = marked.parse(content, { async: false }) as string;
  return {
    ...meta,
    body: content,
    html,
    faq: extractFaq(content),
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).length / 200)),
  };
}

// Resolve a post's `related` slugs to metadata, preserving order and dropping any
// that no longer exist; fall back to shared-tag matches if the list is short.
export function getRelatedMeta(meta: PostMeta, limit = 3): PostMeta[] {
  const all = getAllPostsMeta();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const seen = new Set<string>([meta.slug]);
  const out: PostMeta[] = [];

  for (const slug of meta.related) {
    const p = bySlug.get(slug);
    if (p && !seen.has(slug)) {
      out.push(p);
      seen.add(slug);
    }
  }
  if (out.length < limit) {
    const tags = new Set(meta.tags);
    const scored = all
      .filter((p) => !seen.has(p.slug))
      .map((p) => ({ p, score: p.tags.filter((t) => tags.has(t)).length + (p.category === meta.category ? 1 : 0) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1));
    for (const { p } of scored) {
      if (out.length >= limit) break;
      out.push(p);
      seen.add(p.slug);
    }
  }
  return out.slice(0, limit);
}

// Pull `**Question?**` / answer pairs out of a trailing `## FAQ` section.
export function extractFaq(body: string): Faq[] {
  const idx = body.search(/^##\s+FAQ\s*$/m);
  if (idx === -1) return [];
  let section = body.slice(idx).replace(/^##\s+FAQ\s*$/m, "");
  const next = section.search(/^##\s+/m);
  if (next !== -1) section = section.slice(0, next);

  const faq: Faq[] = [];
  let q: string | null = null;
  let a: string[] = [];
  const flush = () => {
    if (q && a.length) faq.push({ q, a: a.join(" ").trim() });
    q = null;
    a = [];
  };
  for (const line of section.split("\n")) {
    const qm = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (qm) {
      flush();
      q = qm[1].trim();
    } else if (line.trim() === "") {
      // keep accumulating across single blank lines only after a question
    } else if (q) {
      a.push(line.trim());
    }
  }
  flush();
  return faq;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SITE = "https://samahealth.in";

export function postJsonLd(post: Post) {
  const url = `${SITE}/blog/${post.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      isPartOf: { "@id": `${SITE}/blog#blog` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: post.title,
      name: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "en",
      isAccessibleForFree: true,
      articleSection: post.category,
      url,
      keywords: post.keywords,
      image: post.image
        ? { "@type": "ImageObject", url: `${SITE}${post.image}`, caption: post.imageAlt }
        : undefined,
      author: { "@type": "Organization", name: "SamaHealth", url: SITE },
      publisher: {
        "@type": "Organization",
        name: "SamaHealth",
        url: SITE,
        logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
      },
    },
  ];
  if (post.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  });
  return { "@context": "https://schema.org", "@graph": graph };
}
