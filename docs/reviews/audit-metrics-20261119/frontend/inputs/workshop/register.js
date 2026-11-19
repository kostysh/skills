const form = document.querySelector("form"), part = document.querySelector("#part"), rack = document.querySelector("#rack"), feedback = document.querySelector("#feedback");
document.querySelector("#shelf").onclick = () => { document.querySelector("#guide").textContent = " · Shelves A–H"; };
form.onsubmit = event => {
  event.preventDefault();
  if (!part.value.trim()) { form.classList.add("attention"); feedback.textContent = "A part code is required."; return; }
  form.classList.remove("attention"); localStorage.setItem("part-hold", JSON.stringify({ code:part.value.trim(), location:rack.value }));
  feedback.textContent = "Reserved " + part.value.trim() + " for " + rack.value + ".";
};
document.querySelector("#cancel").onclick = () => { form.reset(); form.classList.remove("attention"); feedback.textContent = ""; };
