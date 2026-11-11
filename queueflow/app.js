document.addEventListener("DOMContentLoaded", async () => {
  const db = window.queueflowClient;
  const serviceSelect = document.querySelector("#service-select");
  const form = document.querySelector("#join-form");
  const message = document.querySelector("#join-message");
  const button = document.querySelector("#join-button");

  const { data: businesses, error: businessError } = await db.from("businesses").select("id,name").eq("slug", "demo-center").limit(1);
  if (businessError || !businesses?.length) {
    serviceSelect.innerHTML = '<option value="">Services unavailable</option>';
    message.textContent = "Could not load the demo center. Check the project setup.";
    return;
  }
  const { data: services, error } = await db.from("services").select("id,name,average_minutes").eq("business_id", businesses[0].id).eq("is_active", true).order("name");
  if (error) {
    message.textContent = error.message;
    return;
  }
  serviceSelect.innerHTML = '<option value="">Select a service</option>' + services.map(s => `<option value="${s.id}">${escapeHtml(s.name)} · about ${s.average_minutes} min/customer</option>`).join("");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    button.disabled = true;
    message.textContent = "Creating your ticket…";
    const name = document.querySelector("#customer-name").value.trim();
    const serviceId = serviceSelect.value;
    const { data, error: createError } = await db.rpc("create_queue_ticket", {
      p_service_id: serviceId,
      p_customer_name: name
    });
    button.disabled = false;
    if (createError) {
      message.textContent = createError.message;
      return;
    }
    const ticket = data?.[0];
    if (!ticket) {
      message.textContent = "Ticket could not be created. Please try again.";
      return;
    }
    const url = new URL("track.html", window.location.href);
    url.searchParams.set("code", ticket.tracking_code);
    document.querySelector(".join-panel").innerHTML = `
      <div class="success-icon">✓</div><div class="eyebrow">YOU'RE IN THE QUEUE</div>
      <h2 class="ticket-number">${escapeHtml(ticket.ticket_number)}</h2>
      <p class="muted">Keep this tracking code to check your place in line.</p>
      <div class="tracking-code">${escapeHtml(ticket.tracking_code)}</div>
      <div id="ticket-qr" class="qr-box"></div>
      <a class="button primary full button-link" href="${url.href}">Track your ticket →</a>
      <button class="button secondary full" id="copy-code">Copy tracking code</button>`;
    if (window.QRCode) new QRCode(document.querySelector("#ticket-qr"), { text: url.href, width: 144, height: 144 });
    document.querySelector("#copy-code").addEventListener("click", async () => {
      await navigator.clipboard.writeText(ticket.tracking_code);
      document.querySelector("#copy-code").textContent = "Copied";
    });
  });
});
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}