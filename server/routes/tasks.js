const express = require("express");
const router = express.Router();
const { run, all, get } = require("../db/db");

const DEMO_USER_ID = 1;

// GET /api/tasks?course_id=1
router.get("/", async (req, res) => {
  const course_id = req.query.course_id ? Number(req.query.course_id) : null;

  if (req.query.course_id && (!Number.isFinite(course_id) || course_id <= 0)) {
    return res.status(400).json({ error: "Invalid course_id." });
  }

  try {
    const params = [DEMO_USER_ID];
    let where = `WHERE c.user_id = ?`;

    if (course_id) {
      where += ` AND t.course_id = ?`;
      params.push(course_id);
    }

    const tasks = await all(
      `SELECT t.id, t.user_id, t.course_id, t.title, t.deadline, t.estimated_hours, t.priority, t.status, t.created_at,
              c.name AS course_name
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       ${where}
       ORDER BY datetime(t.deadline) ASC`,
      params
    );

    res.json({ tasks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  const course_id = Number(req.body?.course_id);
  const title = String(req.body?.title || "").trim();
  const deadline = String(req.body?.deadline || "").trim();
  const estimated_hours = Number(req.body?.estimated_hours);
  const priority = Number(req.body?.priority ?? 3);

  if (!Number.isFinite(course_id) || course_id <= 0) {
    return res.status(400).json({ error: "course_id is required." });
  }
  if (!title) {
    return res.status(400).json({ error: "title is required." });
  }

  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) {
    return res.status(400).json({ error: "deadline must be a valid ISO datetime." });
  }

  if (!(estimated_hours > 0)) {
    return res.status(400).json({ error: "estimated_hours must be > 0." });
  }
  if (!(priority >= 1 && priority <= 5)) {
    return res.status(400).json({ error: "priority must be 1..5." });
  }

  try {
    const course = await get(
      `SELECT id
       FROM courses
       WHERE id = ? AND user_id = ?`,
      [course_id, DEMO_USER_ID]
    );

    if (!course) {
      return res.status(404).json({ error: "course not found for this user." });
    }

    const r = await run(
      `INSERT INTO tasks (user_id, course_id, title, deadline, estimated_hours, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'todo')`,
      [DEMO_USER_ID, course_id, title, d.toISOString(), estimated_hours, priority]
    );

    const task = await get(
      `SELECT t.id, t.user_id, t.course_id, t.title, t.deadline, t.estimated_hours, t.priority, t.status, t.created_at,
              c.name AS course_name
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE t.id = ? AND c.user_id = ?`,
      [r.lastID, DEMO_USER_ID]
    );

    res.status(201).json({ task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid task id." });
  }

  if (status !== "todo" && status !== "done") {
    return res.status(400).json({ error: "status must be todo or done." });
  }

  try {
    const existing = await get(
      `SELECT t.id
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE t.id = ? AND c.user_id = ?`,
      [id, DEMO_USER_ID]
    );

    if (!existing) {
      return res.status(404).json({ error: "task not found." });
    }

    await run(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);

    const task = await get(
      `SELECT t.id, t.user_id, t.course_id, t.title, t.deadline, t.estimated_hours, t.priority, t.status, t.created_at,
              c.name AS course_name
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE t.id = ? AND c.user_id = ?`,
      [id, DEMO_USER_ID]
    );

    res.json({ task });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid task id." });
  }

  try {
    const existing = await get(
      `SELECT t.id
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE t.id = ? AND c.user_id = ?`,
      [id, DEMO_USER_ID]
    );

    if (!existing) {
      return res.status(404).json({ error: "task not found." });
    }

    const r = await run(`DELETE FROM tasks WHERE id = ?`, [id]);
    res.json({ deleted: r.changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;