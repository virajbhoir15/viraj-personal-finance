/*
 Viraj Personal Finance Centre - AI backend + Google Finance FX proxy
*/
const ALLOWED_ORIGIN = "https://virajbhoir15.github.io";
const MODEL = "@cf/google/gemma-4-26b-a4b-it";

function corsHeaders(origin, request) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:8788" || origin === "http://localhost:3000";
  const requestedHeaders = request && request.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": requestedHeaders || "Content-Type, X-Viraj-App-Token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, origin, request, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      {"Content-Type":"application/json; charset=utf-8"},
      corsHeaders(origin, request),
      extraHeaders || {}
    )
  });
}

function compactFinance(f) {
  return JSON.stringify(f || {}, null, 2).slice(0, 90000);
}

function extractAnswer(result) {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  if (typeof result.response === "string") return result.response.trim();
  if (result.result && typeof result.result.response === "string") return result.result.response.trim();
  if (result.choices && result.choices[0] && result.choices[0].message) {
    const content = result.choices[0].message.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content.map(x => typeof x === "string" ? x : (x && (x.text || x.content || ""))).join("").trim();
    }
  }
  if (Array.isArray(result.response)) {
    return result.response.map(x => typeof x === "string" ? x : (x && (x.text || x.content || ""))).join("").trim();
  }
  if (result.output_text && typeof result.output_text === "string") return result.output_text.trim();
  return "";
}

async function googleFxQuote() {
  const urls = [
    "https://www.google.com/finance/quote/EUR-INR?hl=en&gl=ie",
    "https://www.google.com/finance/quote/EUR-INR"
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VirajFinance/1.0; +https://virajbhoir15.github.io/viraj-personal-finance/)",
          "Accept": "text/html,application/xhtml+xml"
        },
        cf: { cacheTtl: 60, cacheEverything: true }
      });
      if (!r.ok) throw new Error("Google Finance HTTP " + r.status);
      const html = await r.text();

      const markerPatterns = [
        /EUR\\s*\\/\\s*INR/gi,
        /Euro\\s*\\/\\s*Indian\\s*Rupee/gi
      ];
      const candidates = [];
      for (const re of markerPatterns) {
        for (const m of html.matchAll(re)) {
          const start = Math.max(0, (m.index || 0) - 1000);
          const end = Math.min(html.length, (m.index || 0) + 16000);
          const context = html.slice(start, end);
          const nums = context.match(/\\b(?:10[0-9]|11[0-9])\\.[0-9]{4,6}\\b/g) || [];
          for (const raw of nums) {
            const value = Number(raw);
            if (Number.isFinite(value) && value >= 100 && value <= 120) {
              candidates.push({ value, distance: Math.abs((m.index || 0) - (start + context.indexOf(raw))) });
            }
          }
        }
      }

      const classMatches = html.match(/class="[^"]*(?:YMlKec|fxKbKc)[^"]*"[^>]*>\\s*([0-9]{2,3}\\.[0-9]{4,6})/gi) || [];
      for (const chunk of classMatches) {
        const m = chunk.match(/([0-9]{2,3}\\.[0-9]{4,6})/);
        if (m) {
          const value = Number(m[1]);
          if (Number.isFinite(value) && value >= 100 && value <= 120) {
            candidates.push({ value, distance: 999999 });
          }
        }
      }

      if (!candidates.length) throw new Error("Google Finance EUR/INR quote not found");
      candidates.sort((a,b) => a.distance - b.distance);
      const rate = candidates[0].value;
      return {
        ok: true,
        pair: "EUR-INR",
        rate,
        date: new Date().toISOString().slice(0,10),
        source: "Google Finance",
        url
      };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Google Finance quote unavailable");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {status:204, headers:corsHeaders(origin, request)});
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.replace(/\/$/,"") === "/fx/google") {
      try {
        const q = await googleFxQuote();
        return json(q,200,origin,request,{
          "Cache-Control":"public, max-age=60, s-maxage=60"
        });
      } catch (e) {
        return json({ok:false,error:String(e && e.message || e)},502,origin,request);
      }
    }

    if (request.method === "GET") {
      return json({
        ok:true,
        service:"viraj-finance-ai",
        provider:"cloudflare-workers-ai",
        model:MODEL,
        configured:!!env.AI
      },200,origin,request);
    }

    if (request.method !== "POST") {
      return json({error:"POST only"},405,origin,request);
    }

    if (origin && origin !== ALLOWED_ORIGIN && !origin.startsWith("http://localhost:")) {
      return json({error:"Origin not allowed"},403,origin,request);
    }

    if (!env.AI) {
      return json({error:"Cloudflare Workers AI binding is not configured on this Worker."},500,origin,request);
    }

    if (env.AI_SHARED_TOKEN) {
      const got = request.headers.get("X-Viraj-App-Token") || "";
      if (got !== env.AI_SHARED_TOKEN) {
        return json({error:"Unauthorized"},401,origin,request);
      }
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({error:"Invalid JSON"},400,origin,request);
    }

    const question = String(body.question || "").trim();
    if (!question) return json({error:"Question is required"},400,origin,request);

    const finance = compactFinance(body.finance);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const historyText = history.map(x => String(x.role || "user")+": "+String(x.text || "")).join("\n").slice(-8000);

    const instructions = [
      "You are Viraj's private personal finance copilot.",
      "Answer using the finance snapshot supplied in the user message. Treat those figures as the current app data, not as live bank data. The snapshot is the source of truth for this user: use accounts, card balances, transactions, monthly budgets/actuals, goals, recurring payments, net-worth history, education-loan model and tracker details together when relevant.",
      "Use EUR for Ireland cash-flow questions and INR for India/education-loan questions. Do not silently mix currencies.",
      "When a number is missing, say it is missing rather than inventing it. Never assume a credit-card purchase came from AIB cash: use the transaction account/source field and distinguish bank spending from credit-card spending.",
      "Be practical, concise, and explain calculations when useful.",
      "Format answers for a normal finance app user: do not use Markdown bold markers, headings with #, tables, or decorative symbols. Use short plain-text headings, short paragraphs, and simple bullet points using • when helpful.",
      "Keep answers easy to scan. Put the direct answer first, then the key numbers, then a short explanation or next step.",
      "For affordability, consider actual spendable EUR, recurring commitments and the €1,000 emergency reserve shown in the snapshot.",
      "For education-loan questions, distinguish the app's planning model from an official lender payoff quote.",
      "Do not claim to execute bank transfers, change loans, or access live accounts.",
      "This is financial planning support, not regulated financial advice.",
      "The finance snapshot may include liveFxEurInr. If the user asks for the current EUR/INR rate and liveFxEurInr is present, answer directly from that field and state its source/date. Do not replace it with the older fxEurInr reference field and do not say external research is needed when liveFxEurInr is present. If liveFxEurInr is absent, then say a live external lookup is needed. For other current external rates, laws, tax rules, products or market data, say that live external research is needed rather than pretending the private snapshot contains it."
    ].join("\n");

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          {role:"system",content:instructions},
          {role:"user",content:"PRIVATE FINANCE SNAPSHOT:\n"+finance+"\n\nRECENT CHAT:\n"+historyText+"\n\nUSER QUESTION:\n"+question}
        ],
        chat_template_kwargs:{enable_thinking:false}
      });

      const answer = extractAnswer(result);
      if (!answer) {
        return json({
          error:"Workers AI returned no readable text.",
          provider:"cloudflare-workers-ai",
          model:MODEL,
          responseShape:result && typeof result==="object"?Object.keys(result):typeof result
        },502,origin,request);
      }
      return json({answer,provider:"cloudflare-workers-ai",model:MODEL},200,origin,request);
    } catch (e) {
      return json({error:"Cloudflare Workers AI error: "+String(e && e.message || e)},502,origin,request);
    }
  }
};