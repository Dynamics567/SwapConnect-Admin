// Deterministic, rule-based scoring -- no AI call, computed instantly as the
// admin types. This is what sections 6/7 of the spec actually need (a live
// score + checklist); an AI-generated SEO/content assistant is a separate,
// later addition on top of this, not a replacement for it.

export interface ScoreCheck {
  label: string;
  pass: boolean;
}

export interface PostDraftForScoring {
  title: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  categoryId?: number | null;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function computeSeoChecks(post: PostDraftForScoring): ScoreCheck[] {
  const title = post.seoTitle || post.title || "";
  const description = post.seoDescription || post.excerpt || "";
  const text = stripHtml(post.content || "");
  const keyword = post.focusKeyword?.trim().toLowerCase();
  const hasInternalLink = /<a\s+[^>]*href=/i.test(post.content || "");

  return [
    { label: "Title is a good length (30–60 characters)", pass: title.length >= 30 && title.length <= 60 },
    { label: "Meta description is a good length (120–160 characters)", pass: description.length >= 120 && description.length <= 160 },
    {
      label: "Focus keyword appears in the title",
      pass: !!keyword && title.toLowerCase().includes(keyword),
    },
    {
      label: "Focus keyword appears in the content",
      pass: !!keyword && text.toLowerCase().includes(keyword),
    },
    { label: "Featured image has alt text", pass: !!post.coverImageUrl && !!post.coverImageAlt?.trim() },
    { label: "Content includes at least one link", pass: hasInternalLink },
    { label: "Content length is substantial (300+ words)", pass: wordCount(text) >= 300 },
  ];
}

export function computeSeoScore(post: PostDraftForScoring): { score: number; checks: ScoreCheck[] } {
  const checks = computeSeoChecks(post);
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { score, checks };
}

export function computeContentQualityChecks(post: PostDraftForScoring): ScoreCheck[] {
  const text = stripHtml(post.content || "");
  const hasHeading = /<h[23][^>]*>/i.test(post.content || "");

  return [
    { label: "Has a title", pass: !!post.title?.trim() },
    { label: "Has an excerpt/summary", pass: !!post.excerpt?.trim() },
    { label: "Content is substantial (300+ words)", pass: wordCount(text) >= 300 },
    { label: "Uses headings to structure the content", pass: hasHeading },
    { label: "Has a featured image", pass: !!post.coverImageUrl },
    { label: "Assigned to a category", pass: !!post.categoryId },
    { label: "SEO title and meta description are set", pass: !!post.seoTitle && !!post.seoDescription },
  ];
}

export function computeContentQualityScore(post: PostDraftForScoring): { score: number; checks: ScoreCheck[]; label: string } {
  const checks = computeContentQualityChecks(post);
  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  const label = score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 40 ? "Needs Work" : "Incomplete";
  return { score, checks, label };
}
