/* SADEFT LEAL — script.js (atualizado) */
/* util */
const $ = id => document.getElementById(id);
const toNums = txt => txt.trim().split(/[\s,;.-]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n)&&n>=1&&n<=25);

/* config */
const LOCK_PW = "Leal2461@";
const EXCL = new Set([4,10,14,16,20,22,25]);

/* DOM */
const lock = $("lock"), app = $("app"), errLock = $("errLock");

/* estado */
let selected = new Set();
let fixed = new Set();
let gridElems = [];
let lastChatResponse = "";

/* --- LOCK --- */
$("btnEntrar").addEventListener("click",()=>{
  if($("senha").value === LOCK_PW){
    lock.style.display="none"; app.style.display="block";
    initApp();
  } else { errLock.innerText="Senha incorreta"; setTimeout(()=>errLock.innerText="",1800); }
});
$("senha").addEventListener("keydown", e=>{ if(e.key==="Enter") $("btnEntrar").click(); });

/* sair -> voltar lock */
$("btnSair").addEventListener("click", ()=> {
  app.style.display="none";
  lock.style.display="flex";
  $("senha").value = "";
  // optional: clear selections? keep state for next login
});

/* --- build grid --- */
function buildGrid(){
  const grid = $("gridDezenas");
  grid.innerHTML=""; gridElems=[];
  for(let i=1;i<=25;i++){
    const d = document.createElement("div");
    d.className="dez"; d.innerText = i.toString().padStart(2,"0"); d.dataset.num = i;
    if(EXCL.has(i)){ d.style.opacity=0.25; d.style.pointerEvents="none"; }
    d.addEventListener("click", ()=> handleClick(d));
    d.addEventListener("dblclick", ()=> handleDbl(d));
    grid.appendChild(d); gridElems.push(d);
  }
  refreshSelectedUI();
}

function handleClick(elem){
  const v = Number(elem.dataset.num);
  if(fixed.has(v)){ fixed.delete(v); elem.classList.remove("fixed"); }
  else if(selected.has(v)){ selected.delete(v); elem.classList.remove("selected"); }
  else { selected.add(v); elem.classList.add("selected"); }
  refreshSelectedUI();
}

function handleDbl(elem){
  const v = Number(elem.dataset.num);
  fixed.add(v); selected.delete(v);
  gridElems.forEach(e=>{ if(Number(e.dataset.num)===v){ e.classList.add("fixed"); e.classList.remove("selected"); }});
  refreshSelectedUI();
}

function refreshSelectedUI(){
  const arr = [...fixed, ...selected].map(n=>n.toString().padStart(2,"0"));
  $("selecionadasList").innerText = arr.length ? arr.join(" ") : "nenhuma";
}

/* limpar */
$("btnLimpar").addEventListener("click", ()=>{
  selected.clear(); fixed.clear(); gridElems.forEach(e=>e.classList.remove("selected","fixed"));
  refreshSelectedUI();
});

/* incluir fixa (move selected -> fixed) with currency symbol on button */
$("btnIncluir").addEventListener("click", ()=>{
  selected.forEach(n=> fixed.add(n));
  selected.clear();
  gridElems.forEach(e=>{ if(fixed.has(Number(e.dataset.num))){ e.classList.add("fixed"); e.classList.remove("selected"); }});
  refreshSelectedUI();
});

/* --- HISTÓRICO AUTOMÁTICO (localStorage) --- */
const HIST_KEY = "sadeft_hist";
function loadHistorico(){
  const raw = localStorage.getItem(HIST_KEY) || "";
  if(!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}
function saveHistorico(arr){
  localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(-50)));
}
function ensureHistoricoTextarea(){
  let arr = loadHistorico();
  // show last 20 lines (most recent last)
  const last20 = arr.slice(-20);
  $("historico").value = last20.map(a=>a.join(" ")).join("\n");
  $("lenHist").innerText = Math.min(arr.length,20);
}
$("historico").addEventListener("input", ()=>{
  // manual edits: store lines
  const lines = $("historico").value.split("\n").map(l=>toNums(l)).filter(l=>l.length>0).slice(-50);
  saveHistorico(lines);
  $("lenHist").innerText = Math.min(lines.length,20);
});

/* --- STATS & RANK --- */
function construirStats(hist){
  const stats = {};
  for(let i=1;i<=25;i++) stats[i] = {dz:i,freq:0,lastSeen:-1,impulso:0,runs:0};
  hist.forEach((conc,idx)=>{
    for(let d=1;d<=25;d++) if(conc.includes(d)) stats[d].freq++;
  });
  for(let d=1;d<=25;d++){
    for(let i=hist.length-1;i>=0;i--) if(hist[i].includes(d)){ stats[d].lastSeen = hist.length-1 - i; break; }
  }
  for(let d=1;d<=25;d++){
    const tl = hist.map(c=> c.includes(d)?1:0);
    let runs=0, cur=0, impulso=0;
    for(let i=0;i<tl.length;i++){
      const v=tl[i], prev = i>0?tl[i-1]:0;
      if(v===1 && prev===0) impulso+=1;
      if(v===1 && prev===1) impulso+=2;
      if(v===0 && prev===1) impulso-=1;
      if(v===1) cur++; else { if(cur>0){ runs++; cur=0; } }
    }
    if(cur>0) runs++;
    stats[d].runs=runs; stats[d].impulso=impulso;
  }
  return stats;
}

function rankByScore(stats, arr){
  const maxF = Math.max(...Object.values(stats).map(s=>s.freq)) || 1;
  const maxR = Math.max(...Object.values(stats).map(s=>s.runs)) || 1;
  const maxL = Math.max(...Object.values(stats).map(s=>s.lastSeen)) || 1;
  const score = d => {
    const s = stats[d];
    return s.impulso + 1.2*(s.freq/maxF) + 0.8*(s.runs/maxR) + 1.0*((maxL - s.lastSeen)/maxL);
  };
  return arr.slice().sort((a,b)=>score(b)-score(a));
}

/* --- GERAÇÃO (usamos função SADEFT-lite) --- */
function gerarSADEFT(params){
  const {concursoAnterior, historicoArr, quantidade, tamanho} = params;
  const stats = construirStats(historicoArr);
  const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
  const R = (concursoAnterior||[]).filter(d=>!EXCL.has(d)).slice(0,8);
  const ranked = rankByScore(stats, universo);
  const dzfa = universo.filter(d=> !(concursoAnterior||[]).includes(d)).slice(0,8);
  const seed = [...new Set([...R, ...dzfa])].slice(0,18);

  const jogos = [];
  for(let g=0; g<quantidade; g++){
    const used = new Set([...fixed]); // include fixed
    for(const r of R){ if(used.size>=tamanho) break; used.add(r); }
    let idx=0;
    while(used.size < Math.max(6, Math.floor(tamanho*0.6)) && idx < ranked.length){ used.add(ranked[idx++]); }
    const pick = arr => arr[Math.floor(Math.random()*arr.length)];
    while(used.size < tamanho){
      const p = pick(seed || ranked);
      if(!used.has(p)) used.add(p);
    }
    // fill randomly if needed
    while(used.size < tamanho){
      const v = Math.floor(Math.random()*25)+1;
      if(!EXCL.has(v)) used.add(v);
    }
    const arr = [...used].sort((a,b)=>a-b).slice(0,tamanho);
    jogos.push({id:g+1,numeros:arr,score:arr.reduce((s,x)=>s+stats[x].freq,0)});
  }
  return {jogos,stats,R,dzfa,ranked};
}

/* --- render resultado --- */
function renderResultado(res){
  const cont = $("resultado"); cont.innerHTML="";
  const meta = document.createElement("div");
  meta.style.marginBottom="8px";
  meta.style.color = "var(--celeste)";
  meta.innerHTML = `<b>R</b>: ${res.R.join(" ")} &nbsp; <b>DzFA</b>: ${res.dzfa.join(" ")}`;
  cont.appendChild(meta);

  const oficial = toNums($("resultadoOficial").value||"");
  let high = 0;

  res.jogos.forEach(j=>{
    const box = document.createElement("div"); box.className="jogo-box";
    const left = document.createElement("div");
    left.innerHTML = `<div style="color:var(--celeste);font-weight:800">Jogo ${j.id}</div>
      <div class="jogo-num">${j.numeros.map(n=>`<span class="badge">${n.toString().padStart(2,"0")}</span>`).join(" ")}</div>`;
    const right = document.createElement("div"); right.style.textAlign="right";
    right.innerHTML = `<div style="color:#ffd700;font-weight:800">Score: ${j.score}</div>`;
    let hits = 0;
    if(oficial.length){ hits = j.numeros.filter(n=>oficial.includes(n)).length;
      right.innerHTML += `<div style="margin-top:6px;color:${hits>=10?'#7efc7e':'#a9d3ff'}"><b>Acertos: ${hits}</b></div>`;
      if(hits>=10) high++;
    } else right.innerHTML += `<div style="margin-top:6px;color:var(--muted)">Acertos: —</div>`;
    box.appendChild(left); box.appendChild(right); cont.appendChild(box);
  });

  $("probabilidades").innerText = `Score médio: ${ Math.round(res.jogos.reduce((a,b)=>a+b.score,0)/res.jogos.length || 0) } • Jogos: ${res.jogos.length} • High≥10: ${high}`;
}

/* --- GERAR (botão) --- */
$("btnGerar").addEventListener("click", ()=> {
  const conc = toNums($("concursoAnterior").value||"");
  const hist = ($("historico").value||"").split("\n").map(l=>toNums(l)).filter(l=>l.length>0);
  const qtd = parseInt($("quantidade").value,10);
  const tam = parseInt($("tamanho").value,10);

  // ensure historico autosave
  const histAll = loadHistorico(); // existing local history
  // If textarea empty, use local storage
  const histToUse = hist.length ? hist : histAll.slice(-20);

  if(conc.length < 5){
    alert("Informe o concurso anterior com ao menos 5 dezenas.");
    return;
  }

  const res = gerarSADEFT({concursoAnterior:conc,historicoArr:histToUse,quantidade:qtd,tamanho:tam});
  // auto-push concursoAnterior as most recent if not same as last
  const arrHist = loadHistorico();
  const maybe = conc.slice(0,15);
  if(maybe.length>=5){
    // avoid duplicate if equals last
    if(!(arrHist.length && arraysEqual(arrHist[arrHist.length-1], maybe))){
      arrHist.push(maybe);
      saveHistorico(arrHist);
      ensureHistoricoTextarea();
    }
  }
  renderResultado(res);
  updateTendencias();
});

/* helper array compare */
function arraysEqual(a,b){
  if(!a||!b||a.length!==b.length) return false;
  for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}

/* --- TENDÊNCIAS --- */
function updateTendencias(limit=3){
  const hist = ($("historico").value||"").split("\n").map(l=>toNums(l)).filter(l=>l.length>0);
  const use = hist.length ? hist.slice(-limit) : loadHistorico().slice(-limit);
  $("lenHist").innerText = Math.min(loadHistorico().length,20);
  if(!use.length){ $("tendencias").innerText = "—"; return; }
  const stats = construirStats(use);
  const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
  const ranked = rankByScore(stats, universo).slice(0,10);
  $("tendencias").innerHTML = ranked.map(n=>`<span class="badge">${n.toString().padStart(2,"0")}</span>`).join(" ");
}

/* tendencia buttons */
$("btnLast3").addEventListener("click", ()=> updateTendencias(3));
$("btnLast10").addEventListener("click", ()=> updateTendencias(10));

/* --- HIST local helpers --- */
function loadHistorico(){
  const raw = localStorage.getItem(HIST_KEY) || "[]";
  try{ return JSON.parse(raw); }catch(e){ return []; }
}
function saveHistorico(arr){ localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(-50))); }
function ensureHistoricoTextarea(){ const arr = loadHistorico(); $("historico").value = arr.slice(-20).map(a=>a.join(" ")).join("\n"); $("lenHist").innerText = Math.min(arr.length,20); }

/* --- chat / voz --- */
let synth = window.speechSynthesis;
let femaleVoice = null;

function loadVoices(){
  const v = synth.getVoices();
  femaleVoice = v.find(voice => (voice.lang && voice.lang.toLowerCase().includes('pt')) && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('brasil') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('victoria'))) || v.find(voice => voice.lang && voice.lang.toLowerCase().includes('pt'));
}
setTimeout(()=>{ loadVoices(); },500);
synth.onvoiceschanged = loadVoices;

function speak(text){
  lastChatResponse = text;
  if(!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  if(femaleVoice) u.voice = femaleVoice;
  u.lang = 'pt-BR'; u.rate = 1.02; u.pitch = 1.05;
  synth.cancel(); synth.speak(u);
}

/* receive chat send */
$("chatSend").addEventListener("click", ()=> handleChatSend());
$("chatInput").addEventListener("keydown", e=>{ if(e.key==="Enter") handleChatSend(); });
$("chatSpeak").addEventListener("click", ()=> { if(lastChatResponse) speak(lastChatResponse); else speak("Nenhuma resposta para reproduzir."); });

function addChat(who, text, cls){
  const d = document.createElement("div"); d.className = "chat-line "+cls;
  d.innerHTML = `<b>${who}:</b> ${text}`; $("chatLog").appendChild(d); $("chatLog").scrollTop = $("chatLog").scrollHeight;
}

function handleChatSend(){
  const msg = $("chatInput").value.trim();
  if(!msg) return;
  addChat("Você", msg, "chat-me"); $("chatInput").value="";
  // try "advanced" local reasoning
  const reply = advancedReply(msg);
  addChat("SADEFT", reply, "chat-ai");
  speak(reply);
}

function advancedReply(msg){
  const lower = msg.toLowerCase();
  // smart answers that use stats
  if(lower.includes("tendenc") || lower.includes("vir") || lower.includes("prov")){
    // compute top 6 from last 10
    const hist = ($("historico").value||"").split("\n").map(l=>toNums(l)).filter(l=>l.length>0);
    const use = hist.length ? hist.slice(-10) : loadHistorico().slice(-10);
    const stats = construirStats(use);
    const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
    const ranked = rankByScore(stats, universo).slice(0,6);
    return `Tendências fortes (últimos ${use.length}): ${ranked.join(", ")}. Repetição estimada: 5–8 dezenas.`;
  }
  if(lower.includes("rezar")||lower.includes("oração")||lower.includes("orar")){
    return "Que o Criador te ouça e ilumine seu caminho. Confie no processo e nas repetições.";
  }
  if(lower.includes("gerar") || lower.includes("jogo")){
    return "Clique em GERAR para processar a previsão. Escolha quantidade e tamanho e eu montarei os jogos com a lógica SADEFT.";
  }
  // fallback spiritual + technical mix
  return "Sinto tendência de repetição nas dezenas centrais e pares. Posso gerar jogos agora se desejar.";
}

/* --- init app --- */
function initApp(){
  buildGrid();
  ensureHistoricoTextarea();
  updateTendencias(3);
  // wire ensure buttons existed earlier
}

/* --- ensure HIST_KEY defined after functions used --- */
const HIST_KEY = "sadeft_hist";

/* when page loads ensure local history key exists */
if(!localStorage.getItem(HIST_KEY)) saveHistorico([]);

/* --- ensure initial UI --- */
document.addEventListener("DOMContentLoaded", ()=>{ /* no-op, lock handles start */ });
