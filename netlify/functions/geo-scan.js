// GEO Scan — "Can AI find your business?"
// Three actions, each a fast single call so we stay inside Netlify's 10s window:
//   probe  -> one web search, checks whether the business is cited for a buyer query
//   report -> no tools, writes the narrative + fixes from probe results
// Score is computed deterministically in JS (defensible, consistent), Claude writes the words.

const ALLOWED_ORIGIN = 'https://agentsatwork.co';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const clip = (s, n) => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

async function callClaude(body) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

function extractText(data) {
  if (!data || !Array.isArray(data.content)) return '';
  return data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in model output');
  return JSON.parse(clean.slice(start, end + 1));
}

// ---- action: probe ---------------------------------------------------------
async function probe(input) {
  const business = clip(input.business, 80);
  const website = clip(input.website, 100);
  const query = clip(input.query, 120);

  const data = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system:
      'You simulate an AI answer engine (like ChatGPT or Perplexity) responding to a local buyer query. ' +
      'Run exactly one web search for the query, then respond ONLY with JSON, no markdown fences, no preamble: ' +
      '{"cited":["names of up to 5 businesses/sites your answer would recommend or cite"],' +
      '"target_found":boolean (true only if the target business itself would be recommended or cited),' +
      '"evidence":"one short sentence on what the results show about the target\'s visibility"}',
    messages: [
      {
        role: 'user',
        content:
          `Buyer query: "${query}"\n` +
          `Target business: "${business}"${website ? ` (website: ${website})` : ''}\n` +
          `Search once, then output the JSON only.`,
      },
    ],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
  });

  const parsed = parseJSON(extractText(data));
  return {
    query,
    cited: Array.isArray(parsed.cited) ? parsed.cited.slice(0, 5).map((c) => clip(c, 60)) : [],
    target_found: !!parsed.target_found,
    evidence: clip(parsed.evidence, 200),
  };
}

// ---- action: report --------------------------------------------------------
function computeScore(probes) {
  // branded query is always probe[0]; category queries follow
  const weights = [35, 25, 25];
  let score = 15; // baseline for existing (having a findable web presence at all is checked below)
  let anyCitations = false;
  probes.forEach((p, i) => {
    if (p.target_found) score += weights[i] ?? 20;
    if (p.cited && p.cited.length) anyCitations = true;
  });
  if (!anyCitations) score = Math.min(score, 20);
  return Math.max(5, Math.min(100, score));
}

async function report(input) {
  const business = clip(input.business, 80);
  const location = clip(input.location, 80);
  const category = clip(input.category, 80);
  const probes = (Array.isArray(input.probes) ? input.probes : []).slice(0, 3).map((p) => ({
    query: clip(p.query, 120),
    cited: (Array.isArray(p.cited) ? p.cited : []).slice(0, 5).map((c) => clip(c, 60)),
    target_found: !!p.target_found,
    evidence: clip(p.evidence, 200),
  }));

  const score = computeScore(probes);

  const data = await callClaude({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system:
      'You write the results section of a GEO (Generative Engine Optimization) visibility scan for a small business owner. ' +
      'Plain UK English, direct, no hype, no jargon without explanation. ' +
      'Respond ONLY with JSON, no markdown fences: ' +
      '{"headline":"one blunt sentence stating what the scan found",' +
      '"summary":"2-3 sentences explaining what this means for the business in plain terms",' +
      '"fixes":[{"title":"short imperative","detail":"1-2 sentences, specific and actionable"} x3]}',
    messages: [
      {
        role: 'user',
        content:
          `Business: ${business} — ${category} in ${location}. Visibility score: ${score}/100.\n` +
          `Probe results (what AI answer engines cite for real buyer queries):\n` +
          JSON.stringify(probes, null, 2) +
          `\nWrite the headline, summary and exactly 3 fixes. Fixes should focus on: being citable by AI engines ` +
          `(structured data, consistent NAP, authoritative pages that answer buyer questions directly, reviews, ` +
          `being present on the sources engines actually cited above). Output JSON only.`,
      },
    ],
  });

  const parsed = parseJSON(extractText(data));
  return {
    score,
    headline: clip(parsed.headline, 160),
    summary: clip(parsed.summary, 500),
    fixes: (Array.isArray(parsed.fixes) ? parsed.fixes : []).slice(0, 3).map((f) => ({
      title: clip(f.title, 80),
      detail: clip(f.detail, 300),
    })),
    probes,
  };
}

// ---- handler ----------------------------------------------------------------
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  const origin = event.headers.origin || event.headers.Origin || '';
  if (origin && origin !== ALLOWED_ORIGIN) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  try {
    const input = JSON.parse(event.body || '{}');
    let result;
    if (input.action === 'probe') result = await probe(input);
    else if (input.action === 'report') result = await report(input);
    else return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Unknown action' }) };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
