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

// ROTA TEMPORÁRIA PARA TROCAR SENHA DO ADMIN
router.get('/update-admin-secure', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('enemfl@w20266034!#8#', 10);
    
    await User.updateOne(
      { email: 'admin@enemflow.com' },
      { $set: { senha: hash } }
    );
    
    res.send('<h1>✅ Senha do Admin atualizada com sucesso!</h1><p>Já pode usar a senha nova.</p>');
  } catch (err) {
    res.status(500).send('Erro: ' + err.message);
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
