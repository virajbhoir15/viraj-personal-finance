/* Viraj Finance - unified transaction engine */
(function () {
  "use strict";

  var KEY = "virajFinance";
  var UNDO_KEY = "virajFinanceUndo";
  var now = function () { return new Date(); };
  var isoDate = function (d) { return new Date(d || now()).toISOString().slice(0, 10); };
  var monthKey = function (d) { return String(d || "").slice(0, 7); };
  var currentMonth = function () { return isoDate().slice(0, 7); };
  var n = function (v) { var x = Number(v); return isFinite(x) ? x : 0; };
  var uid = function (p) { return (p || "tx") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); };

  function getData() {
    return window.data || {};
  }

  function persist(message) {
    var d = getData();
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      if (window.driveSync && typeof window.driveSync.markDirty === "function") {
        window.driveSync.markDirty();
      }
    } catch (e) {
      console.error("Finance data save failed", e);
    }
    if (message && typeof window.toast === "function") window.toast(message);
  }

  function account(id) {
    return (getData().accounts || []).find(function (a) { return a.id === id; }) || null;
  }

  function rememberAccount(description, accountId) {
    var key = String(description || "").trim().toLowerCase();
    if (!key || !accountId) return;
    try {
      var map = JSON.parse(localStorage.getItem("virajMerchantAccounts") || "{}");
      map[key] = accountId;
      localStorage.setItem("virajMerchantAccounts", JSON.stringify(map));
    } catch (e) {}
  }

  function rememberedAccount(description) {
    var key = String(description || "").trim().toLowerCase();
    try {
      var map = JSON.parse(localStorage.getItem("virajMerchantAccounts") || "{}");
      if (map[key] && account(map[key])) return map[key];
      var words = key.split(/\s+/).filter(function (x) { return x.length >= 3; });
      var entries = Object.entries(map);
      for (var i = entries.length - 1; i >= 0; i--) {
        var saved = entries[i][0];
        if (words.some(function (w) { return saved.indexOf(w) >= 0 || w.indexOf(saved) >= 0; })) {
          if (account(entries[i][1])) return entries[i][1];
        }
      }
    } catch (e) {}
    return null;
  }

  function defaultAccountId(type, description, requested) {
    if (requested && account(requested)) return requested;
    var remembered = rememberedAccount(description);
    if (remembered) return remembered;
    var d = getData();
    if (type === "income") {
      var a = (d.accounts || []).find(function (x) { return x.id === "aib-regular" && x.currency === "EUR"; });
      if (a) return a.id;
    }
    var regular = (d.accounts || []).find(function (x) { return x.id === "aib-regular"; });
    return regular ? regular.id : ((d.accounts || [])[0] || {}).id || "";
  }

  function syncCardAccount() {
    var d = getData();
    var card = (d.accounts || []).find(function (a) { return a.id === "avant-card"; });
    if (card) {
      d.creditCard = d.creditCard || {};
      d.creditCard.balance = n(card.balance);
    }
  }

  function updateMonth(t, dir) {
    var d = getData();
    if (t.currency !== "EUR") return;
    var k = monthKey(t.date), m = d.months && d.months[k];
    if (!m) return;
    m.actual = m.actual || {};
    if (t.type === "expense") {
      var cat = t.category || "Other";
      m.actual[cat] = n(m.actual[cat]) + n(t.amount) * dir;
      if (Math.abs(m.actual[cat]) < 0.005) m.actual[cat] = 0;
    } else if (t.type === "income") {
      m.income = n(m.income) + n(t.amount) * dir;
      if (Math.abs(m.income) < 0.005) m.income = 0;
    }
  }

  /* Account balances are snapshots of current money.
     Only transactions in the current month change the current snapshot.
     Historical/future entries still update the ledger and monthly tracker,
     but do not rewrite today's bank/card balance. */
  function updateAccountForNormal(t, dir) {
    if (t.currency !== "EUR" || monthKey(t.date) !== currentMonth()) return;
    var a = account(t.accountId);
    if (!a) return;
    if (t.type === "expense") {
      a.balance = n(a.balance) + (a.type === "Credit Card" ? n(t.amount) * dir : -n(t.amount) * dir);
    } else if (t.type === "income") {
      a.balance = n(a.balance) + n(t.amount) * dir;
    }
    if (a.id === "avant-card") syncCardAccount();
  }

  function updateTransfer(t, dir) {
    if (t.currency !== "EUR" || monthKey(t.date) !== currentMonth()) return;
    var from = account(t.fromAccountId || t.accountId);
    var to = account(t.toAccountId);
    if (from) from.balance = n(from.balance) - n(t.amount) * dir;
    if (to) to.balance = n(to.balance) + n(t.amount) * dir;
    syncCardAccount();
  }

  function updateGoalContribution(t, dir) {
    var d = getData();
    if (t.currency !== "EUR" || monthKey(t.date) !== currentMonth()) return;
    var from = account(t.accountId);
    var goal = (d.goals || []).find(function (g) { return g.id === t.goalId; });
    if (from) from.balance = n(from.balance) - n(t.amount) * dir;
    if (goal) goal.current = n(goal.current) + n(t.amount) * dir;
    syncCardAccount();
  }

  function apply(t, dir) {
    if (!t) return;
    updateMonth(t, dir);
    if (t.type === "transfer") updateTransfer(t, dir);
    else if (t.type === "goal") updateGoalContribution(t, dir);
    else updateAccountForNormal(t, dir);
  }

  function refresh() {
    try {
      if (typeof window.show === "function") window.show(window.__view || "dashboard");
      else if (typeof window.dashboard === "function") window.dashboard();
    } catch (e) {
      console.error("Finance refresh failed", e);
    }
  }

  function baseTransaction(input) {
    var d = getData();
    var type = input.type || "expense";
    var desc = String(input.description || (type === "income" ? "Income" : "Expense")).trim();
    var cur = input.currency || "EUR";
    var t = {
      id: input.id || uid("tx"),
      date: isoDate(input.date),
      description: desc,
      amount: n(input.amount),
      currency: cur,
      type: type,
      category: String(input.category || (type === "income" ? "Salary" : "Other")),
      accountId: type === "goal" ? (input.accountId || "") : (input.accountId || (cur === "EUR" ? defaultAccountId(type, desc, "") : "")),
      notes: String(input.notes || "").trim(),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (type === "transfer") {
      t.fromAccountId = input.fromAccountId || input.accountId || "";
      t.toAccountId = input.toAccountId || "";
      t.category = "Transfer";
    }
    if (type === "goal") {
      t.goalId = input.goalId || "";
      t.category = "Goal contribution";
    }
    return t;
  }

  function addTransaction(input, opts) {
    var d = getData();
    opts = opts || {};
    d.transactions = d.transactions || [];
    var t = baseTransaction(input || {});
    if (t.amount <= 0) throw new Error("Enter an amount greater than zero.");

    if (t.type === "transfer") {
      if (!t.fromAccountId || !t.toAccountId) throw new Error("Choose both accounts for a transfer.");
      if (t.fromAccountId === t.toAccountId) throw new Error("Transfer accounts must be different.");
    }
    if (t.type === "goal") {
      var goal = (d.goals || []).find(function (g) { return g.id === t.goalId; });
      if (!goal) throw new Error("Choose a goal.");
      if (goal.currency !== t.currency) throw new Error("Goal currency must match the contribution currency.");
    }

    d.transactions.push(t);
    apply(t, 1);
    rememberAccount(t.description, t.accountId || t.fromAccountId);
    persist();
    if (!opts.silent) {
      if (typeof window.toast === "function") window.toast(
        (t.type === "income" ? "Income" : t.type === "expense" ? "Expense" : t.type === "transfer" ? "Transfer" : "Goal contribution") + " added"
      );
      refresh();
    }
    return t;
  }

  function editTransaction(id, input) {
    var d = getData(), old = (d.transactions || []).find(function (x) { return x.id === id; });
    if (!old) throw new Error("Transaction not found.");
    var next = baseTransaction(Object.assign({}, input, { id: old.id, createdAt: old.createdAt }));
    if (next.amount <= 0) throw new Error("Enter an amount greater than zero.");
    if (next.type === "transfer" && (!next.fromAccountId || !next.toAccountId || next.fromAccountId === next.toAccountId)) throw new Error("Choose two different accounts for a transfer.");
    if (next.type === "goal") {
      var editGoal = (d.goals || []).find(function (g) { return g.id === next.goalId; });
      if (!editGoal) throw new Error("Choose a goal.");
      if (editGoal.currency !== next.currency) throw new Error("Goal currency must match the contribution currency.");
    }
    apply(old, -1);
    apply(next, 1);
    d.transactions = d.transactions.map(function (x) { return x.id === id ? next : x; });
    rememberAccount(next.description, next.accountId || next.fromAccountId);
    persist();
    if (typeof window.toast === "function") window.toast("Transaction updated");
    refresh();
    return next;
  }

  function removeTransaction(id) {
    var d = getData(), old = (d.transactions || []).find(function (x) { return x.id === id; });
    if (!old) return false;
    apply(old, -1);
    d.transactions = d.transactions.filter(function (x) { return x.id !== id; });
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify({ deleted: old, at: Date.now() }));
    } catch (e) {}
    persist();
    showUndoToast(old);
    refresh();
    return true;
  }

  function undoLastDelete() {
    var payload = null;
    try { payload = JSON.parse(localStorage.getItem(UNDO_KEY) || "null"); } catch (e) {}
    if (!payload || !payload.deleted) return false;
    var d = getData();
    if ((d.transactions || []).some(function (t) { return t.id === payload.deleted.id; })) return false;
    d.transactions.push(payload.deleted);
    apply(payload.deleted, 1);
    localStorage.removeItem(UNDO_KEY);
    persist();
    if (typeof window.toast === "function") window.toast("Transaction restored");
    refresh();
    return true;
  }

  function duplicateTransaction(id) {
    var d = getData(), old = (d.transactions || []).find(function (x) { return x.id === id; });
    if (!old) return null;
    var copy = Object.assign({}, old);
    delete copy.id;
    copy.date = isoDate();
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.description = (old.description || "Transaction") + " (copy)";
    var t = addTransaction(copy);
    return t;
  }

  function showUndoToast(old) {
    var box = document.getElementById("financeUndoToast");
    if (!box) {
      box = document.createElement("div");
      box.id = "financeUndoToast";
      box.className = "financeUndoToast";
      document.body.appendChild(box);
    }
    box.innerHTML = "<span>Deleted " + String(old.description || "transaction").replace(/[<>&"]/g, "") + "</span><button id=\"financeUndoBtn\">Undo</button>";
    box.style.display = "flex";
    clearTimeout(window.__undoTimer);
    document.getElementById("financeUndoBtn").onclick = function () {
      box.style.display = "none";
      undoLastDelete();
    };
    window.__undoTimer = setTimeout(function () { box.style.display = "none"; }, 6000);
  }

  window.financeCore = {
    addTransaction: addTransaction,
    editTransaction: editTransaction,
    deleteTransaction: removeTransaction,
    undoLastDelete: undoLastDelete,
    duplicateTransaction: duplicateTransaction,
    persist: persist,
    refresh: refresh,
    apply: apply,
    rememberedAccount: rememberedAccount,
    defaultAccountId: defaultAccountId,
    currentMonth: currentMonth,
    isoDate: isoDate
  };
})();