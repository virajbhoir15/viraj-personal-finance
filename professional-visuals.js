/* Viraj Finance — professional merchant visuals */
(function(){
  "use strict";

  var BRANDS={
    lidl:{label:"Lidl",src:"https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/lidl.svg",cls:"brand-lidl"},
    dunnes:{label:"Dunnes Stores",src:"https://upload.wikimedia.org/wikipedia/commons/7/79/Logo_of_Dunnes_Stores.svg",cls:"brand-dunnes"},
    aldi:{label:"Aldi",src:"https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/aldisud.svg",cls:"brand-aldi"},
    tesco:{label:"Tesco",src:"https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/tesco.svg",cls:"brand-tesco"},
    esb:{label:"ESB",src:"https://upload.wikimedia.org/wikipedia/commons/f/fc/ESB_Group_Logo.svg",cls:"brand-esb"}
  };

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"]/g,function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m];
    });
  }

  function merchantFor(t){
    var s=((t&&t.description)||"")+" "+((t&&t.category)||"");
    s=s.toLowerCase();
    if(/lidl/.test(s))return BRANDS.lidl;
    if(/dunnes/.test(s))return BRANDS.dunnes;
    if(/aldi/.test(s))return BRANDS.aldi;
    if(/tesco/.test(s))return BRANDS.tesco;
    if(/esb|electricity/.test(s))return BRANDS.esb;
    return null;
  }

  function fallbackLabel(t){
    var s=((t&&t.description)||"")+" "+((t&&t.category)||"");
    s=s.toLowerCase();
    if(/rent|landlord/.test(s))return ["R","Rent","merchant-rent"];
    if(/salary|payday|pay/.test(s))return ["€","Salary","merchant-salary"];
    if(/gym/.test(s))return ["G","Gym","merchant-gym"];
    if(/mrcpi|exam/.test(s))return ["M","MRCPI","merchant-mrcpi"];
    if(/skincare|skin/.test(s))return ["S","Skincare","merchant-skin"];
    if(/donat/.test(s))return ["D","Donation","merchant-donation"];
    return [t&&t.type==="income"?"+":"•","Transaction","merchant-default"];
  }

  function addBrand(){
    var b=document.querySelector(".brandMark");
    if(b&&!b.querySelector("img"))b.innerHTML='<img src="icon.svg" alt="Viraj Finance">';
  }

  function ensureStyle(){
    if(document.getElementById("virajVisualStyle"))return;
    var st=document.createElement("style");
    st.id="virajVisualStyle";
    st.textContent=
      ".brandMark{overflow:hidden;background:#f5f8ff!important;box-shadow:inset 0 0 0 1px #e0e7f5}.brandMark img{width:100%;height:100%;display:block}"+
      "#pfContent .txIcon{background:#f7f9fc!important;border:1px solid #e8ecf3;width:36px;height:36px;border-radius:10px;overflow:hidden;display:grid;place-items:center}"+
      "#pfContent .txIcon img.brandLogoImg{width:26px;height:26px;max-width:86%;max-height:86%;object-fit:contain;display:block}"+
      "#pfContent .txIcon.brand-wide img.brandLogoImg{width:29px;height:22px}"+
      ".merchant-rent{background:#f7f2ea!important;color:#6d4b1d!important}.merchant-salary{background:#eefaf4!important;color:#13704b!important}.merchant-gym{background:#f2f4f7!important;color:#2f3742!important}.merchant-mrcpi{background:#eef2ff!important;color:#3157d5!important}.merchant-skin{background:#fff5ef!important;color:#9a4c1f!important}.merchant-donation{background:#fff2f6!important;color:#a23563!important}.merchant-default{background:#f0f3f8!important;color:#556174!important}"+
      ".brand-lidl,.brand-aldi{background:#f5f8ff}.brand-dunnes{background:#fff}.brand-tesco{background:#fff7f7}.brand-esb{background:#f2faf6}"+
      ".uxMerchantPanel{margin-top:16px}.uxMerchantRail{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.uxMerchantBtn{border:1px solid #e4e8f0;background:#fff;border-radius:13px;padding:12px 10px;display:flex;align-items:center;gap:10px;text-align:left;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.uxMerchantBtn:hover{transform:translateY(-1px);box-shadow:0 10px 25px rgba(23,32,51,.08);border-color:#d0d8ea}.uxMerchantLogo{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;overflow:hidden;flex:none;border:1px solid #e9edf3;background:#fff}.uxMerchantLogo img{max-width:27px;max-height:26px;object-fit:contain}.uxMerchantLogo.wide img{max-width:29px;max-height:21px}.uxMerchantText b{display:block;font-size:12px}.uxMerchantText small{display:block;color:#7b8494;font-size:10px;margin-top:2px}.uxMerchantEyebrow{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8a93a3;font-weight:850}.uxMerchantPanel h2{margin:4px 0 0;font-size:15px}.uxMerchantPanel .panelHead{margin-bottom:12px}@media(max-width:900px){.uxMerchantRail{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.uxMerchantRail{grid-template-columns:repeat(2,1fr)}.uxMerchantBtn{padding:10px}.uxMerchantText small{display:none}}";
    document.head.appendChild(st);
  }

  function decorateTxNodes(){
    var d=window.data||{};
    document.querySelectorAll("#pfContent .txRow, #pfContent .uxTx").forEach(function(row){
      var edit=row.querySelector("[data-ux-edit]"),id=row.getAttribute("data-fin-tx")||(edit&&edit.dataset.uxEdit);
      var t=(d.transactions||[]).find(function(x){return x.id===id});
      var icon=row.querySelector(".txIcon");
      if(!t||!icon)return;
      if(icon.dataset.brandReady===t.id)return;
      icon.innerHTML="";
      var brand=merchantFor(t);
      if(brand){
        var img=document.createElement("img");
        img.className="brandLogoImg "+brand.cls;
        img.src=brand.src;
        img.alt=brand.label;
        img.title=brand.label;
        if(/dunnes|esb/.test(brand.cls))icon.classList.add("brand-wide");
        img.onerror=function(){
          icon.classList.remove("brand-wide");
          var fb=fallbackLabel(t);
          icon.textContent=fb[0];
          icon.className=icon.className.replace(/\bbrand-[^ ]+\b/g,"")+" "+fb[2];
          icon.title=fb[1];
        };
        icon.appendChild(img);
      }else{
        var fb=fallbackLabel(t);
        icon.textContent=fb[0];
        icon.classList.add(fb[2]);
        icon.title=fb[1];
      }
      icon.dataset.brandReady=t.id;
    });
  }

  function addMerchantRail(){
    if(window.__view!=="dashboard"||document.getElementById("uxMerchantPanel"))return;
    var content=document.getElementById("pfContent");
    if(!content)return;
    var anchor=content.querySelector(".dashboardGrid");
    if(!anchor)return;
    var panel=document.createElement("section");
    panel.id="uxMerchantPanel";
    panel.className="panel uxMerchantPanel";
    var items=[["lidl","Lidl","Grocery"],["dunnes","Dunnes Stores","Grocery"],["aldi","Aldi","Grocery"],["tesco","Tesco","Grocery"],["esb","ESB","Bills"]];
    panel.innerHTML=
      '<div class="panelHead"><div><div class="uxMerchantEyebrow">RECENT & COMMON</div><h2>Merchant shortcuts</h2></div><span class="uxMuted">Tap to pre-fill an expense</span></div>'+
      '<div class="uxMerchantRail">'+items.map(function(x){
        var b=BRANDS[x[0]];
        var wide=/dunnes|esb/.test(b.cls)?" wide":"";
        return '<button class="uxMerchantBtn" data-merchant="'+x[0]+'"><span class="uxMerchantLogo '+wide+'"><img src="'+b.src+'" alt="'+esc(b.label)+'"></span><span class="uxMerchantText"><b>'+esc(b.label)+'</b><small>'+esc(x[2])+'</small></span></button>';
      }).join("")+
      '</div>';
    anchor.parentNode.insertBefore(panel,anchor);
    panel.querySelectorAll("[data-merchant]").forEach(function(btn){
      btn.onclick=function(){
        var key=btn.dataset.merchant,b=BRANDS[key];
        var category=key==="esb"?"Bills":"Grocery";
        if(window.uxFinance&&typeof window.uxFinance.openAdd==="function"){
          window.uxFinance.openAdd("expense",{description:b.label,category:category,date:new Date().toISOString().slice(0,10),amount:"",currency:"EUR"});
        }
      };
      var img=btn.querySelector("img");
      if(img)img.onerror=function(){btn.querySelector(".uxMerchantLogo").textContent=b.label.charAt(0)};
    });
  }

  function addHomeLoanCard(){
    if(window.__view!=="dashboard"||document.getElementById("uxHomeLoanCard"))return;
    var content=document.getElementById("pfContent");
    if(!content)return;
    var stats=content.querySelector(".statsGrid"),d=window.data||{},l=d.loan||{};
    if(!stats)return;
    var wrap=document.createElement("section");
    wrap.id="uxHomeLoanCard";
    wrap.className="panel";
    var b=Number(l.opening||0),p=Number(l.payment||100000),rate=Number(l.rate||.875);
    wrap.innerHTML=
      '<div class="uxLoanCard"><div class="eyebrow">DEBT PLAN</div><h3>Education Loan</h3><div class="big">₹'+Math.round(b).toLocaleString("en-IN")+'</div><div class="uxMuted">₹'+Math.round(p).toLocaleString("en-IN")+' / month · '+rate.toFixed(3)+'% monthly model</div><button class="uxSecondary" data-nav="loan">Open full loan calculator →</button></div>';
    stats.parentNode.insertBefore(wrap,stats.nextSibling);
  }

  function decorate(){
    ensureStyle();
    addBrand();
    addHomeLoanCard();
    addMerchantRail();
    decorateTxNodes();
  }

  var oldShow=window.show;
  window.show=function(id){
    var r=oldShow?oldShow.apply(this,arguments):null;
    setTimeout(decorate,60);
    return r;
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(decorate,180)});
  else setTimeout(decorate,180);

  window.virajVisuals={decorate:decorate,brands:BRANDS};
})();