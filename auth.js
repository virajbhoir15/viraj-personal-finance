(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var state={connected:false,email:""};
function status(t,ok){var s=$("v7AuthStatus");if(s){s.textContent=t;s.className=ok?"v7auth good":"v7auth"}}
var st=document.createElement("style");st.textContent=".v7auth{margin-top:12px;padding:10px;border-radius:10px;background:#f8fafc;color:#475467;font-size:12px}.v7auth.good{background:#ecfdf3;color:#166534}.v7authGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}@media(max-width:650px){.v7authGrid{grid-template-columns:1fr}}";document.head.appendChild(st);

function addLoginUI(){
 var gate=$("loginGate");if(!gate)return;
 var card=gate.querySelector(".loginCard");if(!card||$("googleSignInBtn"))return;
 var b=document.createElement("div");b.className="v7authGrid";
 b.innerHTML='<button id="googleSignInBtn" class="primary" type="button">Continue with Google</button><button id="legacySignInBtn" type="button">Use app password</button>';
 card.appendChild(b);
 var note=document.createElement("div");note.id="v7AuthStatus";note.className="v7auth";note.textContent="Google sign-in uses the Google account connected to this finance app. No Google password is entered here.";card.appendChild(note);
 $("googleSignInBtn").onclick=googleLogin;
 $("legacySignInBtn").onclick=function(){var u=$("loginUser"),p=$("loginPass");if(u)u.focus();if(p)p.style.display="block";status("Legacy browser app-lock remains available.",false)};
}

async function googleLogin(){
 var btn=$("googleSignInBtn");if(btn)btn.disabled=true;
 try{
  if(typeof getDriveToken!=="function")throw new Error("Google connection module is unavailable.");
  var token=await getDriveToken();
  if(!token)throw new Error("Google authorization was not completed.");
  sessionStorage.setItem("virajGoogleSession","1");
  state.connected=true;
  var gate=$("loginGate");if(gate)gate.style.display="none";
  status("Google account connected.",true);
  if(typeof toast==="function")toast("Google account connected");
  if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false);
 }catch(e){status(e.message||"Google sign-in failed.",false);alert(e.message||"Google sign-in failed.");}
 finally{if(btn)btn.disabled=false}
}

function signOutGoogle(){try{sessionStorage.removeItem("virajGoogleSession")}catch(e){}state.connected=false}
function hasGoogleSession(){try{return sessionStorage.getItem("virajGoogleSession")==="1"}catch(e){return false}}
function init(){
 addLoginUI();
 var gate=$("loginGate");
 if(hasGoogleSession()){state.connected=true;if(gate)gate.style.display="none";setTimeout(function(){if(window.driveSync&&typeof window.driveSync.start==="function")window.driveSync.start(false)},300)}
 var top=document.querySelector(".top>div:last-child");
 if(top&&!$("v7AccountBtn")){
  var b=document.createElement("button");b.id="v7AccountBtn";b.textContent="Google account";b.onclick=function(){googleLogin()};top.insertBefore(b,top.firstChild);
 }
 window.v7GoogleLogin=googleLogin;window.v7GoogleLogout=signOutGoogle;var oldLogout=window.logout;window.logout=function(){signOutGoogle();if(typeof oldLogout==="function")oldLogout();else location.reload()};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();