const registerForm = document.querySelector('#registration-form');
const registerBtn  = document.querySelector('#register-btn');

function showMessage(msg, type = 'error') {
  ['register-error', 'register-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const el = document.createElement('div');
  el.id = type === 'error' ? 'register-error' : 'register-success';
  el.textContent = msg;
  registerBtn.insertAdjacentElement('beforebegin', el);
}

async function handleRegister(event) {
  event.preventDefault();

  const originalText    = registerBtn.innerText;
  registerBtn.innerText = 'Creating account...';
  registerBtn.disabled  = true;

  const formData = new FormData(registerForm);
  const data     = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('https://m-market-2.onrender.com/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Account created! Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } else {
      showMessage(result.message || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showMessage('Cannot connect to server. Is it running on port 3000?');
  } finally {
    registerBtn.innerText = originalText;
    registerBtn.disabled  = false;
  }
}

registerForm.addEventListener('submit', handleRegister);