const { generateScheduleBlocks, clamp } = require("./scheduler");

function getHours(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end - start) / 1000 / 60 / 60;
}

function getDayKey(dateString) {
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

describe("generateScheduleBlocks", () => {
  test("generates schedule blocks before the deadline", () => {
    const tasks = [
      {
        id: 1,
        title: "Study math",
        deadline: "2026-09-20T23:59:00.000Z",
        estimated_hours: 2,
        priority: 3,
        status: "todo"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    expect(blocks.length).toBeGreaterThan(0);

    for (const block of blocks) {
     expect(new Date(block.end_time).getTime()).toBeLessThanOrEqual(
  new Date("2026-09-20T23:59:00.000Z").getTime()
);
    }
  });

  test("does not schedule done tasks", () => {
    const tasks = [
      {
        id: 1,
        title: "Already finished",
        deadline: "2026-09-20T23:59:00.000Z",
        estimated_hours: 2,
        priority: 3,
        status: "done"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    expect(blocks).toHaveLength(0);
  });

  test("ignores tasks with past deadlines", () => {
    const tasks = [
      {
        id: 1,
        title: "Old task",
        deadline: "2026-09-10T23:59:00.000Z",
        estimated_hours: 2,
        priority: 3,
        status: "todo"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    expect(blocks).toHaveLength(0);
  });

  test("does not exceed max hours per day", () => {
    const tasks = [
      {
        id: 1,
        title: "Study physics",
        deadline: "2026-09-20T23:59:00.000Z",
        estimated_hours: 6,
        priority: 5,
        status: "todo"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    const hoursByDay = {};

    for (const block of blocks) {
      const day = getDayKey(block.start_time);
      const hours = getHours(block.start_time, block.end_time);
      hoursByDay[day] = (hoursByDay[day] || 0) + hours;
    }

    for (const hours of Object.values(hoursByDay)) {
      expect(hours).toBeLessThanOrEqual(2);
    }
  });

  test("splits large tasks into multiple blocks", () => {
    const tasks = [
      {
        id: 1,
        title: "Study algorithms",
        deadline: "2026-09-20T23:59:00.000Z",
        estimated_hours: 4,
        priority: 5,
        status: "todo"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    expect(blocks.length).toBeGreaterThan(1);
  });

  test("prioritizes earlier deadlines before later deadlines", () => {
    const tasks = [
      {
        id: 1,
        title: "Later task",
        deadline: "2026-09-25T23:59:00.000Z",
        estimated_hours: 1,
        priority: 5,
        status: "todo"
      },
      {
        id: 2,
        title: "Earlier task",
        deadline: "2026-09-18T23:59:00.000Z",
        estimated_hours: 1,
        priority: 1,
        status: "todo"
      }
    ];

    const blocks = generateScheduleBlocks(
      tasks,
      {
        block_minutes: 60,
        day_start_hour: 17,
        max_hours_per_day: 2,
        lookback_days: 7
      },
      new Date("2026-09-15T12:00:00.000Z")
    );

    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].task_id).toBe(2);
  });
});

describe("clamp", () => {
  test("keeps values inside a minimum and maximum range", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-1, 1, 10)).toBe(1);
    expect(clamp(20, 1, 10)).toBe(10);
  });
});