function gerar() {
    let entrada = document.getElementById("entrada").value.trim();
    let historicoTexto = document.getElementById("historico").value.trim();

    if (!entrada || !historicoTexto) {
        document.getElementById("resultado").innerText = "⚠ Preencha entrada e histórico.";
        return;
    }

    // Entrada do último concurso
    let base = entrada.split(/[\s,;.-]+/).map(Number);

    // Histórico
    let linhas = historicoTexto.split("\n");
    let historico = linhas.map(l => l.trim().split(/[\s,;.-]+/).map(Number));

    // Contagem de frequência das dezenas
    let freq = Array(26).fill(0);
    historico.forEach(concurso => {
        concurso.forEach(n => freq[n]++);
    });

    // Ordenar dezenas por mais frequentes
    let maisFreq = [...Array(25).keys()].map(i => i+1);
    maisFreq.sort((a,b) => freq[b] - freq[a]);

    // Tendências SADEFT
    let tendenciaAlta = maisFreq.slice(0, 8);   // mais fortes
    let tendenciaMedia = maisFreq.slice(8, 15); // medianas
    let tendenciaBaixa = maisFreq.slice(15, 25); // atrasadas

    function montarJogo() {
        let jogo = [];

        // 5 dezenas do concurso anterior (repetições prováveis)
        jogo.push(...base.slice(0, 5));

        // 5 dezenas fortes
        while (jogo.length < 10) {
            let n = tendenciaAlta[Math.floor(Math.random()*tendenciaAlta.length)];
            if (!jogo.includes(n)) jogo.push(n);
        }

        // 3 dezenas medianas
        while (jogo.length < 13) {
            let n = tendenciaMedia[Math.floor(Math.random()*tendenciaMedia.length)];
            if (!jogo.includes(n)) jogo.push(n);
        }

        // 2 dezenas atrasadas (correção SADEFT)
        while (jogo.length < 15) {
            let n = tendenciaBaixa[Math.floor(Math.random()*tendenciaBaixa.length)];
            if (!jogo.includes(n)) jogo.push(n);
        }

        jogo.sort((a,b)=>a-b);
        return jogo;
    }

    let jogos = [];
    for (let i=0; i<3; i++) jogos.push(montarJogo());

    let texto = "🎯 JOGOS SADEFT LEAL – PREVISÃO REAL\n\n";
    jogos.forEach((jogo, i) => {
        texto += `Jogo ${i+1}: ${jogo.join(" ")}\n`;
    });

    document.getElementById("resultado").innerText = texto;
}
