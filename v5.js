
(function(){
  'use strict';

  function by(id){ return document.getElementById(id); }
  function n(v){ var x=Number(v); return isFinite(x)?x:0; }
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];}); }
  function eur(v){ return fmtEUR(n(v)); }
  function inr(v){ return fmtINR(n(v)); }
  var backupTimer=null;
  function saveData(){
    localStorage.setItem('virajFinance',JSON.stringify(data));
    if(typeof toast==='function')toast('Saved');
    if(localStorage.getItem('googleClientId')&&typeof backupToDrive==='function'){
      clearTimeout(backupTimer);
      backupTimer=setTimeout(function(){try{backupToDrive(true);}catch(e){}},15000);
    }
  }
  function monthLabel(k){
    var d=new Date(k+'-01T00:00:00');
    return d.toLocaleDateString('en-IE',{month:'long',year:'numeric'});
  }
  function lastIncome(){
    var ks=Object.keys(data.months||{}).sort();
    for(var i=ks.length-1;i>=0;i--)if(n(data.months[ks[i]].income)>0)return n(data.months[ks[i]].income);
    return 0;
  }
  function recentSpend(){
    var ks=Object.keys(data.months||{}).sort().slice(-3),t=0,c=0;
    ks.forEach(function(k){if(data.months[k].actual){t+=Object.values(data.months[k].actual).reduce(function(a,b){return a+n(b)},0);c++;}});
    return c?t/c:0;
  }
  function ensure(){
    if(!data.transactions)data.transactions=[];
    if(!data.accounts)data.accounts=[];
    if(!data.goals)data.goals=[];
    if(!data.networth)data.networth=[];
    if(!data.settings)data.settings={};
    if(!data.settings.fxEurInr)data.settings.fxEurInr=100;
    if(!data.savingsPlans)data.savingsPlans=[];
    if(!data.savingsPlans.some(function(x){return x.name==='AIB Savings';})){
      data.savingsPlans.push({id:'aib-savings',name:'AIB Savings',monthly:100,currency:'EUR',contributions:{'2026-09':200,'2026-10':100}});
    }
    var aib=(data.accounts||[]).find(function(x){return x.name==='AIB Savings';});
    if(!aib)data.accounts.push({id:'aib-savings',name:'AIB Savings',currency:'EUR',type:'Bank',balance:300,includeInSafeSpend:false});
    if(!data.goals.some(function(x){return x.name==='Emergency Fund';}))data.goals.push({id:'emergency',name:'Emergency Fund',target:5000,current:0,currency:'EUR',monthlyContribution:200,targetDate:'2027-12-31'});
    if(!data.goals.some(function(x){return x.name==='iPhone / India Tour';}))data.goals.push({id:'iphone-india',name:'iPhone / India Tour',target:1500,current:300,currency:'EUR',monthlyContribution:100,targetDate:'',note:'Flexible fund for either an iPhone or India trip.'});
    if(!data.goals.some(function(x){return x.name==='Mumbai Flat';}))data.goals.push({id:'mumbai-flat',name:'Mumbai Flat',target:20000000,current:0,currency:'INR',monthlyContribution:0,targetDate:'2030-12-31'});
    if(!data.goals.some(function(x){return x.name==='Education Loan';}))data.goals.push({id:'education-loan',name:'Education Loan',target:n(data.loan&&data.loan.opening),current:n(data.loan&&data.loan.opening),currency:'INR',type:'debt',monthlyContribution:n(data.loan&&data.loan.payment),targetDate:'2029-03-31'});
    if(!data.creditCard)data.creditCard={balance:0,limit:0,statementDate:'',dueDate:'',minPayment:0};
    saveData();
  }

  var style=document.createElement('style');
  style.id='v5cleanStyle';
  style.textContent=
    '.v5cols{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px}'+
    '.v5cols2{display:grid;grid-template-columns:1.1fr .9fr;gap:15px;margin-top:15px}'+
    '.v5box{padding:15px;border:1px solid var(--line);border-radius:15px;background:#fff}'+
    '.v5num{font-size:25px;font-weight:900;margin-top:4px}'+
    '.v5mini{font-size:12px;color:var(--muted);margin-top:5px}'+
    '.v5good{color:#166534}.v5warn{color:#92400e}.v5bad{color:#991b1b}'+
    '.v5table{width:100%;border-collapse:collapse}.v5table th,.v5table td{padding:9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}'+
    '.v5quick{position:fixed;right:22px;bottom:22px;z-index:30;border:0;border-radius:999px;padding:14px 18px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;box-shadow:0 12px 30px #17255433}'+
    '@media(max-width:900px){.v5cols,.v5cols2{grid-template-columns:1fr}}'+
    '@media(max-width:650px){.v5quick{right:14px;bottom:82px}.v5cols{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(style);

  ensure();

  function replaceSection(id,title,body){
    var s=by(id);
    if(!s)return null;
    s.className='view';
    s.innerHTML='<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Viraj Personal Finance Centre</div><h2>'+title+'</h2></div></div></div>'+body;
    return s;
  }

  replaceSection('grocery','Grocery Tracker',
    '<div class="card" style="margin-top:15px"><div class="sectionTitle"><div><h3>Individual items</h3><p class="muted">Add, edit or delete any grocery source.</p></div><button class="primary" onclick="v5AddTracker(\'Grocery\')">+ Add item</button></div><div id="v5Grocery"></div></div>');
  replaceSection('india','India Tracker',
    '<div class="card" style="margin-top:15px"><div class="sectionTitle"><div><h3>India commitments</h3><p class="muted">Keep education loan, family, MRCPI, SIPs and other India items separate.</p></div><button class="primary" onclick="v5AddTracker(\'India\')">+ Add item</button></div><div id="v5India"></div></div>');
  replaceSection('misc','Miscellaneous Tracker',
    '<div class="card" style="margin-top:15px"><div class="sectionTitle"><div><h3>Miscellaneous</h3><p class="muted">Fully editable individual tracking.</p></div><button class="primary" onclick="v5AddTracker(\'Misc\')">+ Add item</button></div><div id="v5Misc"></div></div>');

  var main=document.querySelector('main');

  var tx=document.createElement('section');
  tx.id='transactions';tx.className='view';
  tx.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Daily money movement</div><h2>Transactions</h2><p class="muted">One ledger. Add, edit or delete transactions without changing your historical monthly totals unless you choose to.</p></div></div></div>'+
    '<div class="card" style="margin-top:15px"><h3>Add transaction</h3><div class="form">'+
    '<div><label>Date</label><input id="v5txDate" type="date"></div>'+
    '<div><label>Description</label><input id="v5txDesc" placeholder="Lidl groceries"></div>'+
    '<div><label>Amount</label><input id="v5txAmount" type="number" step=".01"></div>'+
    '<div><label>Currency</label><select id="v5txCurrency"><option>EUR</option><option>INR</option></select></div>'+
    '<div><label>Type</label><select id="v5txType"><option>expense</option><option>income</option><option>transfer</option></select></div>'+
    '<div><label>Category</label><input id="v5txCategory" placeholder="Grocery"></div>'+
    '<div><label>Account</label><select id="v5txAccount"></select></div>'+
    '<div class="wide"><label>Notes</label><input id="v5txNotes" placeholder="Optional note"></div></div>'+
    '<div class="actions" style="margin-top:10px"><button class="primary" onclick="v5AddTransaction()">+ Add transaction</button></div></div>'+
    '<div class="card" style="margin-top:15px"><div class="sectionTitle"><h3>Ledger</h3><button onclick="v5ClearTransactions()">Clear all transactions</button></div><div id="v5TxTable" class="tableWrap"></div></div>';
  main.appendChild(tx);

  var ac=document.createElement('section');
  ac.id='accounts';ac.className='view';
  ac.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Balances</div><h2>Accounts</h2><p class="muted">Ireland and India accounts stay separate. AIB Savings is excluded from spendable cash.</p></div></div></div>'+
    '<div class="card" style="margin-top:15px"><h3>Add account</h3><div class="form">'+
    '<div><label>Name</label><input id="v5acName" placeholder="Revolut"></div><div><label>Currency</label><select id="v5acCurrency"><option>EUR</option><option>INR</option></select></div>'+
    '<div><label>Type</label><select id="v5acType"><option>Bank</option><option>Cash</option><option>Investment</option><option>Credit Card</option><option>Other</option></select></div>'+
    '<div><label>Current balance</label><input id="v5acBalance" type="number" step=".01"></div></div>'+
    '<button class="primary" style="margin-top:10px" onclick="v5AddAccount()">+ Add account</button></div>'+
    '<div class="card" style="margin-top:15px"><div id="v5Accounts"></div></div>'+
    '<div class="card" style="margin-top:15px"><h3>Credit card control</h3><div class="form">'+
    '<div><label>Balance €</label><input id="v5ccBal" type="number" step=".01"></div><div><label>Limit €</label><input id="v5ccLimit" type="number" step=".01"></div>'+
    '<div><label>Statement date</label><input id="v5ccStatement" type="date"></div><div><label>Due date</label><input id="v5ccDue" type="date"></div>'+
    '<div><label>Minimum payment €</label><input id="v5ccMin" type="number" step=".01"></div></div><button class="primary" style="margin-top:10px" onclick="v5SaveCard()">Save credit card</button><div id="v5ccInfo" style="margin-top:10px"></div></div>';
  main.appendChild(ac);

  var goals=document.createElement('section');
  goals.id='goals';goals.className='view';
  goals.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Milestones</div><h2>Goals</h2><p class="muted">Emergency fund, iPhone / India trip and long-term goals.</p></div></div></div>'+
    '<div class="card" style="margin-top:15px"><h3>Add goal</h3><div class="form">'+
    '<div><label>Name</label><input id="v5gName"></div><div><label>Target</label><input id="v5gTarget" type="number" step=".01"></div><div><label>Current</label><input id="v5gCurrent" type="number" step=".01"></div>'+
    '<div><label>Currency</label><select id="v5gCurrency"><option>EUR</option><option>INR</option></select></div><div><label>Monthly contribution</label><input id="v5gMonthly" type="number" step=".01"></div><div><label>Target date</label><input id="v5gDate" type="date"></div></div>'+
    '<button class="primary" style="margin-top:10px" onclick="v5AddGoal()">+ Add goal</button></div>'+
    '<div id="v5Goals" class="v5cols"></div>'+
    '<div class="card" style="margin-top:15px"><div class="sectionTitle"><h3>AIB Savings Plan</h3><span class="pill good">€100/month</span></div><div class="v5cols"><div class="v5box"><div class="eyebrow">September</div><div class="v5num">€200</div></div><div class="v5box"><div class="eyebrow">October</div><div class="v5num">€100</div></div><div class="v5box"><div class="eyebrow">AIB balance</div><div class="v5num" id="v5AibBalance">€300</div></div></div><p class="v5mini">From November onward the planned contribution is €100 every month.</p></div>';
  main.appendChild(goals);

  var nw=document.createElement('section');
  nw.id='networth';nw.className='view';
  nw.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Assets and liabilities</div><h2>Net Worth</h2><p class="muted">EUR and INR are shown separately, with an optional planning conversion.</p></div></div><div class="v5cols"><div><div class="eyebrow" style="color:#c7d2fe">EUR net worth</div><div class="v5num" id="v5NWEur">€0</div></div><div><div class="eyebrow" style="color:#c7d2fe">INR net worth</div><div class="v5num" id="v5NWInr">₹0</div></div><div><div class="eyebrow" style="color:#c7d2fe">Combined planning</div><div class="v5num" id="v5NWCombined">€0</div></div></div></div>'+
    '<div class="v5cols2"><div class="card"><div class="sectionTitle"><h3>Assets</h3><button onclick="v5AddNW(\'asset\')">+ Add</button></div><div id="v5Assets"></div></div><div class="card"><div class="sectionTitle"><h3>Liabilities</h3><button onclick="v5AddNW(\'liability\')">+ Add</button></div><div id="v5Liabilities"></div></div></div>'+
    '<div class="card" style="margin-top:15px"><div class="inline"><div><label>Planning rate ₹ per €1</label><input id="v5FX" type="number" step=".01"></div><button class="primary" onclick="v5SaveFX()">Save rate</button></div></div>';
  main.appendChild(nw);

  var reports=document.createElement('section');
  reports.id='reports';reports.className='view';
  reports.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Review</div><h2>Reports</h2><p class="muted">Monthly performance, category totals and a 12-month planning view.</p></div><button onclick="v5ExportReport()">Export</button></div></div>'+
    '<div class="card" style="margin-top:15px"><div id="v5Report"></div></div>';
  main.appendChild(reports);

  var planning=document.createElement('section');
  planning.id='planning';planning.className='view';
  planning.innerHTML=
    '<div class="card hero"><div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Decision tools</div><h2>Planning Centre</h2><p class="muted">Test purchases, trips and monthly saving plans before spending.</p></div><span class="pill">What-if</span></div></div>'+
    '<div class="v5cols"><div class="v5box"><div class="eyebrow">AIB savings</div><div class="v5num" id="v5PlanAib">€300</div><div class="v5mini">€100/month from November</div></div><div class="v5box"><div class="eyebrow">Recent average spending</div><div class="v5num" id="v5PlanSpend">€0</div><div class="v5mini">Latest recorded months</div></div><div class="v5box"><div class="eyebrow">Latest known salary</div><div class="v5num" id="v5PlanIncome">€0</div><div class="v5mini">Used only as a planning assumption</div></div></div>'+
    '<div class="v5cols2"><div class="card"><h3>Can I afford this?</h3><div class="form"><div><label>Purchase / trip €</label><input id="v5Buy" type="number" value="1500" step=".01"></div><div><label>Minimum reserve €</label><input id="v5Reserve" type="number" value="500" step=".01"></div><div style="align-self:end"><button class="primary" onclick="v5Afford()">Calculate</button></div></div><div id="v5AffordResult" class="forecastBox" style="margin-top:14px"></div></div>'+
    '<div class="card"><h3>Goal simulator</h3><div class="form"><div><label>Target €</label><input id="v5SimTarget" type="number" value="1500"></div><div><label>Current €</label><input id="v5SimCurrent" type="number" value="300"></div><div><label>Monthly €</label><input id="v5SimMonthly" type="number" value="100"></div></div><button class="primary" style="margin-top:10px" onclick="v5Simulate()">Simulate</button><div id="v5SimResult" style="margin-top:12px"></div></div></div>'+
    '<div class="card" style="margin-top:15px"><h3>12-month forecast</h3><p class="muted small">Estimate only: latest known income minus recent average spending and €100 AIB saving. Actual future transactions can differ.</p><div id="v5Forecast"></div></div>';
  main.appendChild(planning);

  function setNav(){
    var nav=document.querySelector('.nav');if(!nav)return;
    var items=[['dashboard','📊 Dashboard'],['transactions','💳 Transactions'],['monthly','📅 Monthly'],['grocery','🛒 Grocery'],['india','🇮🇳 India'],['misc','🧾 Misc'],['accounts','🏦 Accounts'],['goals','🎯 Goals'],['loan','🎓 Education Loan'],['networth','📈 Net Worth'],['reports','📑 Reports'],['planning','🧭 Planning'],['settings','⚙️ Settings']];
    nav.innerHTML=items.map(function(x){return '<button data-v5nav="'+x[0]+'">'+x[1]+'</button>';}).join('');
    Array.prototype.forEach.call(nav.querySelectorAll('button'),function(b){b.onclick=function(){window.show(b.getAttribute('data-v5nav'),b);};});
  }
  setNav();

  function renderTrackers(){
    ['Grocery','India','Misc'].forEach(function(k){
      var id='v5'+k;
      var obj=data.detail&&data.detail[k]?data.detail[k]:{};
      var rows=Object.keys(obj).map(function(name){
        return '<tr><td>'+esc(name)+'</td><td><input type="number" step=".01" value="'+n(obj[name])+'" onchange="v5UpdateTracker(\''+k+'\',\''+esc(name).replace(/'/g,'&#39;')+'\',this.value)"></td><td><button class="danger" onclick="v5DeleteTracker(\''+k+'\',\''+esc(name).replace(/'/g,'&#39;')+'\')">Delete</button></td></tr>';
      }).join('');
      if(by(id))by(id).innerHTML='<table class="v5table"><tr><th>Item</th><th>Amount €</th><th></th></tr>'+rows+'</table>';
    });
  }
  window.v5AddTracker=function(k){
    var name=prompt('New '+k+' item name');if(!name||!name.trim())return;
    name=name.trim();if(!data.detail[k])data.detail[k]={};
    if(Object.prototype.hasOwnProperty.call(data.detail[k],name)){alert('That item already exists.');return;}
    var amount=prompt('Amount in EUR','0');data.detail[k][name]=n(amount);saveData();renderTrackers();
  };
  window.v5UpdateTracker=function(k,name,v){if(data.detail[k]&&Object.prototype.hasOwnProperty.call(data.detail[k],name)){data.detail[k][name]=n(v);saveData();renderTrackers();}};
  window.v5DeleteTracker=function(k,name){if(!confirm('Delete '+name+'?'))return;delete data.detail[k][name];saveData();renderTrackers();};

  function renderAccounts(){
    var rows=(data.accounts||[]).map(function(a){
      return '<tr><td>'+esc(a.name)+'</td><td>'+a.currency+'</td><td>'+esc(a.type)+'</td><td><input type="number" step=".01" value="'+n(a.balance)+'" onchange="v5UpdateAccount(\''+a.id+'\',this.value)"></td><td><button class="danger" onclick="v5DeleteAccount(\''+a.id+'\')">Delete</button></td></tr>';
    }).join('');
    by('v5Accounts').innerHTML='<table class="v5table"><tr><th>Account</th><th>Currency</th><th>Type</th><th>Balance</th><th></th></tr>'+rows+'</table>';
    var cc=data.creditCard||{};by('v5ccBal').value=n(cc.balance);by('v5ccLimit').value=n(cc.limit);by('v5ccStatement').value=cc.statementDate||'';by('v5ccDue').value=cc.dueDate||'';by('v5ccMin').value=n(cc.minPayment);
    by('v5ccInfo').innerHTML=cc.limit?'<span class="pill '+(cc.balance/cc.limit>.8?'bad':cc.balance/cc.limit>.5?'warn':'good')+'">Utilisation '+((cc.balance/cc.limit)*100).toFixed(0)+'%</span>':'<span class="v5mini">Enter a limit to calculate utilisation.</span>';
    var s=by('v5txAccount');if(s)s.innerHTML='<option value="">Unassigned</option>'+(data.accounts||[]).map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+' · '+a.currency+'</option>';}).join('');
  }
  window.v5AddAccount=function(){
    var name=by('v5acName').value.trim();if(!name)return alert('Enter an account name.');
    data.accounts.push({id:uid(),name:name,currency:by('v5acCurrency').value,type:by('v5acType').value,balance:n(by('v5acBalance').value),includeInSafeSpend:name!=='AIB Savings'});
    saveData();renderAccounts();by('v5acName').value='';by('v5acBalance').value='';
  };
  window.v5UpdateAccount=function(id,v){var a=data.accounts.find(function(x){return x.id===id});if(a){a.balance=n(v);saveData();renderAccounts();renderDashboard();}};
  window.v5DeleteAccount=function(id){if(id==='aib-savings')return alert('Keep the AIB Savings account; you can edit its balance.');if(!confirm('Delete this account?'))return;data.accounts=data.accounts.filter(function(a){return a.id!==id});data.transactions.forEach(function(t){if(t.accountId===id)t.accountId=''});saveData();renderAccounts();};
  window.v5SaveCard=function(){data.creditCard={balance:n(by('v5ccBal').value),limit:n(by('v5ccLimit').value),statementDate:by('v5ccStatement').value,dueDate:by('v5ccDue').value,minPayment:n(by('v5ccMin').value)};saveData();renderAccounts();};

  function renderTransactions(){
    var rows=(data.transactions||[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).map(function(t){
      var sign=t.type==='income'?'+':'-';
      var cls=t.type==='income'?'v5good':t.type==='expense'?'v5bad':'';
      return '<tr><td>'+esc(t.date)+'</td><td>'+esc(t.description)+'</td><td>'+esc(t.category)+'</td><td>'+esc(t.currency)+'</td><td class="'+cls+'">'+sign+(t.currency==='INR'?inr(t.amount):eur(t.amount))+'</td><td><button onclick="v5EditTransaction(\''+t.id+'\')">Edit</button> <button class="danger" onclick="v5DeleteTransaction(\''+t.id+'\')">Delete</button></td></tr>';
    }).join('');
    by('v5TxTable').innerHTML=rows?'<table class="v5table"><tr><th>Date</th><th>Description</th><th>Category</th><th>Currency</th><th>Amount</th><th></th></tr>'+rows+'</table>':'<div class="note">No transactions yet. Use the form above to add one.</div>';
  }
  window.v5AddTransaction=function(){
    var amount=n(by('v5txAmount').value);if(amount<=0)return alert('Enter an amount.');
    var t={id:uid(),date:by('v5txDate').value||new Date().toISOString().slice(0,10),description:by('v5txDesc').value.trim()||'Untitled',amount:amount,currency:by('v5txCurrency').value,type:by('v5txType').value,category:by('v5txCategory').value.trim()||'Other',accountId:by('v5txAccount').value,notes:by('v5txNotes').value.trim()};
    data.transactions.unshift(t);
    var a=data.accounts.find(function(x){return x.id===t.accountId});
    if(a&&t.currency===a.currency&&t.type!=='transfer')a.balance+=t.type==='income'?t.amount:-t.amount;
    saveData();renderTransactions();renderAccounts();renderDashboard();
    by('v5txAmount').value='';by('v5txDesc').value='';by('v5txNotes').value='';
  };
  window.v5EditTransaction=function(id){
 var t=data.transactions.find(function(x){return x.id===id});if(!t)return;
 var a=data.accounts.find(function(x){return x.id===t.accountId});
 var oldAmount=t.amount,oldType=t.type;
 var desc=prompt("Description",t.description);if(desc===null)return;
 var amount=prompt("Amount",t.amount);if(amount===null)return;
 var cat=prompt("Category",t.category||"Other");if(cat===null)return;
 var notes=prompt("Notes",t.notes||"");if(notes===null)return;
 amount=n(amount);if(amount<=0)return alert("Amount must be greater than zero.");
 if(a&&t.currency===a.currency&&t.type!=="transfer")a.balance += t.type==="income" ? -oldAmount : oldAmount;
 t.description=desc.trim()||t.description;t.amount=amount;t.category=cat.trim()||"Other";t.notes=notes.trim();
 if(a&&t.currency===a.currency&&t.type!=="transfer")a.balance += t.type==="income" ? amount : -amount;
 saveData();renderTransactions();renderAccounts();renderDashboard();
};
window.v5DeleteTransaction=function(id){
    var t=data.transactions.find(function(x){return x.id===id});if(!t)return;
    if(!confirm('Delete this transaction and reverse its effect on the linked account balance?'))return;
    var a=data.accounts.find(function(x){return x.id===t.accountId});
    if(a&&t.currency===a.currency&&t.type!=='transfer'){
      a.balance += t.type==='income' ? -t.amount : t.amount;
    }
    data.transactions=data.transactions.filter(function(x){return x.id!==id});
    saveData();renderTransactions();renderAccounts();renderDashboard();
  };
  window.v5ClearTransactions=function(){if(!confirm('Delete every transaction in the ledger?'))return;data.transactions=[];saveData();renderTransactions();};

  function renderGoals(){
    var html=(data.goals||[]).map(function(g){
      var pct=g.type==='debt'?(g.target?Math.min(100,Math.max(0,(g.target-g.current)/g.target*100)):0):(g.target?Math.min(100,Math.max(0,g.current/g.target*100)):0);
      var cur=g.currency==='INR'?inr(g.current):eur(g.current),tar=g.currency==='INR'?inr(g.target):eur(g.target);
      return '<div class="v5box"><div class="sectionTitle"><h3>'+esc(g.name)+'</h3><button class="danger" onclick="v5DeleteGoal(\''+g.id+'\')">Delete</button></div><div class="v5num">'+cur+' / '+tar+'</div><div class="progress" style="margin:10px 0"><span style="width:'+pct+'%"></span></div><div class="v5mini">'+pct.toFixed(0)+'% complete • '+(n(g.monthlyContribution)?((g.currency==='INR'?inr(g.monthlyContribution):eur(g.monthlyContribution))+'/month'):'no monthly plan')+'</div><div class="form" style="margin-top:10px"><div><label>Current</label><input type="number" step=".01" value="'+n(g.current)+'" onchange="v5UpdateGoal(\''+g.id+'\',this.value)"></div></div></div>';
    }).join('');
    by('v5Goals').innerHTML=html;
    var a=data.accounts.find(function(x){return x.name==='AIB Savings'});var aibBal=a?a.balance:0;var fg=data.goals.find(function(x){return x.name==='iPhone / India Tour'});if(fg)fg.current=aibBal;by('v5AibBalance').textContent=eur(aibBal);
  }
  window.v5AddGoal=function(){
    var name=by('v5gName').value.trim();if(!name)return alert('Enter a goal name.');
    data.goals.push({id:uid(),name:name,target:n(by('v5gTarget').value),current:n(by('v5gCurrent').value),currency:by('v5gCurrency').value,monthlyContribution:n(by('v5gMonthly').value),targetDate:by('v5gDate').value});
    saveData();renderGoals();
  };
  window.v5UpdateGoal=function(id,v){var g=data.goals.find(function(x){return x.id===id});if(g){g.current=n(v);saveData();renderGoals();renderDashboard();}};
  window.v5DeleteGoal=function(id){if(!confirm('Delete this goal?'))return;data.goals=data.goals.filter(function(g){return g.id!==id});saveData();renderGoals();};

  function renderNetWorth(){
    var eurAssets=0,inrAssets=0,eurLiab=0,inrLiab=0;
    (data.accounts||[]).forEach(function(a){if(a.currency==='EUR')eurAssets+=n(a.balance);else inrAssets+=n(a.balance);});
    (data.networth||[]).forEach(function(x){if(x.currency==='EUR'){if(x.kind==='asset')eurAssets+=n(x.amount);else eurLiab+=n(x.amount);}else{if(x.kind==='asset')inrAssets+=n(x.amount);else inrLiab+=n(x.amount);}});
    if(data.loan)inrLiab+=n(data.loan.opening);
    var ne=eurAssets-eurLiab,ni=inrAssets-inrLiab,fx=n(data.settings.fxEurInr)||100;
    by('v5NWEur').textContent=eur(ne);by('v5NWInr').textContent=inr(ni);by('v5NWCombined').textContent=eur(ne+ni/fx);by('v5FX').value=fx;
    ['asset','liability'].forEach(function(kind){
      var target=kind==='asset'?'v5Assets':'v5Liabilities';
      var rows=(data.networth||[]).filter(function(x){return x.kind===kind}).map(function(x){return '<tr><td>'+esc(x.name)+'</td><td>'+x.currency+'</td><td><input type="number" step=".01" value="'+n(x.amount)+'" onchange="v5UpdateNW(\''+x.id+'\',this.value)"></td><td><button class="danger" onclick="v5DeleteNW(\''+x.id+'\')">Delete</button></td></tr>';}).join('');
      by(target).innerHTML='<table class="v5table"><tr><th>Item</th><th>Currency</th><th>Amount</th><th></th></tr>'+rows+'</table>';
    });
  }
  window.v5AddNW=function(kind){var name=prompt('Name of '+kind);if(!name)return;var cur=prompt('Currency: EUR or INR','EUR');cur=(cur||'EUR').toUpperCase();if(cur!=='EUR'&&cur!=='INR')cur='EUR';var amount=prompt('Amount','0');data.networth.push({id:uid(),name:name,currency:cur,amount:n(amount),kind:kind});saveData();renderNetWorth();};
  window.v5UpdateNW=function(id,v){var x=data.networth.find(function(y){return y.id===id});if(x){x.amount=n(v);saveData();renderNetWorth();}};
  window.v5DeleteNW=function(id){if(!confirm('Delete this item?'))return;data.networth=data.networth.filter(function(x){return x.id!==id});saveData();renderNetWorth();};
  window.v5SaveFX=function(){data.settings.fxEurInr=n(by('v5FX').value)||100;saveData();renderNetWorth();};

  function renderDashboard(){
    var d=by('dashboard');if(!d)return;
    var health=by('v5Health');
    if(!health){health=document.createElement('div');health.id='v5Health';health.className='card';health.style.marginTop='15px';d.appendChild(health);}
    var inc=lastIncome(),sp=recentSpend(),rate=inc?((inc-sp)/inc*100):0,aib=(data.accounts.find(function(x){return x.name==='AIB Savings'})||{}).balance||0,loan=n(data.loan&&data.loan.opening);
    var g=data.goals.find(function(x){return x.name==='iPhone / India Tour'}),gp=g&&g.target?Math.min(100,g.current/g.target*100):0;
    health.innerHTML='<div class="sectionTitle"><div><h3>Financial health</h3><p class="muted">Calculated from the data currently stored in the app.</p></div><span class="pill">Live</span></div>'+
      '<div class="v5cols"><div class="v5box"><div class="eyebrow">Savings capacity</div><div class="v5num '+(rate>=0?'v5good':'v5bad')+'">'+rate.toFixed(0)+'%</div><div class="v5mini">Latest known income minus recent average spending</div></div>'+
      '<div class="v5box"><div class="eyebrow">AIB Savings</div><div class="v5num">'+eur(aib)+'</div><div class="v5mini">September €200 • October €100 • then €100/month</div></div>'+
      '<div class="v5box"><div class="eyebrow">Education loan</div><div class="v5num">'+inr(loan)+'</div><div class="v5mini">Current planning opening balance</div></div></div>'+
      '<div style="margin-top:12px"><div class="eyebrow">iPhone / India fund</div><div class="progress" style="margin-top:6px"><span style="width:'+gp+'%"></span></div><div class="v5mini" style="margin-top:5px">'+eur(g?g.current:0)+' of '+eur(g?g.target:0)+'</div></div>';
  }

  function renderReports(){
    var ks=Object.keys(data.months||{}).sort();
    var rows=ks.map(function(k){var m=data.months[k],actual=Object.values(m.actual||{}).reduce(function(a,b){return a+n(b)},0);return '<tr><td>'+esc(m.label)+'</td><td>'+eur(m.income)+'</td><td>'+eur(actual)+'</td><td class="'+(n(m.income)-actual>=0?'v5good':'v5bad')+'">'+eur(n(m.income)-actual)+'</td></tr>';}).join('');
    by('v5Report').innerHTML='<table class="v5table"><tr><th>Month</th><th>Income</th><th>Actual spend</th><th>Left</th></tr>'+rows+'</table>';
  }
  window.v5ExportReport=function(){
    var text='Viraj Personal Finance Centre Report\n\n';
    Object.keys(data.months||{}).sort().forEach(function(k){var m=data.months[k],s=Object.values(m.actual||{}).reduce(function(a,b){return a+n(b)},0);text+=m.label+': income '+n(m.income)+' EUR, spend '+s.toFixed(2)+' EUR, left '+(n(m.income)-s).toFixed(2)+' EUR\n';});
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download='viraj-financial-report.txt';a.click();
  };

  window.v5Simulate=function(){
    var t=n(by('v5SimTarget').value),c=n(by('v5SimCurrent').value),m=n(by('v5SimMonthly').value);
    if(t<=c){by('v5SimResult').innerHTML='<div class="alertItem good"><b>Target reached.</b></div>';return;}
    if(m<=0){by('v5SimResult').innerHTML='<div class="alertItem warn">Enter a positive monthly saving.</div>';return;}
    var months=Math.ceil((t-c)/m),d=new Date();d.setMonth(d.getMonth()+months);
    by('v5SimResult').innerHTML='<div class="alertItem good"><b>'+months+' months</b> at '+eur(m)+'/month. Estimated completion: <b>'+d.toLocaleDateString('en-IE',{month:'long',year:'numeric'})+'</b>.</div>';
  };
  window.v5Afford=function(){
    var cost=n(by('v5Buy').value),reserve=n(by('v5Reserve').value),available=(data.accounts||[]).filter(function(a){return a.currency==='EUR'&&a.includeInSafeSpend!==false}).reduce(function(s,a){return s+n(a.balance)},0);
    var after=available-cost;
    by('v5AffordResult').innerHTML=cost<=0?'<div class="alertItem warn">Enter a cost.</div>':after>=reserve?'<div class="alertItem good">Based on the spendable EUR account balances entered, '+eur(after)+' would remain after this purchase, above the '+eur(reserve)+' reserve assumption.</div>':'<div class="alertItem warn">Based on the balances entered, this purchase would take spendable EUR below the reserve assumption. Update account balances before relying on this calculation.</div>';
  };
  function renderPlanning(){
    var a=data.accounts.find(function(x){return x.name==='AIB Savings'}),ab=a?a.balance:0;
    by('v5PlanAib').textContent=eur(ab);by('v5PlanSpend').textContent=eur(recentSpend());by('v5PlanIncome').textContent=eur(lastIncome());
    var income=lastIncome(),spend=recentSpend(),running=(data.accounts||[]).filter(function(x){return x.currency==='EUR'&&x.includeInSafeSpend!==false}).reduce(function(s,a){return s+n(a.balance)},0),rows='<table class="v5table"><tr><th>Month</th><th>Income assumption</th><th>Average spend</th><th>AIB</th><th>Planning balance</th></tr>';
    var d=new Date();
    for(var i=0;i<12;i++){var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),net=income-spend-100;running+=net;rows+='<tr><td>'+monthLabel(k)+'</td><td>'+eur(income)+'</td><td>'+eur(spend)+'</td><td>'+eur(100)+'</td><td class="'+(running>=0?'v5good':'v5bad')+'">'+eur(running)+'</td></tr>';d.setMonth(d.getMonth()+1);}
    by('v5Forecast').innerHTML=rows+'</table>';v5Simulate();v5Afford();
  }

  window.v5AddTransaction=window.v5AddTransaction;
  function renderAll(){
    ensure();renderTrackers();renderAccounts();renderTransactions();renderGoals();renderNetWorth();renderReports();renderDashboard();renderPlanning();
    if(by('v5txDate')&&!by('v5txDate').value)by('v5txDate').value=new Date().toISOString().slice(0,10);
  }

  var oldShow=window.show;
  window.show=function(id,btn){
    document.querySelectorAll('.view').forEach(function(v){v.classList.remove('on')});
    var v=by(id);if(v)v.classList.add('on');
    document.querySelectorAll('.nav button').forEach(function(b){b.classList.remove('active')});
    if(btn)btn.classList.add('active');
    var titles={dashboard:'Dashboard',transactions:'Transactions',monthly:'Monthly',grocery:'Grocery',india:'India',misc:'Misc',accounts:'Accounts',goals:'Goals',loan:'Education Loan',networth:'Net Worth',reports:'Reports',planning:'Planning Centre',settings:'Settings'};
    if(by('title'))by('title').textContent=titles[id]||id;
    if(id==='monthly'&&typeof monthly==='function')monthly();
    if(id==='loan'&&typeof calcLoan==='function')calcLoan();
    if(id==='settings'&&typeof ensureLogin==='function')ensureLogin();
    if(id==='dashboard')renderDashboard();
    if(id==='transactions')renderTransactions();
    if(id==='grocery'||id==='india'||id==='misc')renderTrackers();
    if(id==='accounts')renderAccounts();
    if(id==='goals')renderGoals();
    if(id==='networth')renderNetWorth();
    if(id==='reports')renderReports();
    if(id==='planning')renderPlanning();
  };

  var q=document.createElement('button');q.id='v5Quick';q.className='v5quick';q.textContent='＋ Add transaction';
  q.onclick=function(){var b=document.querySelector('[data-v5nav="transactions"]');window.show('transactions',b);setTimeout(function(){if(by('v5txAmount'))by('v5txAmount').focus();},50);};
  document.body.appendChild(q);

  renderAll();
})();
