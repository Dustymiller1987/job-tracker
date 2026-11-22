const form =
    document.getElementById(
        "resetPasswordForm"
    );

const message =
    document.getElementById(
        "resetMessage"
    );

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const email =
            document.getElementById(
                "resetEmail"
            ).value;

        const { error } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                        "https://job-application-trackerdashboard.netlify.app/pages/reset-password.html"
                    }
                );

        if (error) {

            message.textContent =
                error.message;

            return;
        }

        message.textContent =
            "Password reset email sent. Please check your inbox.";

    }
);