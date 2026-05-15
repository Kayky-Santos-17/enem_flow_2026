require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// ── Conexão com MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── App Express ──────────────────────────────────────────────────────────────
const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Log de requisições (apenas em dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Servir Frontend Estático ────────────────────────────────────────────────
// Isso permite que você hospede tudo em um único lugar (como o Render.com)
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/auth',     require('./routes/auth.routes'));
app.use('/contents', require('./routes/content.routes'));
app.use('/study',    require('./routes/study.routes'));
app.use('/ai',       require('./routes/ai.routes'));
app.use('/upload',   require('./routes/upload.routes'));

// Fallback para o Frontend (Single Page Application ou multi-páginas)
// Se não for uma rota de API ou arquivo estático, serve o login.html ou index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/contents') || req.path.startsWith('/study') || req.path.startsWith('/ai') || req.path.startsWith('/upload')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// ── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ── Handler de erros globais ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Exporta o app para a Vercel
module.exports = app;

// Só inicia o servidor se não estiver na Vercel (localmente)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 EnemFlow API rodando → http://localhost:${PORT}`);
    console.log(`📋 Health check      → http://localhost:${PORT}/health`);
    console.log(`🌍 Ambiente          → ${process.env.NODE_ENV}`);
  });
}
