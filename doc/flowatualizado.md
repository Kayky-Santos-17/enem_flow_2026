# Documento de Requisitos do Produto (PRD) — EnemFlow 2026
## Edição Premium & Ultra Otimizada

Este documento descreve a visão do produto, arquitetura técnica, modelo de dados, decisões de engenharia e especificações de interface do **EnemFlow**, uma plataforma gamificada de gestão e imersão de estudos voltada para a preparação do ENEM.

---

## 1. Visão Geral do Produto
O **EnemFlow** é um ecossistema de estudos que combina elementos de gamificação (XP, níveis, trilhas de progresso) com ferramentas práticas de foco (cronômetro imersivo, suporte a leitura de PDFs, videoaulas e anotações). O principal objetivo é tornar a rotina de preparação para o vestibular viciante, organizada e extremamente fluida.

---

## 2. Arquitetura Técnica e Tecnologias
O projeto foi desenvolvido sob uma arquitetura leve, moderna e de altíssima performance, ideal para deploy serverless (Vercel).

### **Stack Tecnológica:**
*   **Front-end**: HTML5 semântico, Vanilla CSS3 (Custom Variables, Glassmorphism, animações avançadas) e Vanilla JavaScript (ES6+, sem frameworks pesados para garantir carregamento instantâneo).
*   **Back-end**: Node.js com framework Express.
*   **Banco de Dados**: MongoDB Atlas operando na nuvem com modelagem via Mongoose.
*   **Segurança**: Autenticação stateless via JSON Web Token (JWT) assinado com criptografia de senhas via Bcrypt.
*   **Deploy**: Hospedagem serverless de alto desempenho via Vercel (integrando rewrites e servindo rotas estáticas).

---

## 3. Principais Soluções e Desafios de Engenharia Resolvidos

### **A. Proteção de Disco Serverless (Vercel EROFS Crash Prevention)**
*   **Desafio**: A Vercel possui um sistema de arquivos estritamente somente-leitura. Qualquer tentativa da biblioteca `Multer` de salvar uploads temporários em disco (`diskStorage`) resultava em crash fatal do servidor (erro de permissão de disco - `EROFS`), retornando páginas 500 em HTML e quebrando a experiência de rede.
*   **Solução**: Implementamos detecção dinâmica de ambiente (`process.env.VERCEL`). Se rodando na nuvem, o backend adota o **`multer.memoryStorage()`**, retendo os dados apenas na memória RAM e retornando uma mensagem limpa e estruturada de validação (JSON 400).
*   **Upload Direto no Banco (Base64)**: Para viabilizar o envio de PDFs pelo painel sem falhas de disco, o front-end lê e codifica o arquivo PDF selecionado em uma string **Base64 (Data URL)** via `FileReader` nativo. Essa string é enviada no payload do formulário e salva diretamente no banco de dados MongoDB Atlas (dentro do limite BSON de 16MB).

### **B. Superação do Limite do Navegador (`localStorage` Quota Limit)**
*   **Desafio**: O navegador possui um limite rígido de apenas 5MB para dados guardados no `localStorage`. Ao salvar PDFs em Base64 de 8MB ou 10MB no `localStorage` antes de abrir a tela de estudos, o navegador lançava `QuotaExceededError` e travava o redirecionamento.
*   **Solução**: Eliminamos o armazenamento de URLs gigantes no navegador. O dashboard salva apenas o **ID** do conteúdo no `localStorage`. Ao carregar a tela do cronômetro (`study.html`), ela realiza uma requisição rápida e eficiente ao back-end (`GET /contents/:id`) para renderizar os dados e mídias em tempo real a partir do banco de dados online.

### **C. Sessão Segura e Volátil (Tab Close Auto-Logout)**
*   **Desafio**: Evitar que a conta do aluno permaneça permanentemente ativa se ele fechar a aba em computadores públicos ou compartilhados.
*   **Solução**: Migramos o armazenamento de credenciais e tokens de acesso de `localStorage` para **`sessionStorage`**. Isso faz com que o próprio navegador destrua e limpe o token de acesso no exato segundo em que a aba ou navegador do EnemFlow é fechado, exigindo login seguro no próximo acesso. Preferências estéticas (como tema claro/escuro e menu recolhido) continuam persistentes em `localStorage` para a melhor experiência do usuário (UX).

### **D. Painel de Controle de Sessão Única por Conta**
*   **Desafio**: Evitar compartilhamento não autorizado de contas.
*   **Solução**: Implementação de `sessionToken` gerado a cada login. Se o mesmo usuário se logar em outro aparelho, o token antigo é invalidado no banco de dados e o usuário anterior é deslogado automaticamente do sistema.

---

## 4. Estrutura do Banco de Dados (Schemas do Mongoose)

### **A. User Schema (`User.js`)**
```javascript
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  xp: { type: Number, default: 0 },
  sessionToken: { type: String, default: '' },
  progresso: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
    tempoEstudado: { type: Number, default: 0 }, // em segundos
    concluido: { type: Boolean, default: false }
  }]
}, { timestamps: true });
```

### **B. Content Schema (`Content.js`)**
```javascript
const contentSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: { type: String, default: '' },
  materia: { type: String, required: true }, // ex: Matemática, Biologia
  assunto: { type: String, required: true }, // ex: Geometria
  subassunto: { type: String, default: '' }, // ex: Tópico/Subtítulo
  tipo: { type: String, required: true, enum: ['video', 'pdf', 'artigo', 'exercicio'] },
  url: { type: String, required: true }, // Suporta URL padrão (YouTube/Drive) ou Base64 (PDFs físicos)
  tempoMedio: { type: Number, default: 0 }, // em minutos
  ordem: { type: Number, default: 0 }
}, { timestamps: true });
```

### **C. StudySession Schema (`StudySession.js`)**
```javascript
const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  duracao: { type: Number, required: true }, // em segundos
  xpGanho: { type: Number, required: true },
  iniciadaEm: { type: Date, required: true },
  encerradaEm: { type: Date, default: Date.now }
}, { timestamps: true });
```

---

## 5. Rotas da API e Fluxos de Endpoints

### **Módulo de Autenticação (`/auth`)**
*   `POST /auth/register`: Cadastro de usuários (encriptação com Bcrypt + emissão de JWT).
*   `POST /auth/login`: Login seguro (validação de hash de senha + geração de sessionToken).
*   `GET /auth/me`: Retorna os dados do perfil autenticado (inclui XP e role).

### **Módulo de Conteúdo (`/contents`)**
*   `GET /contents`: Lista todos os conteúdos agrupados por matéria e assunto.
*   `GET /contents/:id`: Detalha um único conteúdo (essencial para renderizar PDFs).
*   `POST /contents`: *(Apenas Admin)* Cria novos conteúdos.
*   `PUT /contents/:id`: *(Apenas Admin)* Edita um conteúdo.
*   `DELETE /contents/:id`: *(Apenas Admin)* Exclusão lógica ou física do conteúdo.

### **Módulo de Timer de Estudos (`/study`)**
*   `POST /study/start`: Marca o timestamp de início da sessão do aluno no servidor.
*   `POST /study/end`: Encerra a sessão, calcula a duração e o XP ganho (+1 XP a cada 6 minutos), registra a sessão no histórico e soma o progresso e XP na conta do usuário no MongoDB.
*   `GET /study/history/:userId`: Retorna o histórico das últimas 20 sessões de estudo.

### **Módulo de Arquivos (`/upload`)**
*   `POST /upload`: Salva arquivos localmente (se em ambiente de desenvolvimento local).

---

## 6. Recursos Premium de UI e Experiência do Usuário (UX)

### **A. Botão Dinâmico de Alternância Admin/Aluno**
*   O token JWT carrega a propriedade `role` de forma criptografada em seu payload.
*   Ao acessar as telas do aluno, o script `app.js` decodifica o payload e, se identificar a propriedade `role === 'admin'`, injeta de forma inteligente e estilizada um botão rosa de **"Voltar ao Master"** no menu lateral e mobile. Isso permite que o administrador navegue entre a visão real do aluno e o painel de criação sem precisar deslogar!

### **B. A Área de Estudos Imersiva (O Coração do App)**
*   **Design Pomodoro Glow**: Um anel de cronômetro com efeito de respiração neon e gradientes HSL que pulsa em verde/roxo quando ativo.
*   **Layout Híbrido Dinâmico**: Caso a missão não possua material físico anexado (apenas anotações/exercícios livres), a coluna da esquerda é elegantemente ocultada e o cronômetro assume 100% da tela centralizado.
*   **Modo Foco Total**: Atalhos dedicados ocultam barras de navegação ou expandem o leitor de PDF para maximizar a área de foco na leitura.
*   **Feedback Sonoro Premium**: Toca tons puros e suaves via API de Áudio do Navegador para indicar início e fim das sessões (bell chime).
*   **Estimador de XP em tempo real**: O aluno vê os pontos de experiência subirem visualmente a cada segundo, gerando forte apelo gamificado.

---

## 7. Próximos Passos de Evolução do Produto
1.  **Trilha de Conquistas (Badges)**: Adicionar medalhas colecionáveis para marcos de tempo de estudo (ex: 10h, 50h de foco).
2.  **Modo Coop (Grupo de Estudos)**: Salas Pomodoro compartilhadas onde alunos veem o timer dos colegas em tempo real para estudo em grupo.
3.  **Chatbot de IA com Contexto**: Integração de assistente de Inteligência Artificial que lê o conteúdo da aula e gera simulados sob demanda baseados no PDF anexado.
