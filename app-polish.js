/* Viraj Finance - responsive shell + restored feature surface */
(function(){
  "use strict";
  function el(id){return document.getElementById(id);}
  function d(){return window.data||{};}
  function n(v){var x=Number(v);return isFinite(x)?x:0;}
  function eur(v){return "€"+n(v).toLocaleString("en-IE",{minimumFractionDigits:2,maximumFractionDigits:2});}
  function inr(v){return "₹"+Math.round(n(v)).toLocaleString("en-IN");}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m];});}
  function dateLabel(x){if(!x)return "—";return new Date(x+"T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"});}
  function monthLabel(k){return new Date(k+"-01T00:00:00").toLocaleDateString("en-IE",{month:"short",year:"numeric"});}
  function months(){return Object.keys(d().months||{}).sort();}
  function spend(k){var a=d().months&&d().months[k]&&d().months[k].actual||{};return Object.values(a).reduce(function(s,v){return s+n(v)},0);}
  function budget(k){var a=d().months&&d().months[k]&&d().months[k].budget||{};return Object.values(a).reduce(function(s,v){return s+n(v)},0);}
  function safeSpend(){
    var accounts=(d().accounts||[]).filter(function(a){return a.currency==="EUR"&&a.includeInSafeSpend!==false;});
    var spendable=accounts.reduce(function(s,a){return s+n(a.balance)},0);
    var recurring=(d().recurring||[]).filter(function(r){return r.currency==="EUR";}).reduce(function(s,r){return s+n(r.amount)},0);
    return spendable-recurring-1000;
  }

  var CSS=`
    .uxSettingsTop{border:1px solid #e1e5ec;background:#fff;color:#4d586b;border-radius:9px;padding:8px 10px;font-weight:800}
    .uxRestoredTools{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .uxTool{border:1px solid #e4e8f0;background:#fff;border-radius:11px;padding:13px}
    .uxTool small{display:block;color:#7b8494;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    .uxTool strong{display:block;font-size:17px;margin-top:6px}
    .uxTool p{margin:5px 0 0;color:#697386;font-size:11px;line-height:1.4}
    .uxTool button{margin-top:8px}
    .uxHistoryTable td,.uxHistoryTable th{padding:9px 8px}
    .uxHistoryTable tr:last-child td{border-bottom:0}
    @media(max-width:900px){.uxRestoredTools{grid-template-columns:1fr 1fr}}
    @media(max-width:700px){
      body{font-size:13px;padding-bottom:72px}
      .sidebar{display:none!important}
      .main{margin-left:0!important;width:100%!important}
      .topbar{height:68px;padding:0 12px;gap:8px}
      .topbar h1{font-size:17px}
      .crumb{font-size:8px}
      .topActions{gap:5px}
      .topActions .iconBtn{display:none}
      .userChip{padding:7px 8px!important;font-size:11px}
      .userChip span{display:none}
      .uxSettingsTop{padding:7px 8px}
      .content{padding:15px 12px 28px!important}
      .heroRow{flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:13px}
      .heroRow h2{font-size:24px}
      .heroRow .actions{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .statsGrid{grid-template-columns:1fr 1fr!important;gap:8px}
      .stat{padding:12px!important}
      .stat strong{font-size:19px}
      .dashboardGrid,.dashboardGrid.lower,.reportGrid,.planningGrid{grid-template-columns:1fr!important}
      .loanSummary{grid-template-columns:1fr 1fr!important}
      .loanSummary>div{padding:13px}
      .formGrid{grid-template-columns:1fr!important}
      .commitmentGrid{grid-template-columns:1fr 1fr!important}
      .accountGrid,.goalGrid{grid-template-columns:1fr!important}
      .uxAccountGrid,.uxPlanGrid{grid-template-columns:1fr!important}
      .uxMerchantRail{grid-template-columns:1fr 1fr!important}
      .virajFxGrid{grid-template-columns:1fr!important}
      .panel,.view .card{padding:14px!important;border-radius:12px}
      .panelHead{gap:8px;flex-wrap:wrap}
      .tableWrap{overflow-x:auto}
      .tableWrap table{min-width:620px}
      .mobileNav{display:grid!important;position:fixed;left:0;right:0;bottom:0;height:68px;background:#fff;border-top:1px solid #e3e7ef;z-index:80;grid-template-columns:repeat(5,1fr);padding:5px 6px 7px;box-shadow:0 -8px 30px #17203310}
      .mobileNav button{border:0;background:transparent;border-radius:10px;color:#667085;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
      .mobileNav button.active{background:#edf2ff;color:#3157d5}
      .uxAdd{right:14px!important;bottom:78px!important}
      .uxTypeTabs{grid-template-columns:1fr 1fr}
      .uxSheet{width:100%;max-width:none}
      .uxTool{padding:11px}
      .uxTool strong{font-size:15px}
    }
  `;
  if(!el("virajResponsiveRestoredStyle")){
    var st=document.createElement("style");st.id="virajResponsiveRestoredStyle";st.textContent=CSS;document.head.appendChild(st);
  }

  function ensureSettings(){
    var side=document.querySelector(".sidebar");
    if(side&&!side.querySelector('[data-nav="settings"]')){
      var b=document.createElement("button");b.dataset.nav="settings";b.textContent="Settings";b.style.marginTop="2px";
      var foot=side.querySelector(".sidebarFoot");if(foot)side.insertBefore(b,foot);else side.appendChild(b);
    }
    var top=document.querySelector(".topActions");
    if(top&&!top.querySelector(".uxSettingsTop")){
      var b=document.createElement("button");b.className="uxSettingsTop";b.dataset.nav="settings";b.textContent="⚙";
      top.insertBefore(b,top.lastElementChild||null);
    }
  }

  function decorateTitles(){
    var id=window.__view||"dashboard";
    var names={dashboard:"Home",money:"Money",budget:"Budget",plans:"Plans",loan:"Education Loan",reports:"Insights",ai:"Finance AI",settings:"Settings"};
    var t=el("pageTitle");if(t)t.textContent=names[id]||"Home";
    document.title=(names[id]||"Home")+" · Viraj Finance";
  }

  function addDashboardTools(){
    if(window.__view!=="dashboard"||el("uxRestoredDashboardTools"))return;
    var content=el("pfContent");if(!content)return;
    var stats=content.querySelector(".statsGrid");if(!stats)return;
    var dd=d(), goals=dd.goals||[], emergency=goals.find(function(g){return g.name==="Emergency Fund";}), mumbai=goals.find(function(g){return /mumbai/i.test(g.name);});
    var savings=(dd.accounts||[]).find(function(a){return a.name==="AIB Savings";}), loan=dd.loan||{};
    var panel=document.createElement("section");panel.id="uxRestoredDashboardTools";panel.className="panel";
    panel.innerHTML='<div class="panelHead"><div><div class="eyebrow">PLANS AT A GLANCE</div><h2>Goals, debt & reserve</h2></div><button class="uxSecondary" data-nav="plans">Open Plans →</button></div>'+
      '<div class="uxRestoredTools">'+
      '<div class="uxTool"><small>Emergency fund</small><strong>'+eur(emergency&&emergency.current||0)+'</strong><p>Target '+eur(emergency&&emergency.target||5000)+'</p></div>'+
      '<div class="uxTool"><small>Education loan</small><strong>'+inr(loan.opening||0)+'</strong><p>'+inr(loan.payment||100000)+' monthly plan</p><button class="uxSecondary" data-nav="loan">Calculator</button></div>'+
      '<div class="uxTool"><small>Mumbai home</small><strong>'+inr(mumbai&&mumbai.target||20000000)+'</strong><p>Long-term INR target</p></div>'+
      '<div class="uxTool"><small>AIB savings</small><strong>'+eur(savings&&savings.balance||0)+'</strong><p>Kept outside safe-to-spend</p></div>'+
      '</div>';
    var grid=content.querySelector(".dashboardGrid");if(grid)grid.parentNode.insertBefore(panel,grid);else content.appendChild(panel);
  }

  function addMoneyHistory(){
    if(window.__view!=="money"||el("uxMoneyHistory"))return;
    var content=el("pfContent");if(!content)return;
    var ks=months().slice(-6),dd=d();
    var rows=ks.map(function(k){var m=dd.months[k]||{};return '<tr><td>'+esc(monthLabel(k))+'</td><td>'+eur(m.income||0)+'</td><td>'+eur(spend(k))+'</td><td>'+eur(budget(k))+'</td><td class="'+(spend(k)>n(m.income)?"negative":"positive")+'">'+eur(n(m.income)-spend(k))+'</td></tr>';}).join("");
    var sec=document.createElement("section");sec.id="uxMoneyHistory";sec.className="panel";
    sec.innerHTML='<div class="panelHead"><div><div class="eyebrow">PRESERVED TRACKER</div><h2>Monthly history</h2></div><span class="uxMuted">Legacy monthly totals remain intact</span></div>'+
      '<div class="tableWrap"><table class="uxHistoryTable"><thead><tr><th>Month</th><th>Income</th><th>Actual spend</th><th>Budget</th><th>Left</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<p class="hint">The transaction ledger is a separate, item-level record. Your July–September tracker totals continue to drive reports and budget analysis.</p>';
    content.appendChild(sec);
  }

  function addPlansTools(){
    if(window.__view!=="plans"||el("uxPlansTools"))return;
    var content=el("pfContent");if(!content)return;
    var dd=d(),safe=safeSpend();
    var recurring=(dd.recurring||[]).filter(function(r){return r.currency==="EUR";}).reduce(function(s,r){return s+n(r.amount)},0);
    var panel=document.createElement("section");panel.id="uxPlansTools";panel.className="panel";
    panel.innerHTML='<div class="panelHead"><div><div class="eyebrow">DECISION TOOLS</div><h2>Before you spend</h2></div><span class="uxMuted">Planning tools restored</span></div>'+
      '<div class="uxRestoredTools">'+
      '<div class="uxTool"><small>Safe to spend</small><strong class="'+(safe<0?"negative":"positive")+'">'+eur(safe)+'</strong><p>After recurring commitments and the €1,000 reserve.</p></div>'+
      '<div class="uxTool"><small>Recurring commitments</small><strong>'+eur(recurring)+'</strong><p>Monthly EUR commitments currently saved.</p><button class="uxSecondary" data-ux-rec-add>+ Add recurring</button></div>'+
      '<div class="uxTool"><small>Purchase check</small><strong>€400</strong><p>Quick test against your current safe-to-spend amount.</p><button class="uxSecondary" data-ux-afford-check>Check purchase</button></div>'+
      '<div class="uxTool"><small>Education loan</small><strong>'+inr(dd.loan&&dd.loan.payment||100000)+'</strong><p>Monthly payment currently in the model.</p><button class="uxSecondary" data-nav="loan">Open calculator</button></div>'+
      '</div>';
    var first=content.querySelector(".uxPlanGrid,.goalGrid,.panel");if(first)content.insertBefore(panel,first);else content.appendChild(panel);
  }

  function addReportSummary(){
    if(window.__view!=="reports"||el("uxReportSummary"))return;
    var content=el("pfContent");if(!content)return;
    var ks=months().slice(-6),total=ks.reduce(function(s,k){return s+spend(k)},0),avg=ks.length?total/ks.length:0;
    var peak=ks.reduce(function(best,k){return spend(k)>spend(best)?k:best},ks[0]||"");
    var cats={};ks.forEach(function(k){Object.entries((d().months[k]&&d().months[k].actual)||{}).forEach(function(x){cats[x[0]]=(cats[x[0]]||0)+n(x[1]);});});
    var top=Object.entries(cats).sort(function(a,b){return b[1]-a[1]})[0];
    var g=document.createElement("div");g.id="uxReportSummary";g.className="statsGrid compact";
    g.innerHTML='<div class="stat"><span>6-month spend</span><strong>'+eur(total)+'</strong><small>Tracked monthly totals</small></div>'+
      '<div class="stat"><span>Average / month</span><strong>'+eur(avg)+'</strong><small>Based on '+ks.length+' months</small></div>'+
      '<div class="stat"><span>Highest month</span><strong>'+eur(peak?spend(peak):0)+'</strong><small>'+esc(peak?monthLabel(peak):"No data")+'</small></div>'+
      '<div class="stat"><span>Top category</span><strong>'+esc(top?top[0]:"—")+'</strong><small>'+eur(top?top[1]:0)+' total</small></div>';
    var hero=content.querySelector(".heroRow");if(hero)hero.parentNode.insertBefore(g,hero.nextSibling);else content.insertBefore(g,content.firstChild);
  }

  var previousShow=window.show;
  window.show=function(id){
    var r=previousShow?previousShow.apply(this,arguments):null;
    setTimeout(function(){
      ensureSettings();
      decorateTitles();
      addDashboardTools();
      addMoneyHistory();
      addPlansTools();
      addReportSummary();
    },40);
    return r;
  };

  document.addEventListener("click",function(e){
    var a=e.target.closest("[data-ux-afford-check]");
    if(a){
      e.preventDefault();e.stopImmediatePropagation();
      var v=prompt("Purchase amount in EUR","400");if(v){var p=n(v);alert("After a "+eur(p)+" purchase, your modelled safe-to-spend would be about "+eur(safeSpend()-p)+".");}
      return;
    }
  },true);

  function boot(){
    ensureSettings();
    decorateTitles();
    addDashboardTools();
    addMoneyHistory();
    addPlansTools();
    addReportSummary();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,250)});else setTimeout(boot,250);
})();
