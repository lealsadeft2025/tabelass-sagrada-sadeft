# Tabela Sagrada — SADEFT LEAL (package)

Projeto completo (frontend + backend híbrido Node + Python) para o painel "Tabela Sagrada — SADEFT LEAL".

## Conteúdo
- `index.html` — frontend (UI, senha, painel, grid 1-25)
- `style.css` — estilos (grafite, ouro, azul celeste)
- `script.js` — frontend logic + fetch para backend (`API_BASE = "/api"`)
- `app.py` — Flask (motor SADEFT v3 - leve)
- `server.js` — Node proxy (encaminha `/api/prever` para o Python)
- `package.json` — Node deps
- `requirements.txt` — Python deps
- `docker-compose.yml` — opcional para rodar ambos (precisa Dockerfile)
- `README.md` — este arquivo

## Passo a passo rápido (local)
1. Clone o repositório ou extraia este ZIP.
2. Rodar Python:
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   # Flask rodará em http://localhost:5000
   ```
3. Rodar Node (proxy):
   ```bash
   npm install
   PYTHON_BASE=http://localhost:5000 node server.js
   # Node rodará em http://localhost:3000
   ```
4. Ajuste `API_BASE` no `script.js` para `http://localhost:3000` enquanto estiver testando local.
5. Abra `index.html` via um servidor estático (ex: Live Server, http-server) ou publique o frontend no GitHub Pages e aponte `API_BASE` para o Node/Flask publicados.

## Deploy recomendado
- Faça deploy do `app.py` (Flask) em um serviço como Render/Railway.
- Faça deploy do `server.js` (Node) em outro serviço ou no mesmo (defina `PYTHON_BASE`).
- Publique `index.html` no GitHub Pages; então ajuste `API_BASE` para a URL do Node proxy.

## Senha de teste
- Senha inicial: `Leal2461@` (está no cliente para facilitar testes; para produção, implemente autenticação segura)

## Observações
- Arquivos e lógica são um ponto de partida — posso ajudar a:
  - Criar Dockerfile para Python
  - Integrar modelos ML reais e treinar com seus dados
  - Gerar APK (WebView) para Android
  - Fazer deploy passo a passo no Render
# 🔮 SADEFT LEAL V3.2 – Fase 3

Motor inteligente para geração de dezenas (Lotofácil)
com núcleo fixo + IA leve por atraso.

## 🚀 Endpoints
- `/` Interface web
- `/api/health` Status
- `/api/gerar` Gerar jogo inteligente

## ☁️ Deploy
Render (Python + Gunicorn)
