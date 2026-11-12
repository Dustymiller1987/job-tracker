const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const submitButton = registerForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        registerMessage.textContent = "";

        try {
            const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
        data: {
            full_name: name
        },
        emailRedirectTo:
            "https://job-application-trackerdashboard.netlify.app/dashboard.html"
    }
});

            if (error) {
                registerMessage.textContent = error.message;
                return;
            }

            registerMessage.textContent = "Check your email to confirm your account.";
            registerForm.reset();
        } catch (error) {
            registerMessage.textContent = "Registration failed. Check your connection and try again.";
            console.error("Registration failed:", error);
        } finally {
            submitButton.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const loginMessage = document.getElementById("loginMessage");
        const submitButton = loginForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        loginMessage.textContent = "";

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                loginMessage.textContent = error.message;
                return;
            }

            window.location.href = "../dashboard.html";
        } catch (error) {
            loginMessage.textContent = "Login failed. Check your connection and try again.";
            console.error("Login failed:", error);
        } finally {
            submitButton.disabled = false;
        }
    });
}
