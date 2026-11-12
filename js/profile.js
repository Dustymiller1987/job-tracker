let currentUser = null;

async function loadProfile() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "../pages/login.html";
        return;
    }

    currentUser = user;

    const userEmailElement = document.getElementById("userEmail");
    if (userEmailElement) {
        userEmailElement.textContent = user.user_metadata?.full_name?.trim() || user.email || "";
    }

    const profileNameInput = document.getElementById("profileName");
    const profileEmailInput = document.getElementById("profileEmail");

    if (profileEmailInput) {
        profileEmailInput.value = user.email || "";
    }

    if (profileNameInput) {
        profileNameInput.value = user.user_metadata?.full_name || "";
    }

    const profileForm = document.getElementById("profileForm");

    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const fullName = document.getElementById("profileName").value.trim();
            const message = document.getElementById("profileMessage");

            const { error: updateError } = await supabaseClient.auth.updateUser({
                data: {
                    full_name: fullName
                }
            });

            if (updateError) {
                message.textContent = updateError.message;
                return;
            }

            currentUser.user_metadata = {
                ...currentUser.user_metadata,
                full_name: fullName
            };
            if (userEmailElement) {
                userEmailElement.textContent = fullName || currentUser.email || "";
            }
            message.textContent = "Profile updated successfully.";
        });
    }

    const changePasswordButton = document.getElementById("changePassword");

    if (changePasswordButton) {
        changePasswordButton.addEventListener("click", async () => {
            const password = document.getElementById("newPassword").value;

            if (!password.trim()) {
                alert("Please enter a new password.");
                return;
            }

            const { error: passwordError } = await supabaseClient.auth.updateUser({
                password
            });

            if (passwordError) {
                alert(passwordError.message);
                return;
            }

            alert("Password updated.");
            document.getElementById("newPassword").value = "";
        });
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Unable to sign out:", error);
        return;
    }

    window.location.href = "../index.html";
}

loadProfile();