const form =
    document.getElementById(
        "newPasswordForm"
    );

const message =
    document.getElementById(
        "passwordMessage"
    );

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const password =
            document.getElementById(
                "newPassword"
            ).value;

        const { error } =
            await supabaseClient.auth
                .updateUser({
                    password
                });

        if (error) {

            message.textContent =
                error.message;

            return;
        }

        message.textContent =
            "Password updated successfully.";

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 2000);

    }
);