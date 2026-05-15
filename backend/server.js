require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// ── Conexão com MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── App Express ──────────────────────────────────────────────────────────────
const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// ── Servir Uploads ──────────────────────────────────────────────────────────
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

// Só tenta criar a pasta se não estiver em produção (evita erro na Vercel)
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: mongoose.connection.readyState === 1,
    env: process.env.NODE_ENV
  });
});

// Rotas da API
app.use('/auth',     require('./routes/auth.routes'));
app.use('/contents', require('./routes/content.routes'));
app.use('/study',    require('./routes/study.routes'));
app.use('/ai',       require('./routes/ai.routes'));
app.use('/upload',   require('./routes/upload.routes'));

// ── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ── Handler de erros globais ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ ERRO IDENTIFICADO:', err.message);
  console.error('📋 STACK TRACE:', err.stack);
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
