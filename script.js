document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
  
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const errorMessageElement = document.getElementById('errorMessage');
  
    // Limpa a mensagem de erro antes de tentar fazer login
    errorMessageElement.textContent = '';
  
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Redirecionar para a página protegida (se necessário)
        window.location.href = '/dashboard.html';
      } else {
        errorMessageElement.textContent = data.message || 'Erro ao fazer login';
      }
    } catch (error) {
      errorMessageElement.textContent = 'Erro ao conectar com o servidor';
    }
  });
  