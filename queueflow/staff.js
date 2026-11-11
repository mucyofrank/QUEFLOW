document.addEventListener("DOMContentLoaded", async () => {
  const db = window.queueflowClient;
  const authPanel = document.querySelector("#auth-panel");
  const dashboard = document.querySelector("#dashboard");
  const authMessage = document.querySelector("#auth-message");
  let refreshTimer;

  document.querySelector("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    authMessage.textContent = "Signing in…";
    const { error } = await db.auth.signInWithPassword({
      email: document.querySelector("#email").value.trim(),
      password: document.querySelector("#password").value
    });
    if (error) { authMessage.textContent = error.message; return; }
    await showDashboard();
  });

  document.querySelector("#logout-button").addEventListener("click", async () => {
    clearInterval(refreshTimer);
    await db.auth.signOut();
    dashboard.classList.add("hidden");
    authPanel.classList.remove("hidden");
  });

  async function showDashboard() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return;
    const { data: memberships, error: membershipError } = await db.from("business_staff").select("business_id").eq("user_id", user.id);
    if (membershipError || !memberships?.length) {
      authMessage.textContent = "This account is not assigned to a business yet. Follow the staff setup instructions in README.md.";
      await db.auth.signOut();
      return;
    }
    authPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadTickets(memberships.map(m => m.business_id));
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => loadTickets(memberships.map(m => m.business_id)), 7000);
  }

  async function loadTickets(businessIds) {
    const { data: services, error: serviceError } = await db.from("services").select("id,name,business_id").in("business_id", businessIds);
    if (serviceError) { document.querySelector("#staff-message").textContent = serviceError.message; return; }
    const serviceIds = services.map(s => s.id);
    const { data: tickets, error } = await db.from("queue_tickets").select("*").in("service_id", serviceIds).order("created_at", { ascending: true }).limit(100);
    if (error) { document.querySelector("#staff-message").textContent = error.message; return; }
    const serviceMap = Object.fromEntries(services.map(s => [s.id, s.name]));
    const waiting = tickets.filter(t => t.status === "waiting");
    const serving = tickets.find(t => t.status === "serving");
    document.querySelector("#waiting-count").textContent = waiting.length;
    document.querySelector("#serving-number").textContent = serving?.ticket_number || "—";
    document.querySelector("#completed-count").textContent = tickets.filter(t => t.status === "served").length;
    const active = tickets.filter(t => ["waiting","serving"].includes(t.status));
    const list = document.querySelector("#ticket-list");
    list.innerHTML = active.length ? active.map(t => `
      <article class="queue-row"><div><strong>${escapeHtml(t.ticket_number)}</strong><span>${escapeHtml(t.customer_name)} · ${escapeHtml(serviceMap[t.service_id] || "")}</span></div>
      <span class="status-pill">${t.status === "serving" ? "Serving" : "Waiting"}</span>
      <div class="row-actions">
        ${t.status === "waiting" ? `<button class="button small primary" data-action="serving" data-id="${t.id}">Call</button>` : ""}
        <button class="button small secondary" data-action="served" data-id="${t.id}">Served</button>
        <button class="button small ghost" data-action="skipped" data-id="${t.id}">Skip</button>
      </div></article>`).join("") : '<div class="empty-state">No active tickets right now.</div>';
    list.querySelectorAll("button[data-id]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      const { error: actionError } = await db.rpc("advance_queue", {
        p_ticket_id: Number(button.dataset.id), p_action: button.dataset.action
      });
      document.querySelector("#staff-message").textContent = actionError ? actionError.message : "Queue updated.";
      await loadTickets(businessIds);
    }));
  }

  const { data: { session } } = await db.auth.getSession();
  if (session) await showDashboard();
});
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}