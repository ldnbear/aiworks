// Content loop — background worker (up to 15 min).
// Phase 1 (publish): any Airtable rows with Status=Approved get rendered,
//   committed to the repo (post page + blog index + manifest + sitemap in ONE
//   git commit via the trees API), then marked Published.
// Phase 2 (generate): if fewer than 2 Pending drafts, research + write one new
//   post with web search and add it to the queue as Pending.
// Nothing is ever published without a human flipping Status to Approved.

const BASE = 'appJ4hjTx63s80pzH';
const TABLE = 'Content Queue';
const REPO = 'ldnbear/aiworks';
const SITE = 'https://agentsatwork.co';

// ---------- Airtable ----------
const at = (path, opts = {}) =>
  fetch('https://api.airtable.com/v0/' + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.AIRTABLE_TOKEN,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

async function ensureTable() {
  const probe = await at(`${BASE}/${encodeURIComponent(TABLE)}?maxRecords=1`);
  if (probe.ok) return 'exists';
  const create = await at(`meta/bases/${BASE}/tables`, {
    method: 'POST',
    body: JSON.stringify({
      name: TABLE,
      fields: [
        { name: 'Title', type: 'singleLineText' },
        { name: 'Slug', type: 'singleLineText' },
        { name: 'MetaDescription', type: 'multilineText' },
        { name: 'Body', type: 'multilineText' },
        { name: 'Status', type: 'singleSelect', options: { choices: [
          { name: 'Pending' }, { name: 'Approved' }, { name: 'Published' }, { name: 'Rejected' } ] } },
        { name: 'PublishedURL', type: 'url' },
        { name: 'Notes', type: 'multilineText' },
      ],
    }),
  });
  if (!create.ok) throw new Error('Could not create Content Queue table (does AIRTABLE_TOKEN have schema.bases:write scope?): ' + (await create.text()).slice(0, 300));
  return 'created';
}

async function listRecords() {
  const r = await at(`${BASE}/${encodeURIComponent(TABLE)}?pageSize=100`);
  if (!r.ok) throw new Error('Airtable list failed: ' + (await r.text()).slice(0, 200));
  return (await r.json()).records || [];
}

// ---------- Claude ----------
async function claude(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!Array.isArray(data.content)) throw new Error('Claude error: ' + JSON.stringify(data).slice(0, 300));
  return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const s = clean.indexOf('{'); const e = clean.lastIndexOf('}');
  if (s === -1) throw new Error('No JSON from model');
  return JSON.parse(clean.slice(s, e + 1));
}

// ---------- GitHub (single-commit publish via trees API) ----------
const gh = (path, opts = {}) =>
  fetch('https://api.github.com/' + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

async function ghJson(path, opts) {
  const r = await gh(path, opts);
  if (!r.ok) throw new Error(`GitHub ${path} -> ${r.status}: ` + (await r.text()).slice(0, 200));
  return r.json();
}

async function readRepoFile(path) {
  const d = await ghJson(`repos/${REPO}/contents/${path}?ref=main`);
  return Buffer.from(d.content, 'base64').toString('utf8');
}

async function commitFiles(files, message) {
  const ref = await ghJson(`repos/${REPO}/git/ref/heads/main`);
  const headSha = ref.object.sha;
  const headCommit = await ghJson(`repos/${REPO}/git/commits/${headSha}`);
  const tree = await ghJson(`repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: headCommit.tree.sha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
    }),
  });
  const commit = await ghJson(`repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  });
  await ghJson(`repos/${REPO}/git/refs/heads/main`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });
  return commit.sha;
}

// ---------- Templates (match site design system) ----------
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HEAD_COMMON = `<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<style>
:root{--hero-bg:#0B1A10;--bg:#F9F7F3;--surface:#FFFFFF;--border:#E8E3DA;--ink:#1A1814;--mid:#7A7568;--dim:#B8B2A8;--green:#1F6644;--green-bg:#EAF2ED;--green-line:rgba(31,102,68,.22)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Geist',sans-serif;font-weight:300;background:var(--bg);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
nav{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;max-width:1180px;margin:0 auto}
.logo{font-family:'Instrument Serif',serif;font-size:1.5rem;color:#fff}.logo span{color:#7FB89A;font-style:italic}
.nav-a{font-size:.85rem;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.1);padding:8px 16px;border-radius:999px}
.hero{background:var(--hero-bg);color:#fff;padding-bottom:64px}
.hero-inner{max-width:760px;margin:0 auto;padding:48px 24px 0}
.eyebrow{font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:#7FB89A}
h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(2rem,5vw,3rem);line-height:1.15;margin:14px 0 12px}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
footer{border-top:1px solid var(--border);padding:28px 24px;text-align:center;font-size:.8rem;color:var(--dim);margin-top:64px}
footer a{color:var(--mid)}
</style>`;

function postPage(p) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LHZZMMVRMJ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LHZZMMVRMJ');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)} | AIWorks</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${SITE}/blog/${p.slug}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${SITE}/blog/${p.slug}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: p.date, author: { '@type': 'Organization', name: 'AIWorks' }, publisher: { '@type': 'Organization', name: 'AIWorks', url: SITE } })}</script>
${HEAD_COMMON}
<style>
.post{padding:40px 0}
.post h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.6rem;margin:36px 0 12px}
.post h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.25rem;margin:28px 0 10px}
.post p{margin:0 0 18px;color:#3a362e}
.post ul,.post ol{margin:0 0 18px 22px;color:#3a362e}
.post li{margin-bottom:8px}
.meta{font-family:'DM Mono',monospace;font-size:.75rem;color:rgba(255,255,255,.5);margin-top:10px}
.cta{background:var(--green-bg);border:1px solid var(--green-line);border-radius:14px;padding:26px;margin-top:48px}
.cta h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.3rem;margin:0 0 8px}
.cta p{font-size:.92rem;color:var(--mid);margin-bottom:14px}
.cta a{display:inline-block;background:var(--green);color:#fff;font-weight:500;padding:11px 20px;border-radius:999px;font-size:.9rem;margin-right:10px}
.cta a.alt{background:transparent;color:var(--green);border:1px solid var(--green-line)}
</style>
</head>
<body>
<header class="hero">
  <nav><a class="logo" href="/">ai<span>works</span></a><a class="nav-a" href="/blog/">All posts &rarr;</a></nav>
  <div class="hero-inner">
    <p class="eyebrow">AIWorks blog</p>
    <h1>${esc(p.title)}</h1>
    <p class="meta">${p.date} &middot; AIWorks</p>
  </div>
</header>
<main class="wrap post">
${p.body}
<div class="cta">
  <h2>Is your business visible to AI?</h2>
  <p>Your customers are asking ChatGPT and Perplexity for recommendations. Run our free 60-second scan and see whether the engines cite you &mdash; or your competitors.</p>
  <a href="/geo-scan.html">Run the free GEO scan &rarr;</a><a class="alt" href="/#waitlist">Join the waitlist</a>
</div>
</main>
<footer>&copy; AIWorks &middot; <a href="/blog/">Blog</a> &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/contact.html">Contact</a></footer>
</body>
</html>`;
}

function indexPage(posts) {
  const cards = posts.map((p) => `    <a class="card" href="/blog/${p.slug}">
      <div class="card-date">${p.date}</div>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
      <span class="more">Read &rarr;</span>
    </a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LHZZMMVRMJ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LHZZMMVRMJ');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog — practical AI for UK small businesses | AIWorks</title>
<meta name="description" content="Practical, hype-free guides on AI tools, AI visibility (GEO) and automation for UK small businesses, from AIWorks.">
<link rel="canonical" href="${SITE}/blog/">
${HEAD_COMMON}
<style>
.list{padding:48px 0;display:grid;gap:18px}
.card{display:block;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:26px;transition:box-shadow .2s}
.card:hover{box-shadow:0 2px 24px rgba(0,0,0,.07)}
.card h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.35rem;margin:6px 0 8px}
.card p{font-size:.92rem;color:var(--mid)}
.card-date{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--dim);letter-spacing:.08em}
.more{display:inline-block;margin-top:12px;font-size:.85rem;font-weight:500;color:var(--green)}
</style>
</head>
<body>
<header class="hero">
  <nav><a class="logo" href="/">ai<span>works</span></a><a class="nav-a" href="/geo-scan.html">Free GEO scan &rarr;</a></nav>
  <div class="hero-inner">
    <p class="eyebrow">The AIWorks blog</p>
    <h1>Practical AI for UK small businesses</h1>
  </div>
</header>
<main class="wrap list">
${cards}
</main>
<footer>&copy; AIWorks &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/contact.html">Contact</a></footer>
</body>
</html>`;
}

function sitemapXml(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = [
    { loc: SITE + '/', pri: '1.0', freq: 'weekly' },
    { loc: SITE + '/geo-scan.html', pri: '0.9', freq: 'monthly' },
    { loc: SITE + '/blog/', pri: '0.8', freq: 'weekly' },
    { loc: SITE + '/privacy', pri: '0.3', freq: 'yearly' },
    { loc: SITE + '/contact', pri: '0.4', freq: 'yearly' },
  ];
  const urls = staticUrls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`)
    .concat(posts.map((p) => `  <url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

// ---------- Phases ----------
async function publishApproved(records, log) {
  const approved = records.filter((r) => r.fields.Status === 'Approved');
  if (!approved.length) { log.push('publish: nothing approved'); return; }

  let manifest;
  try { manifest = JSON.parse(await readRepoFile('blog/posts.json')); }
  catch { manifest = []; }

  const today = new Date().toISOString().slice(0, 10);
  const files = [];
  for (const rec of approved) {
    const f = rec.fields;
    const slug = String(f.Slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug || !f.Title || !f.Body) { log.push(`publish: skipped ${rec.id} (missing fields)`); continue; }
    const post = { title: f.Title, slug, description: f.MetaDescription || '', date: today, body: f.Body };
    files.push({ path: `blog/${slug}.html`, content: postPage(post) });
    manifest = manifest.filter((m) => m.slug !== slug);
    manifest.unshift({ title: post.title, slug, description: post.description, date: today });
    rec._publishedUrl = `${SITE}/blog/${slug}`;
  }
  if (!files.length) return;

  files.push({ path: 'blog/posts.json', content: JSON.stringify(manifest, null, 2) + '\n' });
  files.push({ path: 'blog/index.html', content: indexPage(manifest) });
  files.push({ path: 'sitemap.xml', content: sitemapXml(manifest) });

  const sha = await commitFiles(files, `Agent: publish ${files.length - 3} approved post(s)`);
  log.push(`publish: committed ${sha.slice(0, 8)}`);

  for (const rec of approved.filter((r) => r._publishedUrl)) {
    await at(`${BASE}/${encodeURIComponent(TABLE)}/${rec.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: { Status: 'Published', PublishedURL: rec._publishedUrl } }),
    });
    log.push(`publish: live -> ${rec._publishedUrl}`);
  }
}

async function generateDraft(records, log) {
  const pending = records.filter((r) => r.fields.Status === 'Pending').length;
  if (pending >= 2) { log.push(`generate: ${pending} pending, skipping`); return; }

  const existing = records.map((r) => r.fields.Title).filter(Boolean);
  let manifest = [];
  try { manifest = JSON.parse(await readRepoFile('blog/posts.json')); } catch {}
  const allTitles = existing.concat(manifest.map((m) => m.title));

  const raw = await claude({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `You write for the AIWorks blog: practical, hype-free AI guidance for UK small business owners (hospitality, trades, clinics, professional services, retail). Plain UK English. Specific and actionable, no filler. You may use web search (max 3) to ground the post in current facts.
Respond ONLY with JSON, no fences: {"title":"...","slug":"lowercase-hyphenated","meta_description":"under 155 chars","body_html":"the post body as clean HTML using only <h2>,<h3>,<p>,<ul>,<ol>,<li>,<strong> — 900-1200 words, no <h1>, no inline styles, no invented statistics or fake client stories"}`,
    messages: [{ role: 'user', content: `Write one new post. Strong angles: AI visibility / GEO (can AI find your business), a practical "how to use AI for X" for one UK SME sector, or an honest tool comparison. Avoid these existing titles: ${JSON.stringify(allTitles)}. Search first if the topic benefits from current facts, then output the JSON only.` }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
  });

  const d = parseJSON(raw);
  const create = await at(`${BASE}/${encodeURIComponent(TABLE)}`, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields: {
      Title: d.title, Slug: d.slug, MetaDescription: d.meta_description,
      Body: d.body_html, Status: 'Pending',
      Notes: 'Drafted by content agent ' + new Date().toISOString(),
    } }] }),
  });
  if (!create.ok) throw new Error('Airtable create failed: ' + (await create.text()).slice(0, 200));
  log.push(`generate: new draft "${d.title}" -> Pending (approve in Airtable to publish)`);
}

// ---------- Handler ----------
exports.handler = async function (event) {
  if ((event.headers['x-cron-secret'] || event.headers['X-Cron-Secret']) !== process.env.CRON_SECRET) {
    return { statusCode: 401, body: 'unauthorized' };
  }
  const log = [];
  try {
    log.push('table: ' + (await ensureTable()));
    const records = await listRecords();
    await publishApproved(records, log);
    await generateDraft(records, log);
    console.log('content-worker OK:', JSON.stringify(log));
    return { statusCode: 200, body: JSON.stringify({ ok: true, log }) };
  } catch (e) {
    log.push('ERROR: ' + e.message);
    console.error('content-worker FAILED:', JSON.stringify(log));
    return { statusCode: 500, body: JSON.stringify({ ok: false, log }) };
  }
};
