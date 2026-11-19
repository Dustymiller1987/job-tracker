let currentUser = null;

const historyList = document.getElementById("historyList");
const historyMessage = document.getElementById("historyMessage");

async function checkUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error("Unable to verify the current user:", error);
        historyMessage.textContent = `Unable to verify your account: ${error.message}`;
        return false;
    }

    if (!user) {
        window.location.href = "pages/login.html";
        return false;
    }

    currentUser = user;
    const userEmail = document.getElementById("userEmail");
    userEmail.textContent = user.user_metadata?.full_name?.trim() || user.email || "";
    return true;
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Unable to sign out:", error);
        historyMessage.textContent = `Unable to sign out: ${error.message}`;
        return;
    }

    window.location.href = "index.html";
}

function renderHistory(applications) {
    historyList.replaceChildren();

    if (applications.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.classList.add("empty-column");
        emptyMessage.textContent = "No archived applications.";
        historyList.appendChild(emptyMessage);
        return;
    }

    applications.forEach(application => {
        const card = document.createElement("article");
        card.classList.add("application-card");

        const title = document.createElement("h3");
        title.textContent = application.company || "Application";

        const role = document.createElement("p");
        role.innerHTML = "<strong>Role:</strong> ";
        role.append(document.createTextNode(application.job_title || "N/A"));

        const status = document.createElement("p");
        status.innerHTML = "<strong>Status:</strong> ";
        status.append(document.createTextNode(application.status || "N/A"));

        const archivedDate = application.archived_date
            ? new Date(application.archived_date)
            : null;
        const archived = document.createElement("p");
        archived.innerHTML = "<strong>Archived:</strong> ";
        archived.append(document.createTextNode(
            archivedDate && !Number.isNaN(archivedDate.getTime())
                ? archivedDate.toLocaleDateString()
                : "Unknown"
        ));

        const actions = document.createElement("div");
        actions.classList.add("dashboard-actions");

        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => restoreApplication(application.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete forever";
        deleteButton.addEventListener("click", () => deleteForever(application.id));

        actions.append(restoreButton, deleteButton);
        card.append(title, role, status, archived, actions);
        historyList.appendChild(card);
    });
}

async function loadHistory() {
    const { data, error } = await supabaseClient
        .from("applications")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("archived", true)
        .order("archived_date", { ascending: false });

    if (error) {
        console.error("Unable to load archived applications:", error);
        historyMessage.textContent = `Archived applications could not be loaded: ${error.message}`;
        return;
    }

    historyMessage.textContent = "";
    renderHistory(data || []);
}

async function restoreApplication(id) {
    const { error } = await supabaseClient
        .from("applications")
        .update({ archived: false, archived_date: null })
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Unable to restore application:", error);
        historyMessage.textContent = `Application could not be restored: ${error.message}`;
        return;
    }

    await loadHistory();
}

async function deleteForever(id) {
    if (!confirm("Permanently delete this application?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("applications")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Unable to permanently delete application:", error);
        historyMessage.textContent = `Application could not be deleted: ${error.message}`;
        return;
    }

    await loadHistory();
}

async function initHistory() {
    if (await checkUser()) {
        await loadHistory();
    }
}

initHistory();
