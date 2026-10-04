/* Viraj Finance - simple, consistent product UI */
(function () {
  "use strict";
  var legacyShow = window.show;
  window.__legacyShow = legacyShow;

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>\"]/g, function (m) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]; }); }
  function n(v) { var x = Number(v); return isFinite(x) ? x : 0; }
  function eur(v) { return "€" + n(v).toLocaleString("en-IE", {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function inr(v) { return "₹" + Math.round(n(v)).toLocaleString("en-IN"); }
  function dateLabel(d) { if (!d) return "—"; return new Date(d + "T00:00:00").toLocaleDateString("en-IE",{day:"2-digit",month:"short",year:"numeric"}); }
  function currentDate() { return new Date().toISOString().slice(0,10); }
  function data() { return window.data || {}; }

  var CSS = ".uxTopSearch{display:flex;align-items:center;gap:8px;margin-left:auto;margin-right:8px}.uxSearch{width:250px;border:1px solid #dfe4ec;background:#f8fafc;border-radius:9px;padding:9px 11px;outline:none}.uxSearch:focus{background:#fff;border-color:#9eb0e8;box-shadow:0 0 0 3px #3157d512}.uxAIButton{border:1px solid #dfe4ec;background:#fff;border-radius:9px;padding:8px 10px;font-weight:750;color:#3157d5}.uxAdd{position:fixed;right:24px;bottom:26px;z-index:55;border:0;border-radius:999px;background:#3157d5;color:#fff;font-weight:850;padding:13px 18px;box-shadow:0 10px 25px #3157d544}.uxAdd:hover{background:#2343ad}.uxSheetBack{position:fixed;inset:0;background:#17203366;z-index:200;display:none;align-items:flex-end;justify-content:center;padding:16px}.uxSheet{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 30px 90px #17203344}.uxSheetHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.uxSheetHead h2{margin:0;font-size:20px}.uxClose{border:0;background:#f1f3f7;border-radius:8px;width:34px;height:34px;font-size:20px}.uxTypeTabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:15px}.uxTypeTabs button{border:1px solid #dfe4ec;background:#fff;border-radius:9px;padding:9px 7px;font-weight:750;color:#596579}.uxTypeTabs button.active{background:#edf2ff;color:#3157d5;border-color:#c8d4ff}.uxField{margin:11px 0}.uxField label{display:block;font-size:11px;color:#697386;font-weight:800;margin-bottom:5px}.uxField input,.uxField select{width:100%;border:1px solid #d9dee7;border-radius:9px;padding:10px 11px;background:#fff}.uxGrid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}.uxInline{display:flex;align-items:center;justify-content:space-between;gap:10px}.uxHint{font-size:11px;color:#7b8494;line-height:1.45;margin-top:8px}.uxSave{width:100%;border:0;background:#3157d5;color:#fff;border-radius:9px;padding:11px;font-weight:850;margin-top:12px}.uxSecondary{border:1px solid #dfe4ec;background:#fff;color:#334155;border-radius:9px;padding:9px 11px;font-weight:750}.uxRows{display:grid;gap:8px}.uxTx{display:flex;align-items:center;gap:11px;border:1px solid #e7eaf0;background:#fff;border-radius:11px;padding:12px}.uxTxMain{flex:1;min-width:0}.uxTxMain b,.uxTxMain small{display:block}.uxTxMain b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.uxTxMain small{color:#7a8495;font-size:11px;margin-top:3px}.uxTxAmt{font-weight:850;white-space:nowrap}.uxTxActions{display:flex;gap:5px}.uxTxActions button{border:1px solid #e1e5eb;background:#fff;border-radius:7px;padding:5px 7px;font-size:10px}.uxAccountGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.uxAccount{border:1px solid #e7eaf0;border-radius:11px;background:#fff;padding:13px}.uxAccountHead{display:flex;justify-content:space-between;gap:8px}.uxAccount small{display:block;color:#7a8495;margin-top:4px;font-size:11px}.uxAccount strong{display:block;font-size:18px;margin-top:8px}.uxSectionTitle{font-size:14px;font-weight:850;margin:20px 0 9px}.uxMuted{color:#697386;font-size:12px}.uxPlanGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.uxPlanCard{border:1px solid #e7eaf0;background:#fff;border-radius:13px;padding:16px}.uxPlanCard h3{margin:0 0 5px;font-size:15px}.uxPlanCard .big{font-size:24px;font-weight:900;margin:8px 0}.uxPlanCard button{margin-top:10px}.uxProgress{height:7px;background:#edf0f4;border-radius:99px;overflow:hidden;margin:9px 0}.uxProgress i{display:block;height:100%;background:#3157d5;border-radius:99px}.uxDanger{color:#c83b45!important}.uxGood{color:#16845a!important}@media(max-width:900px){.uxSearch{width:170px}.uxAccountGrid{grid-template-columns:1fr 1fr}.uxPlanGrid{grid-template-columns:1fr}}@media(max-width:700px){.uxTopSearch{display:none}.uxAdd{right:15px;bottom:78px}.uxSheetBack{padding:0}.uxSheet{border-radius:18px 18px 0 0;max-height:90vh}.uxTypeTabs{grid-template-columns:repeat(2,1fr)}.uxGrid2{grid-template-columns:1fr}.uxAccountGrid{grid-template-columns:1fr 1fr}.uxTx{padding:10px}.uxTxActions button{padding:5px 6px}.uxTxActions button:nth-child(2){display:none}}";
  var style=document.createElement("style"); style.textContent=CSS; document.head.appendChild(style);

  function rebuildNavigation() {
    var side=document.querySelector(".sidebar");
    if(side){
      var brand=side.querySelector(".brand");
      side.innerHTML="";
      if(brand)side.appendChild(brand);
      var groups=[
        {label:"Overview",items:[["dashboard","Home"],["money","Money"],["budget","Budget"]]},
        {label:"Planning",items:[["plans","Plans"],["insights","Insights"]]}
      ];
      groups.forEach(function(g){
        var ng=document.createElement("div");ng.className="navGroup";
        ng.innerHTML='<div class="navLabel">'+g.label+'</div>'+g.items.map(function(x){return '<button data-nav="'+x[0]+'">'+x[1]+'</button>';}).join("");
        side.appendChild(ng);
      });
      var foot=document.createElement("div");foot.className="sidebarFoot";foot.innerHTML='<span class="statusDot"></span>Cloud-ready finance workspace<br><span>Use + Add for everyday money actions.</span>';side.appendChild(foot);
    }
    var mobile=document.querySelector(".mobileNav");
    if(mobile){
      mobile.innerHTML='<button data-nav="dashboard">Home</button><button data-nav="money">Money</button><button data-nav="budget">Budget</button><button data-nav="plans">Plans</button><button data-nav="insights">Insights</button>';
    }
  }

  function addTopControls() {
    var top=document.querySelector(".topbar .topActions"); if(!top || document.getElementById("uxSearch")) return;
    var wrap=document.createElement("div"); wrap.className="uxTopSearch";
    wrap.innerHTML='<input class="uxSearch" id="uxSearch" placeholder="Search transactions…"><button class="uxAIButton" id="uxAIButton">🤖 AI</button>';
    top.insertBefore(wrap, top.firstChild);
    el("uxSearch").addEventListener("keydown",function(e){if(e.key==="Enter"){window.__moneySearch=this.value.trim();showView("money");}});
    el("uxAIButton").onclick=function(){showView("ai");};
  }

  function addGlobalButton() {
    if(document.getElementById("uxAdd"))return;
    var b=document.createElement("button");b.id="uxAdd";b.className="uxAdd";b.textContent="+ Add";b.onclick=function(){openAddSheet("expense");};document.body.appendChild(b);
  }

  function openOverlay(id,html) {
    var old=el(id);if(old)old.remove();
    var back=document.createElement("div");back.id=id;back.className="uxSheetBack";back.style.display="flex";
    back.innerHTML='<div class="uxSheet">'+html+'</div>';document.body.appendChild(back);
    back.addEventListener("click",function(e){if(e.target===back)back.remove();});
    var close=back.querySelector("[data-ux-close]");if(close)close.onclick=function(){back.remove();};
    return back;
  }

  function accountOptions(selected,currency) {
    return (data().accounts||[]).filter(function(a){return !currency||a.currency===currency;}).map(function(a){return '<option value="'+esc(a.id)+'" '+(a.id===selected?"selected":"")+'>'+esc(a.name)+'</option>';}).join("");
  }

  function categoryOptions(selected) {
    var cats=["Salary","Freelance","Refund","Grocery","Rent","Bills","Recharge","Leap","Gym","Education loan","SIP/ETFs","Family","MRCPI","Skincare","Shopping","Donation","Other"];
    return cats.map(function(c){return '<option '+(c===selected?"selected":"")+'>'+c+'</option>';}).join("");
  }

  function typeDefaults(type, tx) {
    var d=data();
    var date=tx&&tx.date||currentDate();
    var desc=tx&&tx.description||(type==="income"?"Salary":"");
    var accountId=tx&&tx.accountId||(window.financeCore&&window.financeCore.defaultAccountId?window.financeCore.defaultAccountId(type,desc,""):"aib-regular");
    return {date:date,desc:desc,amount:tx&&tx.amount||"",accountId:accountId,category:tx&&tx.category||(type==="income"?"Salary":"Grocery"),currency:tx&&tx.currency||"EUR",notes:tx&&tx.notes||""};
  }

  function openAddSheet(type, tx) {
    type=type||"expense";
    var edit=!!tx, d=typeDefaults(type,tx);
    var body='<div class="uxSheetHead"><div><div class="eyebrow">QUICK ENTRY</div><h2>'+(edit?"Edit transaction":"Add money movement")+'</h2></div><button class="uxClose" data-ux-close>×</button></div>'+
      '<div class="uxTypeTabs">'+["expense","income","transfer","goal"].map(function(t){return '<button type="button" data-ux-type="'+t+'" class="'+(type===t?"active":"")+'">'+(t==="expense"?"Expense":t==="income"?"Income":t==="transfer"?"Transfer":"Goal")+'</button>';}).join("")+'</div>'+
      '<div id="uxFormArea"></div><div class="uxHint">One entry updates the ledger, month, account/goal and dashboard together. Historical entries update the month without rewriting today’s account snapshot.</div><button class="uxSave" id="uxSave">Save</button>';
    var back=openOverlay("uxAddOverlay",body);
    function renderForm(t) {
      var isTransfer=t==="transfer",isGoal=t==="goal",v=typeDefaults(t,edit?tx:null);
      if(isTransfer){
        var from=tx&&tx.fromAccountId||v.accountId,to=tx&&tx.toAccountId||"";
        el("uxFormArea").innerHTML='<div class="uxGrid2"><div class="uxField"><label>Amount</label><input id="uxAmt" type="number" step=".01" value="'+esc(v.amount)+'"></div><div class="uxField"><label>Date</label><input id="uxDate" type="date" value="'+esc(v.date)+'"></div></div>'+
          '<div class="uxGrid2"><div class="uxField"><label>From</label><select id="uxFrom">'+accountOptions(from,v.currency)+'</select></div><div class="uxField"><label>To</label><select id="uxTo">'+accountOptions(to,v.currency)+'</select></div></div>'+
          '<div class="uxField"><label>Note</label><input id="uxDesc" value="'+esc(v.desc||"Transfer")+'" placeholder="e.g. Move money to savings"></div>';
      } else if(isGoal){
        var goals=(data().goals||[]).map(function(g){return '<option value="'+esc(g.id)+'" '+((tx&&tx.goalId===g.id)?"selected":"")+'>'+esc(g.name)+' · '+esc(g.currency)+'</option>';}).join("");
        el("uxFormArea").innerHTML='<div class="uxGrid2"><div class="uxField"><label>Amount</label><input id="uxAmt" type="number" step=".01" value="'+esc(v.amount)+'"></div><div class="uxField"><label>Date</label><input id="uxDate" type="date" value="'+esc(v.date)+'"></div></div>'+
          '<div class="uxField"><label>Goal</label><select id="uxGoal">'+goals+'</select></div>'+
          '<div class="uxField"><label>From account</label><select id="uxAcc">'+accountOptions(v.accountId,v.currency)+'</select></div>';
      } else {
        var acct=window.financeCore&&window.financeCore.rememberedAccount?window.financeCore.rememberedAccount(v.desc):null;
        if(!edit&&acct)v.accountId=acct;
        var label=t==="income"?"What did you receive?":"What did you spend?";
        el("uxFormArea").innerHTML='<div class="uxField"><label>'+label+'</label><input id="uxDesc" value="'+esc(v.desc)+'" placeholder="'+(t==="income"?"e.g. Salary":"e.g. Lidl groceries")+'"></div>'+
          '<div class="uxGrid2"><div class="uxField"><label>Amount</label><input id="uxAmt" type="number" step=".01" value="'+esc(v.amount)+'"></div><div class="uxField"><label>Date</label><input id="uxDate" type="date" value="'+esc(v.date)+'"></div></div>'+
          '<div class="uxGrid2"><div class="uxField"><label>Paid with / received in</label><select id="uxAcc">'+accountOptions(v.accountId,v.currency)+'</select></div><div class="uxField"><label>Category</label><select id="uxCat">'+categoryOptions(v.category)+'</select></div></div>'+
          '<div class="uxField"><label>Currency</label><select id="uxCur"><option '+(v.currency==="EUR"?"selected":"")+'>EUR</option><option '+(v.currency==="INR"?"selected":"")+'>INR</option></select></div>';
        var descInput=el("uxDesc"); if(descInput)descInput.addEventListener("input",function(){var remembered=window.financeCore&&window.financeCore.rememberedAccount?window.financeCore.rememberedAccount(this.value):null;if(remembered&&el("uxAcc"))el("uxAcc").value=remembered;});
      }
      el("uxSave").onclick=function(){
        try{
          var obj;
          if(t==="transfer"){
            obj={type:"transfer",amount:n(el("uxAmt").value),date:el("uxDate").value,fromAccountId:el("uxFrom").value,toAccountId:el("uxTo").value,accountId:el("uxFrom").value,description:el("uxDesc").value||"Transfer",currency:v.currency||"EUR"};
          } else if(t==="goal"){
            obj={type:"goal",amount:n(el("uxAmt").value),date:el("uxDate").value,goalId:el("uxGoal").value,accountId:el("uxAcc").value,currency:((data().goals||[]).find(function(g){return g.id===el("uxGoal").value;})||{}).currency||"EUR",description:"Goal contribution"};
          } else {
            obj={type:t,amount:n(el("uxAmt").value),date:el("uxDate").value,description:el("uxDesc").value,accountId:el("uxAcc").value,category:el("uxCat").value,currency:el("uxCur").value};
          }
          if(edit)window.financeCore.editTransaction(tx.id,obj);else window.financeCore.addTransaction(obj);
          back.remove();
        }catch(e){alert(e.message||"Could not save transaction.");}
      };
    }
    back.querySelectorAll("[data-ux-type]").forEach(function(b){b.onclick=function(){back.querySelectorAll("[data-ux-type]").forEach(function(x){x.classList.remove("active")});b.classList.add("active");renderForm(b.dataset.uxType);};});
    renderForm(type);
  }

  function openAccountSheet(id) {
    var d=data(), a=id?(d.accounts||[]).find(function(x){return x.id===id;}):null;
    var body='<div class="uxSheetHead"><h2>'+(a?"Edit account":"Add account")+'</h2><button class="uxClose" data-ux-close>×</button></div>'+
      '<div class="uxField"><label>Name</label><input id="uxAccName" value="'+esc(a&&a.name||"")+'"></div>'+
      '<div class="uxGrid2"><div class="uxField"><label>Currency</label><select id="uxAccCur"><option '+(!a||a.currency==="EUR"?"selected":"")+'>EUR</option><option '+(a&&a.currency==="INR"?"selected":"")+'>INR</option></select></div><div class="uxField"><label>Type</label><select id="uxAccType">'+["Bank","Savings","Cash","Investment","Credit Card","Other"].map(function(t){return '<option '+(a&&a.type===t?"selected":"")+'>'+t+'</option>';}).join("")+'</select></div></div>'+
      '<div class="uxField"><label>Current balance</label><input id="uxAccBal" type="number" step=".01" value="'+esc(a&&a.balance||0)+'"></div>'+
      '<div class="uxHint">A current balance is a snapshot. New current-month transactions adjust it automatically; historical transactions do not.</div><button id="uxAccSave" class="uxSave">Save account</button>';
    var back=openOverlay("uxAccountOverlay",body);
    el("uxAccSave").onclick=function(){
      var name=el("uxAccName").value.trim();if(!name){alert("Enter an account name.");return;}
      if(a){Object.assign(a,{name:name,currency:el("uxAccCur").value,type:el("uxAccType").value,balance:n(el("uxAccBal").value)});}
      else {d.accounts=d.accounts||[];d.accounts.push({id:"acc-"+Date.now().toString(36),name:name,currency:el("uxAccCur").value,type:el("uxAccType").value,balance:n(el("uxAccBal").value),includeInSafeSpend:name!=="AIB Savings"});}
      try{localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();}catch(e){}
      back.remove(); if(window.toast)window.toast("Account saved");showView("money");
    };
  }

  function deleteAccount(id) {
    var d=data(),a=(d.accounts||[]).find(function(x){return x.id===id;});if(!a)return;
    var used=(d.transactions||[]).some(function(t){return t.accountId===id||t.fromAccountId===id||t.toAccountId===id;});
    if(used){alert("This account is used by transactions. Move those transactions first, then delete the account.");return;}
    if(!confirm("Delete "+a.name+"?"))return;
    d.accounts=d.accounts.filter(function(x){return x.id!==id;});
    try{localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();}catch(e){}
    if(window.toast)window.toast("Account deleted");showView("money");
  }

  function moneyView() {
    var d=data(),q=(window.__moneySearch||"").toLowerCase();
    var accounts=(d.accounts||[]).filter(function(a){return a.currency==="EUR"});
    var accHtml=accounts.map(function(a){return '<div class="uxAccount"><div class="uxAccountHead"><b>'+esc(a.name)+'</b><span class="badge">'+esc(a.type)+'</span></div><small>'+esc(a.currency)+(a.includeInSafeSpend===false?" · excluded from safe-to-spend":"")+'</small><strong class="'+(a.type==="Credit Card"&&n(a.balance)>0?"uxDanger":"")+'">'+eur(a.balance)+'</strong><div class="uxTxActions" style="margin-top:8px"><button data-ux-edit-account="'+esc(a.id)+'">Edit</button><button data-ux-delete-account="'+esc(a.id)+'">Delete</button></div></div>';}).join("");
    var all=(d.transactions||[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
    var tx=all.filter(function(t){return !q||((t.description||"")+" "+(t.category||"")+" "+(t.date||"")).toLowerCase().includes(q);});
    var txHtml=tx.length?tx.map(function(t){
      var acc=(d.accounts||[]).find(function(a){return a.id===t.accountId});
      return '<div class="uxTx"><div class="txIcon">'+(t.type==="income"?"↑":t.type==="transfer"?"↔":t.type==="goal"?"☆":"−")+'</div><div class="uxTxMain"><b>'+esc(t.description||"Transaction")+'</b><small>'+esc(t.category||"Other")+' · '+dateLabel(t.date)+(acc?" · "+esc(acc.name):"")+'</small></div><div class="uxTxAmt '+(t.type==="income"?"uxGood":"")+'">'+(t.type==="income"?"+":"−")+(t.currency==="INR"?inr(t.amount):eur(t.amount))+'</div><div class="uxTxActions"><button data-ux-edit="'+esc(t.id)+'">Edit</button><button data-ux-dup="'+esc(t.id)+'">Copy</button><button data-ux-del="'+esc(t.id)+'">Delete</button></div></div>';
    }).join(""):'<div class="empty">No matching transactions.</div>';
    el("pfContent").innerHTML='<div class="heroRow"><div><div class="eyebrow">ONE MONEY VIEW</div><h2>Money</h2><p>Accounts and transactions in the same place.</p></div><div class="actions"><button data-ux-add-type="income">+ Income</button><button class="primary" data-ux-add-type="expense">+ Expense</button></div></div>'+
      '<div class="uxAccountGrid">'+accHtml+'</div><div class="actions"><button data-ux-add-account>+ Add account</button><button data-nav="settings">Settings →</button></div>'+
      '<section class="panel"><div class="panelHead"><h2>Transactions</h2><span class="uxMuted">'+tx.length+' entries</span></div><div class="toolbar"><input id="uxMoneySearch" value="'+esc(window.__moneySearch||"")+'" placeholder="Search description, category or date…"><button class="uxSecondary" data-ux-clear-search>Clear</button></div><div class="uxRows">'+txHtml+'</div></section>';
    var search=el("uxMoneySearch");if(search)search.addEventListener("input",function(){window.__moneySearch=this.value;moneyView();});
  }

  function loanSummary() {
    var d=data(),l=d.loan||{},b=n(l.opening),pay=n(l.payment)||100000,rate=n(l.rate)/100,int=0,count=0,dt=new Date((l.start||"2026-10-11")+"T00:00:00");
    while(b>.01&&count<240){var it=count===0?17967:b*rate, p=Math.min(pay,b+it);b=Math.max(0,b-(p-it));int+=it;count++;dt.setMonth(dt.getMonth()+1);}
    return {balance:n(l.opening),payment:pay,interest:int,payments:count,payoff:count?new Date(dt.setMonth(dt.getMonth()-1)).toISOString().slice(0,10):""};
  }

  function plansView() {
    var d=data(),goals=d.goals||[],em=goals.find(function(g){return /emergency/i.test(g.name)}),home=goals.find(function(g){return /mumbai/i.test(g.name)}),loan=loanSummary();
    var goalsHtml=goals.map(function(g){var p=g.target?Math.min(100,n(g.current)/n(g.target)*100):0;return '<div class="uxPlanCard"><h3>'+esc(g.name)+'</h3><div class="big">'+(g.currency==="INR"?inr(g.current):eur(g.current))+' <span class="uxMuted">/ '+(g.currency==="INR"?inr(g.target):eur(g.target))+'</span></div><div class="uxProgress"><i style="width:'+p+'%"></i></div><div class="uxMuted">'+p.toFixed(0)+'% funded · target '+esc(g.targetDate||"no date")+'</div><button class="uxSecondary" data-ux-goal-add="'+esc(g.id)+'">+ Add contribution</button> <button class="rowBtn" data-ux-goal-edit="'+esc(g.id)+'">Edit</button> <button class="rowBtn dangerBtn" data-ux-goal-del="'+esc(g.id)+'">Delete</button></div>';}).join("");
    var rec=(d.recurring||[]).map(function(r){return '<div class="uxInline" style="padding:10px 0;border-bottom:1px solid #e7eaf0"><span>'+esc(r.name)+' <small class="uxMuted">· day '+n(r.day)+'</small></span><span><b>'+(r.currency==="INR"?inr(r.amount):eur(r.amount))+'</b> <button class="rowBtn dangerBtn" data-ux-rec-del="'+esc(r.id)+'">Delete</button></span></div>';}).join("")||'<div class="uxMuted">No recurring payments saved.</div>';
    el("pfContent").innerHTML='<div class="heroRow"><div><div class="eyebrow">PLANS & MILESTONES</div><h2>Plans</h2><p>Goals, debt and recurring commitments without cluttering everyday tracking.</p></div></div>'+
      '<div class="uxPlanGrid">'+
      '<div class="uxPlanCard"><h3>Emergency Fund</h3><div class="big">'+eur(em?em.current:0)+' <span class="uxMuted">/ '+eur(em?em.target:5000)+'</span></div><p class="uxMuted">Keep a €1,000 minimum reserve in the safe-to-spend calculation.</p><button class="uxSecondary" data-ux-goal-add="'+esc(em&&em.id||"")+'">+ Add savings</button></div>'+
      '<div class="uxPlanCard"><h3>Education Loan</h3><div class="big">'+inr(loan.balance)+'</div><p class="uxMuted">'+inr(loan.payment)+' planned monthly · modelled payoff '+dateLabel(loan.payoff)+'</p><button class="uxSecondary" data-nav="loan">Open loan plan →</button></div>'+
      '<div class="uxPlanCard"><h3>Mumbai Home</h3><div class="big">₹2 Cr</div><p class="uxMuted">'+(home?home.targetDate:"")+' long-term target. Keep INR planning separate from Ireland cash flow.</p><button class="uxSecondary" data-ux-goal-add="'+esc(home&&home.id||"")+'">+ Add contribution</button></div>'+
      '<div class="uxPlanCard"><h3>Recurring Payments</h3><div class="big">'+eur((d.recurring||[]).filter(function(r){return r.currency==="EUR"}).reduce(function(s,r){return s+n(r.amount)},0))+'</div><p class="uxMuted">Saved recurring commitments.</p><button class="uxSecondary" data-ux-rec-add>+ Add recurring</button></div>'+
      '</div><section class="panel"><div class="panelHead"><h2>Your goals</h2><button data-ux-goal-new>+ Add goal</button></div><div class="uxPlanGrid">'+goalsHtml+'</div></section>'+
      '<section class="panel"><div class="panelHead"><h2>Recurring payments</h2></div>'+rec+'</section>';
  }

  function openGoalSheet(id) {
    var d=data(),g=id?(d.goals||[]).find(function(x){return x.id===id;}):null;
    var body='<div class="uxSheetHead"><h2>'+(g?"Add contribution":"New goal")+'</h2><button class="uxClose" data-ux-close>×</button></div>';
    if(g){
      body+='<div class="uxField"><label>Goal</label><input value="'+esc(g.name)+'" disabled></div><div class="uxGrid2"><div class="uxField"><label>Amount</label><input id="uxGoalAmt" type="number" step=".01"></div><div class="uxField"><label>Date</label><input id="uxGoalDate" type="date" value="'+currentDate()+'"></div></div><div class="uxField"><label>From account</label><select id="uxGoalAcc">'+accountOptions("",g.currency)+'</select></div><button class="uxSave" id="uxGoalSave">Add contribution</button>';
      var back=openOverlay("uxGoalOverlay",body);
      el("uxGoalSave").onclick=function(){try{window.financeCore.addTransaction({type:"goal",amount:n(el("uxGoalAmt").value),date:el("uxGoalDate").value,goalId:g.id,accountId:el("uxGoalAcc").value,currency:g.currency,description:"Goal contribution"});back.remove();}catch(e){alert(e.message);}};
      return;
    }
    body+='<div class="uxField"><label>Goal name</label><input id="uxNewGoalName"></div><div class="uxGrid2"><div class="uxField"><label>Target</label><input id="uxNewGoalTarget" type="number"></div><div class="uxField"><label>Currency</label><select id="uxNewGoalCur"><option>EUR</option><option>INR</option></select></div></div><div class="uxGrid2"><div class="uxField"><label>Current</label><input id="uxNewGoalCurrent" type="number" value="0"></div><div class="uxField"><label>Target date</label><input id="uxNewGoalDate" type="date"></div></div><button class="uxSave" id="uxNewGoalSave">Save goal</button>';
    var b2=openOverlay("uxNewGoalOverlay",body);
    el("uxNewGoalSave").onclick=function(){var name=el("uxNewGoalName").value.trim();if(!name)return alert("Enter a goal name.");d.goals=d.goals||[];d.goals.push({id:"goal-"+Date.now().toString(36),name:name,target:n(el("uxNewGoalTarget").value),current:n(el("uxNewGoalCurrent").value),currency:el("uxNewGoalCur").value,monthlyContribution:0,targetDate:el("uxNewGoalDate").value});try{localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();}catch(e){}b2.remove();if(window.toast)window.toast("Goal saved");showView("plans");};
  }


  function openGoalEditor(id) {
    var d=data(),g=(d.goals||[]).find(function(x){return x.id===id;});
    if(!g)return;
    var body='<div class="uxSheetHead"><h2>Edit goal</h2><button class="uxClose" data-ux-close>×</button></div>'+
      '<div class="uxField"><label>Goal name</label><input id="uxEditGoalName" value="'+esc(g.name)+'"></div>'+
      '<div class="uxGrid2"><div class="uxField"><label>Target</label><input id="uxEditGoalTarget" type="number" value="'+n(g.target)+'"></div><div class="uxField"><label>Currency</label><select id="uxEditGoalCur"><option '+(g.currency==="EUR"?"selected":"")+'>EUR</option><option '+(g.currency==="INR"?"selected":"")+'>INR</option></select></div></div>'+
      '<div class="uxGrid2"><div class="uxField"><label>Current</label><input id="uxEditGoalCurrent" type="number" value="'+n(g.current)+'"></div><div class="uxField"><label>Target date</label><input id="uxEditGoalDate" type="date" value="'+esc(g.targetDate||"")+'"></div></div>'+
      '<button class="uxSave" id="uxEditGoalSave">Save goal</button>';
    var b=openOverlay("uxEditGoalOverlay",body);
    el("uxEditGoalSave").onclick=function(){
      var name=el("uxEditGoalName").value.trim();if(!name)return alert("Enter a goal name.");
      Object.assign(g,{name:name,target:n(el("uxEditGoalTarget").value),current:n(el("uxEditGoalCurrent").value),currency:el("uxEditGoalCur").value,targetDate:el("uxEditGoalDate").value});
      try{localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();}catch(e){}
      b.remove();if(window.toast)window.toast("Goal updated");showView("plans");
    };
  }

  function recurringSheet() {
    var body='<div class="uxSheetHead"><h2>Add recurring payment</h2><button class="uxClose" data-ux-close>×</button></div><div class="uxField"><label>Name</label><input id="uxRecName" placeholder="e.g. Rent"></div><div class="uxGrid2"><div class="uxField"><label>Amount</label><input id="uxRecAmt" type="number" step=".01"></div><div class="uxField"><label>Currency</label><select id="uxRecCur"><option>EUR</option><option>INR</option></select></div></div><div class="uxGrid2"><div class="uxField"><label>Day of month</label><input id="uxRecDay" type="number" min="1" max="28" value="1"></div><div class="uxField"><label>Category</label><input id="uxRecCat" placeholder="e.g. Rent"></div></div><button class="uxSave" id="uxRecSave">Save recurring</button>';
    var b=openOverlay("uxRecOverlay",body);
    el("uxRecSave").onclick=function(){var name=el("uxRecName").value.trim();if(!name)return alert("Enter a name.");d=data();d.recurring=d.recurring||[];d.recurring.push({id:"rec-"+Date.now().toString(36),name:name,amount:n(el("uxRecAmt").value),currency:el("uxRecCur").value,day:n(el("uxRecDay").value)||1,category:el("uxRecCat").value.trim()||"Other"});try{localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();}catch(e){}b.remove();if(window.toast)window.toast("Recurring payment saved");showView("plans");};
  }

  function showView(id) {
    if(id==="home")id="dashboard";
    if(id==="accounts")id="money";
    if(id==="goals"||id==="planning")id="plans";
    if(id==="money"){window.__view="money";rebuildNavigation();navActive("money");moneyView();postRender();return;}
    if(id==="plans"){window.__view="plans";rebuildNavigation();navActive("plans");plansView();postRender();return;}
    if(id==="insights")id="reports";
    if(["dashboard","budget","reports","loan","settings","ai"].indexOf(id)>=0){
      window.__view=id;
      if(legacyShow)legacyShow(id);
      postRender();
    } else {
      window.__view="dashboard";
      if(legacyShow)legacyShow("dashboard");
      postRender();
    }
  }

  function navActive(id) {
    document.querySelectorAll("[data-nav]").forEach(function(b){b.classList.toggle("active",b.dataset.nav===id);});
  }

  function postRender() {
    setTimeout(function(){
      if(window.__view==="dashboard")decorateDashboard();
      if(window.__view==="budget")decorateBudget();
      if(window.__view==="settings")decorateSettings();
    },30);
  }

  function decorateDashboard() {
    var d=data(), tx=d.transactions.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,8);
    var rows=document.querySelectorAll("#pfContent .txRow");
    rows.forEach(function(row,i){
      var t=tx[i];if(!t||row.querySelector("[data-ux-edit]"))return;
      row.setAttribute("data-fin-tx",t.id);
      var box=document.createElement("div");box.className="uxTxActions";
      box.innerHTML='<button data-ux-edit="'+esc(t.id)+'">Edit</button><button data-ux-del="'+esc(t.id)+'">Delete</button>';
      row.appendChild(box);
    });
  }

  function decorateBudget() {
    var hero=document.querySelector("#pfContent .heroRow .actions");
    if(hero&&!hero.querySelector("[data-ux-add-type]"))hero.insertAdjacentHTML("afterbegin",'<button data-ux-add-type="expense">+ Expense</button>');
    document.querySelectorAll("#pfContent table tbody tr").forEach(function(row){
      if(row.querySelector("[data-ux-del-category]"))return;
      var name=row.cells[0]&&row.cells[0].childNodes[0]&&row.cells[0].childNodes[0].textContent?row.cells[0].childNodes[0].textContent.trim():row.cells[0]&&row.cells[0].textContent.trim();
      if(!name)return;
      var mk=window.__budgetMonth||((window.data&&Object.keys(window.data.months||{}).sort().slice(-1)[0])||"");
      var actual=Number(window.data&&window.data.months&&window.data.months[mk]&&window.data.months[mk].actual&&window.data.months[mk].actual[name]||0);
      var btn=document.createElement("button");btn.className="rowBtn dangerBtn";btn.textContent="Remove";btn.dataset.uxDelCategory=name;btn.dataset.uxDelCategoryMonth=mk;btn.title=actual?"Recorded spending exists":"Remove this category";
      if(actual>0)btn.disabled=true;
      row.cells[0].appendChild(btn);
    });
  }

  function decorateSettings() {
    var c=document.getElementById("pfContent");if(!c||c.querySelector(".uxSettingsHint"))return;
    var p=document.createElement("section");p.className="panel uxSettingsHint";p.innerHTML='<div class="panelHead"><h2>Sync behaviour</h2></div><p class="uxMuted">When Google Drive is connected, changes save locally first and sync to your Drive finance file automatically. This browser also checks Drive about every 30 seconds and when you return to the app.</p>';c.appendChild(p);
  }

  document.addEventListener("click",function(e){
    var nav=e.target.closest("[data-nav]");
    if(nav){e.preventDefault();e.stopImmediatePropagation();showView(nav.dataset.nav);return;}
    var add=e.target.closest("[data-ux-add-type]");
    if(add){e.preventDefault();e.stopImmediatePropagation();openAddSheet(add.dataset.uxAddType);return;}
    var ed=e.target.closest("[data-edit-tx]");
    if(ed){e.preventDefault();e.stopImmediatePropagation();var t=(data().transactions||[]).find(function(x){return x.id===ed.dataset.editTx;});if(t)openAddSheet(t.type,t);return;}
    var del=e.target.closest("[data-delete-tx]");
    if(del){e.preventDefault();e.stopImmediatePropagation();window.financeCore.deleteTransaction(del.dataset.deleteTx);return;}
    var ue=e.target.closest("[data-ux-edit]");
    if(ue){e.preventDefault();e.stopImmediatePropagation();var tx=(data().transactions||[]).find(function(x){return x.id===ue.dataset.uxEdit;});if(tx)openAddSheet(tx.type,tx);return;}
    var ud=e.target.closest("[data-ux-del]");
    if(ud){e.preventDefault();e.stopImmediatePropagation();if(confirm("Delete this transaction?"))window.financeCore.deleteTransaction(ud.dataset.uxDel);return;}
    var dup=e.target.closest("[data-ux-dup]");
    if(dup){e.preventDefault();e.stopImmediatePropagation();window.financeCore.duplicateTransaction(dup.dataset.uxDup);return;}
    var ea=e.target.closest("[data-ux-edit-account]");
    if(ea){e.preventDefault();e.stopImmediatePropagation();openAccountSheet(ea.dataset.uxEditAccount);return;}
    var da=e.target.closest("[data-ux-delete-account]");
    if(da){e.preventDefault();e.stopImmediatePropagation();deleteAccount(da.dataset.uxDeleteAccount);return;}
    if(e.target.closest("[data-ux-add-account]")){e.preventDefault();e.stopImmediatePropagation();openAccountSheet();return;}
    if(e.target.closest("[data-ux-clear-search]")){window.__moneySearch="";moneyView();return;}
    var ge=e.target.closest("[data-ux-goal-edit]");
    if(ge){e.preventDefault();e.stopImmediatePropagation();openGoalEditor(ge.dataset.uxGoalEdit);return;}
    var gd=e.target.closest("[data-ux-goal-del]");
    if(gd){e.preventDefault();e.stopImmediatePropagation();var dg=data(),gid=gd.dataset.uxGoalDel,used=(dg.transactions||[]).some(function(t){return t.goalId===gid;});if(used){alert("This goal has contribution history. Delete those contributions first to keep the ledger consistent.");return;}if(confirm("Delete this goal?")){dg.goals=(dg.goals||[]).filter(function(g){return g.id!==gid;});localStorage.setItem("virajFinance",JSON.stringify(dg));if(window.driveSync)window.driveSync.markDirty();if(window.toast)window.toast("Goal deleted");showView("plans");}return;}
    var gg=e.target.closest("[data-ux-goal-add]");
    if(gg&&gg.dataset.uxGoalAdd){e.preventDefault();e.stopImmediatePropagation();openGoalSheet(gg.dataset.uxGoalAdd);return;}
    if(e.target.closest("[data-ux-goal-new]")){e.preventDefault();e.stopImmediatePropagation();openGoalSheet();return;}
    var rg=e.target.closest("[data-ux-rec-add]");
    if(rg){e.preventDefault();e.stopImmediatePropagation();recurringSheet();return;}
    var dc=e.target.closest("[data-ux-del-category]");
    if(dc){e.preventDefault();e.stopImmediatePropagation();var dd=data(),mk=dc.dataset.uxDelCategoryMonth,cat=dc.dataset.uxDelCategory,m=dd.months&&dd.months[mk];if(!m)return;if(Number(m.actual&&m.actual[cat]||0)>0){alert("This category has recorded spending and cannot be removed.");return;}if(confirm("Remove "+cat+" from this month?")){if(m.budget)delete m.budget[cat];localStorage.setItem("virajFinance",JSON.stringify(dd));if(window.driveSync)window.driveSync.markDirty();if(window.toast)window.toast("Budget category removed");showView("budget");}return;}
    var rd=e.target.closest("[data-ux-rec-del]");
    if(rd){e.preventDefault();e.stopImmediatePropagation();var d=data();if(confirm("Delete recurring payment?")){d.recurring=(d.recurring||[]).filter(function(x){return x.id!==rd.dataset.uxRecDel;});localStorage.setItem("virajFinance",JSON.stringify(d));if(window.driveSync)window.driveSync.markDirty();plansView();}}
  },true);

  window.show=showView;

  function boot() {
    rebuildNavigation();
    addTopControls();
    addGlobalButton();
    postRender();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else setTimeout(boot,0);
  window.uxFinance={openAdd:openAddSheet,showView:showView,moneyView:moneyView,plansView:plansView};
})();