const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth');

// Certifique-se de que a pasta existe
const uploadDir = path.join(__dirname, '../uploads');
// Cria a pasta de uploads se não existir (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}

const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({ storage: storage });

// Rota de upload (protegida)
router.post('/', auth, upload.single('file'), (req, res) => {
  // O Vercel possui um sistema de arquivos somente-leitura.
  // Graças ao memoryStorage, a requisição chega aqui sem dar crash de disco na Multer.
  // Agora retornamos um erro de validação JSON amigável e legível.
  if (process.env.VERCEL) {
    return res.status(400).json({
      error: 'Upload de arquivo físico desativado na Vercel (servidor sem disco). Por favor, use a opção de "Link externo" (ex: link do YouTube ou Google Drive).'
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  // Retorna a URL pública (modo local)
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
