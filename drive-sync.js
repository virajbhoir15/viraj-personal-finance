/* Viraj Finance - near-real-time Google Drive sync */
(function () {
  "use strict";

  var FILE_NAME = "Viraj_Finance_Data.json";
  var POLL_MS = 30000;
  var state = {
    token: null,
    fileId: null,
    remoteModified: "",
    dirty: false,
    busy: false,
    started: false,
    conflict: false,
    timer: null
  };

  function nowISO() { return new Date().toISOString(); }
  function log() { if (window.console) console.log.apply(console, ["[Viraj Drive]"].concat([].slice.call(arguments))); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>\"]/g, function (m) { return {"&":"&amp;","<":"&lt;",">":"&gt;", "\"":"&quot;"}[m]; }); }

  function ensureStatusUI() {
    if (document.getElementById("driveSyncStatus")) return;
    var top = document.querySelector(".topActions");
    if (!top) return;
    var st = document.createElement("button");
    st.id = "driveSyncStatus";
    st.className = "driveSyncStatus";
    st.type = "button";
    st.title = "Google Drive sync status";
    st.onclick = function () {
      if (state.conflict) {
        var useCloud = confirm("Google Drive has newer finance data from another device. OK = use the cloud copy. Cancel = keep this device and overwrite the cloud copy.");
        if (useCloud) { state.dirty = false; resolveCloud(true); }
        else { state.dirty = true; resolveCloud(false); }
        return;
      }
      if (window.show) window.show("settings");
    };
    top.insertBefore(st, top.firstChild);
    var css = document.createElement("style");
    css.textContent =
      ".driveSyncStatus{border:1px solid #e5e9f0;background:#fff;border-radius:999px;padding:7px 10px;font-size:11px;color:#667085;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.driveSyncStatus .dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:#98a2b3}.driveSyncStatus.live{color:#166534;background:#effaf3;border-color:#ccebd8}.driveSyncStatus.live .dot{background:#2e9d63}.driveSyncStatus.syncing{color:#344054;background:#f8fafc}.driveSyncStatus.syncing .dot{background:#3157d5}.driveSyncStatus.conflict{color:#9a3412;background:#fff7ed;border-color:#fed7aa}.driveSyncStatus.conflict .dot{background:#f97316}.driveSyncStatus.offline .dot{background:#98a2b3}@media(max-width:700px){.driveSyncStatus{max-width:150px;overflow:hidden;text-overflow:ellipsis}.driveSyncStatus{font-size:10px;padding:6px 8px}}";
    document.head.appendChild(css);
  }

  function status(label, mode) {
    ensureStatusUI();
    var el = document.getElementById("driveSyncStatus");
    if (!el) return;
    el.className = "driveSyncStatus " + (mode || "");
    el.innerHTML = '<span class="dot"></span><span>' + esc(label) + "</span>";
    el.title = label;
  }

  function setConnected(flag) {
    try { localStorage.setItem("virajDriveConnected", flag ? "1" : "0"); } catch (e) {}
  }

  async function token(interactive) {
    if (state.token) return state.token;
    if (typeof window.getDriveToken !== "function") throw new Error("Google Drive connection is unavailable.");
    var t = await window.getDriveToken(!interactive);
    if (!t) throw new Error("Google Drive authorization was not completed.");
    state.token = t;
    return t;
  }

  async function findFile(t) {
    var saved = localStorage.getItem("virajDriveBackupId") || state.fileId;
    if (saved) {
      var check = await fetch("https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(saved) + "?fields=id,name,modifiedTime,version,trashed", {
        headers: { Authorization: "Bearer " + t }
      });
      if (check.ok) {
        var meta = await check.json();
        if (!meta.trashed) return meta;
      }
      localStorage.removeItem("virajDriveBackupId");
    }
    var q = encodeURIComponent("name='" + FILE_NAME + "' and trashed=false");
    var res = await fetch("https://www.googleapis.com/drive/v3/files?q=" + q + "&spaces=drive&fields=files(id,name,modifiedTime,version,trashed)", {
      headers: { Authorization: "Bearer " + t }
    });
    if (!res.ok) throw new Error("Drive search failed (" + res.status + ").");
    var body = await res.json();
    return (body.files || [])[0] || null;
  }

  function buildPayload() {
    var d = window.data || {};
    return JSON.stringify({
      app: "Viraj Personal Finance Centre",
      schemaVersion: 4,
      savedAt: nowISO(),
      data: d
    });
  }

  async function upload(t, force) {
    var meta = await findFile(t);
    if (meta && state.remoteModified && meta.modifiedTime && meta.modifiedTime !== state.remoteModified && !state.dirty) {
      var remoteWrapper = await downloadFile(t, meta);
      replaceInPlace(remoteWrapper.data);
      state.fileId = meta.id;
      state.remoteModified = meta.modifiedTime;
      try { localStorage.setItem("virajDriveLastRemoteModified", state.remoteModified); } catch (e) {}
      status("Cloud synced", "live");
      return "pulled";
    }
    if (meta && state.remoteModified && meta.modifiedTime && meta.modifiedTime !== state.remoteModified && state.dirty && !force) {
      state.conflict = true;
      status("Drive changed elsewhere", "conflict");
      return "conflict";
    }

    var boundary = "----virajFinance" + Date.now();
    var payload = buildPayload();
    var metaBody = JSON.stringify({ name: FILE_NAME, mimeType: "application/json" });
    var body = "--" + boundary + "\r\n" +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" + metaBody + "\r\n" +
      "--" + boundary + "\r\n" +
      "Content-Type: application/json\r\n\r\n" + payload + "\r\n" +
      "--" + boundary + "--";

    var url = meta
      ? "https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(meta.id) + "?uploadType=multipart&fields=id,name,modifiedTime,version"
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,version";
    var res = await fetch(url, {
      method: meta ? "PATCH" : "POST",
      headers: {
        Authorization: "Bearer " + t,
        "Content-Type": "multipart/related; boundary=" + boundary
      },
      body: body
    });
    var text = await res.text();
    if (!res.ok) throw new Error("Drive upload failed (" + res.status + ").");
    var saved = JSON.parse(text);
    state.fileId = saved.id || (meta && meta.id);
    state.remoteModified = saved.modifiedTime || nowISO();
    state.dirty = false;
    state.conflict = false;
    try {
      localStorage.removeItem("virajDriveDirty");
      localStorage.setItem("virajDriveBackupId", state.fileId);
      localStorage.setItem("virajDriveBackupAt", nowISO());
      localStorage.setItem("virajDriveLastRemoteModified", state.remoteModified);
    } catch (e) {}
    status("Cloud synced", "live");
    return "uploaded";
  }

  async function downloadFile(t, file) {
    var id = (file && file.id) || state.fileId || localStorage.getItem("virajDriveBackupId");
    if (!id) return null;
    var res = await fetch("https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(id) + "?alt=media", {
      headers: { Authorization: "Bearer " + t }
    });
    if (!res.ok) throw new Error("Drive download failed (" + res.status + ").");
    var wrapper = await res.json();
    if (!wrapper || !wrapper.data || !wrapper.data.months) throw new Error("The Drive finance backup is invalid.");
    return wrapper;
  }

  function replaceInPlace(remoteData) {
    var local = window.data || {};
    Object.keys(local).forEach(function (k) { delete local[k]; });
    Object.assign(local, remoteData || {});
    window.data = local;
    try { localStorage.setItem("virajFinance", JSON.stringify(local)); } catch (e) {}
    if (window.financeCore && window.financeCore.refresh) window.financeCore.refresh();
    else if (window.show) window.show(window.__view || "dashboard");
  }

  async function pull(interactive) {
    if (state.busy && !interactive) return;
    state.busy = true;
    status("Syncing from Drive…", "syncing");
    try {
      var t = await token(!!interactive);
      var file = await findFile(t);
      if (!file) {
        state.fileId = null;
        if (!interactive) status("Drive file not created yet", "");
        return "missing";
      }
      var wrapper = await downloadFile(t, file);
      replaceInPlace(wrapper.data);
      state.fileId = file.id;
      state.remoteModified = file.modifiedTime || nowISO();
      state.dirty = false;
      state.conflict = false;
      try {
        localStorage.removeItem("virajDriveDirty");
        localStorage.setItem("virajDriveBackupId", file.id);
        localStorage.setItem("virajDriveLastRemoteModified", state.remoteModified);
        localStorage.setItem("virajDriveBackupAt", nowISO());
      } catch (e) {}
      status("Cloud synced", "live");
      return "pulled";
    } finally {
      state.busy = false;
    }
  }

  async function syncNow(interactive, force) {
    if (state.busy) return;
    if (!navigator.onLine) {
      status("Offline · saved locally", "offline");
      return "offline";
    }
    state.busy = true;
    status("Syncing…", "syncing");
    try {
      var t = await token(!!interactive);
      var result = await upload(t, !!force);
      if (result === "conflict") return result;
      if (result === "pulled") {
        state.dirty = false;
        return result;
      }
      return result;
    } catch (e) {
      log(e);
      if (!interactive && /401|403|authorization|token/i.test(String(e.message || ""))) {
        state.token = null;
        setConnected(false);
      }
      status(navigator.onLine ? "Drive sync unavailable" : "Offline · saved locally", navigator.onLine ? "" : "offline");
      if (interactive && window.toast) window.toast(e.message || "Drive sync failed");
      return "error";
    } finally {
      state.busy = false;
    }
  }

  function schedulePush() {
    state.dirty = true;
    try { localStorage.setItem("virajDriveDirty", "1"); } catch (e) {}
    if (localStorage.getItem("virajDriveConnected") !== "1") {
      status("Saved locally", "");
      return;
    }
    clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(function () { syncNow(false); }, 700);
    status("Saving to Drive…", "syncing");
  }

  async function start(interactive) {
    if (state.started) {
      if (interactive) return syncNow(true);
      return "started";
    }
    state.started = true;
    state.dirty = localStorage.getItem("virajDriveDirty") === "1";
    state.remoteModified = localStorage.getItem("virajDriveLastRemoteModified") || "";
    ensureStatusUI();
    var connected = localStorage.getItem("virajDriveConnected") === "1";
    if (!connected && !interactive) {
      status("Drive not connected", "");
      return "not-connected";
    }
    var result;
    try {
      if (!state.dirty) {
        var t = await token(!!interactive), file = await findFile(t);
        if (file) {
          status("Updating from Drive…", "syncing");
          var wrapper = await downloadFile(t, file);
          replaceInPlace(wrapper.data);
          state.fileId = file.id;
          state.remoteModified = file.modifiedTime || nowISO();
          try {
            localStorage.setItem("virajDriveLastRemoteModified", state.remoteModified);
            localStorage.removeItem("virajDriveDirty");
          } catch (e) {}
          status("Cloud synced", "live");
          result = "pulled";
        } else {
          result = await syncNow(!!interactive);
        }
      } else {
        result = await syncNow(!!interactive);
      }
    } catch (e) {
      state.started = false;
      status(navigator.onLine ? "Drive sync unavailable" : "Offline · saved locally", navigator.onLine ? "" : "offline");
      if (interactive && window.toast) window.toast(e.message || "Drive sync failed");
      return "error";
    }
    if (result !== "error") {
      clearInterval(state.timer);
      state.timer = setInterval(function () {
        if (document.visibilityState !== "hidden" && !state.dirty) syncFromDrive();
      }, POLL_MS);
      setConnected(true);
    }
    return result;
  }

  async function syncFromDrive() {
    if (state.busy || state.dirty || !navigator.onLine) return;
    try {
      var t = await token(false);
      var file = await findFile(t);
      if (!file) return;
      var known = state.remoteModified || localStorage.getItem("virajDriveLastRemoteModified") || "";
      if (known && file.modifiedTime && file.modifiedTime === known) {
        status("Cloud synced", "live");
        return;
      }
      status("Updating from Drive…", "syncing");
      var wrapper = await downloadFile(t, file);
      replaceInPlace(wrapper.data);
      state.fileId = file.id;
      state.remoteModified = file.modifiedTime || nowISO();
      try { localStorage.setItem("virajDriveLastRemoteModified", state.remoteModified); } catch (e) {}
      status("Cloud synced", "live");
    } catch (e) {
      log("poll failed", e);
    }
  }

  async function connect() {
    setConnected(true);
    state.token = null;
    state.started = false;
    return start(true);
  }

  async function restore() {
    state.dirty = false;
    return pull(true);
  }

  async function resolveCloud(useCloud) {
    state.conflict = false;
    if (useCloud) {
      state.dirty = false;
      try { localStorage.removeItem("virajDriveDirty"); } catch (e) {}
      return pull(true);
    }
    state.dirty = true;
    try { localStorage.setItem("virajDriveDirty", "1"); } catch (e) {}
    var result = await syncNow(true, true);
    return result;
  }

  window.driveSync = {
    state: state,
    start: start,
    connect: connect,
    syncNow: function () { return syncNow(true, true); },
    syncFromDrive: syncFromDrive,
    restore: restore,
    markDirty: schedulePush,
    resolveCloud: resolveCloud
  };

  /* Keep the existing app buttons working while moving the actual sync logic here. */
  var oldSave = window.save;
  if (oldSave && !window.__driveSaveWrapped) {
    window.__driveSaveWrapped = true;
    window.save = function (msg) {
      var out = oldSave.apply(this, arguments);
      schedulePush();
      return out;
    };
  }

  window.backupToDrive = function () { return syncNow(true); };
  window.restoreFromDrive = function () { return restore(); };

  function boot() {
    ensureStatusUI();
    window.addEventListener("online", function () {
      if (localStorage.getItem("virajDriveConnected") === "1") start(false);
    });
    window.addEventListener("offline", function () { status("Offline · saved locally", "offline"); });
    window.addEventListener("storage", function (e) {
      if (e.key !== "virajFinance" || !e.newValue || state.busy || state.dirty) return;
      try {
        var incoming = JSON.parse(e.newValue);
        if (!incoming || !incoming.months) return;
        replaceInPlace(incoming);
        status("Updated from another tab", "live");
      } catch (err) {}
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && localStorage.getItem("virajDriveConnected") === "1") syncFromDrive();
    });
    if (localStorage.getItem("virajDriveConnected") === "1") start(false);
    else status("Drive not connected", "");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else setTimeout(boot, 0);
})();