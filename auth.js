(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var state={connected:false,email:""};

function status(t,ok){
  var s=$("v7AuthStatus");
  if(s){s.textContent=t;s.className=ok?"v7auth good":"v7auth";}
}

var st=document.createElement("style");
st.textContent=".v7auth{margin-top:12px;padding:10px;border-radius:10px;background:#f8fafc;color:#475467;font-size:12px}.v7auth.good{background:#ecfdf3;color:#166534}.v7authGrid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}.v7authFields{display:grid;gap:10px}.v7authFields label{display:block;font-size:11px;color:#697386;font-weight:800}.v7authFields input{display:block;width:100%;margin-top:5px;box-sizing:border-box;border:1px solid #d9dee7;border-radius:10px;padding:11px 12px;background:#fff;color:#172033;font-size:16px}.v7authDivider{display:flex;align-items:center;gap:9px;margin:4px 0;color:#98a2b3;font-size:10px}.v7authDivider:before,.v7authDivider:after{content:'';height:1px;background:#e7eaf0;flex:1}.v7authSecondary{border:1px solid #dfe4ec;background:#fff;color:#334155;border-radius:10px;padding:10px 12px;font-weight:800}.v7authMode{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f3f5f9;border-radius:10px;padding:4px}.v7authMode button{border:0;background:transparent;border-radius:8px;padding:9px 8px;color:#667085;font-weight:850}.v7authMode button.active{background:#fff;color:#3157d5;box-shadow:0 2px 8px #17203312}.v7authHelp{font-size:10px;color:#7b8494;line-height:1.45}";
document.head.appendChild(st);

async function digest(text){
  if(window.crypto&&crypto.subtle){
    var buf=new TextEncoder().encode(text);
    var hash=await crypto.subtle.digest("SHA-256",buf);
    return Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,"0")}).join("");
  }
  var h=0;for(var i=0;i<text.length;i++)h=((h<<5)-h+text.charCodeAt(i))|0;
  return String(h);
}
function hasLocalCredential(){
  try{return !!localStorage.getItem("virajAuthHash")&&!!localStorage.getItem("virajAuthUser")}catch(e){return false}
}
function setLocalCredential(user,pass){
  return digest(user+"::"+pass).then(function(hash){
    localStorage.setItem("virajAuthUser",user);
    localStorage.setItem("virajAuthHash",hash);
  });
}
async function verifyLocalCredential(user,pass){
  try{
    var expected=localStorage.getItem("virajAuthHash")||"";
    var hash=await digest(user+"::"+pass);
    return !!expected&&hash===expected;
  }catch(e){return false}
}

function hideGate(){
  var gate=$("loginGate");if(gate)gate.style.display="none";
}
function localLogin(){
  var user=($("localAuthUser").value||"").trim();
  var pass=$("localAuthPass").value||"";
  if(!user||!pass){status("Enter your username and app password.",false);return;}
  verifyLocalCredential(user,pass).then(function(ok){
    if(!ok){status("Username or app password is incorrect.",false);return;}
    try{localStorage.setItem("virajFinanceLoggedIn","1");sessionStorage.setItem("virajLocalSession","1");}catch(e){}
    state.connected=true;hideGate();status("Signed in with your app password.",true);
    if(typeof toast==="function")toast("Signed in");
    if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false);
  });
}
function createLocalCredential(){
  var user=($("localAuthUser").value||"").trim();
  var pass=$("localAuthPass").value||"";
  var pass2=$("localAuthPass2").value||"";
  if(!user){status("Choose a username.",false);return;}
  if(pass.length<6){status("Use an app password with at least 6 characters.",false);return;}
  if(pass!==pass2){status("Passwords do not match.",false);return;}
  setLocalCredential(user,pass).then(function(){
    try{localStorage.setItem("virajFinanceLoggedIn","1");sessionStorage.setItem("virajLocalSession","1");}catch(e){}
    state.connected=true;hideGate();status("Local login created and signed in.",true);
    if(typeof toast==="function")toast("Local login created");
    if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false);
  }).catch(function(){status("Could not save the local login.",false)});
}

function renderLocal(mode){
  var wrap=$("localAuthPanel");if(!wrap)return;
  var setup=mode==="setup";
  wrap.innerHTML=
    '<div class="v7authMode"><button type="button" class="'+(setup?"active":"")+'" data-local-mode="setup">Create password</button><button type="button" class="'+(!setup?"active":"")+'" data-local-mode="login">Sign in</button></div>'+
    '<div class="v7authFields"><label>Username<input id="localAuthUser" autocomplete="username" value="'+((localStorage.getItem("virajAuthUser")||"viraj").replace(/"/g,"&quot;"))+'"></label>'+
    '<label>App password<input id="localAuthPass" type="password" autocomplete="'+(setup?"new-password":"current-password")+'"></label>'+
    (setup?'<label>Confirm password<input id="localAuthPass2" type="password" autocomplete="new-password"></label>':'')+
    '<button type="button" class="primary" id="localAuthSubmit">'+(setup?"Create password & sign in":"Sign in with password")+'</button>'+
    '<div class="v7authHelp">This is a local app lock for this device/browser. It is not a replacement for server-side banking security.</div></div>';
  wrap.querySelectorAll("[data-local-mode]").forEach(function(b){
    b.onclick=function(){renderLocal(b.dataset.localMode==="setup"?"setup":"login")};
  });
  $("localAuthSubmit").onclick=setup?createLocalCredential:localLogin;
}

function addLoginUI(){
  var gate=$("loginGate");if(!gate)return;
  var card=gate.querySelector(".loginCard");if(!card||$("googleSignInBtn"))return;
  var b=document.createElement("div");b.className="v7authGrid";
  b.innerHTML='<button id="googleSignInBtn" class="primary" type="button">Continue with Google</button>'+
    '<div class="v7authDivider">OR</div>'+
    '<div id="localAuthPanel"></div>';
  card.appendChild(b);
  var note=document.createElement("div");note.id="v7AuthStatus";note.className="v7auth";note.textContent=hasLocalCredential()?"Use your username and app password, or continue with Google.":"Create a username and app password for this device, or continue with Google.";card.appendChild(note);
  $("googleSignInBtn").onclick=googleLogin;
  renderLocal(hasLocalCredential()?"login":"setup");
}

async function googleLogin(){
  var btn=$("googleSignInBtn");if(btn)btn.disabled=true;
  try{
    if(typeof getDriveToken!=="function")throw new Error("Google connection module is unavailable.");
    var token=await getDriveToken();
    if(!token)throw new Error("Google authorization was not completed.");
    sessionStorage.setItem("virajGoogleSession","1");
    localStorage.setItem("virajFinanceLoggedIn","1");
    state.connected=true;hideGate();status("Google account connected.",true);
    if(typeof toast==="function")toast("Google account connected");
    if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false);
  }catch(e){status(e.message||"Google sign-in failed.",false);alert(e.message||"Google sign-in failed.");}
  finally{if(btn)btn.disabled=false}
}
function signOutGoogle(){try{sessionStorage.removeItem("virajGoogleSession");sessionStorage.removeItem("virajLocalSession")}catch(e){}state.connected=false}
function hasGoogleSession(){try{return sessionStorage.getItem("virajGoogleSession")==="1"}catch(e){return false}}
function hasLocalSession(){try{return sessionStorage.getItem("virajLocalSession")==="1"}catch(e){return false}}

function init(){
  addLoginUI();
  var gate=$("loginGate");
  try{
    if(hasGoogleSession()||hasLocalSession()||localStorage.getItem("virajFinanceLoggedIn")==="1"){
      state.connected=true;if(gate)gate.style.display="none";
      setTimeout(function(){if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false)},300);
    }
  }catch(e){}
  window.v7GoogleLogin=googleLogin;
  window.v7GoogleLogout=signOutGoogle;
  var oldLogout=window.logout;
  window.logout=function(){
    signOutGoogle();
    try{localStorage.removeItem("virajFinanceLoggedIn")}catch(e){}
    if(typeof oldLogout==="function")oldLogout();else location.reload();
  };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();