import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CHAT_SYSTEM, AUDIT_SYSTEM } from "./knowledge.js";

const MODEL = "claude-opus-5-5";
const MAX_CHAT_TURNS = 12;
const MAX_MESSAGE_CHARS = 1200;
const MAX_PAGE_BYTES = 1_500_000;
const TEXT_EXCERPT_CHARS = 12_000;
const LANGS = { en: "English", ms: "Bahasa Malaysia", zh: "Simplified Chinese" };

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);
    if (request.method === "GET" && pathname === "/health") return json({ ok: true }, 200, cors);
    if (request.method !== "POST") return json({ error: "Not found" }, 404, cors);
    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed" }, 403, cors);

    const ip = request.headers.get("CF-Connecting-IP") || "anon";
    try {
      if (pathname === "/chat") {
        if (!(await allowed(env.CHAT_LIMITER, ip))) return json({ error: "rate_limited" }, 429, cors);
        return json(await chat(await request.json(), env), 200, cors);
      }
      if (pathname === "/audit") {
        if (!(await allowed(env.AUDIT_LIMITER, ip))) return json({ error: "rate_limited" }, 429, cors);
        return json(await audit(await request.json(), env), 200, cors);
      }
      return json({ error: "Not found" }, 404, cors);
    } catch (err) {
      if (err instanceof UserError) return json({ error: err.message }, 400, cors);
      if (err instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 503, cors);
      if (err instanceof Anthropic.APIError) {
        console.error(`Claude API error ${err.status}:`, err.message);
        return json({ error: "ai_unavailable" }, 502, cors);
      }
      console.error(err);
      return json({ error: "server_error" }, 500, cors);
    }
  },
};

/* ── CHAT ── */

async function chat(body, env) {
  const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_CHAT_TURNS) : [];
  const messages = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1).role !== "user") throw new UserError("Send a question first.");

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    cache_control: { type: "ephemeral" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: CHAT_SYSTEM,
    messages,
  });

  if (response.stop_reason === "refusal") {
    return { reply: "I can't help with that one here, but you can WhatsApp us at +60 19-502 3897 and we'll take a look." };
  }
  const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  return { reply: reply || "Sorry, I didn't catch that. Could you rephrase?" };
}

/* ── AUDIT ── */

const Score = z.object({ score: z.number(), summary: z.string() });
const AuditSchema = z.object({
  overall_score: z.number(),
  verdict: z.string(),
  categories: z.object({
    clarity: Score,
    navigation: Score,
    mobile: Score,
    accessibility: Score,
    conversion: Score,
    seo: Score,
  }),
  issues: z.array(
    z.object({
      severity: z.enum(["high", "medium", "low"]),
      area: z.string(),
      problem: z.string(),
      fix: z.string(),
    }),
  ),
  quick_wins: z.array(z.string()),
});

async function audit(body, env) {
  const target = parseTarget(body?.url);
  const focus = ["general", "mobile", "conversion", "accessibility"].includes(body?.focus) ? body.focus : "general";
  const snapshot = await snapshotPage(target);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(AuditSchema) },
    system: AUDIT_SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `Audit this page. Give extra weight to: ${focus}.\n` +
          `List 4–8 issues, most important first, and 3–5 quick wins. ` +
          `Write all text in ${LANGS[body?.lang] || "English"}.\n\n` +
          `<page_snapshot>\n${JSON.stringify(snapshot, null, 2)}\n</page_snapshot>`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) throw new UserError("We couldn't review that page.");
  return { url: snapshot.final_url, facts: snapshot.facts, report: response.parsed_output };
}

function parseTarget(raw) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(String(raw || "").trim()) ? String(raw).trim() : `https://${String(raw || "").trim()}`);
  } catch {
    throw new UserError("That doesn't look like a website address.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) {
    throw new UserError("Please use a normal public website address.");
  }
  const host = url.hostname.toLowerCase();
  const privateHost =
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") ||
    !host.includes(".") || /^\[/.test(host) ||
    /^(0|10|127)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host);
  if (privateHost) throw new UserError("Please use a public website address.");
  return url;
}

async function snapshotPage(url) {
  let res;
  try {
    res = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "JonTech-UX-Check/1.0 (+https://jontech-solutions.com)", Accept: "text/html" },
    });
  } catch {
    throw new UserError("We couldn't reach that website. Check the address and try again.");
  }
  parseTarget(res.url); // re-check after redirects
  if (!res.ok) throw new UserError(`That website answered with an error (${res.status}).`);
  if (!(res.headers.get("content-type") || "").includes("html")) throw new UserError("That address isn't a web page.");

  const { html, truncated } = await readCapped(res, MAX_PAGE_BYTES);
  const facts = {
    https: res.url.startsWith("https://"),
    page_kb: Math.round(html.length / 1024),
    html_over_limit: truncated,
    title: "",
    meta_description: "",
    viewport: "",
    lang: "",
    og_image: false,
    favicon: false,
    headings: [],
    h1_count: 0,
    images: 0,
    images_missing_alt: 0,
    links: 0,
    empty_links: 0,
    buttons_and_ctas: [],
    forms: 0,
    inputs: 0,
    labels: 0,
    scripts: 0,
    stylesheets: 0,
    nav_present: false,
    footer_present: false,
    tel_or_whatsapp_link: false,
  };
  let visible = "";
  let skip = 0; // >0 while inside script/style/etc.
  const open = new Set(); // text collectors for elements currently being read

  const capture = (el, onDone) => {
    const buf = { text: "" };
    open.add(buf);
    el.onEndTag(() => { open.delete(buf); onDone(buf.text.replace(/\s+/g, " ").trim()); });
  };
  const pushCta = (t) => { if (t && facts.buttons_and_ctas.length < 25) facts.buttons_and_ctas.push(t.slice(0, 80)); };

  await new HTMLRewriter()
    .on("html", { element(el) { facts.lang = el.getAttribute("lang") || ""; } })
    .on("title", { element(el) { capture(el, (t) => { facts.title = t; }); } })
    .on('meta[name="description"]', { element(el) { facts.meta_description = el.getAttribute("content") || ""; } })
    .on('meta[name="viewport"]', { element(el) { facts.viewport = el.getAttribute("content") || ""; } })
    .on('meta[property="og:image"]', { element() { facts.og_image = true; } })
    .on('link[rel*="icon"]', { element() { facts.favicon = true; } })
    .on("h1, h2, h3", {
      element(el) {
        const tag = el.tagName.toLowerCase();
        if (tag === "h1") facts.h1_count++;
        capture(el, (t) => { if (t && facts.headings.length < 40) facts.headings.push(`${tag}: ${t.slice(0, 140)}`); });
      },
    })
    .on("img", { element(el) { facts.images++; if (!(el.getAttribute("alt") || "").trim()) facts.images_missing_alt++; } })
    .on("a", {
      element(el) {
        facts.links++;
        const href = el.getAttribute("href") || "";
        if (!href || href === "#") facts.empty_links++;
        if (/^(tel:|https:\/\/wa\.me|https:\/\/api\.whatsapp)/i.test(href)) facts.tel_or_whatsapp_link = true;
        if (/btn|button|cta/i.test(el.getAttribute("class") || "")) capture(el, pushCta);
      },
    })
    .on("button", { element(el) { capture(el, pushCta); } })
    .on("form", { element() { facts.forms++; } })
    .on("input, select, textarea", { element(el) { if ((el.getAttribute("type") || "") !== "hidden") facts.inputs++; } })
    .on("label", { element() { facts.labels++; } })
    .on("script", { element() { facts.scripts++; } })
    .on('link[rel="stylesheet"]', { element() { facts.stylesheets++; } })
    .on("nav", { element() { facts.nav_present = true; } })
    .on("footer", { element() { facts.footer_present = true; } })
    .on("br", { element() { if (skip > 0) return; for (const buf of open) buf.text += " "; visible += " "; } })
    .on("script, style, noscript, template, svg", { element(el) { skip++; el.onEndTag(() => { skip--; }); } })
    .onDocument({
      text(chunk) {
        if (skip > 0) return;
        for (const buf of open) buf.text += chunk.text;
        if (visible.length < TEXT_EXCERPT_CHARS * 2) visible += chunk.text;
      },
    })
    .transform(new Response(html))
    .text();

  visible = visible.replace(/\s+/g, " ").trim();
  return {
    final_url: res.url,
    facts,
    visible_text_excerpt: visible.slice(0, TEXT_EXCERPT_CHARS),
    visible_text_is_partial: visible.length > TEXT_EXCERPT_CHARS,
  };
}

async function readCapped(res, limit) {
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    if (size > limit) { truncated = true; await reader.cancel(); break; }
  }
  const all = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const c of chunks) {
    const part = c.subarray(0, Math.min(c.length, all.length - offset));
    all.set(part, offset);
    offset += part.length;
    if (offset >= all.length) break;
  }
  return { html: new TextDecoder().decode(all), truncated };
}

/* ── HELPERS ── */

class UserError extends Error {}

async function allowed(limiter, key) {
  if (!limiter) return true;
  const { success } = await limiter.limit({ key });
  return success;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowList = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allowList.includes(origin);
  return {
    ...(ok ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
