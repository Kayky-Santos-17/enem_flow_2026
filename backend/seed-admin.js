const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const email = 'enemflow2026@gmail.com';
  const senha = 'enemfl@w266034!#8#';
  const hash = await bcrypt.hash(senha, 10);
  
  await User.findOneAndUpdate(
    { email },
    { nome: 'Admin Supremo', email, senha: hash, role: 'admin' },
    { upsert: true, new: true }
  );
  
  console.log('✅ Conta de Administrador criada com sucesso!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
