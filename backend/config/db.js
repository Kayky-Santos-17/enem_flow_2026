const mongoose = require('mongoose');

/**
 * Conecta ao MongoDB usando a URI definida em .env
 * Exibe mensagens de status no console durante o desenvolvimento.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Opções recomendadas para evitar warnings do Mongoose 8+
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1); // Encerra o processo se não conectar
  }
};

// Eventos de conexão para monitoramento
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconectado');
});

module.exports = connectDB;
