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
    opt.textContent = c.name;
    select.appendChild(opt);
  }
}

function badge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

const PRIORITY_LABELS = { 1: "Low", 2: "Medium-Low", 3: "Medium", 4: "High", 5: "Critical" };

async function loadTasks() {
  msg.textContent = "";
  const course_id = filterSel.value ? Number(filterSel.value) : null;
  const url = course_id ? `/api/tasks?course_id=${course_id}` : "/api/tasks";
  const data = await api(url);

  list.innerHTML = "";

  if (!data.tasks.length) {
    list.innerHTML = '<div class="small" style="padding:8px 0;">No tasks found.</div>';
    return;
  }

  for (const t of data.tasks) {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.priority = t.priority;

    div.innerHTML = `
      <div class="row" style="justify-content: space-between; margin-bottom: 0; flex-wrap: nowrap; gap: 8px;">
        <div style="min-width: 0;">
          <div class="title">${t.title} ${badge(t.status)}</div>
          <div class="meta">
            ${t.course_name} &middot; due ${fmtLocal(t.deadline)} &middot; ${t.estimated_hours}h est. &middot; P${t.priority} ${PRIORITY_LABELS[t.priority] || ""}
          </div>
        </div>
        <div class="row" style="flex: 0 0 auto; margin-bottom: 0; gap: 6px; flex-wrap: nowrap;">
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
    msg.textContent = "Task added.";
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