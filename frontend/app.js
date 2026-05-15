const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : ''; // Vazio significa que ele usará o mesmo domínio que está servindo o site

const App = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  },
  
  toggleTheme: () => {
    const root = document.documentElement;
    root.classList.toggle('light-theme');
    const isLight = root.classList.contains('light-theme');
    localStorage.setItem('enemflow_theme', isLight ? 'light' : 'dark');
  },
  
  // Wrapper para fazer requisições para a API
  api: async (endpoint, options = {}) => {
    const token = App.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      // Tenta ler como JSON, mas se falhar (ex: erro 500 da Vercel), captura o erro
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // Se não for JSON, o servidor provavelmente caiu ou deu erro 500
        throw new Error('O servidor encontrou um problema técnico. Tente novamente em instantes.');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro inesperado na requisição.');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      let msg = error.message;
      
      // Tradução de erros técnicos para mensagens amigáveis
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        msg = 'O sistema está temporariamente instável. Verifique sua conexão ou tente mais tarde.';
      } else if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = 'Não foi possível conectar ao servidor. Verifique se você está online.';
      }
      
      throw new Error(msg);
    }
  },

  showToast: (msg, isError = false) => {
    // Remove toast anterior se existir para evitar sobreposição
    const oldToast = document.getElementById('premium-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'premium-toast';
    
    // Design Premium Ultra do Toast
    const icon = isError 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' 
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    
    toast.innerHTML = `
      <div class="toast-icon ${isError ? 'error' : 'success'}">${icon}</div>
      <div class="toast-content">${msg}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger reflow para animação
    void toast.offsetWidth;
    toast.classList.add('show');
    
    if(window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 600);
    }, 5000); // 5 segundos para o usuário ler com calma
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // --- SEGURANÇA: Trava de Sessão de 12 Horas ---
  const lastAccess = localStorage.getItem('enemflow_last_access');
  const now = Date.now();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12h em milissegundos

  if (lastAccess && (now - parseInt(lastAccess)) > TWELVE_HOURS) {
    console.log('Sessão expirada por inatividade (12h).');
    App.logout();
    return;
  }
  // Atualiza o timestamp de acesso
  localStorage.setItem('enemflow_last_access', now.toString());

  // Inicializar Tema
  const savedTheme = localStorage.getItem('enemflow_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  const token = App.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Atualiza o tempo de acesso no login
      localStorage.setItem('enemflow_last_access', Date.now().toString());

      if (payload.role === 'admin' && !window.location.href.includes('admin.html')) {
        const nav = document.querySelector('nav');
        const mobileAdminContainer = document.getElementById('adminMobileBtn');

        // Versão Desktop
        if (nav && !document.getElementById('adminBackBtn')) {
          const sep = document.createElement('div');
          sep.style = 'margin-top: 15px; margin-bottom: 5px; border-top: 1px solid rgba(255,255,255,0.1);';
          nav.appendChild(sep);
          const adminLink = document.createElement('a');
          adminLink.id = 'adminBackBtn';
          adminLink.href = 'admin.html';
          adminLink.className = 'nav-link';
          adminLink.style.color = 'var(--primary)';
          adminLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Voltar ao Master`;
          nav.appendChild(adminLink);
        }

        // Versão Mobile
        if (mobileAdminContainer && !document.getElementById('adminMobileLink')) {
          mobileAdminContainer.innerHTML = `
            <a href="admin.html" id="adminMobileLink" class="btn" style="background: var(--primary); padding: 8px; border-radius: 10px; color: white;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </a>
          `;
        }
      }
    } catch(e) {}
  }

  // Lógica global para Colapsar a Sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const logoContainer = sidebar.querySelector('.sidebar-logo');
    if (logoContainer) {
      logoContainer.style.cursor = 'pointer';
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'hamburger-btn';
      toggleBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      toggleBtn.style = 'background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text); cursor: pointer; margin-left: auto; display: flex; padding: 6px; transition: 0.3s; flex-shrink: 0;';
      toggleBtn.onmouseover = () => toggleBtn.style.background = 'var(--primary)';
      toggleBtn.onmouseout = () => toggleBtn.style.background = 'rgba(255,255,255,0.05)';
      
      logoContainer.style.display = 'flex';
      logoContainer.style.alignItems = 'center';
      logoContainer.appendChild(toggleBtn);
      
      logoContainer.onclick = () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('enemflow_sidebar', sidebar.classList.contains('collapsed'));
      };
      
      if (localStorage.getItem('enemflow_sidebar') === 'true') {
        sidebar.classList.add('collapsed');
      }
    }
  }
});
