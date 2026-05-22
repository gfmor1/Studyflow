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

function generateScheduleBlocks(tasks, options = {}, now = new Date()) {
  let {
    block_minutes = 60,
    day_start_hour = 17,
    max_hours_per_day = 2.5,
    lookback_days = 30
  } = options;

  block_minutes = clamp(Number(block_minutes) || 60, 30, 120);
  day_start_hour = clamp(Number(day_start_hour) || 17, 0, 23);
  max_hours_per_day = clamp(Number(max_hours_per_day) || 2.5, 0.5, 12);
  lookback_days = clamp(Number(lookback_days) || 30, 7, 365);

  const blocks = [];
  const today = startOfDay(now);
  const dayUsage = new Map();
  const maxMinutesPerDay = Math.floor(max_hours_per_day * 60);

  const sortedTasks = [...tasks].sort((a, b) => {
    const deadlineA = new Date(a.deadline);
    const deadlineB = new Date(b.deadline);

    if (deadlineA.getTime() !== deadlineB.getTime()) {
      return deadlineA - deadlineB;
    }

    return Number(b.priority || 0) - Number(a.priority || 0);
  });

  for (const task of sortedTasks) {
    if (task.status && task.status !== "todo") {
      continue;
    }

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
        const start = new Date(cursor);
        start.setHours(day_start_hour, 0, 0, 0);
        start.setMinutes(start.getMinutes() + usedMinutes);

        if (start < now) {
          break;
        }

        let minutes = Math.min(block_minutes, remainingMinutes, availableMinutes);

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

        blocks.push({
          task_id: task.id,
          start_time: start.toISOString(),
          end_time: end.toISOString()
        });

        remainingMinutes -= minutes;
        usedMinutes += minutes;
        dayUsage.set(key, usedMinutes);

        availableMinutes = maxMinutesPerDay - usedMinutes;
      }

      cursor = addDays(cursor, -1);
    }
  }

  return blocks;
}

module.exports = {
  generateScheduleBlocks,
  clamp
};