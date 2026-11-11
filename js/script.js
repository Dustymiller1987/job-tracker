let currentUser = null;

async function checkUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error && error.name !== "AuthSessionMissingError") {
        console.error("Unable to verify the current user:", error);
        return;
    }

    if (!user) {
        window.location.href = "pages/login.html";
        return;
    }

    currentUser = user;

    const userEmail = document.getElementById("userEmail");
    if (userEmail) {
        userEmail.textContent = user.user_metadata?.full_name?.trim() || user.email || "";
    }
}
const currentUserReady = checkUser();
let editingid = null;
function editApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) {
        alert("Application not found.");
        return;
    }
    document.getElementById("companyName").value = app.company;
    document.getElementById("jobTitle").value = app.jobTitle;
    document.getElementById("applicationDate").value = app.date;
    document.getElementById("status").value = app.status;
    document.getElementById("notes").value = app.notes;
    document.getElementById("salary").value = app.salary;
    document.getElementById("location").value = app.location;
    editingid = id;
}
async function saveApplicationToDatabase(application) {
    const { data, error } = await supabaseClient
        .from("applications")
        .insert(application)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Unable to sign out:", error);
        return;
    }

    window.location.href = "pages/landing.html";
}
const form = document.getElementById("applicationForm");
const applicationSaveMessage = document.getElementById("applicationSaveMessage");
const applicationsList = document.getElementById("applicationList");
const applicationCount = document.getElementById("applicationCount");
const statsContainer = document.getElementById("stats");
const applicationLoadMessage = document.getElementById("applicationLoadMessage");
const kanbanBoard = document.getElementById("kanbanBoard");
const followUpForm = document.getElementById("followUpForm");
const followUpList = document.getElementById("followUpList");
const followUpCount = document.getElementById("followUpCount");

const kanbanStatuses = [
    "Interested",
    "Applied",
    "Interview",
    "Final Interview",
    "Offer",
    "Accepted offer",
    "Rejected"
];

async function updateApplication(id, application) {
    const { data, error } = await supabaseClient
        .from("applications")
        .update(application)
        .eq("id", id)
        .select()
        .single();
        if (error) {
            alert(error.message);
            return;
        }
    }

let applications = [];

function getStoredFollowUps() {
    try {
        const saved = localStorage.getItem("followUps");
        const followUps = saved ? JSON.parse(saved) : [];
        return Array.isArray(followUps) ? followUps : [];
    } catch (error) {
        return [];
    }
}

let followUps = getStoredFollowUps();

function saveApplications() {
    localStorage.setItem("applications", JSON.stringify(applications));
}

function saveFollowUps() {
    localStorage.setItem("followUps", JSON.stringify(followUps));
}

function renderFollowUps() {
    if (!followUpList) {
        return;
    }

    followUpList.innerHTML = "";
    if (followUpCount) {
        followUpCount.textContent = `${followUps.length} scheduled`;
    }

    if (followUps.length === 0) {
        const empty = document.createElement("p");
        empty.classList.add("empty-column");
        empty.textContent = "No follow-ups scheduled.";
        followUpList.appendChild(empty);
        return;
    }

    const sortedFollowUps = [...followUps].sort((a, b) => a.date.localeCompare(b.date));
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);

    sortedFollowUps.forEach(followUp => {
        const item = document.createElement("article");
        item.classList.add("follow-up-card");
        if (followUp.date < today) {
            item.classList.add("follow-up-overdue");
        }

        const task = document.createElement("h3");
        task.textContent = followUp.task;

        const company = document.createElement("p");
        company.textContent = `Company: ${followUp.company}`;

        const date = document.createElement("p");
        date.textContent = `Date: ${followUp.date}`;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            if (!confirm("Delete this follow-up?")) {
                return;
            }

            followUps = followUps.filter(item => item.id !== followUp.id);
            saveFollowUps();
            renderFollowUps();
        });

        item.append(task, company, date, deleteButton);
        followUpList.appendChild(item);
    });
}

function updateStats() {
    if (!statsContainer) {
        return;
    }

    const interested = applications.filter(app => app.status === "Interested").length;
    const applied = applications.filter(app => app.status === "Applied").length;
    const interviews = applications.filter(app =>
        app.status && app.status.toLowerCase().includes("interview")
    ).length;
    const offers = applications.filter(app => app.status === "Offer").length;
    const accepted = applications.filter(app => app.status === "Accepted offer").length;
    const rejected = applications.filter(app => app.status === "Rejected").length;

    statsContainer.innerHTML = `
        <article class="stat-card">
            <span class="stat-value">${interested}</span>
            <span class="stat-label">Interested</span>
        </article>
        <article class="stat-card">
            <span class="stat-value">${applied}</span>
            <span class="stat-label">Applied</span>
        </article>
        <article class="stat-card">
            <span class="stat-value">${interviews}</span>
            <span class="stat-label">Interviews</span>
        </article>
        <article class="stat-card">
            <span class="stat-value">${offers}</span>
            <span class="stat-label">Offers</span>
        </article>
        <article class="stat-card">
            <span class="stat-value">${accepted}</span>
            <span class="stat-label">Accepted</span>
        </article>
        <article class="stat-card">
            <span class="stat-value">${rejected}</span>
            <span class="stat-label">Rejected</span>
        </article>
    `;
}

function renderKanbanBoard() {
    if (!kanbanBoard) {
        return;
    }

    const groupedApps = Object.fromEntries(
        kanbanStatuses.map(status => [status, []])
    );

    applications.forEach(app => {
        const status = kanbanStatuses.includes(app.status) ? app.status : "Interested";
        groupedApps[status].push(app);
    });

    kanbanBoard.innerHTML = "";

    kanbanStatuses.forEach(status => {
        const column = document.createElement("div");
        column.classList.add("kanban-column");

        const title = document.createElement("h3");
        title.textContent = status;
        column.appendChild(title);

        const cards = document.createElement("div");
        cards.classList.add("kanban-cards");

        if (groupedApps[status].length === 0) {
            const empty = document.createElement("div");
            empty.classList.add("empty-column");
            empty.textContent = "No applications";
            cards.appendChild(empty);
        } else {
            groupedApps[status].forEach(app => {
                const card = document.createElement("div");
                card.classList.add("kanban-card");
                card.innerHTML = `
                    <h4>${app.company}</h4>
                    <p><strong>Role:</strong> ${app.jobTitle}</p>
                    <p><strong>Closing:</strong> ${app.date || "N/A"}</p>
                    <p><strong>Date applied:</strong> ${app.status === "Interested" ? "N/A" : app.dateApplied || "N/A"}</p>
                    <p>${app.notes || ""}</p>
                    <button type="button" class="view-application">Open application</button>
                    <button type="button">Delete</button>
                `;

                card.querySelector(".view-application").addEventListener("click", () => viewApplication(app.id));
                const deleteButton = card.querySelector("button:last-child");
                deleteButton.addEventListener("click", () => deleteApplication(app.id));
                cards.appendChild(card);
            });
        }

        column.appendChild(cards);
        kanbanBoard.appendChild(column);
    });
}

function renderApplications() {
    if (!applicationCount) {
        return;
    }

    if (applicationsList) {
        applicationsList.innerHTML = "";
    }
    applicationCount.textContent = applications.length;
    updateStats();
    renderKanbanBoard();

    if (!applicationsList) {
        return;
    }

    applications.forEach((app, index) => {
        const div = document.createElement("div");
        div.classList.add("application-card");

        div.innerHTML = `
            <h3>
    ${app.company}
</h3>
            <p><strong>Role:</strong> ${app.jobTitle}</p>
            <p><strong>Closing Date:</strong> ${app.date || "N/A"}</p>
            <p><strong>Status:</strong> ${app.status}</p>
            <p>${app.notes || ""}</p>

            <button type="button" class="view-application">
                Open application
            </button>
            <button type="button" data-index="${index}">
                Delete
            </button>
        `;

        div.querySelector(".view-application").addEventListener("click", () => viewApplication(app.id));
        const deleteButton = div.querySelector("[data-index]");
        deleteButton.addEventListener("click", () => deleteApplication(app.id));
        applicationsList.appendChild(div);
    });
}

async function loadApplications() {
    await currentUserReady;

    if (!currentUser) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("applications")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Error loading applications from database:", error);
        if (applicationLoadMessage) {
            applicationLoadMessage.textContent =
                "Applications could not be loaded. Check your connection and account permissions, then refresh.";
        }
        return;
    }

    if (applicationLoadMessage) {
        applicationLoadMessage.textContent = "";
    }

    applications = data.map(application => ({
        ...application,
        jobTitle: application.job_title,
        jobUrl: application.job_url,
        date: application.date || application.closing_date || "",
        dateApplied: application.date_applied
            ? new Date(application.date_applied).toLocaleDateString()
            : "",
        interviewHistory: application.interview_history || ""
    }));

    renderApplications();
    try {
        saveApplications();
    } catch (storageError) {
        console.error("Applications loaded but could not be cached locally:", storageError);
    }
}

async function deleteApplication(id) {
    await currentUserReady;

    if (!currentUser) {
        alert("You must be logged in to delete an application.");
        return;
    }

    if (!confirm("Delete this application?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("applications")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Error deleting application:", error);
        alert(`The application could not be deleted: ${error.message}`);
        return;
    }

    await loadApplications();
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        await currentUserReady;

        if (!currentUser) {
            alert("You must be logged in to add an application.");
            return;
        }

        const company = document.getElementById("companyName").value.trim();
        const jobTitle = document.getElementById("jobTitle").value.trim();
        const date = document.getElementById("applicationDate").value;
        const status = document.getElementById("status").value;
        const notes = document.getElementById("notes").value.trim();

        if (!company || !jobTitle || !date || !["Interested", "Applied"].includes(status)) {
            return;
        }

        const salary = document.getElementById("salary").value.trim();
        const location = document.getElementById("location").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const jobUrl = document.getElementById("jobUrl").value.trim();
        const application = {
            user_id: currentUser.id,
            company: company,
            job_title: jobTitle,
            status: status,
            notes: notes,
            salary: salary,
            location: location,
            contact: contact,
            job_url: jobUrl,
            date_applied: new Date()
        };
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        if (applicationSaveMessage) {
            applicationSaveMessage.textContent = "";
            applicationSaveMessage.classList.remove("form-message-error");
        }

        try {
            const savedApplication = await saveApplicationToDatabase(application);
            applications.push({
                id: savedApplication.id,
                company,
                jobTitle,
                status,
                notes,
                salary,
                location,
                contact,
                jobUrl,
                date,
                dateApplied: application.date_applied.toLocaleDateString()
            });
            try {
                saveApplications();
            } catch (storageError) {
                console.error("Application saved to Supabase but could not be cached locally:", storageError);
            }
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error saving application to database:", error);
            const message = error && typeof error.message === "string"
                ? error.message
                : "Unknown database error.";
            const permissionHint = error && error.code === "42501"
                ? " Check the Supabase applications table grants and row-level security policies for authenticated users."
                : "";
            if (applicationSaveMessage) {
                applicationSaveMessage.textContent = `Application could not be saved: ${message}.${permissionHint}`;
                applicationSaveMessage.classList.add("form-message-error");
            } else {
                alert(`Application could not be saved: ${message}.${permissionHint}`);
            }
        } finally {
            submitButton.disabled = false;
        }
    });
}

if (followUpForm) {
    followUpForm.addEventListener("submit", event => {
        event.preventDefault();

        const task = document.getElementById("followUpTask").value.trim();
        const company = document.getElementById("followUpCompany").value.trim();
        const date = document.getElementById("followUpDate").value;

        if (!task || !company || !date) {
            return;
        }

        const followUp = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            task,
            company,
            date
        };
        const saveMessage = document.getElementById("followUpSaveMessage");
        const submitButton = followUpForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        if (saveMessage) {
            saveMessage.textContent = "";
        }

        try {
            followUps.push(followUp);
            saveFollowUps();
            window.location.href = "index.html";
        } catch (error) {
            followUps = followUps.filter(item => item.id !== followUp.id);
            console.error("Error saving follow-up:", error);
            if (saveMessage) {
                saveMessage.textContent = "The follow-up could not be saved in this browser. Check available storage and try again.";
            } else {
                alert("The follow-up could not be saved. Check available browser storage and try again.");
            }
            submitButton.disabled = false;
        }
    });
}

if (applicationCount) {
    loadApplications();
}
renderFollowUps();
function viewApplication(id) {
    localStorage.setItem("selectedApplicationId", id);
    window.location.href = "details.html";
}