const API_URL = 'http://localhost:3000';

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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro inesperado na requisição.');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Tradução de erros comuns de rede para Português
      let msg = error.message;
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
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
    
    // Design Premium do Toast
    const icon = isError 
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' 
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    
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
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Tema
  const savedTheme = localStorage.getItem('enemflow_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  const token = App.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'admin' && !window.location.href.includes('admin.html')) {
        const nav = document.querySelector('nav');
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
