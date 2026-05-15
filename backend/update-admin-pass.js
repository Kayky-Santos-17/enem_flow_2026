require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function updateAdmin() {
  try {
    const uri = "mongodb+srv://enem_flow:enemflow266034@cluster0.awsypn2.mongodb.net/enemflow?retryWrites=true&w=majority";
    await mongoose.connect(uri);
    
    const novaSenha = "enemfl@w20266034!#8#";
    const hash = await bcrypt.hash(novaSenha, 10);
    
    const res = await User.updateOne(
      { email: 'admin@enemflow.com' },
      { $set: { senha: hash } }
    );
    
    if (res.modifiedCount > 0) {
      console.log('✅ Senha do Admin atualizada com sucesso!');
    } else {
      console.log('⚠️ Usuário admin não encontrado.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

updateAdmin();
