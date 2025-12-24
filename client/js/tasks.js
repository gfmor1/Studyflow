markActiveNav();

const courseSel = document.getElementById("course");
const filterSel = document.getElementById("filterCourse");
const list = document.getElementById("list");
const msg = document.getElementById("msg");

async function loadCoursesInto(select, includeAll) {
  const data = await api("/api/courses");
  select.innerHTML = "";

  if (includeAll) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "All courses";
    select.appendChild(opt);
  }

  for (const c of data.courses) {
    const opt = document.createElement("option");
    opt.value = String(c.id);
    opt.textContent = c.name; // no id shown
    select.appendChild(opt);
  }
}

function badge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

async function loadTasks() {
  msg.textContent = "";
  const course_id = filterSel.value ? Number(filterSel.value) : null;
  const url = course_id ? `/api/tasks?course_id=${course_id}` : "/api/tasks";
  const data = await api(url);

  list.innerHTML = "";
  for (const t of data.tasks) {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="title">${t.title} ${badge(t.status)}</div>
          <div class="meta">
            ${t.course_name} · due ${fmtLocal(t.deadline)} · est ${t.estimated_hours}h · priority ${t.priority}
          </div>
        </div>
        <div class="row" style="flex: 0 0 auto;">
          <button class="ok" data-action="toggle" data-id="${t.id}" data-status="${t.status}">
            ${t.status === "done" ? "Mark todo" : "Mark done"}
          </button>
          <button class="danger" data-action="delete" data-id="${t.id}">Delete</button>
        </div>
      </div>
    `;

    list.appendChild(div);
  }
}

document.getElementById("addBtn").addEventListener("click", async () => {
  msg.textContent = "";

  const course_id = Number(courseSel.value);
  const title = document.getElementById("title").value.trim();
  const deadlineLocal = document.getElementById("deadline").value;
  const deadline = toISOFromDatetimeLocal(deadlineLocal);
  const estimated_hours = Number(document.getElementById("hours").value);
  const priority = Number(document.getElementById("priority").value);

  if (!title) { msg.textContent = "Title required."; return; }
  if (!deadline) { msg.textContent = "Pick a valid deadline."; return; }

  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ course_id, title, deadline, estimated_hours, priority })
    });
    document.getElementById("title").value = "";
    await loadTasks();
    msg.textContent = "Added.";
  } catch (e) {
    msg.textContent = "Error: " + e.message;
  }
});

document.getElementById("reloadBtn").addEventListener("click", loadTasks);
filterSel.addEventListener("change", loadTasks);

list.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  try {
    if (action === "delete") {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
    } else if (action === "toggle") {
      const cur = btn.dataset.status;
      const next = cur === "done" ? "todo" : "done";
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next })
      });
    }
    await loadTasks();
  } catch (err) {
    msg.textContent = "Error: " + err.message;
  }
});

(async function init() {
  await loadCoursesInto(courseSel, false);
  await loadCoursesInto(filterSel, true);
  await loadTasks();
})().catch(e => msg.textContent = "Error: " + e.message);
