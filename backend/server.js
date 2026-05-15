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

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/auth',     require('./routes/auth.routes'));
app.use('/contents', require('./routes/content.routes'));
app.use('/study',    require('./routes/study.routes'));
app.use('/ai',       require('./routes/ai.routes'));
app.use('/upload',   require('./routes/upload.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
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
app.listen(PORT, () => {
  console.log(`🚀 EnemFlow API rodando → http://localhost:${PORT}`);
  console.log(`📋 Health check      → http://localhost:${PORT}/health`);
  console.log(`🌍 Ambiente          → ${process.env.NODE_ENV}`);
});
