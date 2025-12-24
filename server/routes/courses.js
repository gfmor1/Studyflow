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

module.exports = router;

