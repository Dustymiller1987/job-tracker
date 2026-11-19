const SUPABASE_URL = "https://jvaknxrwybfillklnedb.supabase.co";

const SUPABASE_KEY = "sb_publishable_f8fYmE5ZCoNY040UF48c3Q_KQvjxn5j";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getApplicationUpdateErrorMessage(error) {
    const message = error && typeof error.message === "string"
        ? error.message
        : "Unknown database error.";

    if (error && error.code === "42501") {
        return `${message}. Supabase needs UPDATE permission on public.applications, and row-level security must allow users to update only their own rows (auth.uid() = user_id).`;
    }

    return message;
}

async function updateApplicationStatus (applicationId, newStatus) {
    const { error } = await supabaseClient .from("applications") .update({ status: newStatus}) .eq("id", applicationId);
    if (error) { console.error("Status update failed:", error); return;}
    await loadApplications();
}
