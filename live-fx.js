/* Viraj Finance - live EUR/INR rate panel */
(function(){
  "use strict";
  var API="https://api.frankfurter.dev/v2/providers/ecb/rate/eur/inr";
  var FALLBACK=108.8320;
  var state={rate:Number(localStorage.getItem("virajFxRate")||FALLBACK),date:localStorage.getItem("virajFxDate")||"",source:"ECB reference",updated:0,busy:false};

  function money(n,cur){return (cur==="EUR"?"€":"₹")+Number(n||0).toLocaleString(cur==="EUR"?"en-IE":"en-IN",{minimumFractionDigits:cur==="EUR"?2:0,maximumFractionDigits:cur==="EUR"?2:0});}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]})}
  function fetchRate(){
    if(state.busy||!navigator.onLine)return;
    state.busy=true;
    fetch(API,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error();return r.json()}).then(function(d){
      if(!d||!d.rate)throw new Error();
      state.rate=Number(d.rate);state.date=d.date||"";state.source="ECB reference";state.updated=Date.now();
      try{localStorage.setItem("virajFxRate",state.rate);localStorage.setItem("virajFxDate",state.date)}catch(e){}
      render();
    }).catch(function(){render()}).finally(function(){state.busy=false});
  }
  function render(){
    var card=document.getElementById("virajFxCard");if(!card)return;
    var eurInput=card.querySelector("#virajFxEur"),inrInput=card.querySelector("#virajFxInr"),eur=Number(eurInput&&eurInput.value||1),inr=Number(inrInput&&inrInput.value||eur*state.rate);
    card.querySelector(".virajFxRate").textContent="€1 = ₹"+state.rate.toFixed(4);
    card.querySelector(".virajFxMeta").textContent=(state.date?"Rate date "+state.date+" · ":"")+state.source+" · updates automatically";
    card.querySelector(".virajFxResult").textContent=money(eur*state.rate,"INR");
    card.querySelector(".virajFxInverse").textContent=inr?("₹1 = €"+(1/state.rate).toFixed(6)):"";
    if(document.activeElement!==eurInput&&document.activeElement!==inrInput){if(inrInput)inrInput.value=inr.toFixed(2)}
  }
  function add(){
    if(document.getElementById("virajFxCard"))return;
    var content=document.getElementById("pfContent");if(!content)return;
    var card=document.createElement("section");card.id="virajFxCard";card.className="panel";
    card.innerHTML='<div class="panelHead"><h2>Live EUR / INR</h2><span class="badge">LIVE RATE</span></div><div class="virajFxHero"><div><span class="virajFxRate">€1 = ₹'+state.rate.toFixed(4)+'</span><small class="virajFxMeta"></small></div><div class="virajFxSwap">EUR ↔ INR</div></div><div class="virajFxGrid"><div><label>Euro</label><div class="virajFxInput"><span>€</span><input id="virajFxEur" type="number" step="0.01" value="100"></div></div><div><label>Indian Rupee</label><div class="virajFxInput"><span>₹</span><input id="virajFxInr" type="number" step="0.01" value="'+(100*state.rate).toFixed(2)+'"></div></div></div><div class="virajFxResultRow"><span>100 EUR converts to</span><strong class="virajFxResult"></strong></div><div class="virajFxInverse"></div><p class="hint">ECB reference rates are indicative and may differ from your bank/remittance rate.</p>';
    content.insertBefore(card,content.querySelector(".dashboardGrid")||content.firstChild);
    var e=card.querySelector("#virajFxEur"),i=card.querySelector("#virajFxInr");
    e.addEventListener("input",function(){if(!state.rate)return;i.value=(Number(e.value||0)*state.rate).toFixed(2);render();});
    i.addEventListener("input",function(){if(!state.rate)return;e.value=(Number(i.value||0)/state.rate).toFixed(2);render();});
    render();fetchRate();
  }
  function decorate(){
    if(window.__view==="dashboard")add();
    var styleId="virajFxStyle";if(!document.getElementById(styleId)){var st=document.createElement("style");st.id=styleId;st.textContent=".virajFxHero{display:flex;justify-content:space-between;align-items:center;background:#f7f9ff;border:1px solid #e1e7f7;border-radius:11px;padding:14px 16px;margin-bottom:12px}.virajFxRate{font-size:22px;font-weight:900;color:#172033;display:block}.virajFxMeta{display:block;color:#697386;font-size:10px;margin-top:4px}.virajFxSwap{font-size:11px;color:#3157d5;font-weight:850}.virajFxGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.virajFxGrid label{display:block;font-size:11px;color:#697386;font-weight:800;margin-bottom:5px}.virajFxInput{display:flex;align-items:center;border:1px solid #d9dee7;border-radius:9px;overflow:hidden;background:#fff}.virajFxInput span{padding-left:11px;color:#697386;font-weight:800}.virajFxInput input{border:0!important;border-radius:0!important}.virajFxResultRow{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e7eaf0;margin-top:13px;padding-top:13px;font-size:11px;color:#697386}.virajFxResult{font-size:18px;color:#172033}.virajFxInverse{font-size:11px;color:#697386;margin-top:5px}@media(max-width:700px){.virajFxGrid{grid-template-columns:1fr 1fr}.virajFxRate{font-size:18px}}";document.head.appendChild(st)}
  }
  var oldShow=window.show;
  window.show=function(id){var r=oldShow?oldShow.apply(this,arguments):null;setTimeout(decorate,50);return r};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(decorate,100);setInterval(fetchRate,15*60*1000)});else {setTimeout(decorate,100);setInterval(fetchRate,15*60*1000)}
  window.virajFX={state:state,refresh:fetchRate};
})();