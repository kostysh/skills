const form = document.querySelector("form");
const vessel = document.querySelector("#vessel");
const message = document.querySelector("#message");
document.querySelector("#office").onclick = () => { document.querySelector("#hours").textContent = "Open Monday to Friday, 08:00–17:00."; };
form.onsubmit = event => {
  event.preventDefault();
  const name = vessel.value.trim();
  if (!name) { form.dataset.status = "correction"; message.textContent = "Enter a vessel name."; return; }
  form.dataset.status = "saved";
  const slot = document.querySelector("#slot").value;
  localStorage.setItem("arrival", JSON.stringify({ name, slot }));
  message.textContent = "Arrival requested for " + name + " · " + slot + ".";
};
document.querySelector("#clear").onclick = () => { form.reset(); delete form.dataset.status; message.textContent = ""; };
