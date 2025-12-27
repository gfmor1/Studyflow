# StudyFlow

A full-stack study planner that lets you manage courses and tasks, generate a weekly plan, and auto-generate study blocks before deadlines.

## Features
- Create courses with a weekly hours budget
- Create tasks (deadline, estimated hours, priority)
- Mark tasks as **todo / done**
- Weekly Plan: allocates available hours to highest-priority todo tasks
- Schedule: generates study blocks for **todo** tasks only, before each deadline
- Simple multi-page UI (Dashboard, Courses, Tasks, Weekly Plan, Schedule)

## Tech Stack
- Backend: Node.js + Express
- Database: SQLite
- Frontend: Vanilla HTML/CSS/JS (served by Express)

## Setup (Windows / macOS)
```bash
npm install
npm start
Then open:

http://localhost:3000

If you use a .env, create it from .env.example:

cp .env.example .env


(Windows PowerShell: Copy-Item .env.example .env)

Project Structure
studyflow/
  server/            # Express app + routes
  db/                # SQLite database + setup scripts (if included)
  client/            # Frontend (HTML/CSS/JS)
  package.json

Database Schema (SQLite)

courses

id (PK)

name

weeklyHours

tasks

id (PK)

courseId (FK -> courses.id)

title

dueDate

estHours

priority

status (todo|done)

API Endpoints (high-level)

GET /api/courses (list courses)

POST /api/courses (create course)

GET /api/tasks (list tasks)

POST /api/tasks (create task)

PATCH /api/tasks/:id (update status/details)

GET /api/plan (generate weekly plan)

GET /api/schedule (generate schedule blocks)

What I learned

Designing REST endpoints and validating inputs

SQLite persistence and basic relational modeling

Keeping UI state in sync with backend responses

Next Improvements

User accounts (multi-user)

Calendar export (ICS)

Drag-and-drop scheduling UI


### One warning (don’t lie in your README)
Only keep the endpoints and schema **if your project actually has them**. If not, it hurts you more than it helps.

If you want, paste your actual folder tree (just the top-level folders) and I’ll tailor the README so it matches your real project exactly.
::contentReference[oaicite:0]{index=0}
