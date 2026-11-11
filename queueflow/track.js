document.addEventListener("DOMContentLoaded", () => {
  const db = window.queueflowClient;
  const form = document.querySelector("#track-form");
  const input = document.querySelector("#tracking-code");
  const message = document.querySelector("#track-message");
  const result = document.querySelector("#ticket-result");
  const params = new URLSearchParams(location.search);
  if (params.has("code")) input.value = params.get("code");

  async function lookup(code) {
    message.textContent = "Checking your queue…";
    const { data, error } = await db.rpc("get_queue_status", { p_tracking_code: code });
    if (error) { message.textContent = error.message; return; }
    const ticket = data?.[0];
    if (!ticket) { result.classList.add("hidden"); message.textContent = "No ticket found. Check the tracking code and try again."; return; }
    message.textContent = "";
    result.classList.remove("hidden");
    const statusLabels = { waiting: "Waiting", serving: "Now serving", served: "Completed", skipped: "Skipped", cancelled: "Cancelled" };
    result.innerHTML = `
      <div class="eyebrow">${escapeHtml(ticket.business_name)}</div><h2>${escapeHtml(ticket.service_name)}</h2>
      <div class="ticket-number">${escapeHtml(ticket.ticket_number)}</div>
      <span class="status-pill">${statusLabels[ticket.status] || ticket.status}</span>
      <div class="track-stats"><div><strong>${ticket.status === "waiting" ? ticket.queue_position : "—"}</strong><span>Position in line</span></div>
      <div><strong>${ticket.status === "waiting" ? ticket.estimated_wait_minutes + " min" : "—"}</strong><span>Estimated wait</span></div></div>
      <p class="muted">Ticket for ${escapeHtml(ticket.customer_name)}. This page refreshes automatically.</p>`;
  }
  form.addEventListener("submit", event => { event.preventDefault(); lookup(input.value.trim()); });
  if (input.value) lookup(input.value.trim());
  setInterval(() => { if (input.value.trim()) lookup(input.value.trim()); }, 12000);
});
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}