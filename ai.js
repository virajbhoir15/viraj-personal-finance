(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var KEY_ENDPOINT="virajAIEndpoint";
var KEY_TOKEN="virajAIToken";
var KEY_HISTORY="virajAIHistory";
var DEFAULT_ENDPOINT="https://viraj-finance-ai.virajbhoir-ie.workers.dev";

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});}
function eur(n){return "€"+Number(n||0).toLocaleString("en-IE",{minimumFractionDigits:2,maximumFractionDigits:2});}
function inr(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});}
function num(n){return Number(n||0);}
function sumObj(o){return Object.values(o||{}).reduce(function(a,b){return a+num(b)},0);}

function getData(){try{return typeof data!=="undefined"?data:null}catch(e){return null}}
function recentMonths(){
 var d=getData(); if(!d||!d.months)return [];
 return Object.keys(d.months).sort().slice(-3).map(function(k){return {key:k,label:d.months[k].label,income:num(d.months[k].income),spend:sumObj(d.months[k].actual||{})}});
}
function spendable(){
 var d=getData(); if(!d)return 0;
 var accounts=Array.isArray(d.accounts)?d.accounts:[];
 return accounts.filter(function(a){return a.currency==="EUR" && !a.excludeFromSpendable}).reduce(function(a,b){return a+num(b.balance)},0);
}
function recurring(){
 var d=getData(); if(!d)return 0;
 return (d.recurring||[]).filter(function(x){return x.currency==="EUR"}).reduce(function(a,b){return a+num(b.amount)},0);
}
function loanInfo(){
 var d=getData(),l=d&&d.loan;
 if(!l)return null;
 var b=num(l.opening),rate=num(l.rate)/100,pay=num(l.payment),interestTotal=0,n=0,firstInterest=17967;
 while(b>.01&&n<240){
  var it=n===0?firstInterest:b*rate;
  var p=Math.min(pay,b+it);
  b=Math.max(0,b-(p-it)); interestTotal+=it; n++;
 }
 return {opening:num(l.opening),payment:pay,rate:num(l.rate),months:n,interest:interestTotal};
}
function goalInfo(){
 var d=getData(),g=d&&d.goals||[];
 return g.map(function(x){return {name:x.name,target:num(x.target),current:num(x.current),currency:x.currency||"EUR"}}).filter(function(x){return x.name});
}
function snapshot(){
 var d=getData()||{};
 var ms=recentMonths();
 var latest=ms.length?ms[ms.length-1]:null;
 var incomeMonths=ms.filter(function(x){return x.income>0;});
 var latestIncomeMonth=incomeMonths.length?incomeMonths[incomeMonths.length-1]:null;
 var spendMonths=ms.filter(function(x){return x.spend>0;});
 var latestSpendMonth=spendMonths.length?spendMonths[spendMonths.length-1]:null;
 var accounts=(d.accounts||[]).map(function(a){
   return {id:a.id,name:a.name,currency:a.currency,type:a.type,balance:num(a.balance),includeInSafeSpend:a.includeInSafeSpend!==false};
 });
 var tx=(d.transactions||[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,500).map(function(t){
   return {date:t.date,description:t.description,amount:num(t.amount),currency:t.currency,type:t.type,category:t.category,accountId:t.accountId,notes:t.notes};
 });
 var monthData=Object.keys(d.months||{}).sort().map(function(k){
   var m=d.months[k]||{};
   return {key:k,label:m.label,income:num(m.income),budget:m.budget||{},actual:m.actual||{},budgetTotal:sumObj(m.budget||{}),actualTotal:sumObj(m.actual||{})};
 });
 var detail=d.detail||{};
 var budgetAlerts=[];
 monthData.forEach(function(m){Object.keys(m.budget||{}).forEach(function(cat){var b=num(m.budget[cat]),x=num((m.actual||{})[cat]);if(b>0&&x>b)budgetAlerts.push({month:m.label,category:cat,over:num(x-b)});});});
 var goals=goalInfo();
 var safe=spendable()-recurring()-1000;
 var totalEUR=accounts.filter(function(a){return a.currency==="EUR"&&a.type!=="Credit Card"}).reduce(function(s,a){return s+a.balance},0);
 var savings=accounts.filter(function(a){return a.name==="AIB Savings"&&a.currency==="EUR"}).reduce(function(s,a){return s+a.balance},0);
 var current=accounts.filter(function(a){return a.name==="AIB Regular Account"&&a.currency==="EUR"}).reduce(function(s,a){return s+a.balance},0);
 return {
  asOf:new Date().toISOString(),
  currency:"EUR for Ireland cash flow; INR for India/education-loan planning",
  accounts:accounts,
  aibRegularEUR:current,
  aibSavingsEUR:savings,
  totalEURCash:totalEUR,
  spendableEUR:spendable(),
  recurringEUR:recurring(),
  safeToSpendEUR:safe,
  creditCard:d.creditCard||null,
  latestSalaryEUR:latestIncomeMonth?latestIncomeMonth.income:0,
  latestIncomeMonth:latestIncomeMonth,
  latestSpendMonth:latestSpendMonth,
  currentMonth:monthData.length?monthData[monthData.length-1]:null,
  recentMonths:ms,
  monthData:monthData,
  trackerDetail:detail,
  educationLoan:loanInfo(),
  goals:goals,
  netWorth:d.networth||[],
  netWorthHistory:d.networthHistory||[],
  recentTransactions:tx,
  recurringPayments:d.recurring||[],
  fxEurInr:d.settings&&d.settings.fxEurInr?num(d.settings.fxEurInr):100,
  monthlyAIBSaving:100,
  emergencyReserveEUR:1000,
  homeTargetINR:20000000,
  budgetAlerts:budgetAlerts,
  creditCardDueDays:(function(){var cd=d.creditCard||{};if(!cd.dueDate)return null;return Math.ceil((new Date(cd.dueDate+"T23:59:59").getTime()-Date.now())/86400000);})()
 };
}
function localAnswer(q){
 var s=q.toLowerCase(), snap=snapshot(), l=snap.educationLoan, latest=snap.recentMonths[snap.recentMonths.length-1];
 if(/safe|spend|spendable|available cash/.test(s)){
  var safe=snap.spendableEUR-snap.recurringEUR-snap.emergencyReserveEUR;
  return "Based on the accounts currently marked as spendable, you have "+eur(snap.spendableEUR)+" available. After recurring EUR commitments of "+eur(snap.recurringEUR)+" and keeping your €1,000 reserve, your current safe-to-spend figure is about "+eur(safe)+". This is a planning figure, not a bank balance forecast.";
 }
 if(/loan|education|repay|payoff/.test(s)&&l){
  return "Your education-loan model starts around "+inr(l.opening)+" with a planned "+inr(l.payment)+" monthly payment at "+l.rate+"% monthly. At that payment, the model takes about "+l.months+" months and models about "+inr(l.interest)+" of future interest. Actual lender figures can differ because daily accruals, payment dates and fees may apply.";
 }
 if(/this month|september|october|spend|spent/.test(s)&&latest){
  return "Your latest tracked month, "+latest.label+", shows income of "+eur(latest.income)+" and tracked spending of "+eur(latest.spend)+", leaving "+eur(latest.income-latest.spend)+" before considering other account-level movements.";
 }
 if(/save|saving|aib|emergency/.test(s)){
  var a=snap.goals.find(function(g){return /emergency/i.test(g.name)});
  return "Your plan currently includes €100/month going to AIB savings and a €1,000 cash reserve assumption. "+(a?"Emergency Fund is currently "+eur(a.current)+" of "+eur(a.target)+".":"");
 }
 if(/home|flat|mumbai|house|2 cr/.test(s)){
  return "Your Mumbai home goal is recorded as ₹2 Cr (₹20,000,000). The app can model down payment, purchase costs, available INR funds and a target date, but it should not be treated as a mortgage approval or property-price forecast.";
 }
 var m=q.match(/(?:can i afford|buy|purchase|spend)\D*([0-9]+(?:\.[0-9]+)?)/i);
 if(m){
  var amount=num(m[1]),after=snap.spendableEUR-amount;
  return "For a €"+amount.toFixed(2)+" purchase, spendable EUR would fall from "+eur(snap.spendableEUR)+" to about "+eur(after)+". With the €"+snap.emergencyReserveEUR+" reserve, the purchase would "+(after>=snap.emergencyReserveEUR?"stay above":"fall below")+" the reserve.";
 }
 return "I can already answer common questions from your stored finance data, but full free-form AI is not connected yet. Add your secure AI backend endpoint in Settings, then ask me anything such as “Can I afford €400?”, “How fast will I clear my education loan?”, “Where am I overspending?”, or “Can I save enough for my Mumbai flat?”";
}

function parseQuickFinanceCommand(q){
 var d=getData(); if(!d)return {handled:false};
 var s=String(q||"").trim(), low=s.toLowerCase();
 var nums=Array.from(s.matchAll(/(?:€|eur|euro|rs\.?|₹|inr)?\s*([0-9]{1,7}(?:[.,][0-9]{1,2})?)/ig)).map(function(x){return Number(String(x[1]).replace(/,/g,""))}).filter(function(x){return !(x>=1900&&x<=2100);});
 var amount=nums.length?nums[nums.length-1]:0;
 if(!amount)return {handled:false};
 var type=/\b(received|got paid|salary|income|refund|earned|credit(?:ed)?)\b/i.test(s)?"income":"expense";
 var category="Other";
 if(type==="income"){if(/salary|payday|pay/i.test(low))category="Salary";else if(/refund/i.test(low))category="Refund";else category="Other";}
 else if(/rent|landlord|house rent/i.test(low))category="Rent";
 else if(/grocery|groceries|shopping|lidl|dunnes|aldi|tesco|supermarket|food shopping/i.test(low))category="Grocery";
 else if(/bill|electric|electricity/i.test(low))category="Bills";
 else if(/gym/i.test(low))category="Gym";
 else if(/skin|skincare/i.test(low))category="Skincare";
 else if(/mrcpi|exam/i.test(low))category="MRCPI";
 else if(/donat/i.test(low))category="Donation";
 else if(/family|mum|mom|mother|home/i.test(low))category="Family";

 var date=new Date(), targetMonth=date.toISOString().slice(0,7);
 var monthNames=["january","february","march","april","may","june","july","august","september","october","november","december"];
 monthNames.forEach(function(name,i){if(low.indexOf(name)>-1||low.indexOf(name.slice(0,3))>-1){targetMonth=date.getFullYear()+"-"+String(i+1).padStart(2,"0");}});
 var yearMatch=low.match(/\b(20\d{2})\b/);
 if(yearMatch&&targetMonth){targetMonth=targetMonth.slice(0,5)+yearMatch[1].slice(0,4);}
 var dateText=targetMonth+"-"+String(Math.min(date.getDate(),28)).padStart(2,"0");
 if(/yesterday/i.test(low)){var y=new Date(date);y.setDate(y.getDate()-1);dateText=y.toISOString().slice(0,10);targetMonth=dateText.slice(0,7);}
 if(/today|now/i.test(low)){dateText=date.toISOString().slice(0,10);targetMonth=dateText.slice(0,7);}

 var accountId="";
 if(/credit card|creditcard|avant|card/i.test(low))accountId="avant-card";
 else if(/aib savings|savings/i.test(low))accountId="aib-savings";
 else if(/aib|regular account|bank account/i.test(low))accountId="aib-regular";
 else if(type==="income")accountId="aib-regular";
 else accountId="aib-regular";

 var m=d.months&&d.months[targetMonth];
 if(!m){return {handled:false,reason:"I can add this only when "+targetMonth+" exists in your monthly tracker. Add that month first."};}
 var desc=type==="income"?(category==="Salary"?"Salary":"Income"):category;
 var tx={id:"ai-"+Date.now().toString(36),date:dateText,description:desc,amount:amount,currency:"EUR",type:type,category:category,accountId:accountId,notes:"Added via Finance AI"};
 d.transactions=d.transactions||[];
 d.transactions.push(tx);
 m.actual=m.actual||{};
 if(type==="expense")m.actual[category]=Number(m.actual[category]||0)+amount;
 if(type==="income")m.income=Number(m.income||0)+amount;
 var acc=(d.accounts||[]).find(function(a){return a.id===accountId});
 if(acc){if(type==="expense")acc.balance=Number(acc.balance||0)+(acc.type==="Credit Card"?amount:-amount);else acc.balance=Number(acc.balance||0)+amount;}
 if(accountId==="avant-card"){d.creditCard=d.creditCard||{};d.creditCard.balance=Number(acc?acc.balance:d.creditCard.balance||0);}
 try{localStorage.setItem("virajFinance",JSON.stringify(d));}catch(e){}
 window.data=d;
 if(typeof window.show==="function")window.show("dashboard");
 return {handled:true,type:type,amount:amount,category:category,date:dateText,month:targetMonth,account:acc?acc.name:"Unassigned"};
}

function loadHistory(){try{return JSON.parse(localStorage.getItem(KEY_HISTORY)||"[]")}catch(e){return []}}
function saveHistory(h){localStorage.setItem(KEY_HISTORY,JSON.stringify(h.slice(-40)))}

function formatAIText(s){
 var t=esc(s);
 t=t.replace(/\*\*(.*?)\*\*/g,"$1");
 t=t.replace(/^#{1,6}\s*/gm,"");
 t=t.replace(/^\s*[-•]\s+/gm,"• ");
 t=t.replace(/^\s*\*\s+/gm,"• ");
 t=t.replace(/\*+/g,"");
 t=t.replace(/\n{3,}/g,"\n\n");
 return t.replace(/\n/g,"<br>");
}
function renderChat(){
 var box=$("vAIChat"); if(!box)return;
 var h=loadHistory();
 if(!h.length){
  box.innerHTML='<div class="vaiEmpty"><div class="vaiRobot">🤖</div><b>Your personal Finance AI</b><p>Ask about your cash, spending, education loan, savings, credit card, goals or a purchase. Answers can use the numbers stored in this app.</p></div>';
  return;
 }
 box.innerHTML=h.map(function(x){return '<div class="vaiMsg '+(x.role==="user"?"user":"assistant")+'"><div class="vaiBubble">'+formatAIText(x.text)+'</div></div>'}).join("");
 box.scrollTop=box.scrollHeight;
}
async function ask(){
 var input=$("vAIInput"),btn=$("vAISend"),q=(input&&input.value||"").trim();
 if(!q)return;
 input.value=""; btn.disabled=true;
 var quick=parseQuickFinanceCommand(q);
 if(quick.handled){
  var msg="Added to "+new Date(quick.date+"T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"})+": "+(quick.type==="income"?"income":"expense")+" "+eur(quick.amount)+" · "+quick.category+" · "+quick.account+". Dashboard updated.";
  var qh=loadHistory(); qh.push({role:"user",text:q},{role:"assistant",text:msg}); saveHistory(qh); renderChat(); btn.disabled=false; if(input)input.focus(); return;
 }
 if(quick.reason){
  var rh=loadHistory(); rh.push({role:"user",text:q},{role:"assistant",text:quick.reason}); saveHistory(rh); renderChat(); btn.disabled=false; if(input)input.focus(); return;
 }
 var h=loadHistory(); h.push({role:"user",text:q}); saveHistory(h); renderChat();
 var pending=$("vAIPending"); if(pending)pending.style.display="block";
 try{
  var endpoint=(localStorage.getItem(KEY_ENDPOINT)||DEFAULT_ENDPOINT).trim();
  var token=(localStorage.getItem(KEY_TOKEN)||"").trim();
  var answer;
  if(endpoint){
   var res=await fetch(endpoint,{method:"POST",headers:Object.assign({"Content-Type":"application/json"},token?{"X-Viraj-App-Token":token}:{}),body:JSON.stringify({question:q,finance:snapshot(),history:h.slice(-12)})});
   var body=await res.json().catch(function(){return {}}); 
   if(!res.ok)throw new Error(body.error||"AI backend returned HTTP "+res.status);
   answer=body.answer||body.output_text||"The AI backend returned no answer.";
  }else{
   answer=localAnswer(q);
  }
  h=loadHistory(); h.push({role:"assistant",text:answer}); saveHistory(h); renderChat();
 }catch(e){
  h=loadHistory(); h.push({role:"assistant",text:"I could not reach the AI backend: "+e.message+" You can still use the built-in finance calculations, or check the AI endpoint in Settings."}); saveHistory(h); renderChat();
 }finally{
  if(pending)pending.style.display="none";
  btn.disabled=false; if(input)input.focus();
 }
}
function clearChat(){localStorage.removeItem(KEY_HISTORY);renderChat();}

function inject(){
 if($("vAISection"))return;
 var style=document.createElement("style");
 style.textContent=".vaiLayout{display:grid;grid-template-columns:1.5fr .5fr;gap:15px}.vaiChat{height:480px;overflow:auto;padding:8px;background:#f8fafc;border-radius:14px}.vaiMsg{display:flex;margin:9px 0}.vaiMsg.user{justify-content:flex-end}.vaiBubble{max-width:82%;padding:11px 13px;border-radius:14px;background:#fff;border:1px solid #e5e7eb;line-height:1.45}.vaiMsg.user .vaiBubble{background:#4f46e5;color:#fff;border-color:#4f46e5}.vaiEmpty{text-align:center;padding:70px 25px;color:#667085}.vaiRobot{font-size:38px;margin-bottom:8px}.vaiComposer{display:flex;gap:8px;margin-top:10px}.vaiComposer input{flex:1}.vaiPending{display:none;color:#667085;font-size:12px;margin:8px}.vaiChips{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.vaiChip{background:#eef2ff;color:#3730a3;border:0}.vaiMini{padding:12px;border-radius:12px;background:#f8fafc;margin:9px 0;font-size:12px}.vaiMini b{display:block;font-size:18px;margin-top:3px}@media(max-width:900px){.vaiLayout{grid-template-columns:1fr}.vaiChat{height:400px}}";
 document.head.appendChild(style);

 var nav=document.querySelector(".nav");
 if(nav){
  var nb=document.createElement("button"); nb.id="vAINav"; nb.textContent="🤖 Finance AI";
  nb.onclick=function(){if(typeof show==="function")show("ai",nb);else document.getElementById("ai").classList.add("on");};
  nav.appendChild(nb);
 }
 var main=document.querySelector("main"); if(!main)return;
 var sec=document.createElement("section"); sec.id="ai"; sec.className="view";
 sec.innerHTML='<div id="vAISection"><div class="card hero"><h2 style="margin:0">🤖 Finance AI Copilot</h2><p class="muted">Ask questions using your actual finance data. The AI receives a compact snapshot of your balances, spending, goals and loan model.</p></div><div class="vaiLayout" style="margin-top:15px"><div class="card"><div class="sectionTitle"><h3>Ask anything about your money</h3><button onclick="vAIClear()">Clear chat</button></div><div id="vAIChat" class="vaiChat"></div><div class="vaiPending" id="vAIPending">Thinking about your numbers…</div><div class="vaiChips"><button class="vaiChip" onclick="vAIPrompt(this)">Can I afford €400?</button><button class="vaiChip" onclick="vAIPrompt(this)">How fast can I clear my education loan?</button><button class="vaiChip" onclick="vAIPrompt(this)">Where am I overspending?</button><button class="vaiChip" onclick="vAIPrompt(this)">How much can I safely spend?</button></div><div class="vaiComposer"><input id="vAIInput" placeholder="Try: “I paid rent €650 today” or “Add €42 Lidl to October on credit card”…"><button id="vAISend" class="primary" onclick="vAIAsk()">Ask AI</button></div><div class="hint" style="margin-top:8px">Quick entry: Finance AI can add simple income or expenses directly to your ledger and refresh the dashboard. If you mention “credit card”, it uses Avant; otherwise expenses use AIB Regular Account.</div></div><div><div class="card"><h3>Live finance context</h3><div id="vAIStats"></div></div><div class="card" style="margin-top:15px"><h3>AI connection</h3><p class="muted small">For true free-form AI, point this app at the secure backend. Never put an OpenAI API key here.</p><div><label>AI backend URL</label><input id="vAIEndpoint" placeholder="https://your-worker.example.workers.dev"></div><div style="margin-top:9px"><label>Backend access token (optional)</label><input id="vAIToken" type="password" placeholder="Shared app token"></div><button class="primary" style="margin-top:10px" onclick="vAISaveConfig()">Save AI connection</button><div id="vAIConfigStatus" class="muted small" style="margin-top:8px"></div></div></div></div></div>';
 main.appendChild(sec);
 var settings=document.getElementById("settings");
 if(settings){
  var card=settings.querySelector(".card");
  if(card){
   var box=document.createElement("div"); box.className="driveBox"; box.innerHTML='<b>🤖 Finance AI backend</b><div class="driveStatus">The AI Copilot can use the same finance data stored by this app. Configure the endpoint here after deploying the secure backend.</div><div style="margin-top:8px"><input id="vAIEndpointSettings" placeholder="AI backend URL"></div><button class="primary" style="margin-top:8px" onclick="localStorage.setItem(\"virajAIEndpoint\",document.getElementById(\"vAIEndpointSettings\").value.trim());toast(\"AI endpoint saved\")">Save AI endpoint</button>'; card.appendChild(box);
  }
 }
}

function renderStats(){
 var s=snapshot(), el=$("vAIStats"); if(!el)return;
 var l=s.educationLoan, latest=s.recentMonths[s.recentMonths.length-1];
 el.innerHTML='<div class="vaiMini">AIB Regular<b>'+eur(s.aibRegularEUR)+'</b></div><div class="vaiMini">AIB Savings<b>'+eur(s.aibSavingsEUR)+'</b></div><div class="vaiMini">Spendable EUR<b>'+eur(s.spendableEUR)+'</b></div><div class="vaiMini">Safe to spend<b>'+eur(s.safeToSpendEUR)+'</b></div><div class="vaiMini">Latest income<b>'+eur(s.latestSalaryEUR)+'</b></div><div class="vaiMini">Latest spend<b>'+eur(latest?latest.spend:0)+'</b></div><div class="vaiMini">Loan balance<b>'+inr(l?l.opening:0)+'</b></div>';
 var ep=localStorage.getItem(KEY_ENDPOINT)||DEFAULT_ENDPOINT;
 var e=$("vAIEndpoint"); if(e)e.value=ep;
 var es=$("vAIEndpointSettings"); if(es)es.value=ep;
 var t=$("vAIToken"); if(t)t.value=localStorage.getItem(KEY_TOKEN)||"";
 var cs=$("vAIConfigStatus"); if(cs)cs.textContent=ep?"AI backend configured.":"Built-in finance answers are active; full AI is awaiting a backend URL.";
}
function saveConfig(){
 var e=($("vAIEndpoint")&&$("vAIEndpoint").value||"").trim(),t=($("vAIToken")&&$("vAIToken").value||"").trim();
 if(e&&!/^https?:\/\//i.test(e))return alert("Enter a valid HTTPS backend URL.");
 localStorage.setItem(KEY_ENDPOINT,e); if(t)localStorage.setItem(KEY_TOKEN,t); else localStorage.removeItem(KEY_TOKEN);
 renderStats(); if(typeof toast==="function")toast("AI connection saved");
}
window.vAIAsk=ask; window.vAIClear=clearChat; window.vAISaveConfig=saveConfig;
window.vAIPrompt=function(b){var i=$("vAIInput");if(i){i.value=b.textContent;i.focus()}};
function boot(){inject();renderChat();renderStats();var i=$("vAIInput");if(i)i.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();ask()}});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();