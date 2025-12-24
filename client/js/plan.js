markActiveNav();

const content = document.getElementById("content");
const msg = document.getElementById("msg");

function render(plan) {
  content.innerHTML = "";

  const top = document.createElement("div");
  top.className = "item";
  top.innerHTML = `<div class="title">Total planned hours: ${plan.week_total_hours}</div>`;
  content.appendChild(top);

  for (const c of plan.courses) {
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
      <div class="title">${c.courseName}</div>
      <div class="meta">Budget ${c.hoursBudget}h · Used ${c.hoursUsed}h · Remaining ${c.remainingHours}h</div>
      <div class="list" style="margin-top:10px;" id="tasks-${c.courseId}"></div>
    `;
    content.appendChild(card);

    const list = card.querySelector(`#tasks-${c.courseId}`);
    if (!c.selectedTasks.length) {
      const empty = document.createElement("div");
      empty.className = "small";
      empty.textContent = "No todo tasks selected.";
      list.appendChild(empty);
      continue;
    }

    for (const t of c.selectedTasks) {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="title">${t.title} <span class="badge todo">todo</span></div>
        <div class="meta">Due ${fmtLocal(t.deadline)} · Est ${t.estimated_hours}h · Alloc ${t.allocated_hours}h · Priority ${t.priority}</div>
      `;
      list.appendChild(it);
    }
  }
}

async function load() {
  msg.textContent = "";
  const plan = await api("/api/plan/week");
  render(plan);
}

document.getElementById("reload").addEventListener("click", () =>
  load().catch(e => msg.textContent = e.message)
);

load().catch(e => msg.textContent = e.message);
