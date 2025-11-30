const senhaCorreta = "Leal2461@";

function validarSenha() {
    let s = document.getElementById("senha").value;
    if (s === senhaCorreta) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app-screen").style.display = "block";
    } else {
        alert("Senha incorreta!");
    }
}

function sair() {
    location.reload();
}

let selecionadas = [];
const excluidas = [4,10,14,16,20,22,25];

const container = document.getElementById("numeros-container");

for (let i=1;i<=25;i++){
    let div = document.createElement("div");
    div.className = "numero";

    if (excluidas.includes(i)) {
        div.style.opacity = "0.3";
    }

    div.innerText = i;
    div.onclick = () => selecionarNumero(div, i);
    container.appendChild(div);
}

function selecionarNumero(div, num){
    if (excluidas.includes(num)) return;

    if (!selecionadas.includes(num)){
        selecionadas.push(num);
        div.classList.add("verde");
    } else if (div.classList.contains("verde")){
        div.classList.remove("verde");
        div.classList.add("dourado");
    } else {
        div.classList.remove("dourado");
        selecionadas = selecionadas.filter(n => n !== num);
    }
}

function limparSelecao(){
    selecionadas = [];
    document.querySelectorAll(".numero").forEach(div=>{
        div.classList.remove("verde");
        div.classList.remove("dourado");
    });
}

function gerarJogos(){
    let res = document.getElementById("resultado-box");
    if (selecionadas.length < 10){
        res.innerText = "Selecione pelo menos 10 dezenas.";
        return;
    }

    let jogo = selecionadas.sort((a,b)=>a-b).join(" ");
    res.innerText = "🎲 Jogo SADEFT Gerado:\n" + jogo;
}

function analisarHistorico(){
    document.getElementById("resultado-box").innerText =
        "🔮 Tendência SADEFT:\n11 dezenas no próximo concurso.\nRepetição prevista: 6 a 8 dezenas.\nDz Ouro: 1,3,7,15,17,18,21,23";
}

// IA com voz
const chatBox = document.getElementById("chat-box");

function enviarMensagemIA(){
    let input = document.getElementById("chat-input");
    let msg = input.value.trim();
    if (!msg) return;

    adicionarChat("Você: " + msg);
    input.value = "";

    let resposta = gerarRespostaIA(msg);
    adicionarChat("IA: " + resposta);
    falar(resposta);
}

function adicionarChat(texto){
    let p = document.createElement("p");
    p.innerText = texto;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function gerarRespostaIA(msg){
    return "Estou aqui, José. O algoritmo SADEFT está ativo e ouvindo você.";
}

function falar(texto){
    let voz = new SpeechSynthesisUtterance(texto);
    voz.lang = "pt-BR";
    speechSynthesis.speak(voz);
}
