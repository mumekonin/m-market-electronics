const registerForm = document.querySelector('#registration-form');
async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());
    try {
        const response = await fetch('http://localhost:3000/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert('Registration successful! Redirecting to Home...');
            window.location.href = 'index.html';
        } else {
            alert('Registration Failed: ' + result.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Could not connect to the backend. Is your NestJS server running?');
    }
}
registerForm.addEventListener('submit', handleRegister);