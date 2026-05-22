const express = require("express");
const router = express.Router();
const { run, all, get } = require("../db/db");

const DEMO_USER_ID = 1;

function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function isValidStatus(status) {
  return status === "todo" || status === "done";
}

// GET /api/tasks
// GET /api/tasks?course_id=1
router.get("/", async (req, res) => {
  const course_id = req.query.course_id ? Number(req.query.course_id) : null;

  try {
    let tasks;

    if (course_id) {
      tasks = await all(
        `SELECT t.id, t.course_id, t.title, t.deadline, t.estimated_hours,
                t.priority, t.status, t.created_at, c.name AS course_name
         FROM tasks t
         JOIN courses c ON c.id = t.course_id
         WHERE c.user_id = ? AND t.course_id = ?
         ORDER BY datetime(t.deadline) ASC, t.priority DESC`,
        [DEMO_USER_ID, course_id]
      );
    } else {
      tasks = await all(
        `SELECT t.id, t.course_id, t.title, t.deadline, t.estimated_hours,
                t.priority, t.status, t.created_at, c.name AS course_name
         FROM tasks t
         JOIN courses c ON c.id = t.course_id
         WHERE c.user_id = ?
         ORDER BY datetime(t.deadline) ASC, t.priority DESC`,
        [DEMO_USER_ID]
      );
    }

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
  const status = String(req.body?.status || "todo").trim();

  if (!Number.isFinite(course_id) || course_id <= 0) {
    return res.status(400).json({ error: "Valid course_id is required." });
  }

  if (!title) {
    return res.status(400).json({ error: "Task title is required." });
  }

  if (!deadline || !isValidDate(deadline)) {
    return res.status(400).json({ error: "Valid deadline is required." });
  }

  if (!(estimated_hours > 0)) {
    return res.status(400).json({ error: "estimated_hours must be > 0." });
  }

  if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
    return res.status(400).json({ error: "priority must be an integer from 1 to 5." });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({ error: "status must be todo or done." });
  }

  try {
    const course = await get(
      `SELECT id FROM courses WHERE id = ? AND user_id = ?`,
      [course_id, DEMO_USER_ID]
    );

    if (!course) {
      return res.status(404).json({ error: "course not found." });
    }

  const r = await run(
  `INSERT INTO tasks (user_id, course_id, title, deadline, estimated_hours, priority, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    DEMO_USER_ID,
    course_id,
    title,
    deadline,
    estimated_hours,
    priority,
    status
  ]
);

    const task = await get(
      `SELECT t.id, t.course_id, t.title, t.deadline, t.estimated_hours,
              t.priority, t.status, t.created_at, c.name AS course_name
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

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid task id." });
  }

  try {
    const existing = await get(
      `SELECT t.id, t.course_id, t.title, t.deadline, t.estimated_hours,
              t.priority, t.status
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE t.id = ? AND c.user_id = ?`,
      [id, DEMO_USER_ID]
    );

    if (!existing) {
      return res.status(404).json({ error: "task not found." });
    }

    const course_id =
      req.body?.course_id !== undefined
        ? Number(req.body.course_id)
        : existing.course_id;

    const title =
      req.body?.title !== undefined
        ? String(req.body.title).trim()
        : existing.title;

    const deadline =
      req.body?.deadline !== undefined
        ? String(req.body.deadline).trim()
        : existing.deadline;

    const estimated_hours =
      req.body?.estimated_hours !== undefined
        ? Number(req.body.estimated_hours)
        : existing.estimated_hours;

    const priority =
      req.body?.priority !== undefined
        ? Number(req.body.priority)
        : existing.priority;

    const status =
      req.body?.status !== undefined
        ? String(req.body.status).trim()
        : existing.status;

    if (!Number.isFinite(course_id) || course_id <= 0) {
      return res.status(400).json({ error: "Valid course_id is required." });
    }

    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    if (!deadline || !isValidDate(deadline)) {
      return res.status(400).json({ error: "Valid deadline is required." });
    }

    if (!(estimated_hours > 0)) {
      return res.status(400).json({ error: "estimated_hours must be > 0." });
    }

    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return res.status(400).json({ error: "priority must be an integer from 1 to 5." });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({ error: "status must be todo or done." });
    }

    const course = await get(
      `SELECT id FROM courses WHERE id = ? AND user_id = ?`,
      [course_id, DEMO_USER_ID]
    );

    if (!course) {
      return res.status(404).json({ error: "course not found." });
    }

    await run(
      `UPDATE tasks
       SET course_id = ?,
           title = ?,
           deadline = ?,
           estimated_hours = ?,
           priority = ?,
           status = ?
       WHERE id = ?`,
      [course_id, title, deadline, estimated_hours, priority, status, id]
    );

    await run(
      `DELETE FROM study_blocks
       WHERE task_id = ?`,
      [id]
    );

    const task = await get(
      `SELECT t.id, t.course_id, t.title, t.deadline, t.estimated_hours,
              t.priority, t.status, t.created_at, c.name AS course_name
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

    await run(
      `DELETE FROM study_blocks
       WHERE task_id = ?`,
      [id]
    );

    const r = await run(
      `DELETE FROM tasks
       WHERE id = ?`,
      [id]
    );

    res.json({ deleted: r.changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;