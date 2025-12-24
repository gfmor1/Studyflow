const express = require("express");
const router = express.Router();
const { all } = require("../db/db");

const DEMO_USER_ID = 1;

router.get("/week", async (_req, res) => {
  try {
    const courses = await all(
      `SELECT id, name, weekly_hours_available
       FROM courses
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [DEMO_USER_ID]
    );

    let week_total_hours = 0;
    const result = [];

    for (const c of courses) {
      const budget = Number(c.weekly_hours_available) || 0;
      let remaining = budget;

      const tasks = await all(
        `SELECT t.id, t.title, t.deadline, t.estimated_hours, t.priority
         FROM tasks t
         JOIN courses c ON c.id = t.course_id
         WHERE t.course_id = ? AND c.user_id = ? AND t.status = 'todo'
         ORDER BY t.priority DESC, datetime(t.deadline) ASC`,
        [c.id, DEMO_USER_ID]
      );

      const selectedTasks = [];
      let used = 0;

      for (const t of tasks) {
        if (remaining <= 0) break;

        const est = Number(t.estimated_hours) || 0;
        const allocated = est <= remaining ? est : remaining;

        selectedTasks.push({ ...t, allocated_hours: allocated });

        remaining -= allocated;
        used += allocated;
      }

      result.push({
        courseId: c.id,
        courseName: c.name,
        hoursBudget: budget,
        hoursUsed: used,
        remainingHours: budget - used,
        selectedTasks
      });

      week_total_hours += used;
    }

    res.json({ week_total_hours, courses: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
