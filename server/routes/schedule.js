const express = require("express");
const router = express.Router();
const { run, all } = require("../db/db");

// Helpers
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function dayKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function maxDate(a, b) {
  return a > b ? a : b;
}

// POST /api/schedule/generate
router.post("/generate", async (req, res) => {
  const user_id = 1;

  let {
    block_minutes = 60,
    day_start_hour = 17,
    max_hours_per_day = 2.5,
    lookback_days = 30
  } = req.body || {};

  block_minutes = clamp(Number(block_minutes) || 60, 30, 120);
  day_start_hour = clamp(Number(day_start_hour) || 17, 0, 23);
  max_hours_per_day = clamp(Number(max_hours_per_day) || 2.5, 0.5, 12);
  lookback_days = clamp(Number(lookback_days) || 30, 7, 365);

  try {
    const tasks = await all(
      `SELECT t.id, t.title, t.deadline, t.estimated_hours, t.priority
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

    const now = new Date();
    const today = startOfDay(now);
    const dayUsage = new Map(); // "YYYY-MM-DD" -> used minutes
    const maxMinutesPerDay = Math.floor(max_hours_per_day * 60);

    for (const task of tasks) {
      const deadline = new Date(task.deadline);

      if (Number.isNaN(deadline.getTime())) {
        continue;
      }

      if (deadline <= now) {
        continue;
      }

      let remainingMinutes = Math.round(Number(task.estimated_hours) * 60);

      if (remainingMinutes <= 0) {
        continue;
      }

      let cursor = startOfDay(deadline);
      const earliestByLookback = startOfDay(addDays(deadline, -lookback_days));
      const earliest = maxDate(today, earliestByLookback);

      while (remainingMinutes > 0 && cursor >= earliest) {
        const key = dayKey(cursor);
        let usedMinutes = dayUsage.get(key) || 0;
        let availableMinutes = maxMinutesPerDay - usedMinutes;

        if (availableMinutes <= 0) {
          cursor = addDays(cursor, -1);
          continue;
        }

        while (remainingMinutes > 0 && availableMinutes > 0) {
          let start = new Date(cursor);
          start.setHours(day_start_hour, 0, 0, 0);
          start.setMinutes(start.getMinutes() + usedMinutes);

          if (start < now) {
            break;
          }

          let minutes = Math.min(
            block_minutes,
            remainingMinutes,
            availableMinutes
          );

          let end = new Date(start);
          end.setMinutes(end.getMinutes() + minutes);

          if (end > deadline) {
            minutes = Math.floor((deadline - start) / 60000);

            if (minutes <= 0) {
              break;
            }

            end = new Date(start);
            end.setMinutes(end.getMinutes() + minutes);
          }

          await run(
            `INSERT INTO study_blocks (task_id, start_time, end_time)
             VALUES (?, ?, ?)`,
            [task.id, start.toISOString(), end.toISOString()]
          );

          remainingMinutes -= minutes;

          usedMinutes += minutes;
          dayUsage.set(key, usedMinutes);

          availableMinutes = maxMinutesPerDay - usedMinutes;
        }

        cursor = addDays(cursor, -1);
      }
    }

    res.json({ status: "schedule generated" });
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