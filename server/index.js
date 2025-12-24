const express = require("express");
const cors = require("cors");
const path = require("path");
const { init } = require("./db/db");

const coursesRouter = require("./routes/courses");
const tasksRouter = require("./routes/tasks");
const scheduleRouter = require("./routes/schedule");
const planRouter = require("./routes/plan");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/courses", coursesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/plan", planRouter);


app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

const PORT = 3000;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`StudyFlow running: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init failed:", err.message);
    process.exit(1);
  });
