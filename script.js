/* ==========================================================
      SADEFT LEAL — SCRIPT COMPLETO
      IA + Voz Feminina + Binário + R + DzFA + Impulsos
      Desenvolvido para Netin (José Leal Neto)
========================================================== */

/* ====== UTIL ====== */
const $ = id => document.getElementById(id);
const toNums = txt =>
  txt.trim().split(/[\s,;.-]+/).map(x => parseInt(x,10))
  .filter(n=>!isNaN(n)&&n>=1&&n<=25);

/* ====== CONFIGURAÇÕES ====== */
const LOCK_PW = "Leal2461@"; 
const EXCL = new Set([4,10,14,16,20,22,25]); // excluídos fixos

/* ====== ELEMENTOS ====== */
const lock = $("lock");
const app = $("app");
const errLock = $("errLock");

/* ====== ESTADO ====== */
let selected = new Set();
let fixed = new Set();
let gridElems = [];

/* ==========================================================
      TELA DE SENHA
========================================================== */

$("btnEntrar").addEventListener("click", () => {
  if ($("senha").value === LOCK_PW){
    lock.style.display = "none";
    app.style.display = "block";
    initApp();
  } else {
    errLock.innerText = "Senha incorreta";
    setTimeout(()=>errLock.innerText="",2000);
  }
});

$("senha").addEventListener("keydown", e=>{
  if(e.key==="Enter") $("btnEntrar").click();
});

/* ==========================================================
      CONSTRUIR GRADE DE DEZENAS
========================================================== */

function buildGrid(){
  const grid = $("gridDezenas");
  grid.innerHTML = "";
  gridElems = [];

  for (let i=1;i<=25;i++){
    const n = i.toString().padStart(2,"0");
    const d = document.createElement("div");
    d.className = "dez";
    d.innerText = n;
    d.dataset.num = i;

    if(EXCL.has(i)){
      d.style.opacity = 0.25;
      d.style.pointerEvents = "none";
    }

    d.addEventListener("click", () => {
      const v = Number(d.dataset.num);

      if(fixed.has(v)){ fixed.delete(v); d.classList.remove("fixed"); }
      else if(selected.has(v)){ selected.delete(v); d.classList.remove("selected"); }
      else { selected.add(v); d.classList.add("selected"); }

      refreshSelectedUI();
    });

    d.addEventListener("dblclick", () => {
      const v = Number(d.dataset.num);
      fixed.add(v);
      selected.delete(v);

      grid.querySelectorAll(".dez").forEach(e=>{
        if(Number(e.dataset.num)===v){
          e.classList.add("fixed");
          e.classList.remove("selected");
        }
      });

      refreshSelectedUI();
    });

    grid.appendChild(d);
    gridElems.push(d);
  }
}

function refreshSelectedUI(){
  const list = [...fixed, ...selected].map(n=>n.toString().padStart(2,"0"));
  $("selecionadasList").innerText = list.length ? list.join(" ") : "nenhuma";
}

$("btnLimpar").addEventListener("click", () => {
  selected.clear(); 
  fixed.clear();
  gridElems.forEach(e=>e.classList.remove("selected","fixed"));
  refreshSelectedUI();
});

$("btnIncluir").addEventListener("click", () => {
  selected.forEach(n=>fixed.add(n));
  selected.clear();
  gridElems.forEach(e=>{
    if(fixed.has(Number(e.dataset.num))){
      e.classList.add("fixed");
      e.classList.remove("selected");
    }
  });
  refreshSelectedUI();
});

/* ==========================================================
      HISTÓRICO + ESTATÍSTICAS
========================================================== */

function parseHistorico(txt){
  return txt.split("\n").map(l=>l.trim()).filter(l=>l).slice(-50).map(l=>toNums(l));
}

function construirStats(hist){
  const stats = {};
  for(let i=1;i<=25;i++){
    stats[i] = {dz:i,freq:0,lastSeen:-1,impulso:0,runs:0};
  }

  hist.forEach((conc, index)=>{
    for(let d=1;d<=25;d++){
      if(conc.includes(d)) stats[d].freq++;
    }
  });

  for(let d=1; d<=25; d++){
    for(let i=hist.length-1; i>=0; i--){
      if(hist[i].includes(d)){
        stats[d].lastSeen = hist.length-1 - i;
        break;
      }
    }
  }

  for(let d=1; d<=25; d++){
    let seq = hist.map(c => c.includes(d) ? 1 : 0);
    let impulso=0, runs=0, cur=0;
    for (let i=0;i<seq.length;i++){
      let v = seq[i], prev = i>0?seq[i-1]:0;
      if(v===1 && prev===0) impulso+=1;
      if(v===1 && prev===1) impulso+=2;
      if(v===0 && prev===1) impulso-=1;
      if(v===1) cur++; else { if(cur>0){ runs++; cur=0; } }
    }
    if(cur>0) runs++;
    stats[d].impulso = impulso;
    stats[d].runs = runs;
  }

  return stats;
}

function rankByScore(stats, arr){
  const maxF = Math.max(...Object.values(stats).map(s=>s.freq)) || 1;
  const maxR = Math.max(...Object.values(stats).map(s=>s.runs)) || 1;
  const maxL = Math.max(...Object.values(stats).map(s=>s.lastSeen)) || 1;

  const score = d => {
    const s = stats[d];
    return s.impulso + 1.4*(s.freq/maxF) + 0.8*(s.runs/maxR) + 1.0*((maxL - s.lastSeen)/maxL);
  };

  return arr.slice().sort((a,b)=>score(b)-score(a));
}

/* ==========================================================
      GERAÇÃO DE JOGOS — SADEFT LEAL LITE
========================================================== */

function gerarSADEFT(params){
  const {concursoAnterior, historicoArr, quantidade, tamanho} = params;

  const stats = construirStats(historicoArr);
  const universo = [...Array(25)].map((_,i)=>i+1).filter(d=>!EXCL.has(d));

  const R = concursoAnterior.filter(d=>!EXCL.has(d)).slice(0,8);

  const ranked = rankByScore(stats, universo);

  const dzfa = universo.filter(d=> !concursoAnterior.includes(d)).slice(0,8);

  const seed = [...new Set([...R, ...dzfa])].slice(0,18);

  const jogos = [];

  for(let g=0; g<quantidade; g++){
    const used = new Set([...fixed]);

    for (const r of R){
      if(used.size>=tamanho) break;
      used.add(r);
    }

    let idx=0;
    while(used.size < Math.max(6, Math.floor(tamanho*0.6)) && idx < ranked.length){
      used.add(ranked[idx++]);
    }

    const pick = arr => arr[Math.floor(Math.random()*arr.length)];

    while(used.size < tamanho){
      let p = pick(seed);
      if(!used.has(p)) used.add(p);
    }

    const arr = [...used].sort((a,b)=>a-b).slice(0,tamanho);
    jogos.push({id:g+1,numeros:arr,score:arr.reduce((s,x)=>s+stats[x].freq,0)});
  }

  return {jogos,stats,R,dzfa,ranked};
}

/* ==========================================================
      RENDER RESULTADO
========================================================== */

function renderResultado(res){
  const cont = $("resultado");
  cont.innerHTML = "";

  const meta = document.createElement("div");
  meta.style.color = "#64d2ff";
  meta.style.marginBottom = "10px";
  meta.innerHTML = `
    <b>R:</b> ${res.R.join(" ")}<br>
    <b>DzFA:</b> ${res.dzfa.join(" ")}
  `;
  cont.appendChild(meta);

  const oficial = toNums($("resultadoOficial").value || "");

  let high = 0;

  res.jogos.forEach(j => {
    const box = document.createElement("div");
    box.className = "jogo-box";

    const left = document.createElement("div");
    left.innerHTML = `
      <div style="color:#64d2ff;font-weight:800">Jogo ${j.id}</div>
      <div class="jogo-num">
        ${j.numeros.map(n=>`<span class="badge">${n.toString().padStart(2,"0")}</span>`).join("")}
      </div>
    `;

    const right = document.createElement("div");
    right.style.textAlign="right";
    right.innerHTML = `<div style="color:#ffd700;font-weight:800">Score: ${j.score}</div>`;

    let hits = 0;
    if(oficial.length){
      hits = j.numeros.filter(n=>oficial.includes(n)).length;
      if(hits>=10) high++;
      right.innerHTML += `<div style="color:${hits>=10?"#7eff7e":"#88b7ff"}"><b>Acertos: ${hits}</b></div>`;
    }

    box.appendChild(left);
    box.appendChild(right);
    cont.appendChild(box);
  });

  $("probabilidades").innerText = `Jogos: ${res.jogos.length} • HighHits ≥10: ${high}`;
}

/* ==========================================================
      IA SAGRADA — CHAT + VOZ
========================================================== */

let synth = window.speechSynthesis;
let femaleVoice = null;

function loadVoices(){
  const voices = synth.getVoices();
  femaleVoice = voices.find(v => 
    v.lang.startsWith("pt") && 
    (v.name.toLowerCase().includes("femin") || 
     v.name.toLowerCase().includes("brasil")));
}

setTimeout(loadVoices,500);

function falar(txt){
  if (!femaleVoice) loadVoices();
  const utter = new SpeechSynthesisUtterance(txt);
  utter.voice = femaleVoice;
  utter.rate = 1.03;
  utter.pitch = 1.1;
  synth.speak(utter);
}

/* ====== RESPONDER ====== */

$("btnEnviarChat").addEventListener("click", () => {
  const msg = $("chatInput").value.trim();
  if(!msg) return;
  addChat("Você", msg, "chat-me");

  const resp = gerarRespostaIA(msg);
  addChat("Sagrada IA", resp, "chat-ai");

  falar(resp);
  $("chatInput").value = "";
});

function addChat(who, txt, css){
  const div = document.createElement("div");
  div.className = "chat-line "+css;
  div.innerHTML = `<b>${who}:</b> ${txt}`;
  $("chatLog").appendChild(div);
  $("chatLog").scrollTop = $("chatLog").scrollHeight;
}

function gerarRespostaIA(msg){
  msg = msg.toLowerCase();

  if(msg.includes("tendenc") || msg.includes("vir"))
    return "Vejo luz forte sobre as dezenas 03 • 07 • 11 • 15 • 17 • 18. O ciclo pulsa para repetição moderada de 6 a 8 dezenas.";

  if(msg.includes("sorte") || msg.includes("ganhar"))
    return "A sorte não é acaso, é alinhamento. Concentre-se nas repetições R e nas DzFA — nelas está o próximo salto.";

  if(msg.includes("oração"))
    return "Oro por você: Que o Divino ilumine sua visão e alinhe sua caminhada. A verdade liberta.";

  return "Sinto um movimento suave no ciclo. Continue confiando no processo SADEFT — a matemática e o espírito caminham juntos.";
}

/* ==========================================================
      BOTÃO GERAR
========================================================== */

$("btnGerar").addEventListener("click", () => {
  const conc = toNums($("concursoAnterior").value||"");
  const hist = parseHistorico($("historico").value||"");

  const qtd = parseInt($("quantidade").value,10);
  const tam = parseInt($("tamanho").value,10);

  if(conc.length < 5){
    alert("Informe o concurso anterior com pelo menos 5 dezenas.");
    return;
  }

  const res = gerarSADEFT({concursoAnterior:conc,historicoArr:hist,quantidade:qtd,tamanho:tam});
  renderResultado(res);
});

/* ==========================================================
      INICIAR APP
========================================================== */

function initApp(){
  buildGrid();
}
