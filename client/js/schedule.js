markActiveNav();

const list = document.getElementById("list");
const msg = document.getElementById("msg");

function groupByDate(blocks) {
  const m = new Map();
  for (const b of blocks) {
    const d = new Date(b.start_time);
    const key = Number.isNaN(d.getTime()) ? "Unknown date" : d.toLocaleDateString();
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(b);
  }
  return m;
}

function render(blocks) {
  list.innerHTML = "";
  if (!blocks.length) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.textContent = "No blocks yet. Create a future todo task and click Generate.";
    list.appendChild(empty);
    return;
  }

  const grouped = groupByDate(blocks);
  for (const [day, items] of grouped.entries()) {
    const section = document.createElement("div");
    section.className = "item";
    section.innerHTML = `<div class="title">${day}</div>`;

    const inner = document.createElement("div");
    inner.className = "list";
    inner.style.marginTop = "10px";

    for (const b of items) {
      const it = document.createElement("div");
      it.className = "item";
      it.innerHTML = `
        <div class="title">${b.title}</div>
        <div class="meta">${fmtLocal(b.start_time)} → ${fmtLocal(b.end_time)}</div>
      `;
      inner.appendChild(it);
    }

    section.appendChild(inner);
    list.appendChild(section);
  }
}

async function load() {
  msg.textContent = "";
  const data = await api("/api/schedule");
  render(data.blocks);
}

document.getElementById("gen").addEventListener("click", async () => {
  msg.textContent = "";
  try {
    await api("/api/schedule/generate", { method: "POST", body: JSON.stringify({}) });
    await load();
    msg.textContent = "Generated.";
  } catch (e) {
    msg.textContent = "Error: " + e.message;
  }
});

document.getElementById("reload").addEventListener("click", () =>
  load().catch(e => msg.textContent = e.message)
);

load().catch(e => msg.textContent = e.message);
