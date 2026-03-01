// At the very top - if you don't see this in F12 console, the file isn't linked!
console.log("LOGIN SCRIPT LOADED SUCCESSFULLY");

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#login-form');
    const loginBtn = document.querySelector('#login-btn');

    if (!loginForm) {
        console.error("ERROR: Could not find #login-form. Check your HTML ID!");
        return;
    }

    loginForm.addEventListener('submit', async function (event) {
        // MUST BE FIRST: Stop the URL leak
        event.preventDefault();
        event.stopImmediatePropagation(); 

        console.log("Form submission caught. Preventing URL leak...");

        // Visual feedback
        const originalText = loginBtn.innerText;
        loginBtn.innerText = 'Connecting...';
        loginBtn.disabled = true;

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('userToken', result.token);
                alert('Login Successful!');
                window.location.href = 'index.html';
            } else {
                alert('Login Failed: ' + (result.message || 'Invalid credentials'));
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            alert('Cannot connect to NestJS. Is the server running at port 3000?');
        } finally {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    });
});