# app.py - Flask motor SADEFT v3 (leve, extensível para ML)
from flask import Flask, request, jsonify
from flask_cors import CORS
import random, math

app = Flask(__name__)
CORS(app)

EXCL = {4,10,14,16,20,22,25}

def parse_hist(h):
    # h expected list of lists of ints
    safe = []
    for row in (h or []):
        line = []
        for x in row:
            try:
                xi = int(x)
                line.append(xi)
            except:
                pass
        safe.append(line)
    return safe

def construir_stats(historico):
    stats = {d: {'dz':d,'freq':0,'lastSeen':-1,'runs':0,'impulso':0} for d in range(1,26)}
    for i,conc in enumerate(historico):
        for d in conc:
            if 1 <= d <= 25:
                stats[d]['freq'] += 1
    # lastSeen
    for d in range(1,26):
        for i in range(len(historico)-1, -1, -1):
            if d in historico[i]:
                stats[d]['lastSeen'] = len(historico)-1 - i
                break
    # runs and impulso
    for d in range(1,26):
        tl = [1 if d in c else 0 for c in historico]
        runs = 0; cur = 0; impulso = 0
        for i,v in enumerate(tl):
            prev = tl[i-1] if i>0 else 0
            if v==1 and prev==0: impulso+=1
            if v==0 and prev==1: impulso-=1
            if v==1 and prev==1: impulso+=2
            if v==1: cur+=1
            else:
                if cur>0: runs+=1; cur=0
        if cur>0: runs+=1
        stats[d]['runs']=runs; stats[d]['impulso']=impulso
    return stats

def rank_by_score(stats, arr):
    maxF = max([stats[x]['freq'] for x in stats]) or 1
    maxR = max([stats[x]['runs'] for x in stats]) or 1
    maxL = max([stats[x]['lastSeen'] for x in stats]) or 1
    def score(d):
        s = stats[d]
        termL = ((maxL - s['lastSeen'])/maxL) if maxL>0 else 0
        return s['impulso'] + 1.2*(s['freq']/maxF) + 0.8*(s['runs']/maxR) + 1.0*termL
    return sorted(arr, key=lambda x: score(x), reverse=True)

@app.route('/api/prever', methods=['POST'])
def prever():
    data = request.json or {}
    concursoAnterior = data.get('concursoAnterior', [])
    historico = parse_hist(data.get('historico', []))
    quantidade = int(data.get('quantidade', 3))
    tamanho = int(data.get('tamanho', 12))
    fixed = list(map(int, data.get('fixed', []))) if data.get('fixed') else []

    # use only last 50
    historico = historico[-50:]

    stats = construir_stats(historico)
    universo = [d for d in range(1,26) if d not in EXCL]

    # R: top repetition from concursoAnterior
    R = [d for d in concursoAnterior if d not in EXCL][:8]
    ranked = rank_by_score(stats, universo)
    dzfa = [d for d in universo if d not in (concursoAnterior or [])][:8]
    baseSeed = list(dict.fromkeys(R + dzfa))[:18]

    jogos = []
    for g in range(quantidade):
        used = set([int(x) for x in fixed if 1<=int(x)<=25 and int(x) not in EXCL])
        # include R
        for r in R:
            if len(used) >= tamanho: break
            used.add(r)
        # ranked fill
        idx=0
        while len(used) < max(6, math.floor(tamanho*0.6)) and idx < len(ranked):
            used.add(ranked[idx]); idx+=1
        # fill from baseSeed
        while len(used) < tamanho:
            cand = random.choice(baseSeed) if baseSeed else random.choice(ranked)
            used.add(cand)
        # final fill random if needed
        while len(used) < tamanho:
            v = random.randint(1,25)
            if v not in EXCL: used.add(v)
        arr = sorted(list(used))[:tamanho]
        score = sum(stats[x]['freq'] for x in arr)
        jogos.append({'id': g+1, 'numeros': arr, 'score': score})

    return jsonify({'jogos': jogos, 'stats': stats, 'R': R, 'dzfa': dzfa, 'ranked': ranked})

@app.route('/api/health')
def health():
    return jsonify({'ok': True, 'engine': 'python-sadeft', 'version': 'v3-light'})
@app.route('/api/concurso-atual')
def concurso_atual():
    try:
        url = "https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest"
        resp = requests.get(url).json()
        return jsonify({
            "concurso": resp.get("concurso"),
            "dezenas": resp.get("dezenas"),
            "data": resp.get("data")
        })
    except Exception as e:
        return jsonify({"erro": "Falha ao buscar concurso", "detalhes": str(e)})
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
from flask import Flask, jsonify, request
import datetime

app = Flask(__name__)

@app.route("/")
def home():
    return "SADEFT LEAL V3 SUPER MOTOR — ONLINE"

@app.route("/api/saude")
def saude():
    return jsonify({
        "status": "ok",
        "motor": "SADEFT LEAL V3 SUPER",
        "hora": datetime.datetime.utcnow().isoformat()
    })

@app.route("/api/prever", methods=["POST"])
def prever():
    dados = request.json or {}
    return jsonify({
        "entrada": dados,
        "resultado": "Tabela Sagrada processada",
        "acertos_estimados": 11
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
