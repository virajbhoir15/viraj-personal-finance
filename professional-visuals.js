/* Viraj Finance - professional visual layer */
(function(){
  "use strict";
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;"}[m]})}
  function merchantFor(t){
    var s=((t&&t.description)||"")+" "+((t&&t.category)||"");
    s=s.toLowerCase();
    if(/lidl/.test(s))return ["L","Lidl","merchant-lidl"];
    if(/dunnes/.test(s))return ["D","Dunnes","merchant-dunnes"];
    if(/aldi/.test(s))return ["A","Aldi","merchant-aldi"];
    if(/tesco/.test(s))return ["T","Tesco","merchant-tesco"];
    if(/esb/.test(s))return ["E","ESB","merchant-esb"];
    if(/rent|landlord/.test(s))return ["R","Rent","merchant-rent"];
    if(/salary|payday/.test(s))return ["€","Salary","merchant-salary"];
    if(/gym/.test(s))return ["G","Gym","merchant-gym"];
    if(/mrcpi|exam/.test(s))return ["M","M","merchant-mrcpi"];
    if(/skincare|skin/.test(s))return ["S","Skin","merchant-skin"];
    if(/donat/.test(s))return ["D","Donation","merchant-donation"];
    return [t&&t.type==="income"?"+":"•","", "merchant-default"];
  }
  function addBrand(){
    var b=document.querySelector(".brandMark");if(b&&!b.querySelector("img"))b.innerHTML='<img src="icon.svg" alt="Viraj Finance">';
    var st=document.getElementById("virajVisualStyle");if(st)return;
    st=document.createElement("style");st.id="virajVisualStyle";st.textContent='.brandMark{overflow:hidden}.brandMark img{width:100%;height:100%;display:block}.uxTx .txIcon,.txRow .txIcon{font-size:11px!important;font-weight:900!important;letter-spacing:-.02em}.merchant-lidl{background:#edf4ff!important;color:#1546b7!important}.merchant-dunnes{background:#f2efff!important;color:#5a37a6!important}.merchant-aldi{background:#eef7ff!important;color:#184e8d!important}.merchant-tesco{background:#fff1f1!important;color:#a52a2a!important}.merchant-esb{background:#eef8f4!important;color:#13704b!important}.merchant-rent{background:#f5f1e9!important;color:#6d4b1d!important}.merchant-salary{background:#eefaf4!important;color:#13704b!important}.merchant-gym{background:#f3f3f3!important;color:#2d3642!important}.merchant-mrcpi{background:#eef2ff!important;color:#3157d5!important}.merchant-skin{background:#fff5ef!important;color:#9a4c1f!important}.merchant-donation{background:#fff2f6!important;color:#a23563!important}.merchant-default{background:#f0f3f8!important;color:#556174!important}.uxLoanCard{border:1px solid #dfe5f3;background:linear-gradient(135deg,#f7f9ff,#fff);border-radius:13px;padding:16px}.uxLoanCard h3{margin:0 0 4px;font-size:15px}.uxLoanCard .big{font-size:25px;font-weight:900;margin:8px 0}.uxLoanCard button{margin-top:9px}@media(max-width:700px){.uxLoanCard .big{font-size:21px}}';document.head.appendChild(st)
  }
  function decorateTxNodes(){
    var d=window.data||{};
    document.querySelectorAll("#pfContent .txRow").forEach(function(row){
      var id=row.getAttribute("data-fin-tx"),t=(d.transactions||[]).find(function(x){return x.id===id});
      if(!t)return;
      var icon=row.querySelector(".txIcon");if(!icon)return;
      var m=merchantFor(t);icon.textContent=m[0];icon.title=m[1]||"Transaction";icon.classList.add(m[2]);
    });
    document.querySelectorAll("#pfContent .uxTx").forEach(function(row){
      var buttons=row.querySelector("[data-ux-edit]");if(!buttons)return;
      var t=(d.transactions||[]).find(function(x){return x.id===buttons.dataset.uxEdit});if(!t)return;
      var icon=row.querySelector(".txIcon");if(!icon)return;
      var m=merchantFor(t);icon.textContent=m[0];icon.title=m[1]||"Transaction";icon.classList.add(m[2]);
    });
  }
  function addHomeLoanCard(){
    if(window.__view!=="dashboard"||document.getElementById("uxHomeLoanCard"))return;
    var content=document.getElementById("pfContent");if(!content)return;
    var stats=content.querySelector(".statsGrid"),d=window.data||{},l=d.loan||{};
    if(!stats)return;
    var wrap=document.createElement("section");wrap.id="uxHomeLoanCard";wrap.className="panel";
    var b=Number(l.opening||0),p=Number(l.payment||100000),rate=Number(l.rate||.875);
    wrap.innerHTML='<div class="uxLoanCard"><h3>Education Loan</h3><div class="big">₹'+Math.round(b).toLocaleString("en-IN")+'</div><div class="uxMuted">₹'+Math.round(p).toLocaleString("en-IN")+' / month · '+rate.toFixed(3)+'% monthly model</div><button class="uxSecondary" data-nav="loan">Open full loan calculator →</button></div>';
    stats.parentNode.insertBefore(wrap,stats.nextSibling);
  }
  function decorate(){
    addBrand();addHomeLoanCard();decorateTxNodes();
  }
  var oldShow=window.show;
  window.show=function(id){var r=oldShow?oldShow.apply(this,arguments):null;setTimeout(decorate,60);return r};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(decorate,160)});
  else setTimeout(decorate,160);
  window.virajVisuals={decorate:decorate};
})();