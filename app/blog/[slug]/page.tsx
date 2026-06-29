import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { RevealOnScroll } from "../../components/Reveal";
import {
  getAllSlugs,
  getPostBySlug,
  getRelatedMeta,
  formatDate,
  postJsonLd,
  type PostMeta,
} from "../../lib/blog";

const SITE = "https://samahealth.in";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    return {};
  }
  const url = `${SITE}/blog/${post.slug}`;
  return {
    title: `${post.title} | SamaHealth`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.imageAlt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const related = getRelatedMeta(post);
  const jsonLd = postJsonLd(post);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav variant="light" />
      <main id="main">
        <article>
          <header className="container" style={{ paddingTop: 120, paddingBottom: 8, maxWidth: 820 }}>
            <nav aria-label="Breadcrumb" className="mono" style={{ fontSize: 12, color: "var(--ink-400)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/" style={{ color: "var(--ink-400)" }}>Home</Link>
              <span aria-hidden>/</span>
              <Link href="/blog" style={{ color: "var(--ink-400)" }}>Blog</Link>
              <span aria-hidden>/</span>
              <span style={{ color: "var(--ink-500)" }}>{post.category}</span>
            </nav>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-400)" }}>
                {formatDate(post.date)} · {post.readingMinutes} min read
              </span>
            </div>

            <h1 style={{ marginTop: 18, fontSize: "clamp(32px, 5.2vw, 58px)" }}>{post.title}</h1>
            <p style={{ marginTop: 22, fontSize: 20, lineHeight: 1.5, color: "var(--ink-500)" }}>{post.description}</p>
          </header>

          <div className="container" style={{ maxWidth: 820, paddingTop: 32 }}>
            <hr className="divider" style={{ marginBottom: 40 }} />
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.html }} />

            <div style={{ marginTop: 48, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {post.tags.map((t) => (
                <span key={t} className="blog-tag">{t}</span>
              ))}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section" style={{ paddingTop: 80 }}>
            <div className="container">
              <h2 style={{ fontSize: "clamp(26px, 3.4vw, 38px)", marginBottom: 32 }}>Keep going</h2>
              <div className="grid grid-3">
                {related.map((p: PostMeta) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="card blog-card" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 28 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 10 }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--ink-400)", whiteSpace: "nowrap" }}>{formatDate(p.date)}</span>
                    </div>
                    <h3 style={{ fontSize: 20, lineHeight: 1.2 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--ink-500)", flex: 1 }}>{p.description}</p>
                    <span className="mono" style={{ fontSize: 12, color: "var(--brand)" }}>Read →</span>
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: 48 }}>
                <Link href="/blog" className="btn btn-ghost">← All entries</Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <RevealOnScroll />
    </>
  );
}
