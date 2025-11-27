// server.js - Node proxy + light endpoints
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIG: endereço do serviço Python (onde o Flask roda)
const PYTHON_BASE = process.env.PYTHON_BASE || 'http://localhost:5000';

// Proxy endpoint: /api/prever -> encaminha para Python /api/prever
app.post('/api/prever', async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_BASE}/api/prever`, req.body, { timeout: 30000 });
    return res.json(r.data);
  } catch (err) {
    console.error('Erro proxy /api/prever:', err.message || err);
    return res.status(502).json({ error: 'Serviço de previsão indisponível', detail: err.message });
  }
});

// Health
app.get('/api/health', (req,res)=> res.json({ ok: true, engine: 'node-proxy' }));

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Node proxy rodando na porta ${port}, Python base ${PYTHON_BASE}`));
