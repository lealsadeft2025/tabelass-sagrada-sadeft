/* SADEFT LEAL — script.js (Versão limpa e corrigida) */

/* ====== Config ====== */
const LOCK_PW = "Leal2461@";
const EXCL = new Set([4,10,14,16,20,22,25]);
const HIST_KEY = "sadeft_hist";

/* ====== Util ====== */
if (typeof window.$ === "undefined") {
  window.$ = id => document.getElementById(id);
}
const toNums = txt => (txt||"").trim().split(/[\s,;.-]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n)&&n>=1&&n<=25);

if (typeof window.arraysEqual !== "function") {
  window.arraysEqual = (a,b) => {
    if(!Array.isArray(a) || !Array.isArray(b)) return false;
    if(a.length !== b.length) return false;
    for(let i=0;i<a.length;i++) if(a[i] !== b[i]) return false;
    return true;
  };
}

/* ====== Histórico (localStorage) ====== */
function loadHistorico(){
  try{
    const raw = localStorage.getItem(HIST_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.warn("loadHistorico:", e);
    return [];
  }
}
function saveHistorico(arr){
  try{
    localStorage.setItem(HIST_KEY, JSON.stringify((arr||[]).slice(-200)));
  }catch(e){
    console.warn("saveHistorico:", e);
  }
}
function ensureHistoricoTextarea(){
  const ta = $("historico");
  const arr = loadHistorico();
  if(ta) ta.value = arr.slice(-20).map(a=>a.join(" ")).join("\n");
  const ln = $("lenHist");
  if(ln) ln.innerText = Math.min(arr.length,20);
}
if(!localStorage.getItem(HIST_KEY)) saveHistorico([]);

/* ====== Estado ====== */
let selected = new Set();
let fixed = new Set();
let gridElems = [];

/* ====== Grid e seleção ====== */
function buildGrid(){
  const grid = $("gridDezenas");
  if(!grid) { console.warn("buildGrid: #gridDezenas não encontrado."); return; }
  grid.innerHTML = "";
  gridElems = [];
  for(let i=1;i<=25;i++){
    const d = document.createElement("div");
    d.className = "dez";
    d.innerText = i.toString().padStart(2,"0");
    d.dataset.num = i;
    if(EXCL.has(i)){
      d.style.opacity = "0.25";
      d.style.pointerEvents = "none";
      d.classList.add("excluded");
    }
    d.addEventListener("click", ()=>handleClick(d));
    d.addEventListener("dblclick", ()=>handleDbl(d));
    grid.appendChild(d);
    gridElems.push(d);
  }
  refreshSelectedUI();
}

function handleClick(elem){
  const v = Number(elem.dataset.num);
  if(fixed.has(v)){
    fixed.delete(v); elem.classList.remove("fixed");
  } else if(selected.has(v)){
    selected.delete(v); elem.classList.remove("selected");
  } else {
    selected.add(v); elem.classList.add("selected");
  }
  refreshSelectedUI();
}
function handleDbl(elem){
  const v = Number(elem.dataset.num);
  fixed.add(v); selected.delete(v);
  elem.classList.add("fixed"); elem.classList.remove("selected");
  refreshSelectedUI();
}
function refreshSelectedUI(){
  const arr = [...fixed, ...selected].map(n=>n.toString().padStart(2,"0"));
  const out = $("selecionadasList");
  if(out) out.innerText = arr.length ? arr.join(" ") : "nenhuma";
}

/* limpar / incluir fixa */
function limparSelecionadas(){
  selected.clear(); fixed.clear();
  gridElems.forEach(e => e.classList.remove("selected","fixed"));
  refreshSelectedUI();
}
function incluirFixas(){
  selected.forEach(n=> fixed.add(n));
  selected.clear();
  gridElems.forEach(e=>{
    const num = Number(e.dataset.num);
    if(fixed.has(num)){ e.classList.add("fixed"); e.classList.remove("selected"); }
  });
  refreshSelectedUI();
}

/* ====== Estatísticas e geração ====== */
function construirStats(hist){
  const stats = {};
  for(let i=1;i<=25;i++) stats[i] = {dz:i,freq:0,lastSeen:-1,impulso:0,runs:0};
  hist.forEach((conc,idx)=>{
    for(const d of conc) if(stats[d]) stats[d].freq++;
  });
  for(let d=1;d<=25;d++){
    for(let i=hist.length-1;i>=0;i--){
      if(hist[i].includes(d)){ stats[d].lastSeen = hist.length-1 - i; break; }
    }
  }
  for(let d=1;d<=25;d++){
    const tl = hist.map(c=> c.includes(d)?1:0);
    let runs=0,cur=0,imp=0;
    for(let i=0;i<tl.length;i++){
      const v = tl[i], prev = i>0?tl[i-1]:0;
      if(v===1 && prev===0) imp+=1;
      if(v===1 && prev===1) imp+=2;
      if(v===0 && prev===1) imp-=1;
      if(v===1) cur++; else { if(cur>0){ runs++; cur=0; } }
    }
    if(cur>0) runs++;
    stats[d].runs = runs; stats[d].impulso = imp;
  }
  return stats;
}

function rankByScore(stats, arr){
  const vals = Object.values(stats);
  const maxF = Math.max(...vals.map(s=>s.freq)) || 1;
  const maxR = Math.max(...vals.map(s=>s.runs)) || 1;
  const maxL = Math.max(...vals.map(s=>s.lastSeen)) || 1;
  const score = d => {
    const s = stats[d];
    return s.impulso + 1.2*(s.freq/maxF) + 0.8*(s.runs/maxR) + 1.0*((maxL - (s.lastSeen||0))/maxL);
  };
  return arr.slice().sort((a,b)=> score(b) - score(a));
}

function gerarSADEFT({concursoAnterior, historicoArr, quantidade=10, tamanho=10}){
  const stats = construirStats(historicoArr || []);
  const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
  const R = (concursoAnterior||[]).filter(d=>!EXCL.has(d)).slice(0,8);
  const ranked = rankByScore(stats, universo);
  const dzfa = universo.filter(d=> !(concursoAnterior||[]).includes(d)).slice(0,8);
  const seed = [...new Set([...R, ...dzfa])].slice(0,18);

  const jogos = [];
  for(let g=0; g<quantidade; g++){
    const used = new Set([...fixed]);
    for(const r of R){ if(used.size>=tamanho) break; used.add(r); }
    let idx=0;
    while(used.size < Math.max(6, Math.floor(tamanho*0.6)) && idx < ranked.length){ used.add(ranked[idx++]); }
    const pick = arr => arr[Math.floor(Math.random()*arr.length)];
    while(used.size < tamanho){
      const p = pick(seed.length?seed:ranked);
      if(!used.has(p)) used.add(p);
    }
    while(used.size < tamanho){
      const v = Math.floor(Math.random()*25)+1; if(!EXCL.has(v)) used.add(v);
    }
    const arr = [...used].sort((a,b)=>a-b).slice(0,tamanho);
    jogos.push({id:g+1,numeros:arr,score:arr.reduce((s,x)=>s+(stats[x]?.freq||0),0)});
  }
  return {jogos,stats,R,dzfa,ranked};
}

/* ====== Render resultado ====== */
function renderResultado(res){
  const cont = $("resultado");
  if(!cont) return console.warn("renderResultado: #resultado não encontrado.");
  cont.innerHTML = "";
  const meta = document.createElement("div");
  meta.style.marginBottom = "8px";
  meta.style.color = "var(--celeste)";
  meta.innerHTML = `<b>R</b>: ${(res.R||[]).join(" ")} &nbsp; <b>DzFA</b>: ${(res.dzfa||[]).join(" ")}`;
  cont.appendChild(meta);

  const oficial = toNums(($("resultadoOficial")?.value)||"");
  let bestScore = -1, bestId = -1;

  res.jogos.forEach(j=>{
    const box = document.createElement("div"); box.className = "jogo-box";
    const left = document.createElement("div"); left.className = "jogo-left";
    left.innerHTML = `<div style="color:var(--celeste);font-weight:800">Jogo ${j.id}</div>
      <div class="jogo-num">${j.numeros.map(n=>`<span class="badge">${n.toString().padStart(2,"0")}</span>`).join(" ")}</div>`;

    const right = document.createElement("div"); right.className = "jogo-right";
    const acertos = j.numeros.filter(x=> oficial.includes(x)).length;
    right.innerHTML = `<div style="text-align:right"><div style="color:#ffd700;font-weight:800">Acertos: ${acertos}</div>
      <div style="font-size:12px;color:#aaa">Score: ${j.score}</div></div>`;

    if(j.score > bestScore){ bestScore = j.score; bestId = j.id; box.classList.add("best"); }

    box.appendChild(left); box.appendChild(right);
    cont.appendChild(box);
  });

  const resumo = document.createElement("div"); resumo.style.marginTop = "10px";
  resumo.innerHTML = `<small>${res.jogos.length} jogos gerados. Melhor jogo: ${bestId} (score ${bestScore})</small>`;
  cont.appendChild(resumo);
}

/* ====== Carregar concurso (API) ====== */
async function carregarConcurso(){
  try{
    const resp = await fetch("/api/concurso-atual");
    if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    if(!dados) throw new Error("Resposta vazia");

    const campo = $("concursoAnterior");
    if(campo && Array.isArray(dados.dezenas)) campo.value = dados.dezenas.join(" ");

    const arrHist = loadHistorico();
    if(Array.isArray(dados.dezenas) && dados.dezenas.length >= 5){
      const dezenasNum = dados.dezenas.map(x=>parseInt(x,10)).filter(n=>!isNaN(n));
      if(!(arrHist.length && arraysEqual(arrHist[arrHist.length-1], dezenasNum))){
        arrHist.push(dezenasNum); saveHistorico(arrHist); ensureHistoricoTextarea();
      }
    }
    if(typeof updateTendencias === "function") updateTendencias(3);
    return {ok:true, dados};
  }catch(e){
    console.error("carregarConcurso:", e);
    return {ok:false, error:e};
  }
}

/* ====== Login / init ====== */
function tryLogin(){
  const senhaInput = $("senha");
  const errElem = $("errLock");
  const lockElem = $("lock");
  const appElem = $("app");
  const v = senhaInput ? senhaInput.value.trim() : "";
  if(v === LOCK_PW){
    if(lockElem) lockElem.style.display = "none";
    if(appElem) appElem.style.display = "block";
    initApp();
  } else {
    if(errElem) errElem.innerText = "Senha incorreta";
    setTimeout(()=>{ if(errElem) errElem.innerText = ""; }, 1800);
  }
}

function initApp(){
  if(typeof buildGrid !== "function") window.buildGrid = () => console.info("buildGrid placeholder");
  if(typeof updateTendencias !== "function") window.updateTendencias = (n) => console.info("updateTendencias placeholder", n);

  buildGrid();
  ensureHistoricoTextarea();
  updateTendencias(3);

  carregarConcurso().then(res=>{
    if(!res.ok) console.warn("carregarConcurso() falhou no init:", res.error);
  });
}

/* ====== Attach eventos após DOM pronto ====== */
document.addEventListener("DOMContentLoaded", ()=>{
  // listeners de login/logout
  const btnEntrar = $("btnEntrar"); if(btnEntrar) btnEntrar.addEventListener("click", tryLogin);
  const senhaInput = $("senha"); if(senhaInput) senhaInput.addEventListener("keydown", e=>{ if(e.key==="Enter") tryLogin(); });
  const btnSair = $("btnSair"); if(btnSair) btnSair.addEventListener("click", ()=>{ if($("app")) $("app").style.display="none"; if($("lock")) $("lock").style.display="flex"; if($("senha")) $("senha").value=""; });

  // grid control
  const btnLimpar = $("btnLimpar"); if(btnLimpar) btnLimpar.addEventListener("click", limparSelecionadas);
  const btnIncluir = $("btnIncluir"); if(btnIncluir) btnIncluir.addEventListener("click", incluirFixas);

  // atualizar concurso
  const btnAtualizar = $("btnAtualizar");
  if(btnAtualizar) btnAtualizar.addEventListener("click", async ()=>{
    const res = await carregarConcurso();
    if(res.ok) alert("Dados atualizados com sucesso!");
    else alert("Erro ao atualizar. Veja console.");
  });

  // gerar jogos
  const btnGerar = $("btnGerar");
  if(btnGerar) btnGerar.addEventListener("click", ()=>{
    const concursoAnterior = toNums(($("concursoAnterior")?.value)||"");
    const historicoArr = loadHistorico();
    const quantidade = parseInt(($("quantidade")?.value) || "10",10) || 10;
    const tamanho = parseInt(($("tamanho")?.value) || "10",10) || 10;
    const res = gerarSADEFT({concursoAnterior, historicoArr, quantidade, tamanho});
    renderResultado(res);
  });

  // monta grid (mesmo antes do login para testes)
  buildGrid();
});
// 🔊 SOM ORION STYLE (SEM MP3) — SADEFT LEAL
let SADEFT_audioCtx = null;

function tocarOrionSADEFT() {
  if (!SADEFT_audioCtx) {
    SADEFT_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const ctx = SADEFT_audioCtx;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.6);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(440, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.6);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();

  osc1.stop(ctx.currentTime + 1.2);
  osc2.stop(ctx.currentTime + 1.2);
    }
<script src="script.js"></script>
</body>
