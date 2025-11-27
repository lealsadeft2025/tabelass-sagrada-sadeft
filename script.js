/* FRONTEND: UI + chamadas ao backend híbrido
   Senha: Leal2461@
*/

const API_BASE = "/api"; // se backend separado, troque '/api' por 'https://seu-backend.com'

/* util */
const $ = id => document.getElementById(id);
const toNums = txt => txt.trim().split(/[\s,;.-]+/).map(x=>parseInt(x,10)).filter(n=>!isNaN(n) && n>=1 && n<=25);

/* lock */
const LOCK_PW = "Leal2461@";
$("btnEntrar").addEventListener("click", ()=> {
  const val = $("senha").value || "";
  if(val === LOCK_PW){ $("lock").style.display="none"; $("app").style.display="block"; initApp(); }
  else { $("errLock").innerText = "Senha incorreta"; setTimeout(()=> $("errLock").innerText="",2000); }
});
$("senha").addEventListener("keydown", e=>{ if(e.key==="Enter") $("btnEntrar").click(); });

/* state */
let selected = new Set();
let fixed = new Set();
const EXCL = new Set([4,10,14,16,20,22,25]);
let gridElems = [];

/* build grid */
function buildGrid(){
  const grid = $("gridDezenas");
  grid.innerHTML = "";
  gridElems = [];
  for(let i=1;i<=25;i++){
    const n = i.toString().padStart(2,"0");
    const div = document.createElement("div");
    div.className = "dez";
    div.innerText = n;
    if(EXCL.has(i)){ div.style.opacity=0.28; div.style.pointerEvents="none"; }
    div.dataset.num = i;
    div.addEventListener("click", ()=> {
      const v = Number(div.dataset.num);
      if(fixed.has(v)) { fixed.delete(v); div.classList.remove("fixed"); }
      else {
        if(selected.has(v)){ selected.delete(v); div.classList.remove("selected"); }
        else { selected.add(v); div.classList.add("selected"); }
      }
      refreshSelectedUI();
    });
    div.addEventListener("dblclick", ()=> {
      const v = Number(div.dataset.num);
      fixed.add(v); selected.delete(v);
      grid.querySelectorAll(".dez").forEach(e=>{
        if(Number(e.dataset.num)===v){ e.classList.add("fixed"); e.classList.remove("selected"); }
      });
      refreshSelectedUI();
    });
    grid.appendChild(div);
    gridElems.push(div);
  }
}

/* refresh UI */
function refreshSelectedUI(){
  const list = Array.from(fixed).concat(Array.from(selected)).map(n=>n.toString().padStart(2,"0"));
  $("selecionadasList").innerText = list.length? list.join(" ") : "nenhuma";
}

/* buttons */
$("btnLimpar").addEventListener("click", ()=> {
  selected.clear(); fixed.clear();
  gridElems.forEach(e=> e.classList.remove("selected","fixed"));
  refreshSelectedUI();
});
$("btnIncluir").addEventListener("click", ()=> {
  selected.forEach(n=> fixed.add(n));
  selected.clear();
  gridElems.forEach(e=>{
    if(fixed.has(Number(e.dataset.num))){ e.classList.add("fixed"); e.classList.remove("selected"); }
  });
  refreshSelectedUI();
});
$("btnSair").addEventListener("click", ()=> {
  $("app").style.display="none"; $("lock").style.display="flex"; $("senha").value="";
});

/* history parsing */
function parseHistorico(txt){
  const lines = txt.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
  return lines.slice(-50).map(l=> toNums(l));
}

/* Tendencias UI */
function updateTendencias(){
  const arr = parseHistorico($("historico").value || "");
  const stats = construirStatsClient(arr);
  const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
  const ranked = rankByScoreClient(stats, universo).slice(0,10);
  $("tendencias").innerHTML = ranked.map(n=> `<span class="badge">${n.toString().padStart(2,"0")}</span>`).join(" ");
  $("lenHist").innerText = arr.length;
}

/* cliente: stats leve (mesma lógica do servidor) */
function construirStatsClient(historico){
  const stats = {};
  for(let d=1; d<=25; d++) stats[d]={dz:d,freq:0,lastSeen:-1,runs:0,impulso:0};
  historico.forEach((conc, idx)=>{
    for(let d=1; d<=25; d++) if(conc.includes(d)) stats[d].freq++;
  });
  for(let d=1; d<=25; d++){
    for(let i=historico.length-1;i>=0;i--){
      if(historico[i].includes(d)){ stats[d].lastSeen = historico.length-1 - i; break; }
    }
  }
  for(let d=1; d<=25; d++){
    let runs=0, cur=0, impulso=0;
    const tl = historico.map(c=> c.includes(d)?1:0);
    for(let i=0;i<tl.length;i++){
      const v=tl[i], prev = i>0?tl[i-1]:0;
      if(v===1 && prev===0) impulso+=1;
      if(v===0 && prev===1) impulso-=1;
      if(v===1 && prev===1) impulso+=2;
      if(v===1) cur++; else { if(cur>0){ runs++; cur=0; } }
    }
    if(cur>0) runs++;
    stats[d].runs=runs; stats[d].impulso=impulso;
  }
  return stats;
}
function rankByScoreClient(stats, arr){
  const maxF = Math.max(...Object.values(stats).map(s=>s.freq)) || 1;
  const maxR = Math.max(...Object.values(stats).map(s=>s.runs)) || 1;
  const maxL = Math.max(...Object.values(stats).map(s=>s.lastSeen)) || 1;
  function score(d){
    const s = stats[d];
    return s.impulso + 1.2*(s.freq/maxF) + 0.8*(s.runs/maxR) + 1.0*((maxL - s.lastSeen)/maxL);
  }
  return arr.slice().sort((a,b)=>score(b)-score(a));
}

/* coin sound */
let audioCtx = null;
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function playCoin(times=1){ ensureAudio(); const now = audioCtx.currentTime; for(let i=0;i<times;i++){ const t0=now+i*0.12; const o=audioCtx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(900+i*40,t0); const g=audioCtx.createGain(); g.gain.setValueAtTime(0.001,t0); g.gain.exponentialRampToValueAtTime(0.9,t0+0.01); g.gain.exponentialRampToValueAtTime(0.001,t0+0.5); o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0+0.6); } }

/* click Gerar -> chama backend /api/prever (híbrido) */
async function onGerarClick(){
  const concursoAnterior = toNums($("concursoAnterior").value || "");
  const historicoArr = parseHistorico($("historico").value || "");
  const quantidade = parseInt($("quantidade").value,10) || 3;
  const tamanho = parseInt($("tamanho").value,10) || 12;

  if(concursoAnterior.length < 5){
    alert("Informe o concurso anterior (algumas dezenas).");
    return;
  }

  // UI feedback
  $("resultado").innerText = "Aguardando geração...";
  $("probabilidades").innerText = "Calculando...";

  // payload
  const payload = { concursoAnterior, historico: historicoArr, quantidade, tamanho, fixed: Array.from(fixed) };

  try {
    const res = await fetch(`${API_BASE}/prever`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("Erro no servidor");
    const data = await res.json();
    renderResultado(data);
    updateTendencias();
  } catch (err){
    console.error(err);
    // fallback local generator caso backend indisponível
    const fallback = gerarJogosLocal({concursoAnterior, historicoArr, quantidade, tamanho});
    renderResultado(fallback);
    updateTendencias();
  }
}

/* local fallback generator (mesma heurística leve) */
function gerarJogosLocal({concursoAnterior, historicoArr, quantidade, tamanho}){
  // reuse construirStatsClient + rank
  const stats = construirStatsClient(historicoArr);
  const universo = Array.from({length:25},(_,i)=>i+1).filter(d=>!EXCL.has(d));
  const ranked = rankByScoreClient(stats, universo);
  const R = (concursoAnterior||[]).filter(d=>!EXCL.has(d)).slice(0,8);
  const dzfa = universo.filter(d=> !(concursoAnterior||[]).includes(d) ).slice(0,8);
  const baseSeed = Array.from(new Set(R.concat(dzfa))).slice(0,18);

  function pickFrom(arr, used){
    const shuffled = arr.slice().sort(()=>Math.random()-0.5);
    for(const c of shuffled) if(!used.has(c)) return c;
    return null;
  }

  const jogos = [];
  for(let g=0; g<quantidade; g++){
    const used = new Set(Array.from(fixed));
    for(const r of R) if(used.size < tamanho) used.add(r);
    let idx=0;
    while(used.size < Math.max(6, Math.floor(tamanho*0.6)) && idx < ranked.length){
      const c = ranked[idx++]; if(!used.has(c)) used.add(c);
    }
    while(used.size < tamanho){
      const pick = pickFrom(baseSeed, used) || pickFrom(ranked, used) || (Math.floor(Math.random()*25)+1);
      if(!used.has(pick)) used.add(pick);
    }
    const arr = Array.from(used).sort((a,b)=>a-b).slice(0,tamanho);
    jogos.push({id:g+1,numeros:arr,score: arr.reduce((s,x)=>s+stats[x].freq,0)});
  }

  return {jogos,stats,R,dzfa,ranked};
}

/* render */
function renderResultado(res){
  const container = $("resultado");
  container.innerHTML = "";
  const oficial = toNums($("resultadoOficial").value || "");
  const meta = document.createElement("div");
  meta.innerHTML = `<div style="margin-bottom:8px;color:var(--celeste)"><b>R (repetições):</b> ${JSON.stringify((res.R||[]).slice(0,8))} &nbsp; <b>DzFA:</b> ${JSON.stringify((res.dzfa||[]).slice(0,8))}</div>`;
  container.appendChild(meta);

  let totalHighHits = 0;
  for(const jogo of res.jogos){
    const box = document.createElement("div");
    box.className = "jogo-box";
    const left = document.createElement("div"); left.style.flex="1";
    left.innerHTML = `<div style="font-weight:800;color:var(--celeste)">Jogo ${jogo.id}</div>`;
    const nums = document.createElement("div"); nums.className="jogo-num";
    jogo.numeros.forEach(n=>{
      const s = document.createElement("div"); s.className="badge"; s.innerText = n.toString().padStart(2,"0"); nums.appendChild(s);
    });
    left.appendChild(nums);
    const right = document.createElement("div"); right.style.minWidth="160px"; right.style.textAlign="right";
    right.innerHTML = `<div style="color:#ffd700;font-weight:800">Score: ${jogo.score}</div>`;
    let hits = 0;
    if(oficial.length){
      hits = jogo.numeros.filter(n=>oficial.includes(n)).length;
      right.innerHTML += `<div style="margin-top:6px;color:${hits>=10?'#7efc7e':'#a9d3ff'}"><b>Acertos: ${hits}</b></div>`;
      if(hits>=10){ totalHighHits++; playCoin(Math.min(3, hits-9)); }
    } else {
      right.innerHTML += `<div style="margin-top:6px;color:var(--muted)">Acertos: —</div>`;
    }
    box.appendChild(left); box.appendChild(right);
    container.appendChild(box);
  }

  const probs = res.jogos.map(j=>j.score);
  const avg = Math.round((probs.reduce((a,b)=>a+b,0)/probs.length) || 0);
  $("probabilidades").innerText = `Score médio: ${avg} • Jogos gerados: ${res.jogos.length}`;

  if(totalHighHits>0){
    const msg = document.createElement("div"); msg.style.marginTop="8px"; msg.style.color="#ffd700"; msg.style.fontWeight=800;
    msg.innerText = `Foram ${totalHighHits} jogos com >=10 acertos (comparado ao resultado oficial).`;
    container.insertBefore(msg, container.firstChild);
  }
}

/* init */
function initApp(){
  buildGrid();
  refreshSelectedUI();
  updateTendencias();
  $("btnGerar").addEventListener("click", onGerarClick);
  $("concursoAnterior").addEventListener("keydown",(e)=>{ if(e.key==="Enter") $("btnGerar").click(); });
  $("historico").addEventListener("input", updateTendencias);
}
