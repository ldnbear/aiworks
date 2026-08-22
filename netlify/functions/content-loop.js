// Content Loop Agent — runs hourly on Netlify's scheduler.
// Advances ONE small step per invocation (each step = 1 fast model call + a couple of
// GitHub API calls) so every run fits inside the function timeout.
//
// Pipeline: idle -> topic -> outline -> draft(1..3) -> publish-PR -> idle
// State lives in content/state.json on the `agent-state` branch (no deploys triggered).
// Output: a pull request against main. Merging the PR = human approval = live post.
//
// Env: GITHUB_TOKEN (fine-grained, Contents+PR read/write on ldnbear/aiworks),
//      ANTHROPIC_API_KEY (already set).

const REPO = 'ldnbear/aiworks';
const STATE_BRANCH = 'agent-state';
const STATE_PATH = 'content/state.json';
const MANIFEST_PATH = 'content/posts.json';
const SITE = 'https://agentsatwork.co';
const CYCLE_HOURS = 72; // start a new post roughly twice a week

const FOCUS_AREAS = [
  'GEO / AI visibility: how UK small businesses get recommended by ChatGPT, Perplexity and Gemini',
  'Practical AI automation for a specific UK SME sector (hospitality, trades, clinics, retail, professional services)',
  'AI tools comparisons and honest buying guidance for UK small businesses',
  'Case-style walkthroughs: what an AI agent can actually do for a small business week to week',
];

// ---------- GitHub helpers ----------
async function gh(path, opts = {}) {
  const r = await fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!r.ok && r.status !== 404 && r.status !== 422) {
    throw new Error('GitHub ' + r.status + ' on ' + path + ': ' + (await r.text()).slice(0, 200));
  }
  return r;
}
const b64e = (s) => Buffer.from(s, 'utf8').toString('base64');
const b64d = (s) => Buffer.from(s, 'base64').toString('utf8');

async function getFile(path, ref) {
  const r = await gh(`/repos/${REPO}/contents/${path}?ref=${ref}`);
  if (r.status === 404) return null;
  const d = await r.json();
  return { sha: d.sha, text: b64d(d.content) };
}
async function putFile(path, branch, text, message, sha) {
  const body = { message, branch, content: b64e(text) };
  if (sha) body.sha = sha;
  const r = await gh(`/repos/${REPO}/contents/${path}`, { method: 'PUT', body: JSON.stringify(body) });
  return r.json();
}
async function ensureBranch(name, fromBranch) {
  const r = await gh(`/repos/${REPO}/git/ref/heads/${name}`);
  if (r.status !== 404) return;
  const base = await (await gh(`/repos/${REPO}/git/ref/heads/${fromBranch}`)).json();
  await gh(`/repos/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'refs/heads/' + name, sha: base.object.sha }),
  });
}

// ---------- Claude helper ----------
async function claude(model, system, user, maxTokens) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  });
  const d = await r.json();
  return (d.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}
function pj(text) {
  const c = text.replace(/```json|```/g, '').trim();
  const s = c.indexOf('{');
  const e = c.lastIndexOf('}');
  return JSON.parse(c.slice(s, e + 1));
}

// ---------- State ----------
async function loadState() {
  await ensureBranch(STATE_BRANCH, 'main');
  const f = await getFile(STATE_PATH, STATE_BRANCH);
  if (!f) return { state: { step: 'idle', lastCompleted: 0 }, sha: null };
  return { state: JSON.parse(f.text), sha: f.sha };
}
async function saveState(state, sha) {
  await putFile(STATE_PATH, STATE_BRANCH, JSON.stringify(state, null, 2), 'agent: ' + state.step, sha || undefined);
}

// ---------- Post template ----------
function postHTML(p) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-LHZZMMVRMJ"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LHZZMMVRMJ');</script>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(p.title)} | AIWorks</title>
  <meta name="description" content="${esc(p.description)}">
  <link rel="canonical" href="${SITE}/blog/${p.slug}.html">
  <meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${SITE}/blog/${p.slug}.html">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description,
    datePublished: p.date, dateModified: p.date,
    author: { '@type': 'Organization', name: 'AIWorks' },
    publisher: { '@type': 'Organization', name: 'AIWorks', url: SITE },
    mainEntityOfPage: SITE + '/blog/' + p.slug + '.html',
  })}</script>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root{--hero-bg:#0B1A10;--bg:#F9F7F3;--surface:#FFF;--border:#E8E3DA;--ink:#1A1814;--mid:#7A7568;--dim:#B8B2A8;--green:#1F6644;--green-bg:#EAF2ED;--green-line:rgba(31,102,68,.22)}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Geist',sans-serif;font-weight:300;background:var(--bg);color:var(--ink);line-height:1.75}
    a{color:var(--green)}
    nav{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;max-width:1180px;margin:0 auto;background:var(--hero-bg)}
    nav{background:transparent;border-bottom:1px solid var(--border)}
    .logo{font-family:'Instrument Serif',serif;font-size:1.3rem;color:var(--ink);text-decoration:none}
    .logo span{color:var(--green);font-style:italic}
    .nav-a{font-size:.82rem;color:var(--mid);text-decoration:none}
    article{max-width:680px;margin:0 auto;padding:56px 24px 40px}
    .meta{font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--green);margin-bottom:16px}
    h1{font-family:'Instrument Serif',serif;font-weight:400;font-size:clamp(2rem,5vw,2.9rem);line-height:1.15;margin-bottom:18px}
    .standfirst{font-size:1.08rem;color:var(--mid);margin-bottom:36px}
    h2{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.55rem;margin:40px 0 14px}
    p{margin-bottom:18px}
    ul,ol{margin:0 0 18px 22px}
    li{margin-bottom:8px}
    strong{font-weight:500}
    .cta{background:var(--hero-bg);color:#fff;border-radius:16px;padding:36px 28px;text-align:center;max-width:680px;margin:24px auto 72px}
    .cta h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:1.5rem;margin-bottom:10px}
    .cta p{color:rgba(255,255,255,.7);max-width:440px;margin:0 auto 20px;font-size:.95rem}
    .cta a{display:inline-block;background:#fff;color:var(--hero-bg);font-weight:500;padding:12px 24px;border-radius:999px;text-decoration:none}
    footer{border-top:1px solid var(--border);padding:26px 24px;text-align:center;font-size:.8rem;color:var(--dim)}
    footer a{color:var(--mid);text-decoration:none}
  </style>
</head>
<body>
<nav>
  <a class="logo" href="/">ai<span>works</span></a>
  <span><a class="nav-a" href="/blog/">&larr; All articles</a></span>
</nav>
<article>
  <p class="meta">${p.dateDisplay} &middot; AIWorks</p>
  <h1>${esc(p.title)}</h1>
  <p class="standfirst">${esc(p.description)}</p>
  ${p.body}
</article>
<div class="cta">
  <h3>Can AI find your business?</h3>
  <p>When customers ask ChatGPT or Perplexity for recommendations, do you come up? Find out in 60 seconds &mdash; free.</p>
  <a href="/geo-scan.html">Run the free GEO scan &rarr;</a>
</div>
<footer>&copy; AIWorks &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/contact.html">Contact</a></footer>
</body>
</html>`;
}

// ---------- Steps ----------
async function stepTopic(state) {
  const manifest = await getFile(MANIFEST_PATH, 'main');
  const past = manifest ? JSON.parse(manifest.text).map((x) => x.title) : [];
  const focus = FOCUS_AREAS[(state.cycleCount || 0) % FOCUS_AREAS.length];
  const out = pj(await claude(
    'claude-sonnet-4-6',
    'You plan blog content for AIWorks (agentsatwork.co), which helps UK small businesses use AI. Audience: non-technical UK SME owners. Respond ONLY with JSON: {"title":"specific, useful, search-intent title (not clickbait)","slug":"kebab-case-slug","description":"140-160 char meta description","angle":"2-3 sentences on the specific argument and what makes it worth reading"}',
    `Focus area: ${focus}\nAlready published (do not repeat): ${past.join('; ') || 'none'}\nToday: ${new Date().toISOString().slice(0, 10)}. Pick ONE strong topic.`,
    400
  ));
  return { ...state, step: 'outline', post: { title: out.title, slug: out.slug.replace(/[^a-z0-9-]/g, ''), description: out.description, angle: out.angle } };
}

async function stepOutline(state) {
  const out = pj(await claude(
    'claude-sonnet-4-6',
    'You outline practical blog posts for UK small business owners. Respond ONLY with JSON: {"sections":[{"heading":"...","points":["...","..."]} x4-5]}',
    `Title: ${state.post.title}\nAngle: ${state.post.angle}\nOutline 4-5 sections. Concrete, practical, UK context, no fluff.`,
    500
  ));
  return { ...state, step: 'draft', draftIndex: 0, outline: out.sections, chunks: [] };
}

async function stepDraft(state) {
  const i = state.draftIndex;
  const sec = state.outline[i];
  const prev = state.chunks.length ? 'Previous section ended: ...' + state.chunks[state.chunks.length - 1].slice(-250) : 'This is the opening section — start with a strong 2-3 sentence intro before the first heading.';
  const html = await claude(
    'claude-haiku-4-5-20251001',
    'You write one section of a blog post for UK small business owners. Plain UK English, direct, practical, no hype. Output ONLY the HTML for this section: an <h2> heading then <p>/<ul>/<ol> content. 150-250 words. No <html>, <head>, <article> or markdown fences.',
    `Post: ${state.post.title}\nAngle: ${state.post.angle}\nThis section: ${sec.heading}\nCover: ${sec.points.join('; ')}\nContinuity: ${prev}`,
    700
  );
  const chunks = [...state.chunks, html.trim()];
  const nextIndex = i + 1;
  if (nextIndex >= state.outline.length) return { ...state, step: 'publish', chunks };
  return { ...state, step: 'draft', draftIndex: nextIndex, chunks };
}

async function stepPublish(state) {
  const now = new Date();
  const p = {
    ...state.post,
    date: now.toISOString().slice(0, 10),
    dateDisplay: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    body: state.chunks.join('\n'),
  };
  const branch = 'post/' + p.slug;
  await ensureBranch(branch, 'main');

  // post file
  await putFile(`blog/${p.slug}.html`, branch, postHTML(p), 'agent: draft post — ' + p.title);

  // manifest
  const mf = await getFile(MANIFEST_PATH, branch);
  const list = mf ? JSON.parse(mf.text) : [];
  list.unshift({ slug: p.slug, title: p.title, description: p.description, date: p.date });
  await putFile(MANIFEST_PATH, branch, JSON.stringify(list, null, 2), 'agent: update manifest', mf ? mf.sha : undefined);

  // sitemap
  const sm = await getFile('sitemap.xml', branch);
  if (sm && !sm.text.includes(`/blog/${p.slug}.html`)) {
    const entry = `  <url><loc>${SITE}/blog/${p.slug}.html</loc><lastmod>${p.date}</lastmod></url>\n</urlset>`;
    await putFile('sitemap.xml', branch, sm.text.replace('</urlset>', entry), 'agent: sitemap', sm.sha);
  }

  // PR = approval queue. This step MUST succeed: if it does not, the draft sits on a
  // branch with nobody notified. So we throw, leaving state at "publish" to retry next run.
  const prRes = await gh(`/repos/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'New post ready for review: ' + p.title,
      head: branch,
      base: 'main',
      body: `**${p.title}**\n\n${p.description}\n\n---\nDrafted by the content agent. **Merging this PR publishes the post** to ${SITE}/blog/${p.slug}.html, adds it to the blog index and sitemap. Close the PR to reject.\n\nPreview the full HTML in the Files changed tab.`,
    }),
  });

  if (!prRes.ok) {
    const detail = (await prRes.text()).slice(0, 300);
    // 422 usually means a PR for this head already exists. Verify before giving up.
    const owner = REPO.split('/')[0];
    const openPrs = await (await gh(`/repos/${REPO}/pulls?state=open&head=${owner}:${branch}`)).json();
    if (!Array.isArray(openPrs) || openPrs.length === 0) {
      throw new Error('PR creation failed (' + prRes.status + '): ' + detail);
    }
  }

  return { step: 'idle', lastCompleted: Date.now(), cycleCount: (state.cycleCount || 0) + 1, lastPublished: { slug: p.slug, title: p.title, date: p.date }, lastError: null };
}

// ---------- Handler ----------
exports.handler = async function () {
  try {
    const { state, sha } = await loadState();
    let next = null;

    if (state.step === 'idle') {
      const due = Date.now() - (state.lastCompleted || 0) > CYCLE_HOURS * 3600 * 1000;
      if (!due) return { statusCode: 200, body: 'idle — next cycle not due' };
      next = await stepTopic(state);
    } else if (state.step === 'outline') next = await stepOutline(state);
    else if (state.step === 'draft') next = await stepDraft(state);
    else if (state.step === 'publish') next = await stepPublish(state);
    else next = { step: 'idle', lastCompleted: state.lastCompleted || 0, cycleCount: state.cycleCount || 0 };

    await saveState(next, sha);
    return { statusCode: 200, body: 'advanced: ' + state.step + ' -> ' + next.step };
  } catch (err) {
    // Record the failure in state.json so a stalled agent is visible without reading logs.
    try {
      const s = await loadState();
      await saveState({ ...s.state, lastError: err.message, lastErrorAt: new Date().toISOString() }, s.sha);
    } catch (e2) { /* state write also failed; nothing further we can do */ }
    return { statusCode: 500, body: 'agent error: ' + err.message };
  }
};
