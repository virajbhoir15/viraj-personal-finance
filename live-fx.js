/* Viraj Finance — Google Finance live EUR/INR + interactive history */
(function(){
  "use strict";

  var GOOGLE_PROXY="https://viraj-finance-ai.virajbhoir-ie.workers.dev/fx/google";
  var HISTORY_API="https://api.frankfurter.dev/v2/providers/ecb/rates";
  var GOOGLE_FALLBACK=108.8450;
  var cachedRate=Number(localStorage.getItem("virajGoogleFxRate")||0);
  if(!isFinite(cachedRate)||cachedRate<100||cachedRate>120)cachedRate=GOOGLE_FALLBACK;
  var state={
    rate:cachedRate,
    date:localStorage.getItem("virajGoogleFxDate")||"",
    source:localStorage.getItem("virajGoogleFxSource")||"Google Finance · last known",
    change:null,
    refreshedAt:Number(localStorage.getItem("virajGoogleFxRefreshedAt")||0),
    busy:false,
    range:"1Y",
    series:{}
  };

  function n(v){var x=Number(v);return isFinite(x)?x:0;}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m];});}
  function money(v,cur){
    return (cur==="EUR"?"€":"₹")+n(v).toLocaleString(cur==="EUR"?"en-IE":"en-IN",{
      minimumFractionDigits:cur==="EUR"?2:0,
      maximumFractionDigits:cur==="EUR"?2:0
    });
  }
  function isoDate(d){
    var x=new Date(d); if(isNaN(x.getTime())) return "";
    return x.toISOString().slice(0,10);
  }
  function today(){return new Date().toISOString().slice(0,10);}
  function rangeConfig(key){
    var now=new Date();
    var end=isoDate(now);
    var start;
    var group="";
    if(key==="1D"){var d0=new Date(now);d0.setDate(d0.getDate()-1);start=isoDate(d0);}
    else if(key==="1W"){var dw=new Date(now);dw.setDate(dw.getDate()-7);start=isoDate(dw);}
    else if(key==="1M"){var d=new Date(now);d.setMonth(d.getMonth()-1);start=isoDate(d);}
    else if(key==="3M"){var d3=new Date(now);d3.setMonth(d3.getMonth()-3);start=isoDate(d3);}
    else if(key==="6M"){var d6=new Date(now);d6.setMonth(d6.getMonth()-6);start=isoDate(d6);}
    else if(key==="YTD"){start=now.getUTCFullYear()+"-01-01";}
    else if(key==="1Y"){var d1=new Date(now);d1.setFullYear(d1.getFullYear()-1);start=isoDate(d1);}
    else if(key==="5Y"){var d5=new Date(now);d5.setFullYear(d5.getFullYear()-5);start=isoDate(d5);group="week";}
    else {start="1999-01-04";group="month";}
    return {from:start,to:end,group:group};
  }
  function apiUrl(cfg){
    var q=HISTORY_API+"?from="+encodeURIComponent(cfg.from)+"&to="+encodeURIComponent(cfg.to)+"&quotes=INR";
    if(cfg.group)q+="&group="+cfg.group;
    return q;
  }

  function setLive(rate,date,source){
    var old=state.rate;
    state.rate=n(rate);
    if(n(old)>0 && state.rate>0)state.change=(state.rate/old-1)*100;
    state.date=date||state.date;
    state.source=source||"Google Finance";
    state.refreshedAt=Date.now();
    try{
      localStorage.setItem("virajGoogleFxRate",String(state.rate));
      localStorage.setItem("virajGoogleFxDate",state.date||"");
      localStorage.setItem("virajGoogleFxSource",state.source);
      localStorage.setItem("virajGoogleFxRefreshedAt",String(state.refreshedAt));
    }catch(e){}
  }

  function fetchGoogleRate(){
    if(state.busy||!navigator.onLine)return;
    state.busy=true;
    fetch(GOOGLE_PROXY+"?pair=EUR-INR",{cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error("Google quote unavailable");return r.json();})
      .then(function(d){
        if(!d||!n(d.rate))throw new Error("No Google rate returned");
        var live=n(d.rate);
        if(live<100 || live>120) throw new Error("Invalid EUR/INR quote");
        setLive(live,d.date||today(),"Google Finance");
        render();
      })
      .catch(function(){
        state.source=state.rate?"Google Finance · cached":"ECB fallback";
        render();
      })
      .finally(function(){state.busy=false;});
  }

  function fetchHistory(range,force){
    var cfg=rangeConfig(range);
    if(!force&&state.series[range]){renderChart(range);return;}
    var chart= document.querySelector("#virajFxCard .virajFxChart");
    if(chart)chart.classList.add("isLoading");
    fetch(apiUrl(cfg),{cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error("History unavailable");return r.json();})
      .then(function(rows){
        var points=(rows||[]).filter(function(x){return x&&x.date&&n(x.rate)>0;})
          .map(function(x){return {date:x.date,rate:n(x.rate)};})
          .sort(function(a,b){return a.date.localeCompare(b.date);});
        if(!points.length)throw new Error("No history");
        state.series[range]=points;
        renderChart(range);
      })
      .catch(function(){
        var card=document.getElementById("virajFxCard");
        if(card){
          card.querySelector(".virajFxChart").innerHTML='<div class="virajFxEmpty">Historical data is temporarily unavailable. The Google Finance live quote is still available.</div>';
        }
      })
      .finally(function(){var c=document.querySelector("#virajFxCard .virajFxChart");if(c)c.classList.remove("isLoading");});
  }

  function linePath(points,w,h,pad,minV,maxV){
    var span=Math.max(maxV-minV,.000001);
    return points.map(function(p,i){
      var x=pad+(i/(Math.max(points.length-1,1)))*(w-pad*2);
      var y=pad+(1-(p.rate-minV)/span)*(h-pad*2);
      return (i?"L":"M")+x.toFixed(2)+" "+y.toFixed(2);
    }).join(" ");
  }

  function chartHtml(points,range){
    var w=900,h=300,pad=26;
    var vals=points.map(function(p){return p.rate;});
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals);
    var padValue=Math.max((max-min)*.08,.05);min-=padValue;max+=padValue;
    var line=linePath(points,w,h,pad,min,max);
    var last=points[points.length-1];
    var first=points[0];
    var span=Math.max(max-min,.000001);
    var lastX=pad+(1)*(w-pad*2);
    var lastY=pad+(1-(last.rate-min)/span)*(h-pad*2);
    var area=line+" L "+lastX.toFixed(2)+" "+(h-pad)+" L "+pad+" "+(h-pad)+" Z";
    var y1=pad,y2=h-pad;
    var mid=pad+(h-pad*2)/2;
    return '<svg class="virajFxSvg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" data-range="'+esc(range)+'">'+
      '<defs><linearGradient id="fxAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#3157d5" stop-opacity=".30"/><stop offset="100%" stop-color="#6f8ef7" stop-opacity=".02"/></linearGradient><linearGradient id="fxLineGradient" x1="0" x2="1"><stop offset="0%" stop-color="#3157d5"/><stop offset="50%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>'+
      '<line x1="'+pad+'" y1="'+y1+'" x2="'+(w-pad)+'" y2="'+y1+'" class="fxGridLine"/>'+
      '<line x1="'+pad+'" y1="'+mid+'" x2="'+(w-pad)+'" y2="'+mid+'" class="fxGridLine"/>'+
      '<line x1="'+pad+'" y1="'+y2+'" x2="'+(w-pad)+'" y2="'+y2+'" class="fxGridLine"/>'+
      '<path d="'+area+'" fill="url(#fxAreaGradient)" class="fxArea"/>'+
      '<path d="'+line+'" fill="none" stroke="url(#fxLineGradient)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="fxLine"/>'+
      '<line x1="'+lastX.toFixed(2)+'" y1="'+pad+'" x2="'+lastX.toFixed(2)+'" y2="'+(h-pad)+'" class="fxCrosshair" opacity="0"/>'+
      '<circle cx="'+lastX.toFixed(2)+'" cy="'+lastY.toFixed(2)+'" r="5.5" fill="#fff" stroke="#3157d5" stroke-width="3" class="fxLastDot"/>'+
      '<circle cx="'+lastX.toFixed(2)+'" cy="'+lastY.toFixed(2)+'" r="5" fill="#3157d5" class="fxFocusDot" opacity="0"/>'+
      '<rect x="'+pad+'" y="'+pad+'" width="'+(w-pad*2)+'" height="'+(h-pad*2)+'" fill="transparent" class="fxHitArea"/>'+
      '</svg>'+
      '<div class="virajFxYLabels"><span>₹'+max.toFixed(2)+'</span><span>₹'+((max+min)/2).toFixed(2)+'</span><span>₹'+min.toFixed(2)+'</span></div>';
  }

  function statsFor(points){
    var first=points[0].rate,last=points[points.length-1].rate;
    var high=Math.max.apply(null,points.map(function(x){return x.rate;}));
    var low=Math.min.apply(null,points.map(function(x){return x.rate;}));
    return {first:first,last:last,high:high,low:low,change:(last/first-1)*100};
  }

  function renderChart(range){
    var card=document.getElementById("virajFxCard"),pts=state.series[range];
    if(!card||!pts||!pts.length)return;
    var wrap=card.querySelector(".virajFxChart");
    if(!wrap)return;
    wrap.innerHTML=chartHtml(pts,range);
    var st=statsFor(pts);
    card.querySelector(".fxStatStart").textContent="₹"+st.first.toFixed(4);
    card.querySelector(".fxStatHigh").textContent="₹"+st.high.toFixed(4);
    card.querySelector(".fxStatLow").textContent="₹"+st.low.toFixed(4);
    card.querySelector(".fxStatChange").textContent=(st.change>=0?"+":"")+st.change.toFixed(2)+"%";
    card.querySelector(".fxStatChange").className="fxStatChange "+(st.change>=0?"positive":"negative");
    bindChart(pts);
  }

  function bindChart(points){
    var card=document.getElementById("virajFxCard");if(!card)return;
    var svg=card.querySelector(".virajFxSvg"),tip=card.querySelector(".fxTooltip");
    if(!svg||!tip||!points||!points.length)return;
    var hit=svg.querySelector(".fxHitArea"),cross=svg.querySelector(".fxCrosshair"),dot=svg.querySelector(".fxFocusDot");
    function move(e){
      var r=svg.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      var idx=Math.round(x*(points.length-1)),p=points[idx];
      var label=new Date(p.date+"T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"});
      var vals=points.map(function(z){return z.rate;}),min=Math.min.apply(null,vals),max=Math.max.apply(null,vals);
      var span=Math.max(max-min,.000001),pad=26,w=900,h=300;
      var px=pad+x*(w-pad*2),py=pad+(1-(p.rate-min)/span)*(h-pad*2);
      if(cross){cross.setAttribute("x1",px.toFixed(2));cross.setAttribute("x2",px.toFixed(2));cross.setAttribute("y1",pad);cross.setAttribute("y2",h-pad);cross.setAttribute("opacity","1");}
      if(dot){dot.setAttribute("cx",px.toFixed(2));dot.setAttribute("cy",py.toFixed(2));dot.setAttribute("opacity","1");}
      tip.innerHTML="<strong>₹"+p.rate.toFixed(4)+"</strong><span>"+label+"</span>";
      tip.style.left=(x*100)+"%";
      tip.classList.add("show");
    }
    hit.addEventListener("pointermove",move,{passive:true});
    hit.addEventListener("pointerdown",function(e){try{hit.setPointerCapture(e.pointerId)}catch(_){ }move(e);},{passive:true});
    hit.addEventListener("pointerup",function(){});
    hit.addEventListener("pointercancel",function(){});
    hit.addEventListener("pointerleave",function(){
      if(!("ontouchstart" in window)){tip.classList.remove("show");if(cross)cross.setAttribute("opacity","0");if(dot)dot.setAttribute("opacity","0");}
    });
  }

  function render(){
    var card=document.getElementById("virajFxCard");if(!card)return;
    card.querySelector(".virajFxRate").textContent="€1 = ₹"+state.rate.toFixed(4);
    var meta=state.date?("Google Finance · "+state.date):"Google Finance · live quote";
    if(state.source!=="Google Finance")meta=state.source+" · live quote fallback";
    card.querySelector(".virajFxMeta").textContent=meta;
    card.querySelector(".virajFxLiveDot").className="virajFxLiveDot "+(state.source==="Google Finance"?"on":"cached");
    card.querySelector(".virajFxResult").textContent=money(n(card.querySelector("#virajFxEur").value||0)*state.rate,"INR");
    card.querySelector(".virajFxInverse").textContent="₹1 = €"+(1/state.rate).toFixed(6);
    if(state.change!=null){
      card.querySelector(".fxLiveChange").textContent=(state.change>=0?"+":"")+state.change.toFixed(2)+"% since last refresh";
      card.querySelector(".fxLiveChange").className="fxLiveChange "+(state.change>=0?"positive":"negative");
    }
  }

  function add(){
    if(document.getElementById("virajFxCard"))return;
    var content=document.getElementById("pfContent");if(!content)return;
    var card=document.createElement("section");
    card.id="virajFxCard";card.className="panel virajFxCard";
    card.innerHTML=
      '<div class="panelHead"><div><div class="eyebrow">LIVE FOREIGN EXCHANGE</div><h2>EUR / INR</h2></div><div class="fxHeadActions"><span class="fxGoogleBadge"><span class="virajFxLiveDot on"></span> GOOGLE FINANCE</span><button class="uxSecondary fxRefresh" type="button">Refresh</button></div></div>'+
      '<div class="virajFxHero">'+
        '<div class="fxCurrencyIcon euroIcon">€</div>'+
        '<div class="fxHeroMain"><div class="virajFxRate">€1 = ₹'+state.rate.toFixed(4)+'</div><div class="virajFxMeta"></div><div class="fxLiveChange"></div></div>'+
        '<span class="fxGoogleLink">Live quote · Google Finance</span>'+
      '</div>'+
      '<div class="virajFxGrid"><div><label>Euro</label><div class="virajFxInput"><span>€</span><input id="virajFxEur" type="number" step="0.01" value="100"></div></div><div><label>Indian Rupee</label><div class="virajFxInput"><span>₹</span><input id="virajFxInr" type="number" step="0.01" value="'+(100*state.rate).toFixed(2)+'"></div></div></div>'+
      '<div class="virajFxResultRow"><span>Conversion</span><strong class="virajFxResult">₹'+(100*state.rate).toFixed(0)+'</strong></div>'+
      '<div class="virajFxInverse"></div>'+
      '<div class="fxHistoryHead"><div><div class="eyebrow">RATE HISTORY</div><h3>EUR → INR over time</h3><small>Slide across the graph to inspect the rate at each point.</small></div><div class="fxRangeTabs">'+["1D","1W","1M","3M","6M","YTD","1Y","5Y","MAX"].map(function(x){return '<button type="button" data-fx-range="'+x+'" class="'+(x===state.range?"active":"")+'">'+x+'</button>';}).join("")+'</div></div>'+
      '<div class="virajFxChartWrap"><div class="virajFxChart"></div><div class="fxTooltip"></div></div>'+
      '<div class="fxStats"><div><span>Start</span><strong class="fxStatStart">—</strong></div><div><span>High</span><strong class="fxStatHigh">—</strong></div><div><span>Low</span><strong class="fxStatLow">—</strong></div><div><span>Change</span><strong class="fxStatChange">—</strong></div></div>'+
      '<p class="hint">Google Finance supplies the live quote. The historical graph uses the European Central Bank reference series because Google does not provide a supported public historical-finance API. Rates are indicative and may differ from your bank/remittance rate.</p>';
    content.insertBefore(card,content.querySelector("#uxMerchantPanel")||content.querySelector(".dashboardGrid")||content.firstChild);

    var e=card.querySelector("#virajFxEur"),i=card.querySelector("#virajFxInr");
    e.addEventListener("input",function(){i.value=(n(e.value)*state.rate).toFixed(2);render();});
    i.addEventListener("input",function(){e.value=(n(i.value)/state.rate).toFixed(2);render();});
    card.querySelector(".fxRefresh").onclick=function(){fetchGoogleRate();fetchHistory(state.range,true);};
    card.querySelectorAll("[data-fx-range]").forEach(function(btn){
      btn.onclick=function(){
        state.range=btn.dataset.fxRange;
        card.querySelectorAll("[data-fx-range]").forEach(function(x){x.classList.toggle("active",x===btn);});
        fetchHistory(state.range,false);
      };
    });
    render();
    fetchGoogleRate();
    fetchHistory(state.range,false);
  }

  function decorate(){
    if(window.__view==="dashboard")add();
    var styleId="virajFxProfessionalStyle";
    if(!document.getElementById(styleId)){
      var st=document.createElement("style");st.id=styleId;
      st.textContent=
        ".virajFxCard{overflow:hidden}.virajFxCard .panelHead{align-items:center}.fxHeadActions{display:flex;align-items:center;gap:8px}.fxGoogleBadge{font-size:10px;font-weight:900;letter-spacing:.06em;color:#3157d5;background:#eef2ff;border-radius:999px;padding:6px 9px}.virajFxLiveDot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#94a3b8;margin-right:5px;box-shadow:0 0 0 3px #e7e9ee}.virajFxLiveDot.on{background:#16a34a;box-shadow:0 0 0 3px #dcfce7}.virajFxLiveDot.cached{background:#f59e0b;box-shadow:0 0 0 3px #fef3c7}.virajFxHero{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#f0f5ff,#f7f1ff 55%,#eefcfc);border:1px solid #dfe6f7;border-radius:15px;padding:16px;margin-bottom:12px}.fxCurrencyIcon{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:none;font-size:26px;font-weight:950;color:#fff;box-shadow:0 8px 24px #3157d533}.euroIcon{background:linear-gradient(135deg,#3157d5,#7c3aed)}.fxHeroMain{min-width:0;flex:1}.virajFxRate{font-size:25px;font-weight:950;color:#172033;display:block;letter-spacing:-.03em}.virajFxMeta{display:block;color:#687385;font-size:10px;margin-top:3px}.fxLiveChange{font-size:10px;font-weight:850;margin-top:5px}.positive{color:#138a5b}.negative{color:#d13b3b}.fxGoogleLink{font-size:10px;font-weight:850;color:#3157d5;white-space:nowrap;background:#eef2ff;border-radius:999px;padding:7px 9px}.virajFxGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.virajFxGrid label{display:block;font-size:11px;color:#697386;font-weight:800;margin-bottom:5px}.virajFxInput{display:flex;align-items:center;border:1px solid #d9dee7;border-radius:10px;overflow:hidden;background:#fff}.virajFxInput span{padding-left:11px;color:#697386;font-weight:900}.virajFxInput input{border:0!important;border-radius:0!important;background:#fff}.virajFxResultRow{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e7eaf0;margin-top:13px;padding-top:13px;font-size:11px;color:#697386}.virajFxResult{font-size:19px;color:#172033}.virajFxInverse{font-size:10px;color:#7b8494;margin-top:4px}.fxHistoryHead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:20px;padding-top:14px;border-top:1px solid #e7eaf0}.fxHistoryHead h3{margin:3px 0 0;font-size:15px}.fxHistoryHead small{display:block;color:#7b8494;font-size:10px;margin-top:2px}.fxRangeTabs{display:flex;gap:4px;flex-wrap:wrap}.fxRangeTabs button{border:1px solid #dde3ef;background:#fff;color:#667085;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:850}.fxRangeTabs button.active{background:#3157d5;color:#fff;border-color:#3157d5;box-shadow:0 4px 10px #3157d533}.virajFxChartWrap{position:relative;margin-top:10px;border:1px solid #e6eaf2;border-radius:13px;background:#fcfdff;padding:10px;overflow:hidden}.virajFxChart{height:265px;position:relative}.virajFxChart.isLoading{opacity:.55}.virajFxSvg{width:100%;height:100%;overflow:visible;display:block;touch-action:none}.fxCrosshair{stroke:#3157d5;stroke-width:1.5;stroke-dasharray:5 5;pointer-events:none}.fxFocusDot{pointer-events:none}.fxGridLine{stroke:#e7ebf3;stroke-width:1}.fxHitArea{cursor:crosshair}.fxTooltip{position:absolute;top:12px;transform:translateX(-50%);pointer-events:none;background:#172033;color:#fff;border-radius:9px;padding:7px 9px;display:none;min-width:90px;text-align:center;box-shadow:0 10px 24px #17203325}.fxTooltip.show{display:block}.fxTooltip strong{display:block;font-size:12px}.fxTooltip span{display:block;font-size:9px;color:#cbd5e1;margin-top:2px}.virajFxYLabels{position:absolute;left:8px;top:10px;bottom:10px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;font-size:9px;color:#8a93a3}.fxStats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}.fxStats>div{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:9px}.fxStats span{display:block;color:#8a93a3;font-size:9px;text-transform:uppercase;font-weight:850;letter-spacing:.05em}.fxStats strong{display:block;color:#172033;font-size:13px;margin-top:3px}.virajFxEmpty{height:100%;display:grid;place-items:center;color:#7b8494;font-size:11px;text-align:center;padding:20px}@media(max-width:700px){.virajFxRate{font-size:21px}.fxGoogleLink{display:none}.fxHistoryHead{align-items:flex-start;flex-direction:column}.fxRangeTabs{width:100%}.fxRangeTabs button{flex:1}.virajFxChart{height:220px}.fxStats{grid-template-columns:1fr 1fr}.fxHeadActions .fxRefresh{padding:7px 8px}}";
      document.head.appendChild(st);
    }
  }

  var oldShow=window.show;
  window.show=function(id){var r=oldShow?oldShow.apply(this,arguments):null;setTimeout(decorate,70);return r;};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(decorate,160);setInterval(fetchGoogleRate,5*60*1000);});
  else {setTimeout(decorate,160);setTimeout(decorate,700);setTimeout(decorate,1500);setInterval(fetchGoogleRate,5*60*1000);}
  window.virajFX={state:state,refresh:function(){fetchGoogleRate();fetchHistory(state.range,true);},decorate:decorate};
})()  const exactClass = /class="[^"]*YMlKec[^"]*fxKbKc[^"]*"[^>]*>\\s*([0-9]{2,3}(?:\\.[0-9]{4,6}))/gi;
  const candidates = [];
  for (const m of html.matchAll(exactClass)) {
    const v = Number(m[1]);
    if (Number.isFinite(v) && v >= 80 && v <= 150) candidates.push(v);
  }
  let rate = candidates[0] || null;

  if (!rate) {
    const marker = Math.max(html.indexOf("EUR / INR"), html.indexOf("Euro / Indian Rupee"));
    const context = marker >= 0 ? html.slice(marker, marker + 30000) : html;
    const nums = [...context.matchAll(/\\b(9[0-9]|10[0-9]|11[0-9]|12[0-9]|13[0-9]|14[0-9])\\.[0-9]{4,6}\\b/g)]
      .map(m => Number(m[0]))
      .filter(v => v >= 80 && v <= 150);
    rate = nums[0] || null;
  }

  if (!rate) throw new Error("Google Finance EUR/INR quote not found");
  return {from:start,to:end,group:group};
  }
  function apiUrl(cfg){
    var q=HISTORY_API+"?from="+encodeURIComponent(cfg.from)+"&to="+encodeURIComponent(cfg.to)+"&quotes=INR";
    if(cfg.group)q+="&group="+cfg.group;
    return q;
  }

  function setLive(rate,date,source){
    var old=state.rate;
    state.rate=n(rate);
    if(n(old)>0 && state.rate>0)state.change=(state.rate/old-1)*100;
    state.date=date||state.date;
    state.source=source||"Google Finance";
    state.refreshedAt=Date.now();
    try{
      localStorage.setItem("virajGoogleFxRate",String(state.rate));
      localStorage.setItem("virajGoogleFxDate",state.date||"");
      localStorage.setItem("virajGoogleFxSource",state.source);
      localStorage.setItem("virajGoogleFxRefreshedAt",String(state.refreshedAt));
    }catch(e){}
  }

  function fetchGoogleRate(){
    if(state.busy||!navigator.onLine)return;
    state.busy=true;
    fetch(GOOGLE_PROXY+"?pair=EUR-INR",{cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error("Google quote unavailable");return r.json();})
      .then(function(d){
        if(!d||!n(d.rate))throw new Error("No Google rate returned");
        setLive(d.rate,d.date||today(),"Google Finance");
        render();
      })
      .catch(function(){
        state.source=state.rate?"Google Finance · cached":"ECB fallback";
        render();
      })
      .finally(function(){state.busy=false;});
  }

  function fetchHistory(range,force){
    var cfg=rangeConfig(range);
    if(!force&&state.series[range]){renderChart(range);return;}
    var chart= document.querySelector("#virajFxCard .virajFxChart");
    if(chart)chart.classList.add("isLoading");
    fetch(apiUrl(cfg),{cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error("History unavailable");return r.json();})
      .then(function(rows){
        var points=(rows||[]).filter(function(x){return x&&x.date&&n(x.rate)>0;})
          .map(function(x){return {date:x.date,rate:n(x.rate)};})
          .sort(function(a,b){return a.date.localeCompare(b.date);});
        if(!points.length)throw new Error("No history");
        state.series[range]=points;
        renderChart(range);
      })
      .catch(function(){
        var card=document.getElementById("virajFxCard");
        if(card){
          card.querySelector(".virajFxChart").innerHTML='<div class="virajFxEmpty">Historical data is temporarily unavailable. The Google Finance live quote is still available.</div>';
        }
      })
      .finally(function(){var c=document.querySelector("#virajFxCard .virajFxChart");if(c)c.classList.remove("isLoading");});
  }

  function linePath(points,w,h,pad,minV,maxV){
    var span=Math.max(maxV-minV,.000001);
    return points.map(function(p,i){
      var x=pad+(i/(Math.max(points.length-1,1)))*(w-pad*2);
      var y=pad+(1-(p.rate-minV)/span)*(h-pad*2);
      return (i?"L":"M")+x.toFixed(2)+" "+y.toFixed(2);
    }).join(" ");
  }

  function chartHtml(points,range){
    var w=900,h=300,pad=26;
    var vals=points.map(function(p){return p.rate;});
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals);
    var padValue=Math.max((max-min)*.08,.05);min-=padValue;max+=padValue;
    var line=linePath(points,w,h,pad,min,max);
    var last=points[points.length-1];
    var first=points[0];
    var span=Math.max(max-min,.000001);
    var lastX=pad+(1)*(w-pad*2);
    var lastY=pad+(1-(last.rate-min)/span)*(h-pad*2);
    var area=line+" L "+lastX.toFixed(2)+" "+(h-pad)+" L "+pad+" "+(h-pad)+" Z";
    var y1=pad,y2=h-pad;
    var mid=pad+(h-pad*2)/2;
    return '<svg class="virajFxSvg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" data-range="'+esc(range)+'">'+
      '<defs><linearGradient id="fxAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#3157d5" stop-opacity=".30"/><stop offset="100%" stop-color="#6f8ef7" stop-opacity=".02"/></linearGradient><linearGradient id="fxLineGradient" x1="0" x2="1"><stop offset="0%" stop-color="#3157d5"/><stop offset="50%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>'+
      '<line x1="'+pad+'" y1="'+y1+'" x2="'+(w-pad)+'" y2="'+y1+'" class="fxGridLine"/>'+
      '<line x1="'+pad+'" y1="'+mid+'" x2="'+(w-pad)+'" y2="'+mid+'" class="fxGridLine"/>'+
      '<line x1="'+pad+'" y1="'+y2+'" x2="'+(w-pad)+'" y2="'+y2+'" class="fxGridLine"/>'+
      '<path d="'+area+'" fill="url(#fxAreaGradient)" class="fxArea"/>'+
      '<path d="'+line+'" fill="none" stroke="url(#fxLineGradient)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="fxLine"/>'+
      '<line x1="'+lastX.toFixed(2)+'" y1="'+pad+'" x2="'+lastX.toFixed(2)+'" y2="'+(h-pad)+'" class="fxCrosshair" opacity="0"/>'+
      '<circle cx="'+lastX.toFixed(2)+'" cy="'+lastY.toFixed(2)+'" r="5.5" fill="#fff" stroke="#3157d5" stroke-width="3" class="fxLastDot"/>'+
      '<circle cx="'+lastX.toFixed(2)+'" cy="'+lastY.toFixed(2)+'" r="5" fill="#3157d5" class="fxFocusDot" opacity="0"/>'+
      '<rect x="'+pad+'" y="'+pad+'" width="'+(w-pad*2)+'" height="'+(h-pad*2)+'" fill="transparent" class="fxHitArea"/>'+
      '</svg>'+
      '<div class="virajFxYLabels"><span>₹'+max.toFixed(2)+'</span><span>₹'+((max+min)/2).toFixed(2)+'</span><span>₹'+min.toFixed(2)+'</span></div>';
  }

  function statsFor(points){
    var first=points[0].rate,last=points[points.length-1].rate;
    var high=Math.max.apply(null,points.map(function(x){return x.rate;}));
    var low=Math.min.apply(null,points.map(function(x){return x.rate;}));
    return {first:first,last:last,high:high,low:low,change:(last/first-1)*100};
  }

  function renderChart(range){
    var card=document.getElementById("virajFxCard"),pts=state.series[range];
    if(!card||!pts||!pts.length)return;
    var wrap=card.querySelector(".virajFxChart");
    if(!wrap)return;
    wrap.innerHTML=chartHtml(pts,range);
    var st=statsFor(pts);
    card.querySelector(".fxStatStart").textContent="₹"+st.first.toFixed(4);
    card.querySelector(".fxStatHigh").textContent="₹"+st.high.toFixed(4);
    card.querySelector(".fxStatLow").textContent="₹"+st.low.toFixed(4);
    card.querySelector(".fxStatChange").textContent=(st.change>=0?"+":"")+st.change.toFixed(2)+"%";
    card.querySelector(".fxStatChange").className="fxStatChange "+(st.change>=0?"positive":"negative");
    bindChart(pts);
  }

  function bindChart(points){
    var card=document.getElementById("virajFxCard");if(!card)return;
    var svg=card.querySelector(".virajFxSvg"),tip=card.querySelector(".fxTooltip");
    if(!svg||!tip)return;
    var hit=svg.querySelector(".fxHitArea");
    hit.addEventListener("pointermove",function(e){
      var r=svg.getBoundingClientRect();
      var x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      var idx=Math.round(x*(points.length-1)),p=points[idx];
      var label=new Date(p.date+"T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"});
      tip.innerHTML="<strong>₹"+p.rate.toFixed(4)+"</strong><span>"+label+"</span>";
      tip.style.left=(x*100)+"%";
      tip.classList.add("show");
    });
    hit.addEventListener("pointerleave",function(){tip.classList.remove("show");});
  }

  function render(){
    var card=document.getElementById("virajFxCard");if(!card)return;
    card.querySelector(".virajFxRate").textContent="€1 = ₹"+state.rate.toFixed(4);
    var meta=state.date?("Google Finance · "+state.date):"Google Finance · live quote";
    if(state.source!=="Google Finance")meta=state.source+" · live quote fallback";
    card.querySelector(".virajFxMeta").textContent=meta;
    card.querySelector(".virajFxLiveDot").className="virajFxLiveDot "+(state.source==="Google Finance"?"on":"cached");
    card.querySelector(".virajFxResult").textContent=money(n(card.querySelector("#virajFxEur").value||0)*state.rate,"INR");
    card.querySelector(".virajFxInverse").textContent="₹1 = €"+(1/state.rate).toFixed(6);
    if(state.change!=null){
      card.querySelector(".fxLiveChange").textContent=(state.change>=0?"+":"")+state.change.toFixed(2)+"% since last refresh";
      card.querySelector(".fxLiveChange").className="fxLiveChange "+(state.change>=0?"positive":"negative");
    }
  }

  function add(){
    if(document.getElementById("virajFxCard"))return;
    var content=document.getElementById("pfContent");if(!content)return;
    var card=document.createElement("section");
    card.id="virajFxCard";card.className="panel virajFxCard";
    card.innerHTML=
      '<div class="panelHead"><div><div class="eyebrow">LIVE FOREIGN EXCHANGE</div><h2>EUR / INR</h2></div><div class="fxHeadActions"><span class="fxGoogleBadge"><span class="virajFxLiveDot on"></span> GOOGLE FINANCE</span><button class="uxSecondary fxRefresh" type="button">Refresh</button></div></div>'+
      '<div class="virajFxHero">'+
        '<div class="fxCurrencyIcon euroIcon">€</div>'+
        '<div class="fxHeroMain"><div class="virajFxRate">€1 = ₹'+state.rate.toFixed(4)+'</div><div class="virajFxMeta"></div><div class="fxLiveChange"></div></div>'+
        '<a class="fxGoogleLink" href="https://www.google.com/finance/quote/EUR-INR" target="_blank" rel="noopener">Open Google Finance ↗</a>'+
      '</div>'+
      '<div class="virajFxGrid"><div><label>Euro</label><div class="virajFxInput"><span>€</span><input id="virajFxEur" type="number" step="0.01" value="100"></div></div><div><label>Indian Rupee</label><div class="virajFxInput"><span>₹</span><input id="virajFxInr" type="number" step="0.01" value="'+(100*state.rate).toFixed(2)+'"></div></div></div>'+
      '<div class="virajFxResultRow"><span>Conversion</span><strong class="virajFxResult">₹'+(100*state.rate).toFixed(0)+'</strong></div>'+
      '<div class="virajFxInverse"></div>'+
      '<div class="fxHistoryHead"><div><div class="eyebrow">RATE HISTORY</div><h3>EUR → INR over time</h3><small>Historical ECB reference series · interactive</small></div><div class="fxRangeTabs">'+["1D","1W","1M","3M","6M","YTD","1Y","5Y","MAX"].map(function(x){return '<button type="button" data-fx-range="'+x+'" class="'+(x===state.range?"active":"")+'">'+x+'</button>';}).join("")+'</div></div>'+
      '<div class="virajFxChartWrap"><div class="virajFxChart"></div><div class="fxTooltip"></div></div>'+
      '<div class="fxStats"><div><span>Start</span><strong class="fxStatStart">—</strong></div><div><span>High</span><strong class="fxStatHigh">—</strong></div><div><span>Low</span><strong class="fxStatLow">—</strong></div><div><span>Change</span><strong class="fxStatChange">—</strong></div></div>'+
      '<p class="hint">Google Finance supplies the live quote. The historical graph uses the European Central Bank reference series because Google does not provide a supported public historical-finance API. Rates are indicative and may differ from your bank/remittance rate.</p>';
    content.insertBefore(card,content.querySelector("#uxMerchantPanel")||content.querySelector(".dashboardGrid")||content.firstChild);

    var e=card.querySelector("#virajFxEur"),i=card.querySelector("#virajFxInr");
    e.addEventListener("input",function(){i.value=(n(e.value)*state.rate).toFixed(2);render();});
    i.addEventListener("input",function(){e.value=(n(i.value)/state.rate).toFixed(2);render();});
    card.querySelector(".fxRefresh").onclick=function(){fetchGoogleRate();fetchHistory(state.range,true);};
    card.querySelectorAll("[data-fx-range]").forEach(function(btn){
      btn.onclick=function(){
        state.range=btn.dataset.fxRange;
        card.querySelectorAll("[data-fx-range]").forEach(function(x){x.classList.toggle("active",x===btn);});
        fetchHistory(state.range,false);
      };
    });
    render();
    fetchGoogleRate();
    fetchHistory(state.range,false);
  }

  function decorate(){
    if(window.__view==="dashboard")add();
    var styleId="virajFxProfessionalStyle";
    if(!document.getElementById(styleId)){
      var st=document.createElement("style");st.id=styleId;
      st.textContent=
        ".virajFxCard{overflow:hidden}.virajFxCard .panelHead{align-items:center}.fxHeadActions{display:flex;align-items:center;gap:8px}.fxGoogleBadge{font-size:10px;font-weight:900;letter-spacing:.06em;color:#3157d5;background:#eef2ff;border-radius:999px;padding:6px 9px}.virajFxLiveDot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#94a3b8;margin-right:5px;box-shadow:0 0 0 3px #e7e9ee}.virajFxLiveDot.on{background:#16a34a;box-shadow:0 0 0 3px #dcfce7}.virajFxLiveDot.cached{background:#f59e0b;box-shadow:0 0 0 3px #fef3c7}.virajFxHero{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#f0f5ff,#f7f1ff 55%,#eefcfc);border:1px solid #dfe6f7;border-radius:15px;padding:16px;margin-bottom:12px}.fxCurrencyIcon{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:none;font-size:26px;font-weight:950;color:#fff;box-shadow:0 8px 24px #3157d533}.euroIcon{background:linear-gradient(135deg,#3157d5,#7c3aed)}.fxHeroMain{min-width:0;flex:1}.virajFxRate{font-size:25px;font-weight:950;color:#172033;display:block;letter-spacing:-.03em}.virajFxMeta{display:block;color:#687385;font-size:10px;margin-top:3px}.fxLiveChange{font-size:10px;font-weight:850;margin-top:5px}.positive{color:#138a5b}.negative{color:#d13b3b}.fxGoogleLink{font-size:10px;font-weight:850;color:#3157d5;text-decoration:none;white-space:nowrap}.virajFxGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.virajFxGrid label{display:block;font-size:11px;color:#697386;font-weight:800;margin-bottom:5px}.virajFxInput{display:flex;align-items:center;border:1px solid #d9dee7;border-radius:10px;overflow:hidden;background:#fff}.virajFxInput span{padding-left:11px;color:#697386;font-weight:900}.virajFxInput input{border:0!important;border-radius:0!important;background:#fff}.virajFxResultRow{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e7eaf0;margin-top:13px;padding-top:13px;font-size:11px;color:#697386}.virajFxResult{font-size:19px;color:#172033}.virajFxInverse{font-size:10px;color:#7b8494;margin-top:4px}.fxHistoryHead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:20px;padding-top:14px;border-top:1px solid #e7eaf0}.fxHistoryHead h3{margin:3px 0 0;font-size:15px}.fxHistoryHead small{display:block;color:#7b8494;font-size:10px;margin-top:2px}.fxRangeTabs{display:flex;gap:4px;flex-wrap:wrap}.fxRangeTabs button{border:1px solid #dde3ef;background:#fff;color:#667085;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:850}.fxRangeTabs button.active{background:#3157d5;color:#fff;border-color:#3157d5;box-shadow:0 4px 10px #3157d533}.virajFxChartWrap{position:relative;margin-top:10px;border:1px solid #e6eaf2;border-radius:13px;background:#fcfdff;padding:10px;overflow:hidden}.virajFxChart{height:265px;position:relative}.virajFxChart.isLoading{opacity:.55}.virajFxSvg{width:100%;height:100%;overflow:visible;display:block}.fxGridLine{stroke:#e7ebf3;stroke-width:1}.fxHitArea{cursor:crosshair}.fxTooltip{position:absolute;top:12px;transform:translateX(-50%);pointer-events:none;background:#172033;color:#fff;border-radius:9px;padding:7px 9px;display:none;min-width:90px;text-align:center;box-shadow:0 10px 24px #17203325}.fxTooltip.show{display:block}.fxTooltip strong{display:block;font-size:12px}.fxTooltip span{display:block;font-size:9px;color:#cbd5e1;margin-top:2px}.virajFxYLabels{position:absolute;left:8px;top:10px;bottom:10px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;font-size:9px;color:#8a93a3}.fxStats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}.fxStats>div{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:9px}.fxStats span{display:block;color:#8a93a3;font-size:9px;text-transform:uppercase;font-weight:850;letter-spacing:.05em}.fxStats strong{display:block;color:#172033;font-size:13px;margin-top:3px}.virajFxEmpty{height:100%;display:grid;place-items:center;color:#7b8494;font-size:11px;text-align:center;padding:20px}@media(max-width:700px){.virajFxRate{font-size:21px}.fxGoogleLink{display:none}.fxHistoryHead{align-items:flex-start;flex-direction:column}.fxRangeTabs{width:100%}.fxRangeTabs button{flex:1}.virajFxChart{height:220px}.fxStats{grid-template-columns:1fr 1fr}.fxHeadActions .fxRefresh{padding:7px 8px}}";
      document.head.appendChild(st);
    }
  }

  var oldShow=window.show;
  window.show=function(id){var r=oldShow?oldShow.apply(this,arguments):null;setTimeout(decorate,70);return r;};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(decorate,160);setInterval(fetchGoogleRate,5*60*1000);});
  else {setTimeout(decorate,160);setTimeout(decorate,500);setTimeout(decorate,1200);setInterval(fetchGoogleRate,5*60*1000);}
  window.addEventListener("pageshow",function(){setTimeout(decorate,300);});
  window.virajFX={state:state,refresh:function(){fetchGoogleRate();fetchHistory(state.range,true);},decorate:decorate};
})();