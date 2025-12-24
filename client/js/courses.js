markActiveNav();

const list = document.getElementById("list");
const msg = document.getElementById("msg");

async function loadCourses() {
  const data = await api("/api/courses");
  list.innerHTML = "";
  for (const c of data.courses) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="title">${c.name}</div>
      <div class="meta">Weekly hours: ${c.weekly_hours_available} · id ${c.id}</div>
    `;
    list.appendChild(div);
  }
}

document.getElementById("addBtn").addEventListener("click", async () => {
  msg.textContent = "";
  const name = document.getElementById("name").value.trim();
  const weekly_hours_available = Number(document.getElementById("hours").value);

  try {
    await api("/api/courses", {
      method: "POST",
      body: JSON.stringify({ name, weekly_hours_available })
    });
    document.getElementById("name").value = "";
    await loadCourses();
    msg.textContent = "Added.";
  } catch (e) {
    msg.textContent = "Error: " + e.message;
  }
});

loadCourses().catch(e => msg.textContent = "Error: " + e.message);
