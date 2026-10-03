/*
 Viraj Personal Finance Centre - secure AI backend
 Deploy this file as a Cloudflare Worker (or adapt it to another serverless runtime).
 Required Worker secret: OPENAI_API_KEY
 Optional Worker secret: AI_SHARED_TOKEN
*/
const ALLOWED_ORIGIN = "https://virajbhoir15.github.io";
const MODEL = "gpt-5-mini";

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:8788" || origin === "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, X-Viraj-App-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}
function json(body,status,origin){
  return new Response(JSON.stringify(body),{status,headers:Object.assign({"Content-Type":"application/json; charset=utf-8"},corsHeaders(origin))});
}
function compactFinance(f){
  return JSON.stringify(f||{},null,2).slice(0,30000);
}
export default {
 async fetch(request, env) {
  const origin=request.headers.get("Origin")||"";
  if(request.method==="OPTIONS")return new Response("",{status:204,headers:corsHeaders(origin)});
  if(request.method!=="POST")return json({error:"POST only"},405,origin);
  if(origin && origin!==ALLOWED_ORIGIN && !origin.startsWith("http://localhost:"))return json({error:"Origin not allowed"},403,origin);
  if(env.AI_SHARED_TOKEN){
    const got=request.headers.get("X-Viraj-App-Token")||"";
    if(got!==env.AI_SHARED_TOKEN)return json({error:"Unauthorized"},401,origin);
  }
  if(!env.OPENAI_API_KEY)return json({error:"OPENAI_API_KEY is not configured on the backend."},500,origin);
  let body;
  try{body=await request.json()}catch(e){return json({error:"Invalid JSON"},400,origin);}
  const question=String(body.question||"").trim();
  if(!question)return json({error:"Question is required"},400,origin);
  const finance=compactFinance(body.finance);
  const history=Array.isArray(body.history)?body.history.slice(-12):[];
  const historyText=history.map(x=>String(x.role||"user")+": "+String(x.text||"")).join("\n").slice(-8000);
  const instructions=[
    "You are Viraj's private personal finance copilot.",
    "Answer using the finance snapshot supplied in the user message. Treat those figures as the current app data, not as live bank data.",
    "Use EUR for Ireland cash-flow questions and INR for India/education-loan questions. Do not silently mix currencies.",
    "When a number is missing, say it is missing rather than inventing it.",
    "Be practical, concise, and explain calculations when useful.",
    "For affordability, consider the user's actual spendable EUR, recurring commitments and €1,000 reserve shown in the snapshot.",
    "For education-loan questions, clearly distinguish the app's planning model from an official lender payoff quote.",
    "Do not claim to execute bank transfers, change loans, or access live accounts.",
    "This is financial planning support, not regulated financial advice.",
    "If the user asks for current external rates, laws, tax rules, products or market data, say that live external research is needed rather than pretending the private snapshot contains it."
  ].join("\n");
  const input=[
    {role:"developer",content:instructions},
    {role:"user",content:"PRIVATE FINANCE SNAPSHOT:\n"+finance+"\n\nRECENT CHAT:\n"+historyText+"\n\nUSER QUESTION:\n"+question}
  ];
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,input:input,store:false,max_output_tokens:900})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)return json({error:(data&&data.error&&data.error.message)||"OpenAI request failed"},r.status,origin);
  let answer=data.output_text;
  if(!answer && Array.isArray(data.output)){
    answer=data.output.map(x=>Array.isArray(x.content)?x.content.map(c=>c.text||"").join(""):"").join("").trim();
  }
  return json({answer:answer||"No text answer was returned."},200,origin);
 }
};