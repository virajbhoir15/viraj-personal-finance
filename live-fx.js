/* Viraj Finance — live Google Finance EUR/INR + readable interactive history */
(function(){
"use strict";
var PROXY="https://viraj-finance-ai.virajbhoir-ie.workers.dev/fx/google";
var HISTORY="https://api.frankfurter.dev/v2/providers/ecb/rates";
var FALLBACK=108.8450;
var cached=Number(localStorage.getItem("virajGoogleFxRate")||0);
var rate=(cached>=100&&cached<=120)?cached:FALLBACK;
var liveDate=localStorage.getItem("virajGoogleFxDate")||"2026-10-04";
var source=localStorage.getItem("virajGoogleFxSource")||"Google Finance";
var range="1Y",busy=false,series={};

function N(v){var n=Number(v);return isFinite(n)?n:0}
function money(v,cur){return (cur==="EUR"?"€":"₹")+N(v).toLocaleString(cur==="EUR"?"en-IE":"en-IN",{minimumFractionDigits:cur==="EUR"?2:0,maximumFractionDigits:cur==="EUR"?2:0})}
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]})}
function iso(d){return d.toISOString().slice(0,10)}
function css(){
 if(document.getElementById("virajFxCSS"))return;
 var s=document.createElement("style");s.id="virajFxCSS";s.textContent=
 ".virajFxCard{overflow:hidden}.fxHeadActions{display:flex;align-items:center;gap:8px}.fxGoogleBadge{font-size:10px;font-weight:900;color:#3157d5;background:#eef2ff;border-radius:999px;padding:6px 9px}.virajFxLiveDot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#16a34a;margin-right:5px;box-shadow:0 0 0 3px #dcfce7}.virajFxHero{display:flex;align-items:center;gap:12px;padding:14px;background:linear-gradient(135deg,#edf4ff,#f7f0ff,#effcfb);border:1px solid #dfe6f7;border-radius:14px;margin-bottom:12px}.fxCurrencyIcon{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#3157d5,#7c3aed);font-size:25px;font-weight:950}.fxHeroMain{flex:1;min-width:0}.virajFxRate{font-size:25px;font-weight:950;letter-spacing:-.03em}.virajFxMeta{font-size:10px;color:#697386;margin-top:3px}.virajFxGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.virajFxGrid label{display:block;font-size:11px;font-weight:800;color:#697386;margin-bottom:5px}.virajFxInput{display:flex;align-items:center;border:1px solid #d9dee7;border-radius:10px;background:#fff;overflow:hidden}.virajFxInput span{padding-left:11px;font-weight:900;color:#697386}.virajFxInput input{border:0!important;width:100%;background:#fff}.fxConvertRow{display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:12px;border-top:1px solid #e7eaf0}.fxConvertRow b{font-size:20px}.fxInverse{font-size:10px;color:#7b8494;margin-top:4px}.fxHistory{border-top:1px solid #e7eaf0;margin-top:17px;padding-top:13px}.fxHistoryTop{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}.fxRangeTabs{display:flex;gap:4px;flex-wrap:wrap}.fxRangeTabs button{min-width:38px;border:1px solid #dce2eb;background:#fff;border-radius:8px;padding:7px 8px;font-size:10px;font-weight:850;color:#667085}.fxRangeTabs button.active{background:#3157d5;color:#fff;border-color:#3157d5}.fxGraph{height:250px;margin-top:10px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;position:relative;overflow:hidden}.fxGraph svg{width:100%;height:100%;display:block;touch-action:none}.fxGrid{stroke:#e6ebf2;stroke-width:1}.fxCross{stroke:#3157d5;stroke-width:1.5;stroke-dasharray:5 5;opacity:0}.fxFocus{fill:#3157d5;opacity:0}.fxTooltip{position:absolute;top:10px;transform:translateX(-50%);display:none;background:#172033;color:#fff;border-radius:9px;padding:7px 9px;text-align:center;pointer-events:none;box-shadow:0 8px 22px #1720332a;z-index:2}.fxTooltip.show{display:block}.fxTooltip b{display:block;font-size:12px}.fxTooltip span{display:block;font-size:9px;color:#d8deea;margin-top:2px}.fxAxis{position:absolute;left:8px;top:9px;bottom:9px;display:flex;flex-direction:column;justify-content:space-between;font-size:9px;color:#8a93a3;pointer-events:none}.fxStats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px}.fxStats div{border:1px solid #e6eaf2;background:#fff;border-radius:9px;padding:8px}.fxStats small{display:block;font-size:8px;color:#8992a1;font-weight:850}.fxStats b{font-size:12px;display:block;margin-top:3px}.fxNote{font-size:10px;color:#7b8494;line-height:1.45;margin-top:8px}@media(max-width:700px){.virajFxRate{font-size:21px}.fxHeadActions .fxGoogleBadge{display:none}.virajFxGrid{grid-template-columns:1fr}.fxHistoryTop{display:block}.fxRangeTabs{display:grid;grid-template-columns:repeat(3,1fr);margin-top:8px}.fxRangeTabs button{min-width:0}.fxGraph{height:230px}.fxStats{grid-template-columns:1fr 1fr}.fxGoogleLink{display:none}}";
 document.head.appendChild(s)
}
function rangeCfg(k){
 var now=new Date(),from=new Date(now),group="";
 if(k==="1D")from.setDate(from.getDate()-1);
 else if(k==="1W")from.setDate(from.getDate()-7);
 else if(k==="1M")from.setMonth(from.getMonth()-1);
 else if(k==="3M")from.setMonth(from.getMonth()-3);
 else if(k==="6M")from.setMonth(from.getMonth()-6);
 else if(k==="YTD")from=new Date(now.getFullYear(),0,1);
 else if(k==="1Y")from.setFullYear(from.getFullYear()-1);
 else if(k==="5Y"){from.setFullYear(from.getFullYear()-5);group="week"}
 else {from=new Date("1999-01-04T00:00:00");group="month"}
 return {from:iso(from),to:iso(now),group:group}
}
function histUrl(cfg){var u=HISTORY+"?from="+encodeURIComponent(cfg.from)+"&to="+encodeURIComponent(cfg.to)+"&quotes=INR";if(cfg.group)u+="&group="+cfg.group;return u}
function draw(points){
 var box=document.getElementById("virajFxGraph");if(!box||!points.length)return;
 var w=1000,h=300,p=38,vals=points.map(function(x){return x.rate}),min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),pad=Math.max((max-min)*.08,.03);min-=pad;max+=pad;
 function pt(q,i){return {x:p+(i/(Math.max(points.length-1,1)))*(w-p*2),y:p+(1-(q.rate-min)/(max-min))*(h-p*2)}}
 var d=points.map(function(q,i){var z=pt(q,i);return(i?"L":"M")+z.x.toFixed(2)+" "+z.y.toFixed(2)}).join(" ");
 var last=pt(points[points.length-1],points.length-1),mid=(min+max)/2;
 box.innerHTML='<svg id="virajFxSvg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><defs><linearGradient id="fxLg" x1="0" x2="1"><stop offset="0" stop-color="#3157d5"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient><linearGradient id="fxArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3157d5" stop-opacity=".22"/><stop offset="1" stop-color="#3157d5" stop-opacity=".02"/></linearGradient></defs>'+
  '<line class="fxGrid" x1="'+p+'" y1="'+p+'" x2="'+(w-p)+'" y2="'+p+'"/><line class="fxGrid" x1="'+p+'" y1="'+(h/2)+'" x2="'+(w-p)+'" y2="'+(h/2)+'"/><line class="fxGrid" x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'"/>'+
  '<path d="'+d+" L "+last.x.toFixed(2)+" "+(h-p)+" L "+p+" "+(h-p)+" Z"+'" fill="url(#fxArea)"/><path class="fxLine" d="'+d+'" fill="none" stroke="url(#fxLg)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><line id="fxCross" class="fxCross" x1="'+last.x+'" x2="'+last.x+'" y1="'+p+'" y2="'+(h-p)+'"/><circle id="fxFocus" class="fxFocus" cx="'+last.x+'" cy="'+last.y+'" r="5"/><rect id="fxHit" x="'+p+'" y="'+p+'" width="'+(w-p*2)+'" height="'+(h-p*2)+'" fill="transparent"/></svg><div class="fxAxis"><span>₹'+max.toFixed(2)+'</span><span>₹'+mid.toFixed(2)+'</span><span>₹'+min.toFixed(2)+'</span></div><div id="fxTip" class="fxTooltip"></div>';
 var hit=box.querySelector("#fxHit"),cross=box.querySelector("#fxCross"),focus=box.querySelector("#fxFocus"),tip=box.querySelector("#fxTip"),svg=box.querySelector("#virajFxSvg");
 function move(e){var r=svg.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),idx=Math.round(x*(points.length-1)),q=points[idx],z=pt(q,idx),date=new Date(q.date+"T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"});cross.setAttribute("x1",z.x);cross.setAttribute("x2",z.x);cross.setAttribute("opacity","1");focus.setAttribute("cx",z.x);focus.setAttribute("cy",z.y);focus.setAttribute("opacity","1");tip.style.left=(x*100)+"%";tip.innerHTML="<b>₹"+q.rate.toFixed(4)+"</b><span>"+esc(date)+"</span>";tip.classList.add("show")}
 hit.addEventListener("pointermove",move);hit.addEventListener("pointerdown",function(e){try{hit.setPointerCapture(e.pointerId)}catch(_){}move(e)});hit.addEventListener("pointerleave",function(){if(!("ontouchstart" in window)){tip.classList.remove("show");cross.setAttribute("opacity","0");focus.setAttribute("opacity","0")}})
 var first=points[0].rate,lastRate=points[points.length-1].rate,hi=Math.max.apply(null,vals),lo=Math.min.apply(null,vals);
 document.getElementById("fxStart").textContent="₹"+first.toFixed(4);document.getElementById("fxHigh").textContent="₹"+hi.toFixed(4);document.getElementById("fxLow").textContent="₹"+lo.toFixed(4);document.getElementById("fxChange").textContent=((lastRate/first-1)*100>=0?"+":"")+((lastRate/first-1)*100).toFixed(2)+"%";
}
function history(k,force){var c=document.getElementById("virajFxCard");if(!c)return;if(!force&&series[k]){draw(series[k]);return}var cfg=rangeCfg(k);fetch(histUrl(cfg),{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("history");return r.json()}).then(function(rows){var pts=(rows||[]).filter(function(x){return x&&x.date&&N(x.rate)>0}).map(function(x){return{date:x.date,rate:N(x.rate)}}).sort(function(a,b){return a.date.localeCompare(b.date)});if(!pts.length)throw Error("history");series[k]=pts;draw(pts)}).catch(function(){var g=document.getElementById("virajFxGraph");if(g)g.innerHTML='<div style="height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#7b8494;font-size:11px">Historical data is temporarily unavailable.<br>The live Google Finance quote remains available.</div>'})}
function refresh(){
 if(busy||!navigator.onLine)return;busy=true;
 fetch(PROXY+"?pair=EUR-INR",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("quote");return r.json()}).then(function(x){var v=N(x.rate);if(v<100||v>120)throw Error("invalid quote");rate=v;source="Google Finance";liveDate=x.date||iso(new Date());localStorage.setItem("virajGoogleFxRate",String(rate));localStorage.setItem("virajGoogleFxDate",liveDate);localStorage.setItem("virajGoogleFxSource",source);update();}).catch(function(){update()}).finally(function(){busy=false})
}
function update(){
 var c=document.getElementById("virajFxCard");if(!c)return;
 c.querySelector(".virajFxRate").textContent="€1 = ₹"+rate.toFixed(4);
 c.querySelector(".virajFxMeta").textContent=source+" · "+liveDate;
 var e=c.querySelector("#virajFxEur"),i=c.querySelector("#virajFxInr");
 i.value=(N(e.value)*rate).toFixed(2);c.querySelector("#virajFxResult").textContent=money(i.value,"INR");
 c.querySelector("#virajFxInverse").textContent="₹1 = €"+(1/rate).toFixed(6);
}
function add(){
 if(window.__view!=="dashboard"||document.getElementById("virajFxCard"))return;css();
 var c=document.createElement("section");c.id="virajFxCard";c.className="panel virajFxCard";
 c.innerHTML='<div class="panelHead"><div><div class="eyebrow">LIVE FOREIGN EXCHANGE</div><h2>EUR / INR Converter</h2></div><div class="fxHeadActions"><span class="fxGoogleBadge"><span class="virajFxLiveDot"></span> GOOGLE FINANCE</span><button class="uxSecondary" id="fxRefresh">Refresh</button></div></div>'+
 '<div class="virajFxHero"><div class="fxCurrencyIcon">€</div><div class="fxHeroMain"><div class="virajFxRate">€1 = ₹'+rate.toFixed(4)+'</div><div class="virajFxMeta">'+source+' · '+liveDate+'</div></div></div>'+
 '<div class="virajFxGrid"><div><label>Euro (€)</label><div class="virajFxInput"><span>€</span><input id="virajFxEur" type="number" step=".01" value="100"></div></div><div><label>Indian Rupee (₹)</label><div class="virajFxInput"><span>₹</span><input id="virajFxInr" type="number" step=".01" value="'+(100*rate).toFixed(2)+'"></div></div></div>'+
 '<div class="fxConvertRow"><span>Conversion</span><b id="virajFxResult">₹'+(100*rate).toFixed(2)+'</b></div><div id="virajFxInverse" class="fxInverse">₹1 = €'+(1/rate).toFixed(6)+'</div>'+
 '<div class="fxHistory"><div class="fxHistoryTop"><div><div class="eyebrow">RATE HISTORY</div><h3 style="margin:3px 0">EUR → INR over time</h3><div style="font-size:10px;color:#7b8494">Touch and drag across the line to inspect a date and exact rate.</div></div><div class="fxRangeTabs">'+["1D","1W","1M","3M","6M","YTD","1Y","5Y","MAX"].map(function(x){return '<button type="button" data-fx-range="'+x+'" class="'+(x===range?"active":"")+'">'+x+'</button>'}).join("")+'</div></div>'+
 '<div id="virajFxGraph" class="fxGraph"><div style="height:100%;display:grid;place-items:center;color:#8992a1;font-size:11px">Loading historical rates…</div></div>'+
 '<div class="fxStats"><div><small>START</small><b id="fxStart">—</b></div><div><small>HIGH</small><b id="fxHigh">—</b></div><div><small>LOW</small><b id="fxLow">—</b></div><div><small>CHANGE</small><b id="fxChange">—</b></div></div>'+
 '<div class="fxNote">Live quote: Google Finance. Historical reference series: ECB. Indicative only; bank/remittance rates can differ.</div></div>';
 var p=document.getElementById("pfContent"),a=p.querySelector(".uxMerchantPanel")||p.querySelector(".dashboardGrid")||p.firstChild;if(a)p.insertBefore(c,a);else p.appendChild(c);
 var e=c.querySelector("#virajFxEur"),i=c.querySelector("#virajFxInr");
 e.addEventListener("input",update);i.addEventListener("input",function(){e.value=(N(i.value)/rate).toFixed(2);update()});
 c.querySelector("#fxRefresh").onclick=function(){refresh();history(range,true)};
 c.querySelectorAll("[data-fx-range]").forEach(function(b){b.onclick=function(){range=b.dataset.fxRange;c.querySelectorAll("[data-fx-range]").forEach(function(x){x.classList.toggle("active",x===b)});history(range,true)}});
 refresh();history(range,true);
}
var oldShow=window.show;window.show=function(id){var r=oldShow&&oldShow.apply(this,arguments);setTimeout(add,100);setTimeout(add,700);return r};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(add,250);setInterval(refresh,5*60*1000)});else{setTimeout(add,250);setInterval(refresh,5*60*1000)}
window.virajFX={decorate:add,refresh:function(){refresh();history(range,true)}};
})();