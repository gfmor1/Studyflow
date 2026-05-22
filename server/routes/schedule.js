const express = require("express");
const router = express.Router();
const { run, all } = require("../db/db");
const { generateScheduleBlocks } = require("../services/scheduler");

// POST /api/schedule/generate
router.post("/generate", async (req, res) => {
  const user_id = 1;

  try {
    const tasks = await all(
      `SELECT t.id, t.title, t.deadline, t.estimated_hours, t.priority, t.status
       FROM tasks t
       JOIN courses c ON c.id = t.course_id
       WHERE c.user_id = ? AND t.status = 'todo'
       ORDER BY datetime(t.deadline) ASC, t.priority DESC`,
      [user_id]
    );

    await run(
      `DELETE FROM study_blocks
       WHERE task_id IN (
         SELECT t.id FROM tasks t
         JOIN courses c ON c.id = t.course_id
         WHERE c.user_id = ?
       )`,
      [user_id]
    );

    const blocks = generateScheduleBlocks(tasks, req.body || {});

    for (const block of blocks) {
      await run(
        `INSERT INTO study_blocks (task_id, start_time, end_time)
         VALUES (?, ?, ?)`,
        [block.task_id, block.start_time, block.end_time]
      );
    }

    res.json({
      status: "schedule generated",
      blocks_created: blocks.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/schedule
router.get("/", async (_req, res) => {
  try {
    const blocks = await all(
      `SELECT sb.id, sb.start_time, sb.end_time,
              t.title, t.id AS task_id
       FROM study_blocks sb
       JOIN tasks t ON t.id = sb.task_id
       JOIN courses c ON c.id = t.course_id
       WHERE c.user_id = ?
       ORDER BY datetime(sb.start_time) ASC`,
      [1]
    );

    res.json({ blocks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;