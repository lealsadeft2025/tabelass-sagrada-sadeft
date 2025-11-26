function gerar() {
    let entrada = document.getElementById("entrada").value.trim();
    let historico = document.getElementById("historico").value.trim().split("\n");

    if (!entrada || historico.length === 0) {
        document.getElementById("resultado").innerText = "⚠ Preencha tudo corretamente.";
        return;
    }

    let base = entrada.split(" ").map(Number);
    let jogos = [];

    for (let i = 0; i < 3; i++) {
        let jogo = [...base];

        while (jogo.length < 15) {
            let n = Math.floor(Math.random() * 25) + 1;
            if (!jogo.includes(n)) jogo.push(n);
        }

        jogo.sort((a, b) => a - b);
        jogos.push(jogo);
    }

    let texto = "🎯 JOGOS GERADOS SADEFT LEAL\n\n";
    jogos.forEach((j, i) => {
        texto += `Jogo ${i + 1}: ${j.join(" ")}\n`;
    });

    document.getElementById("resultado").innerText = texto;
}

/* ------------------ ANIMAÇÕES ------------------ */

let canvas = document.getElementById("canvasAnim");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = 200;

let frame = 0;

function desenhar(objeto) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "gold";
    ctx.font = "40px Arial";
    ctx.fillText(objeto, frame, 120);

    frame += 10;
    if (frame > canvas.width) frame = -200;
}

function avião() {
    frame = 0;
    setInterval(() => desenhar("✈"), 60);
}

function carro() {
    frame = 0;
    setInterval(() => desenhar("🚗"), 60);
}

function heli() {
    frame = 0;
    setInterval(() => desenhar("🚁"), 60);
}
