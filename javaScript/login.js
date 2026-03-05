console.log("LOGIN SCRIPT LOADED SUCCESSFULLY");

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#login-form');
  const loginBtn  = document.querySelector('#login-btn');

  if (!loginForm) {
    console.error("ERROR: Could not find #login-form.");
    return;
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const originalText = loginBtn.innerText;
    loginBtn.innerText = 'Connecting...';
    loginBtn.disabled  = true;

    const formData = new FormData(loginForm);
    const data     = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('https://m-market-2.onrender.com/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log("Full Server Response:", result);

      if (response.ok) {
        // Store the token
        const token = result.token || result.access_token || result.accessToken;
        localStorage.setItem('userToken', token);
        let role = result.role
                || result?.user?.role
                || result?.data?.role
                || null;

        // If role still not found, decode it from the JWT payload
        if (!role && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Decoded JWT payload:", payload);
            role = payload.role || payload.Role || null;
          } catch (e) {
            console.warn("Could not decode JWT:", e);
          }
        }

        console.log("Detected role:", role);

        if (role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }

      } else {
        showError(result.message || 'Invalid credentials. Please try again.');
      }

    } catch (error) {
      console.error('Fetch Error:', error);
      showError('Cannot connect to server. Is it running on port 3000?');
    } finally {
      loginBtn.innerText = originalText;
      loginBtn.disabled  = false;
    }
  });

  function showError(msg) {
    const existing = document.getElementById('login-error');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'login-error';
    el.textContent = msg;
    el.style.cssText = `
      background:#fff0f0; color:#c0392b; border:1px solid #f5c6cb;
      border-radius:8px; padding:12px 16px; margin-bottom:16px;
      font-size:14px; font-weight:600; text-align:center;
    `;
    loginBtn.insertAdjacentElement('beforebegin', el);
  }
});