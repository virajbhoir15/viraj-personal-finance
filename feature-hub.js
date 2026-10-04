/* Viraj Finance — restored advanced tools + financial health */
(function(){
  "use strict";
  var q=function(s){return document.querySelector(s)},el=function(id){return document.getElementById(id)};
  function d(){return window.data||{}}
  function n(v){var x=Number(v);return isFinite(x)?x:0}
  function eur(v){return "€"+n(v).toLocaleString("en-IE",{minimumFractionDigits:2,maximumFractionDigits:2})}
  function inr(v){return "₹"+Math.round(n(v)).toLocaleString("en-IN")}
  function spend(k){var m=d().months&&d().months[k]||{};return Object.values(m.actual||{}).reduce(function(s,v){return s+n(v)},0)}
  function budget(k){var m=d().months&&d().months[k]||{};return Object.values(m.budget||{}).reduce(function(s,v){return s+n(v)},0)}
  function currentMonth(){var ks=Object.keys(d().months||{}).sort();return ks.length?ks[ks.length-1]:""}
  function safe(){
    var cash=(d().accounts||[]).filter(function(a){return a.currency==="EUR"&&a.includeInSafeSpend!==false&&a.type!=="Credit Card"}).reduce(function(s,a){return s+n(a.balance)},0);
    var rec=(d().recurring||[]).filter(function(x){return x.currency==="EUR"}).reduce(function(s,x){return s+n(x.amount)},0);
    return cash-rec-1000;
  }
  function health(){
    var k=currentMonth(),m=d().months&&d().months[k]||{},b=n(m.income),a=spend(k),safeVal=safe(),score=100;
    if(b>0&&a>b)score-=Math.min(35,10+((a-b)/b)*50);
    if(safeVal<0)score-=30; else if(safeVal<250)score-=15;
    var savings=(d().accounts||[]).filter(function(x){return x.currency==="EUR"&&/savings/i.test(x.name)}).reduce(function(s,x){return s+n(x.balance)},0);
    if(savings<300)score-=15; else if(savings<1000)score-=8;
    if(!(d().loan&&n(d().loan.payment)>0))score-=5;
    return {score:Math.max(0,Math.min(100,Math.round(score))),safe:safeVal,overspend:b>0&&a>b};
  }
  var style=document.createElement("style");style.id="virajFeatureHubStyle";style.textContent=
    ".pfToolsBtn{border:1px solid #dce3f0;background:#fff;color:#3157d5;border-radius:9px;padding:8px 10px;font-weight:850}.pfToolsBtn span{font-size:12px}.pfToolsPanel{position:fixed;inset:0;background:#17203366;z-index:250;display:none;align-items:flex-end;justify-content:center;padding:0}.pfToolsSheet{width:min(760px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:22px 22px 0 0;padding:20px;box-shadow:0 -20px 70px #17203335}.pfToolsHead{display:flex;align-items:center;justify-content:space-between}.pfToolsHead h2{margin:0;font-size:20px}.pfToolsClose{border:0;background:#f1f4f8;border-radius:9px;width:36px;height:36px;font-size:21px}.pfToolGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}.pfToolCard{border:1px solid #e3e8f0;background:#fff;border-radius:14px;padding:14px;text-align:left}.pfToolCard .pfToolIcon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:18px;margin-bottom:9px}.pfToolCard b{display:block;font-size:13px}.pfToolCard small{display:block;color:#718096;font-size:10px;line-height:1.4;margin-top:3px}.pfToolCard button{margin-top:9px}.pfHealth{display:flex;align-items:center;gap:14px;padding:14px;background:linear-gradient(135deg,#f0f5ff,#f7f1ff);border:1px solid #dfe6f7;border-radius:15px;margin-top:12px}.pfHealthScore{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;flex:none;background:conic-gradient(#3157d5 0deg,#7c3aed 220deg,#e7ebf2 220deg);position:relative}.pfHealthScore:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#fff}.pfHealthScore strong{position:relative;z-index:1;font-size:20px}.pfHealthText{flex:1}.pfHealthText b{display:block;font-size:14px}.pfHealthText small{display:block;color:#697386;font-size:10px;line-height:1.45;margin-top:4px}.pfHealthStats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;min-width:190px}.pfHealthStats div{background:#fff;border:1px solid #e3e8f0;border-radius:10px;padding:8px}.pfHealthStats span{display:block;color:#8a93a3;font-size:9px;text-transform:uppercase;font-weight:850}.pfHealthStats strong{display:block;margin-top:2px;font-size:12px}.pfImportInput{display:none}@media(max-width:700px){.pfToolsBtn{width:35px;height:35px;padding:0;display:grid;place-items:center;font-size:0}.pfToolsBtn:before{content:"☷";font-size:19px}.pfToolGrid{grid-template-columns:1fr}.pfToolsSheet{padding:17px;max-height:90dvh}.pfHealth{align-items:flex-start;flex-wrap:wrap}.pfHealthStats{width:100%;min-width:0}.pfHealthScore{width:64px;height:64px}.pfHealthScore strong{font-size:18px}}";
  document.head.appendChild(style);

  function navigate(id){
    closeTools();
    if(typeof window.showView==="function")window.showView(id);
    else if(typeof window.show==="function")window.show(id);
  }
  function openTools(){
    var p=el("pfToolsPanel");if(p)p.style.display="flex";
  }
  function closeTools(){var p=el("pfToolsPanel");if(p)p.style.display="none"}
  function addTopButton(){
    var top=q(".topActions");if(!top||el("pfToolsBtn"))return;
    var b=document.createElement("button");b.id="pfToolsBtn";b.className="pfToolsBtn";b.innerHTML="<span>☷ Tools</span>";b.title="More finance tools";b.onclick=openTools;
    top.insertBefore(b,top.firstElementChild);
  }
  function addToolsPanel(){
    if(el("pfToolsPanel"))return;
    var p=document.createElement("div");p.id="pfToolsPanel";p.className="pfToolsPanel";
    p.innerHTML='<div class="pfToolsSheet"><div class="pfToolsHead"><div><div class="eyebrow">RESTORED TOOLKIT</div><h2>More finance tools</h2></div><button class="pfToolsClose">×</button></div>'+
      '<div class="pfToolGrid">'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#eef2ff;color:#3157d5">◔</div><b>Planning centre</b><small>Safe-to-spend, purchase affordability and long-term decision tools.</small><button class="uxSecondary" data-pf-nav="planning">Open planning</button></div>'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#edf9f4;color:#13986b">↗</div><b>Insights & reports</b><small>Spending analytics, monthly trends and net-worth snapshots.</small><button class="uxSecondary" data-pf-nav="insights">Open insights</button></div>'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#f4edff;color:#7a42d8">✦</div><b>Finance AI</b><small>Ask questions using your stored finance data.</small><button class="uxSecondary" data-pf-nav="ai">Open Finance AI</button></div>'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#eaf8fb;color:#0b879c">₹</div><b>Education loan</b><small>Full repayment calculator, scenarios and interest-saved model.</small><button class="uxSecondary" data-pf-nav="loan">Open calculator</button></div>'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#fff4df;color:#b86b00">☁</div><b>Backup & restore</b><small>Google Drive backup plus local JSON export/import.</small><button class="uxSecondary" data-pf-nav="settings">Open settings</button></div>'+
      '<div class="pfToolCard"><div class="pfToolIcon" style="background:#f2f4f8;color:#44546a">⇩</div><b>Import CSV</b><small>Bring an exported transaction ledger into the unified app ledger.</small><button class="uxSecondary" id="pfCsvButton">Import CSV</button><input id="pfCsvInput" class="pfImportInput" type="file" accept=".csv,text/csv"></div>'+
      '</div><div class="hint">Advanced features stay here so the main mobile navigation remains simple.</div></div>';
    document.body.appendChild(p);
    p.addEventListener("click",function(e){
      if(e.target===p||e.target.closest(".pfToolsClose"))closeTools();
      var nav=e.target.closest("[data-pf-nav]");if(nav)navigate(nav.dataset.pfNav);
      if(e.target.closest("#pfCsvButton"))el("pfCsvInput").click();
    });
    el("pfCsvInput").addEventListener("change",importCSV);
  }
  function importCSV(e){
    var file=e.target.files&&e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(){
      var text=String(reader.result||"").trim();if(!text)return alert("CSV is empty.");
      var lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)return alert("CSV needs a header row and at least one transaction.");
      var headers=lines[0].split(",").map(function(x){return x.trim().toLowerCase()});
      var idx=function(names){for(var i=0;i<names.length;i++){var j=headers.indexOf(names[i]);if(j>=0)return j}return -1};
      var idDate=idx(["date"]),idDesc=idx(["description","merchant","name"]),idAmt=idx(["amount","value"]),idCur=idx(["currency"]),idType=idx(["type"]),idCat=idx(["category"]),idAcc=idx(["accountid","account","account id"]),idNotes=idx(["notes"]);
      if(idDate<0||idAmt<0)return alert("CSV must contain at least Date and Amount columns.");
      var added=0;
      lines.slice(1).forEach(function(line){
        var cells=line.split(",");var amount=n(cells[idAmt]);if(!amount)return;
        var type=idType>=0&&/income|transfer|goal/i.test(cells[idType])?String(cells[idType]).trim().toLowerCase():"expense";
        var currency=idCur>=0&&/INR/i.test(cells[idCur])?"INR":"EUR";
        var tx={id:"csv-"+Date.now().toString(36)+"-"+added,date:String(cells[idDate]||"").trim(),description:String(idDesc>=0?cells[idDesc]:"Imported transaction").trim()||"Imported transaction",amount:amount,currency:currency,type:type,category:String(idCat>=0?cells[idCat]:"Other").trim()||"Other",accountId:String(idAcc>=0?cells[idAcc]:"").trim(),notes:String(idNotes>=0?cells[idNotes]:"Imported from CSV").trim()};
        if(!tx.date)return;
        if(window.financeCore&&typeof window.financeCore.addTransaction==="function"){window.financeCore.addTransaction(tx);added++}
      });
      alert(added+" transaction"+(added===1?"":"s")+" imported.");
      closeTools();
      if(typeof window.showView==="function")window.showView("money");
      e.target.value="";
    };
    reader.readAsText(file);
  }
  function addHealth(){
    if(window.__view!=="dashboard"||el("pfHealth"))return;
    var content=el("pfContent");if(!content)return;
    var stats=content.querySelector(".statsGrid");if(!stats)return;
    var h=health(),msg=h.score>=80?"Strong foundation":h.score>=60?"Needs some attention":"Action needed";
    var panel=document.createElement("section");panel.id="pfHealth";panel.className="pfHealth";
    panel.innerHTML='<div class="pfHealthScore" style="background:conic-gradient(#3157d5 0deg,#7c3aed '+(h.score*3.6)+'deg,#e7ebf2 '+(h.score*3.6)+'deg)"><strong>'+h.score+'</strong></div><div class="pfHealthText"><b>Financial Health <span class="badge">APP SCORE</span></b><small>'+msg+'. This is a simple planning score based on your stored safe-to-spend, spending discipline, savings and loan-plan data — not a credit score.</small></div><div class="pfHealthStats"><div><span>Safe to spend</span><strong class="'+(h.safe<0?"negative":"positive")+'">'+eur(h.safe)+'</strong></div><div><span>Budget check</span><strong class="'+(h.overspend?"negative":"positive")+'">'+(h.overspend?"Over budget":"On track")+'</strong></div></div>';
    stats.parentNode.insertBefore(panel,stats.nextSibling);
  }
  function ensureLiveFX(){if(window.__view==="dashboard"&&window.virajFX&&typeof window.virajFX.decorate==="function"){window.virajFX.decorate();setTimeout(function(){if(!document.getElementById("virajFxCard"))window.virajFX.decorate();},500);}}
  function boot(){addTopButton();addToolsPanel();addHealth();ensureLiveFX();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,300)});else setTimeout(boot,300);
  var oldShow=window.show;
  window.show=function(id){
    var r=oldShow?oldShow.apply(this,arguments):null;
    setTimeout(function(){addTopButton();addToolsPanel();addHealth();ensureLiveFX()},180);
    return r;
  };
  window.pfTools={open:openTools,close:closeTools,health:health};
})();