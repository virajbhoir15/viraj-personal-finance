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
    .pfBottomIcon{width:22px;height:22px;display:block}.pfBottomIcon path,.pfBottomIcon circle,.pfBottomIcon rect,.pfBottomIcon polyline,.pfBottomIcon line{vector-effect:non-scaling-stroke}.pfBottomLabel{display:block;font-size:11px;font-weight:900;line-height:1.1;margin-top:4px}.mobileNav button{position:relative;min-height:58px;flex-direction:column;gap:0;color:#697386}.mobileNav button .pfNavIcon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;margin-top:2px;transition:transform .15s ease,box-shadow .15s ease}.mobileNav button[data-nav="dashboard"] .pfNavIcon{background:#eaf0ff;color:#3157d5}.mobileNav button[data-nav="money"] .pfNavIcon{background:#e9fbf4;color:#0f9f6e}.mobileNav button[data-nav="budget"] .pfNavIcon{background:#fff4dc;color:#d27b00}.mobileNav button[data-nav="plans"] .pfNavIcon{background:#f2ebff;color:#7a42d8}.mobileNav button[data-nav="loan"] .pfNavIcon{background:#e8f8fb;color:#10869b}.mobileNav button.active{background:transparent;color:#172033}.mobileNav button.active .pfNavIcon{transform:translateY(-3px);box-shadow:0 8px 18px #17203318}.mobileNav button.active .pfBottomLabel{color:#172033}.mobileNav:after{content:"";position:absolute;left:12%;right:12%;bottom:1px;height:3px;border-radius:99px;background:linear-gradient(90deg,#3157d5,#8b5cf6,#0ea5e9,#10b981,#f59e0b);opacity:.75}.pfNavIcon svg{width:23px;height:23px;display:block}.mobileNav button.active[data-nav="dashboard"] .pfNavIcon{background:linear-gradient(135deg,#3157d5,#6d5dfc);color:#fff}.mobileNav button.active[data-nav="money"] .pfNavIcon{background:linear-gradient(135deg,#0f9f6e,#35c99b);color:#fff}.mobileNav button.active[data-nav="budget"] .pfNavIcon{background:linear-gradient(135deg,#d97706,#f4b342);color:#fff}.mobileNav button.active[data-nav="plans"] .pfNavIcon{background:linear-gradient(135deg,#7a42d8,#a978ff);color:#fff}.mobileNav button.active[data-nav="loan"] .pfNavIcon{background:linear-gradient(135deg,#0b879c,#29b9cf);color:#fff}.pfBottomBarTitle{display:none}\n    @media(max-width:1100px){
      .mobileNav{height:84px!important;padding:7px 8px 9px!important}
      body{font-size:13px;padding-bottom:94px}
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


  function decorateBottomNav(){
    var mobile=document.querySelector(".mobileNav");
    if(!mobile)return;
    var items=[
      ["dashboard","Home",'M3 10.5 12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
      ["money","Money",'M4 6h16v12H4z M7 9h5 M7 13h4 M16 9h1'],
      ["budget","Budget",'M4 19V5 M4 19h16 M8 16v-4 M12 16V8 M16 16V10'],
      ["plans","Plans",'M12 3 14.8 8.7 21 9.6 16.5 14l1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z'],
      ["loan","Loan",'M3 10 12 4l9 6v8H3z M8 21v-6h8v6 M8 10h8']
    ];
    mobile.innerHTML=items.map(function(x){
      return '<button type="button" data-nav="'+x[0]+'"><span class="pfNavIcon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+x[2].split(" M").map(function(p,i){return (i?"<path d=\"M"+p+"\"></path>":"<path d=\""+p+"\"></path>");}).join("")+'</svg></span><span class="pfBottomLabel">'+x[1]+'</span></button>';
    }).join("");
    var active=window.__view||"dashboard";
    mobile.querySelectorAll("[data-nav]").forEach(function(b){b.classList.toggle("active",b.dataset.nav===active);});
  }


    @media(max-width:1100px){
      html{width:100%;min-height:100%;background:#f4f6fb;overflow-x:hidden}
      body{width:100%;min-width:0;min-height:100dvh;overflow-x:hidden;background:#f4f6fb;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;overscroll-behavior-y:contain}
      .appShell{min-height:100dvh}
      .main{min-width:0;width:100%!important;margin:0!important}
      .topbar{position:sticky;top:0;height:64px!important;min-height:64px;padding:8px 14px!important;background:rgba(255,255,255,.96)!important;border-bottom:1px solid #e7eaf0;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:70}
      .topbar>div:first-child{min-width:0;display:flex;flex-direction:column;justify-content:center}
      .crumb{display:none!important}
      .topbar h1{margin:0!important;font-size:18px!important;line-height:1.1;display:flex;align-items:center;gap:8px;letter-spacing:-.02em}
      .topbar h1:before{content:"";width:26px;height:26px;border-radius:8px;background:#3157d5 url("icon.svg") center/cover no-repeat;display:inline-block;flex:none;box-shadow:0 4px 12px #3157d526}
      .topActions{margin-left:auto;gap:6px!important;align-items:center}
      .topActions .userChip{font-size:11px!important;padding:7px 9px!important;border-radius:10px!important;background:#f7f9fd!important}
      .uxTopSearch{margin:0!important}
      .uxAIButton{padding:8px 9px!important;border-radius:10px!important;font-size:11px!important}
      .uxSettingsTop{width:34px;height:34px;padding:0!important;border-radius:10px!important;font-size:16px!important;display:grid;place-items:center}
      .content{width:100%;max-width:none!important;padding:14px 12px calc(104px + env(safe-area-inset-bottom))!important}
      .heroRow{margin-bottom:12px!important;gap:9px!important}
      .heroRow h2{font-size:23px!important;line-height:1.08}
      .heroRow p{font-size:12px;line-height:1.45}
      .heroRow .actions{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important}
      .heroRow .actions button,.actions button,.primary,.uxSecondary{min-height:42px}
      .statsGrid{grid-template-columns:1fr 1fr!important;gap:8px!important}
      .stat{min-width:0;padding:12px!important;border-radius:14px!important;box-shadow:0 2px 12px #1720330b}
      .stat span{font-size:9px!important;letter-spacing:.05em}
      .stat strong{font-size:18px!important;line-height:1.05;overflow-wrap:anywhere}
      .stat small{font-size:10px!important}
      .panel,.view .card{margin-top:10px!important;padding:14px!important;border-radius:16px!important;box-shadow:0 2px 14px #1720330b}
      .panelHead{margin-bottom:11px!important}
      .panel h2{font-size:14px!important}
      .dashboardGrid,.dashboardGrid.lower,.reportGrid,.planningGrid{grid-template-columns:1fr!important;gap:10px!important}
      .tableWrap{border-radius:12px;overflow:auto;-webkit-overflow-scrolling:touch}
      th{font-size:9px!important}
      th,td{padding:10px 8px!important;white-space:nowrap}
      input,select,.toolbar input,.uxField input,.uxField select{min-height:42px;font-size:16px!important}
      .uxSheetBack,.modalBack{padding:0!important;align-items:flex-end!important}
      .uxSheet,.modal{width:100%!important;max-width:none!important;max-height:92dvh;border-radius:22px 22px 0 0!important;padding:18px!important;padding-bottom:calc(18px + env(safe-area-inset-bottom))!important}
      .uxSheetHead,.modalHead{position:sticky;top:0;background:#fff;z-index:2;padding-bottom:9px}
      .uxSheetHead h2,.modalHead h2{font-size:19px!important}
      .uxTypeTabs{gap:7px!important}
      .uxTypeTabs button{min-height:44px;font-size:13px}
      .mobileNav{display:grid!important;position:fixed!important;left:0;right:0;bottom:0;height:calc(82px + env(safe-area-inset-bottom))!important;padding:7px 8px calc(8px + env(safe-area-inset-bottom))!important;background:rgba(255,255,255,.97)!important;border-top:1px solid #e0e5ee!important;box-shadow:0 -10px 28px #17203316!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:95!important}
      .mobileNav button{min-height:62px!important;border:0!important;background:transparent!important;border-radius:14px!important;padding:3px 2px!important;font-size:12px!important;font-weight:900!important;display:flex!important;align-items:center;justify-content:center;flex-direction:column;gap:3px;color:#64748b}
      .mobileNav button .pfNavIcon{width:38px!important;height:38px!important;border-radius:12px!important}
      .mobileNav button .pfNavIcon svg{width:23px!important;height:23px!important}
      .mobileNav button .pfBottomLabel{font-size:11px!important;font-weight:900!important;line-height:1!important}
      .mobileNav button.active .pfBottomLabel{font-size:11.5px!important}
      .mobileNav:after{left:14%!important;right:14%!important;height:3px!important;bottom:calc(2px + env(safe-area-inset-bottom))!important}
      .uxAdd{width:56px!important;height:56px!important;border-radius:50%!important;right:15px!important;bottom:calc(92px + env(safe-area-inset-bottom))!important;padding:0!important;font-size:0!important;display:grid!important;place-items:center;box-shadow:0 12px 28px #3157d552!important}
      .uxAdd:before{content:"+";font-size:28px;line-height:1;font-weight:400}
      .barChart{height:200px!important;gap:9px!important}
      .barTrack{height:145px!important}
      .barTrack i{width:24px!important}
      .fxHistoryHead{align-items:flex-start!important;flex-direction:column!important}
      .fxRangeTabs{width:100%!important;display:grid!important;grid-template-columns:repeat(6,1fr);gap:4px!important}
      .fxRangeTabs button{min-height:36px;padding:6px 3px!important;font-size:9px!important}
      .virajFxChart{height:210px!important}
      .fxStats{grid-template-columns:1fr 1fr!important}
      .uxMerchantRail{grid-template-columns:1fr 1fr!important}
    }
    @media(max-width:390px){
      .topbar{padding-left:10px!important;padding-right:10px!important}
      .topbar h1{font-size:16px!important}
      .topbar h1:before{width:24px;height:24px}
      .content{padding-left:10px!important;padding-right:10px!important}
      .stat strong{font-size:16px!important}
      .mobileNav button .pfNavIcon{width:35px!important;height:35px!important}
      .mobileNav button .pfBottomLabel{font-size:10px!important}
    }

  var previousShow=window.show;
  window.show=function(id){
    var r=previousShow?previousShow.apply(this,arguments):null;
    setTimeout(function(){
      ensureSettings();
      decorateBottomNav();
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
    decorateBottomNav();
    decorateTitles();
    addDashboardTools();
    addMoneyHistory();
    addPlansTools();
    addReportSummary();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,250)});else setTimeout(boot,250);
})();
