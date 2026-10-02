
(function(){
  'use strict';

  function el(id){ return document.getElementById(id); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g,function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];
    });
  }
  function num(v){ var n=Number(v); return isFinite(n) ? n : 0; }
  function money(v){ return fmtEUR(num(v)); }
  function saveData(){
    if(typeof persist === 'function') persist(false);
    else if(typeof save === 'function') save();
    else localStorage.setItem('virajFinance',JSON.stringify(data));
  }
  function monthKey(d){ return String(d).slice(0,7); }
  function monthLabel(k){
    var d=new Date(k+'-01T00:00:00');
    return d.toLocaleDateString('en-IE',{month:'long',year:'numeric'});
  }
  function lastKnownIncome(){
    var keys=Object.keys(data.months||{}).sort();
    for(var i=keys.length-1;i>=0;i--){
      if(num(data.months[keys[i]].income)>0) return num(data.months[keys[i]].income);
    }
    return 0;
  }
  function avgRecentSpend(){
    var keys=Object.keys(data.months||{}).sort().slice(-3);
    if(!keys.length) return 0;
    var total=0,count=0;
    keys.forEach(function(k){
      var m=data.months[k];
      if(m && m.actual){ total+=Object.values(m.actual).reduce(function(a,b){return a+num(b)},0); count++; }
    });
    return count ? total/count : 0;
  }
  function eurAccounts(includeSavings){
    return (data.accounts||[]).filter(function(a){
      return a.currency==='EUR' && (includeSavings || a.includeInSafeSpend!==false);
    }).reduce(function(s,a){return s+num(a.balance)},0);
  }
  function aib(){
    var a=(data.accounts||[]).find(function(x){return x.name==='AIB Savings'});
    return a ? num(a.balance) : 0;
  }
  function ensurePlanningData(){
    if(!data.planning) data.planning={};
    if(data.planning.reserve==null) data.planning.reserve=500;
    if(data.planning.iphonePrice==null) data.planning.iphonePrice=1500;
    if(data.planning.tripPrice==null) data.planning.tripPrice=1500;
    if(!data.goals) data.goals=[];
    if(!data.goals.some(function(g){return g.name==='iPhone / India Tour'})){
      data.goals.push({id:'iphone-india-tour',name:'iPhone / India Tour',target:1500,current:aib(),currency:'EUR',type:'savings',targetDate:'',monthlyContribution:100,note:'Flexible fund for either an iPhone or an India trip.'});
    }
  }

  function addStyles(){
    if(el('v5Styles')) return;
    var s=document.createElement('style');
    s.id='v5Styles';
    s.textContent =
      '.v5grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px}' +
      '.v5grid2{display:grid;grid-template-columns:1.1fr .9fr;gap:15px;margin-top:15px}' +
      '.v5stat{padding:14px;border:1px solid var(--line);border-radius:14px;background:#fff}' +
      '.v5stat .num{font-size:24px;font-weight:900;margin-top:4px}' +
      '.v5good{color:#166534}.v5warn{color:#92400e}.v5bad{color:#991b1b}' +
      '.v5table{width:100%;border-collapse:collapse}.v5table th,.v5table td{padding:9px;border-bottom:1px solid var(--line);text-align:left}' +
      '.v5mini{font-size:12px;color:var(--muted)}' +
      '.v5quick{position:fixed;right:22px;bottom:22px;z-index:30;border:0;border-radius:999px;padding:14px 18px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;box-shadow:0 12px 30px #17255433}' +
      '@media(max-width:900px){.v5grid,.v5grid2{grid-template-columns:1fr}}' +
      '@media(max-width:650px){.v5quick{right:14px;bottom:82px}.v5grid{grid-template-columns:1fr 1fr}.v5stat .num{font-size:20px}}';
    document.head.appendChild(s);
  }

  function addPlanningView(){
    if(el('planning')) return;
    var main=document.querySelector('main');
    if(!main) return;
    var sec=document.createElement('section');
    sec.id='planning';
    sec.className='view';
    sec.innerHTML =
      '<div class="card hero">' +
        '<div class="sectionTitle"><div><div class="eyebrow" style="color:#c7d2fe">Decision tools</div><h2>Planning Centre</h2><p class="muted">Plan purchases, trips and monthly cash flow before committing money.</p></div><span class="pill">Planning</span></div>' +
      '</div>' +
      '<div class="v5grid">' +
        '<div class="v5stat"><div class="eyebrow">AIB savings</div><div class="num" id="v5Aib">€0</div><div class="v5mini">September €200 • October €100 • then €100/month</div></div>' +
        '<div class="v5stat"><div class="eyebrow">iPhone / India fund</div><div class="num" id="v5Goal">€0</div><div class="v5mini" id="v5GoalSub">€100/month planned</div></div>' +
        '<div class="v5stat"><div class="eyebrow">Recent average spending</div><div class="num" id="v5AvgSpend">€0</div><div class="v5mini">Average of the latest recorded months</div></div>' +
      '</div>' +
      '<div class="v5grid2">' +
        '<div class="card"><div class="sectionTitle"><h3>Can I afford this?</h3><span class="pill">What-if</span></div>' +
          '<div class="form"><div><label>Purchase / trip cost €</label><input id="v5Purchase" type="number" step=".01" value="1500"></div>' +
          '<div><label>Keep as emergency reserve €</label><input id="v5Reserve" type="number" step=".01" value="500"></div>' +
          '<div style="align-self:end"><button class="primary" onclick="window.v5Afford()">Calculate</button></div></div>' +
          '<div id="v5AffordResult" class="forecastBox" style="margin-top:14px"></div>' +
        '</div>' +
        '<div class="card"><div class="sectionTitle"><h3>Goal simulator</h3><span class="pill good">Flexible</span></div>' +
          '<div class="form"><div><label>Target €</label><input id="v5Target" type="number" step=".01" value="1500"></div>' +
          '<div><label>Current €</label><input id="v5Current" type="number" step=".01" value="300"></div>' +
          '<div><label>Monthly saving €</label><input id="v5Monthly" type="number" step=".01" value="100"></div></div>' +
          '<div id="v5GoalResult" style="margin-top:14px"></div><button class="primary" onclick="window.v5SimGoal()">Simulate</button></div>' +
      '</div>' +
      '<div class="card" style="margin-top:15px"><div class="sectionTitle"><div><h3>12-month planning forecast</h3><p class="muted">Planning estimate based on your latest recorded income and recent average spending. It is not a prediction of actual future transactions.</p></div><button onclick="window.v5Refresh()">Refresh</button></div><div id="v5Forecast"></div></div>' +
      '<div class="card" style="margin-top:15px"><div class="sectionTitle"><h3>Scenario comparison</h3><span class="pill">Edit the assumptions</span></div><div class="form"><div><label>Education loan payment ₹</label><input id="v5LoanPay" type="number" step="1000" value="100000"></div><div><label>iPhone / trip €</label><input id="v5TripCost" type="number" step=".01" value="1500"></div><div><label>Monthly AIB saving €</label><input id="v5AibMonthly" type="number" step=".01" value="100"></div><div style="align-self:end"><button class="primary" onclick="window.v5Scenario()">Compare</button></div></div><div id="v5ScenarioResult" style="margin-top:14px"></div></div>';

    main.appendChild(sec);
  }

  function addPlanningNav(){
    var nav=document.querySelector('.nav');
    if(!nav || nav.querySelector('[data-v5-planning]')) return;
    var b=document.createElement('button');
    b.setAttribute('data-v5-planning','1');
    b.textContent='🧭 Planning';
    b.onclick=function(){window.show('planning',b)};
    nav.appendChild(b);
  }

  function renderHealth(){
    var dash=el('dashboard');
    if(!dash) return;
    var box=el('v5Health');
    if(!box){
      box=document.createElement('div');
      box.id='v5Health';
      box.className='card';
      box.style.marginTop='15px';
      dash.appendChild(box);
    }
    var income=lastKnownIncome();
    var spend=avgRecentSpend();
    var savingsRate=income>0 ? ((income-spend)/income*100) : 0;
    var loan=(data.loan && num(data.loan.opening)) || 0;
    var a=aib();
    var g=(data.goals||[]).find(function(x){return x.name==='iPhone / India Tour'});
    var gp=g && num(g.target)>0 ? Math.min(100,Math.max(0,num(g.current)/num(g.target)*100)) : 0;
    box.innerHTML =
      '<div class="sectionTitle"><div><h3>Financial health</h3><p class="muted">A factual snapshot from the numbers currently stored in the app.</p></div><span class="pill">Live</span></div>' +
      '<div class="v5grid">' +
        '<div class="v5stat"><div class="eyebrow">Savings capacity</div><div class="num '+(savingsRate>=0?'v5good':'v5bad')+'">'+savingsRate.toFixed(0)+'%</div><div class="v5mini">Based on latest recorded income minus recent average spending</div></div>' +
        '<div class="v5stat"><div class="eyebrow">AIB savings</div><div class="num">'+money(a)+'</div><div class="v5mini">Dedicated savings account</div></div>' +
        '<div class="v5stat"><div class="eyebrow">Education loan opening model</div><div class="num">'+fmtINR(loan)+'</div><div class="v5mini">Current planning input</div></div>' +
      '</div>' +
      '<div style="margin-top:12px"><div class="eyebrow">iPhone / India fund progress</div><div class="progress" style="margin-top:7px"><span style="width:'+gp+'%"></span></div><div class="v5mini" style="margin-top:6px">'+money(g ? g.current : 0)+' of '+money(g ? g.target : 0)+' ('+gp.toFixed(0)+'%)</div></div>';
  }

  window.v5SimGoal=function(){
    var t=num(el('v5Target').value), c=num(el('v5Current').value), m=num(el('v5Monthly').value);
    var r=el('v5GoalResult');
    if(t<=c){r.innerHTML='<div class="alertItem good"><b>Target already reached.</b> Current savings are at or above the target.</div>';return;}
    if(m<=0){r.innerHTML='<div class="alertItem warn"><b>Monthly saving is zero.</b> Enter a positive monthly contribution.</div>';return;}
    var months=Math.ceil((t-c)/m);
    var d=new Date(); d.setMonth(d.getMonth()+months);
    r.innerHTML='<div class="alertItem good"><b>'+months+' months</b> at '+money(m)+'/month would cover the remaining '+money(t-c)+'. Estimated completion: <b>'+d.toLocaleDateString('en-IE',{month:'long',year:'numeric'})+'</b>.</div>';
  };

  window.v5Afford=function(){
    var cost=num(el('v5Purchase').value), reserve=num(el('v5Reserve').value);
    var available=eurAccounts(false);
    var after=available-cost;
    var r=el('v5AffordResult');
    if(cost<=0){r.innerHTML='<div class="alertItem warn">Enter a purchase or trip cost.</div>';return;}
    if(after>=reserve){
      r.innerHTML='<div class="alertItem good"><b>Based on the account balances currently entered,</b> €'+after.toFixed(2)+' would remain after the purchase, above the €'+reserve.toFixed(2)+' reserve assumption.</div>';
    }else{
      r.innerHTML='<div class="alertItem warn"><b>This would take the entered spendable-account balance below your reserve assumption.</b> Enter/update your account balances before relying on this calculation.</div>';
    }
  };

  window.v5Scenario=function(){
    var loan=num(el('v5LoanPay').value), trip=num(el('v5TripCost').value), aibm=num(el('v5AibMonthly').value);
    var income=lastKnownIncome(), spend=avgRecentSpend(), net=income-spend-aibm;
    var textClass=net>=0?'v5good':'v5bad';
    el('v5ScenarioResult').innerHTML =
      '<table class="v5table"><tr><th>Scenario</th><th>Monthly EUR effect</th><th>Education loan</th></tr>' +
      '<tr><td>Current planning inputs</td><td class="'+textClass+'">'+money(net)+'</td><td>'+fmtINR(num(data.loan && data.loan.payment))+'</td></tr>' +
      '<tr><td>Entered AIB saving + trip target</td><td class="'+(net>=0?'v5good':'v5bad')+'">'+money(net)+'</td><td>'+fmtINR(loan)+'</td></tr>' +
      '</table><p class="v5mini" style="margin-top:10px">The India-loan payment is shown separately because the app keeps EUR and INR cash flows separate.</p>' +
      '<div class="note" style="margin-top:10px">Trip / iPhone amount: '+money(trip)+' • AIB monthly saving: '+money(aibm)+'</div>';
  };

  window.v5Refresh=function(){
    ensurePlanningData();
    el('v5Aib').textContent=money(aib());
    var g=(data.goals||[]).find(function(x){return x.name==='iPhone / India Tour'});
    if(g){
      el('v5Goal').textContent=money(g.current)+' / '+money(g.target);
      el('v5GoalSub').textContent=money(num(g.monthlyContribution||100))+'/month planned';
      el('v5Target').value=num(g.target);
      el('v5Current').value=num(g.current);
      el('v5Monthly').value=num(g.monthlyContribution||100);
    }
    el('v5AvgSpend').textContent=money(avgRecentSpend());

    var income=lastKnownIncome(), spend=avgRecentSpend(), aibm=100, running=eurAccounts(false);
    var rows='<table class="v5table"><tr><th>Month</th><th>Income assumption</th><th>Avg spending</th><th>AIB saving</th><th>Planning balance</th></tr>';
    var d=new Date();
    for(var i=0;i<12;i++){
      var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      var net=income-spend-aibm;
      running+=net;
      rows+='<tr><td>'+monthLabel(k)+'</td><td>'+money(income)+'</td><td>'+money(spend)+'</td><td>'+money(aibm)+'</td><td class="'+(running>=0?'v5good':'v5bad')+'">'+money(running)+'</td></tr>';
      d.setMonth(d.getMonth()+1);
    }
    rows+='</table>';
    el('v5Forecast').innerHTML=rows;
    window.v5SimGoal();
    window.v5Afford();
    window.v5Scenario();
    renderHealth();
  };

  function addQuickButton(){
    if(el('v5Quick')) return;
    var b=document.createElement('button');
    b.id='v5Quick';
    b.className='v5quick';
    b.textContent='＋ Add money';
    b.onclick=function(){
      var t=document.querySelector('[data-v5-planning]') ? null : null;
      if(typeof window.show==='function'){
        var tx=document.querySelector('.nav button');
        var target=document.querySelector('.nav button');
        var buttons=document.querySelectorAll('.nav button');
        for(var i=0;i<buttons.length;i++){ if(buttons[i].textContent.indexOf('Transactions')>=0){target=buttons[i];break;} }
        window.show('transactions',target);
      }
      setTimeout(function(){ if(el('txAmount')) el('txAmount').focus(); },100);
    };
    document.body.appendChild(b);
  }

  ensurePlanningData();
  addStyles();
  addPlanningView();
  addPlanningNav();
  addQuickButton();

  var oldShow=window.show;
  window.show=function(id,btn){
    if(id==='planning'){
      document.querySelectorAll('.view').forEach(function(v){v.classList.remove('on')});
      var p=el('planning'); if(p)p.classList.add('on');
      document.querySelectorAll('.nav button').forEach(function(x){x.classList.remove('active')});
      if(btn)btn.classList.add('active');
      if(el('title'))el('title').textContent='Planning Centre';
      window.v5Refresh();
      return;
    }
    if(typeof oldShow==='function') oldShow(id,btn);
    setTimeout(renderHealth,0);
  };

  window.v5Refresh();
  window.v5SimGoal();
  window.v5Afford();
  window.v5Scenario();
})();
