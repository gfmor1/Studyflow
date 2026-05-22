# StudyFlow

StudyFlow is a full-stack study planner that helps students manage courses, tasks, weekly study plans, and deadline-aware study blocks.

The app allows users to create courses, add tasks with deadlines and estimated effort, generate study schedules, and track task progress. The backend uses Express and SQLite, while the frontend is built with HTML, CSS, and vanilla JavaScript.

## Features

- Create, view, update, and delete courses
- Add tasks with deadlines, estimated hours, priority, and status
- Filter tasks by course
- Mark tasks as todo or done
- Delete tasks and related schedule blocks
- Generate deadline-aware study blocks
- Limit scheduled study time per day
- Split large tasks into multiple study blocks
- View weekly study plans
- View dashboard statistics for courses and tasks

## Tech Stack

- Backend: Node.js, Express
- Database: SQLite
- Frontend: HTML, CSS, JavaScript
- Testing: Jest
- Tools: Git, GitHub, VS Code

## Project Structure

```text
StudyFlow/
├── client/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── courses.js
│   │   ├── tasks.js
│   │   ├── plan.js
│   │   └── schedule.js
│   ├── index.html
│   ├── courses.html
│   ├── tasks.html
│   ├── plan.html
│   └── schedule.html
├── server/
│   ├── db/
│   │   └── db.js
│   ├── routes/
│   │   ├── courses.js
│   │   ├── tasks.js
│   │   ├── plan.js
│   │   └── schedule.js
│   ├── services/
│   │   ├── scheduler.js
│   │   └── scheduler.test.js
│   └── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Setup

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Then open the app in your browser:

```text
http://localhost:3000
```

## Testing

Run the test suite with:

```bash
npm test
```

The scheduler tests verify that StudyFlow:

- Generates study blocks before deadlines
- Skips completed tasks
- Ignores tasks with past deadlines
- Respects maximum study hours per day
- Splits large tasks into multiple blocks
- Prioritizes earlier deadlines before later deadlines

## API Endpoints

### Courses

```text
GET /api/courses
POST /api/courses
PATCH /api/courses/:id
DELETE /api/courses/:id
```

### Tasks

```text
GET /api/tasks
GET /api/tasks?course_id=1
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

### Weekly Plan

```text
GET /api/plan/week
```

### Schedule

```text
GET /api/schedule
POST /api/schedule/generate
```

## Example API Requests

Create a course:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/courses" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Math","weekly_hours_available":10}'
```

Create a task:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/tasks" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"course_id":1,"title":"Study calculus","deadline":"2026-09-20T23:59:00.000Z","estimated_hours":4,"priority":5,"status":"todo"}'
```

Generate a schedule:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/schedule/generate" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"block_minutes":60,"day_start_hour":17,"max_hours_per_day":2,"lookback_days":7}'
```

## What I Learned

- Building REST APIs with Express
- Designing SQLite-backed CRUD features
- Validating backend input
- Separating route logic from service logic
- Writing unit tests with Jest
- Creating scheduling logic based on deadlines, estimated effort, and daily limits
- Connecting a vanilla JavaScript frontend to backend APIs

## Future Improvements

- Add frontend task editing through a form or modal
- Add user authentication
- Add drag-and-drop schedule editing
- Add better dashboard analytics
- Add deployed demo link