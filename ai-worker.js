/*
 Viraj Personal Finance Centre - free AI backend
 Uses Cloudflare Workers AI, so no OpenAI API key or paid OpenAI credits are required.
 Cloudflare currently provides a free Workers AI allocation of 10,000 Neurons/day.
*/
const ALLOWED_ORIGIN = "https://virajbhoir15.github.io";
const MODEL = "@cf/google/gemma-4-26b-a4b-it";

function corsHeaders(origin, request) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:8788" || origin === "http://localhost:3000";
  const requestedHeaders = request && request.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": requestedHeaders || "Content-Type, X-Viraj-App-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, origin, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      {"Content-Type": "application/json; charset=utf-8"},
      corsHeaders(origin, request)
    )
  });
}

function compactFinance(f) {
  return JSON.stringify(f || {}, null, 2).slice(0, 30000);
}

function extractAnswer(result) {
  if (typeof result === "string") return result;
  if (result && typeof result.response === "string") return result.response;
  if (result && result.result && typeof result.result.response === "string") return result.result.response;
  if (result && Array.isArray(result.response)) {
    return result.response.map(x => typeof x === "string" ? x : (x && (x.text || x.content || ""))).join("").trim();
  }
  return "";
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {status: 204, headers: corsHeaders(origin, request)});
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        service: "viraj-finance-ai",
        provider: "cloudflare-workers-ai",
        model: MODEL,
        configured: !!env.AI
      }, 200, origin, request);
    }

    if (request.method !== "POST") {
      return json({error: "POST only"}, 405, origin, request);
    }

    if (origin && origin !== ALLOWED_ORIGIN && !origin.startsWith("http://localhost:")) {
      return json({error: "Origin not allowed"}, 403, origin, request);
    }

    if (!env.AI) {
      return json({error: "Cloudflare Workers AI binding is not configured on this Worker."}, 500, origin, request);
    }

    if (env.AI_SHARED_TOKEN) {
      const got = request.headers.get("X-Viraj-App-Token") || "";
      if (got !== env.AI_SHARED_TOKEN) {
        return json({error: "Unauthorized"}, 401, origin, request);
      }
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({error: "Invalid JSON"}, 400, origin, request);
    }

    const question = String(body.question || "").trim();
    if (!question) {
      return json({error: "Question is required"}, 400, origin, request);
    }

    const finance = compactFinance(body.finance);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const historyText = history
      .map(x => String(x.role || "user") + ": " + String(x.text || ""))
      .join("\n")
      .slice(-8000);

    const instructions = [
      "You are Viraj's private personal finance copilot.",
      "Answer using the finance snapshot supplied in the user message. Treat those figures as the current app data, not as live bank data.",
      "Use EUR for Ireland cash-flow questions and INR for India/education-loan questions. Do not silently mix currencies.",
      "When a number is missing, say it is missing rather than inventing it.",
      "Be practical, concise, and explain calculations when useful.",
      "For affordability, consider actual spendable EUR, recurring commitments and the €1,000 emergency reserve shown in the snapshot.",
      "For education-loan questions, distinguish the app's planning model from an official lender payoff quote.",
      "Do not claim to execute bank transfers, change loans, or access live accounts.",
      "This is financial planning support, not regulated financial advice.",
      "If the user asks for current external rates, laws, tax rules, products or market data, say that live external research is needed rather than pretending the private snapshot contains it."
    ].join("\n");

    const prompt = instructions +
      "\n\nPRIVATE FINANCE SNAPSHOT:\n" + finance +
      "\n\nRECENT CHAT:\n" + historyText +
      "\n\nUSER QUESTION:\n" + question;

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          {role: "system", content: instructions},
          {role: "user", content: "PRIVATE FINANCE SNAPSHOT:\n" + finance + "\n\nRECENT CHAT:\n" + historyText + "\n\nUSER QUESTION:\n" + question}
        ],
        chat_template_kwargs: {enable_thinking: false}
      });

      const answer = extractAnswer(result);
      return json({
        answer: answer || "No text answer was returned.",
        provider: "cloudflare-workers-ai",
        model: MODEL
      }, 200, origin, request);
    } catch (e) {
      return json({
        error: "Cloudflare Workers AI error: " + String(e && e.message || e)
      }, 502, origin, request);
    }
  }
};
