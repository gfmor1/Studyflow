const express = require("express");
const router = express.Router();
const { run, all, get } = require("../db/db");

const DEMO_USER_ID = 1;

router.get("/", async (_req, res) => {
  try {
    const courses = await all(
      `SELECT id, name, weekly_hours_available, created_at
       FROM courses
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [DEMO_USER_ID]
    );
    res.json({ courses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const weekly_hours_available = Number(req.body?.weekly_hours_available ?? 10);

  if (!name) return res.status(400).json({ error: "Course name is required." });
  if (!(weekly_hours_available > 0)) {
    return res.status(400).json({ error: "weekly_hours_available must be > 0." });
  }

  try {
    const r = await run(
      `INSERT INTO courses (user_id, name, weekly_hours_available)
       VALUES (?, ?, ?)`,
      [DEMO_USER_ID, name, weekly_hours_available]
    );

    const course = await get(
      `SELECT id, name, weekly_hours_available, created_at
       FROM courses
       WHERE id = ?`,
      [r.lastID]
    );

    res.status(201).json({ course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }

});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  const weekly_hours_available = Number(req.body?.weekly_hours_available);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid course id." });
  }

  if (!name) {
    return res.status(400).json({ error: "Course name is required." });
  }

  if (!(weekly_hours_available > 0)) {
    return res.status(400).json({ error: "weekly_hours_available must be > 0." });
  }

  try {
    const existing = await get(
      `SELECT id FROM courses WHERE id = ? AND user_id = ?`,
      [id, DEMO_USER_ID]
    );

    if (!existing) {
      return res.status(404).json({ error: "course not found." });
    }

    await run(
      `UPDATE courses
       SET name = ?, weekly_hours_available = ?
       WHERE id = ? AND user_id = ?`,
      [name, weekly_hours_available, id, DEMO_USER_ID]
    );

    const course = await get(
      `SELECT id, name, weekly_hours_available, created_at
       FROM courses
       WHERE id = ? AND user_id = ?`,
      [id, DEMO_USER_ID]
    );

    res.json({ course });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid course id." });
  }

  try {
    const existing = await get(
      `SELECT id FROM courses WHERE id = ? AND user_id = ?`,
      [id, DEMO_USER_ID]
    );

    if (!existing) {
      return res.status(404).json({ error: "course not found." });
    }

    await run(
      `DELETE FROM study_blocks
       WHERE task_id IN (
         SELECT t.id
         FROM tasks t
         WHERE t.course_id = ?
       )`,
      [id]
    );

    await run(
      `DELETE FROM tasks
       WHERE course_id = ?`,
      [id]
    );

    const r = await run(
      `DELETE FROM courses
       WHERE id = ? AND user_id = ?`,
      [id, DEMO_USER_ID]
    );

    res.json({ deleted: r.changes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

