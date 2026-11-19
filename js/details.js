const details = document.getElementById("applicationDetails");
const statusForm = document.getElementById("statusForm");
const statusSelect = document.getElementById("applicationStatus");
const statusMessage = document.getElementById("applicationUpdateMessage");
const historySection = document.getElementById("interviewHistorySection");
const historyContainer = document.getElementById("interviewHistory");
const historyForm = document.getElementById("interviewHistoryForm");
const historyMessage = document.getElementById("interviewNotesMessage");
const selectedId = localStorage.getItem("selectedApplicationId");
const statusStages = [
    "Interested",
    "Applied",
    "Interview",
    "Final Interview",
    "Offer",
    "Accepted offer",
    "Rejected"
];
const terminalStatuses = ["Accepted offer", "Rejected"];

let applications;
try {
    applications = JSON.parse(localStorage.getItem("applications") || "[]");
    if (!Array.isArray(applications)) {
        throw new Error("Saved applications are not a list.");
    }
} catch (error) {
    details.textContent = "Saved application data could not be read.";
}

const application = Array.isArray(applications)
    ? applications.find(app => String(app.id) === selectedId)
    : null;

function saveApplicationChanges() {
    try {
        localStorage.setItem("applications", JSON.stringify(applications));
        return true;
    } catch (error) {
        console.error("Application was updated but could not be cached locally:", error);
        return false;
    }
}

async function persistApplicationUpdate(update) {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
        throw authError;
    }
    if (!user) {
        throw new Error("You must be logged in to update this application.");
    }

    const { data, error } = await supabaseClient
        .from("applications")
        .update(update)
        .eq("id", selectedId)
        .eq("user_id", user.id)
        .select("id")
        .single();

    if (error) {
        throw error;
    }

    return data;
}

function renderHistory() {
    historyContainer.innerHTML = "";
    const history = document.createElement("p");
    history.classList.add("interview-history-text");
    history.textContent = application.notes || application.interviewHistory || "No interview history added.";
    historyContainer.appendChild(history);
}

if (application) {
    const heading = document.createElement("h1");
    heading.textContent = application.company || "Application details";
    details.appendChild(heading);

    const fields = [
        ["Role", application.jobTitle],
        ["Status", application.status],
        ["Closing Date", application.date],
        ["Salary", application.salary],
        ["Location", application.location],
        ["Recruiter", application.contact],
        ["Applied", application.dateApplied],
        ["Notes", application.notes]
    ];

    fields.forEach(([label, value]) => {
        if (!value) {
            return;
        }

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        paragraph.append(strong, document.createTextNode(value));
        details.appendChild(paragraph);
    });

    if (application.jobUrl) {
        try {
            const jobUrl = new URL(application.jobUrl);
            if (jobUrl.protocol === "http:" || jobUrl.protocol === "https:") {
                const paragraph = document.createElement("p");
                const link = document.createElement("a");
                link.href = jobUrl.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "View job posting";
                paragraph.appendChild(link);
                details.appendChild(paragraph);
            }
        } catch (error) {
            const paragraph = document.createElement("p");
            paragraph.textContent = "The saved job posting URL is invalid.";
            details.appendChild(paragraph);
        }
    }

    const currentStageIndex = statusStages.indexOf(application.status);
    const nextStatus = statusStages[currentStageIndex + 1];
    statusSelect.replaceChildren();
    const availableStatuses = currentStageIndex < 0
        ? ["Interested", "Rejected"]
        : terminalStatuses.includes(application.status)
            ? []
            : [nextStatus, "Rejected"];
    availableStatuses.forEach(status => {
        if (!status) {
            return;
        }
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
    });
    statusForm.hidden = availableStatuses.length === 0;
    if (!statusForm.hidden) {
        statusSelect.value = nextStatus || availableStatuses[0];
    }
    historySection.hidden = false;
    renderHistory();

    statusForm.addEventListener("submit", async event => {
        event.preventDefault();
        const updatedStatus = statusSelect.value;
        const submitButton = statusForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        statusMessage.textContent = "";
        try {
            await persistApplicationUpdate({ status: updatedStatus });
            application.status = updatedStatus;
            saveApplicationChanges();
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Unable to update application status:", error);
            statusMessage.textContent =
                `The application status could not be updated: ${getApplicationUpdateErrorMessage(error)}`;
        } finally {
            submitButton.disabled = false;
        }
    });

    historyForm.addEventListener("submit", async event => {
        event.preventDefault();
        const notes = document.getElementById("interviewNotes").value.trim();
        if (!notes) {
            return;
        }

        const entry = `${new Date().toLocaleDateString()}: ${notes}`;
        const existingNotes = application.notes || application.interviewHistory || "";
        const updatedNotes = existingNotes
            ? `${existingNotes}\n\n${entry}`
            : entry;
        const submitButton = historyForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        historyMessage.textContent = "";
        try {
            await persistApplicationUpdate({ notes: updatedNotes });
            application.notes = updatedNotes;
            application.interviewHistory = updatedNotes;
            const cached = saveApplicationChanges();
            renderHistory();
            historyForm.reset();
            if (!cached) {
                historyMessage.textContent = "The notes were saved to your account but could not be cached in this browser.";
            }
        } catch (error) {
            console.error("Unable to save interview notes:", error);
            historyMessage.textContent =
                `Application note could not be saved: ${getApplicationUpdateErrorMessage(error)}`;
        } finally {
            submitButton.disabled = false;
        }
    });
} else if (!details.textContent) {
    details.textContent = "Application not found. It may have been deleted.";
}
