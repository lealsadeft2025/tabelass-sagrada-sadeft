from flask import Flask, jsonify, send_from_directory
import random
import datetime
from collections import Counter

app = Flask(__name__, static_folder="static", static_url_path="")

# Núcleo Sagrado
NUCLEO = [1, 3, 5, 7, 9, 11, 13, 15]

# Histórico global
historico = []

def gerar_jogo_inteligente():
    base = set(NUCLEO)

    # Frequência simples (IA leve)
    contador = Counter()
    for jogo in historico:
        contador.update(jogo)

    # Prioriza dezenas menos usadas
    candidatos = [n for n in range(1, 26) if n not in base]
    candidatos.sort(key=lambda x: contador[x])

    escolhidas = candidatos[:15 - len(base)]
    jogo = sorted(list(base) + escolhidas)
    return jogo

@app.route("/")
def home():
    return send_from_directory("static", "index.html")

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ONLINE",
        "motor": "SADEFT LEAL V3.2",
        "fase": 3,
        "hora": datetime.datetime.now().isoformat()
    })

@app.route("/api/gerar")
def gerar():
    global historico

    if len(historico) < 5:
        jogo = sorted(NUCLEO + random.sample(
            [n for n in range(1, 26) if n not in NUCLEO],
            15 - len(NUCLEO)
        ))
    else:
        jogo = gerar_jogo_inteligente()

    historico.append(jogo)
    historico = historico[-20:]

    return jsonify({
        "motor": "SADEFT LEAL V3.2 – FASE 3",
        "nucleo": NUCLEO,
        "jogo": jogo,
        "historico": historico
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
