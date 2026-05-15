const router = require('express').Router();
const { 
  register, 
  login, 
  me, 
  updateProfile, 
  getAllUsers, 
  deleteUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  resetAllXP
} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// --- Públicas ---
router.post('/register', register);
router.post('/login', login);

// ROTA TEMPORÁRIA DE SETUP (Cria o primeiro Admin)
router.get('/setup-admin', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const jaExiste = await User.findOne({ role: 'admin' });
    if (jaExiste) return res.send('<h1>O Admin já existe!</h1><p>Use admin@enemflow.com / admin123</p>');

    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      nome: 'Administrador Mestre',
      email: 'admin@enemflow.com',
      senha: hash,
      role: 'admin'
    });

    res.send('<h1>✅ Admin criado com sucesso!</h1><p>Agora você pode fazer login.</p>');
  } catch (err) {
    res.status(500).send('Erro no setup: ' + err.message);
  }
});

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// --- Privadas (Requer Auth) ---
router.get('/me', auth, me);
router.put('/me', auth, updateProfile);
router.put('/password', auth, updatePassword);

// --- Admin ---
router.get('/users', auth, adminMiddleware, getAllUsers);
router.delete('/users/:id', auth, adminMiddleware, deleteUser);
router.post('/system/reset-all-xp', auth, adminMiddleware, resetAllXP);

module.exports = router;
