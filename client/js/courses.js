markActiveNav();

const list = document.getElementById("list");
const msg = document.getElementById("msg");

function showMessage(text) {
  msg.textContent = text;
}

function createButton(text, className, action, id) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = String(id);
  return button;
}

async function loadCourses() {
  const data = await api("/api/courses");

  list.textContent = "";

  if (data.courses.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.textContent = "No courses yet.";
    list.appendChild(empty);
    return;
  }

  for (const c of data.courses) {
    const div = document.createElement("div");
    div.className = "item";

    const row = document.createElement("div");
    row.className = "row";
    row.style.justifyContent = "space-between";

    const info = document.createElement("div");

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = c.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Weekly hours: ${c.weekly_hours_available} · id ${c.id}`;

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "row";
    actions.style.flex = "0 0 auto";

    const editBtn = createButton("Edit", "ok", "edit", c.id);
    editBtn.dataset.name = c.name;
    editBtn.dataset.hours = String(c.weekly_hours_available);

    const deleteBtn = createButton("Delete", "danger", "delete", c.id);
    deleteBtn.dataset.name = c.name;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(actions);
    div.appendChild(row);
    list.appendChild(div);
  }
}

document.getElementById("addBtn").addEventListener("click", async () => {
  showMessage("");

  const name = document.getElementById("name").value.trim();
  const weekly_hours_available = Number(document.getElementById("hours").value);

  try {
    await api("/api/courses", {
      method: "POST",
      body: JSON.stringify({ name, weekly_hours_available })
    });

    document.getElementById("name").value = "";
    await loadCourses();
    showMessage("Added.");
  } catch (e) {
    showMessage("Error: " + e.message);
  }
});

list.addEventListener("click", async (e) => {
  const button = e.target.closest("button");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  try {
    if (action === "edit") {
      const currentName = button.dataset.name;
      const currentHours = button.dataset.hours;

      const name = prompt("Edit course name:", currentName);
      if (name === null) {
        return;
      }

      const hoursInput = prompt("Edit weekly hours:", currentHours);
      if (hoursInput === null) {
        return;
      }

      const trimmedName = name.trim();
      const weekly_hours_available = Number(hoursInput);

      if (!trimmedName) {
        showMessage("Course name cannot be empty.");
        return;
      }

      if (!(weekly_hours_available > 0)) {
        showMessage("Weekly hours must be greater than 0.");
        return;
      }

      await api(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: trimmedName,
          weekly_hours_available
        })
      });

      await loadCourses();
      showMessage("Course updated.");
    }

    if (action === "delete") {
      const courseName = button.dataset.name;
      const confirmed = confirm(
        `Delete "${courseName}"? This will also remove its tasks and schedule blocks.`
      );

      if (!confirmed) {
        return;
      }

      await api(`/api/courses/${id}`, {
        method: "DELETE"
      });

      await loadCourses();
      showMessage("Course deleted.");
    }
  } catch (err) {
    showMessage("Error: " + err.message);
  }
});

loadCourses().catch((e) => {
  showMessage("Error: " + e.message);
});