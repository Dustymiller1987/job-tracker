const details = document.getElementById("applicationDetails");
const statusForm = document.getElementById("statusForm");
const statusSelect = document.getElementById("applicationStatus");
const historySection = document.getElementById("interviewHistorySection");
const historyContainer = document.getElementById("interviewHistory");
const historyForm = document.getElementById("interviewHistoryForm");
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
        details.textContent = "Your changes could not be saved. Check browser storage and try again.";
        return false;
    }
}

function renderHistory() {
    historyContainer.innerHTML = "";
    const history = document.createElement("p");
    history.classList.add("interview-history-text");
    history.textContent = application.interviewHistory || "No interview history added.";
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
    const startingStageIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
    statusSelect.replaceChildren();
    const availableStatuses = terminalStatuses.includes(application.status)
        ? [application.status]
        : statusStages.slice(startingStageIndex);
    availableStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
    });
    statusSelect.value = statusStages[startingStageIndex];
    statusForm.hidden = false;
    historySection.hidden = false;
    renderHistory();

    statusForm.addEventListener("submit", event => {
        event.preventDefault();
        const selectedStageIndex = statusStages.indexOf(statusSelect.value);
        const savedStageIndex = statusStages.indexOf(application.status);
        const cannotChangeTerminalOutcome = terminalStatuses.includes(application.status)
            && statusSelect.value !== application.status;
        if (selectedStageIndex < Math.max(savedStageIndex, 0) || cannotChangeTerminalOutcome) {
            statusSelect.setCustomValidity("You cannot move an application to an earlier stage.");
            statusSelect.reportValidity();
            return;
        }
        statusSelect.setCustomValidity("");
        application.status = statusSelect.value;
        if (saveApplicationChanges()) {
            window.location.reload();
        }
    });

    historyForm.addEventListener("submit", event => {
        event.preventDefault();
        const notes = document.getElementById("interviewNotes").value.trim();
        if (!notes) {
            return;
        }

        const entry = `${new Date().toLocaleDateString()}: ${notes}`;
        application.interviewHistory = application.interviewHistory
            ? `${application.interviewHistory}\n\n${entry}`
            : entry;

        if (saveApplicationChanges()) {
            renderHistory();
            historyForm.reset();
        }
    });
} else if (!details.textContent) {
    details.textContent = "Application not found. It may have been deleted.";
}
