# StudyFlow

A full-stack study planner that lets you manage courses + tasks, generate a weekly plan, and auto-generate study blocks before deadlines.

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

## Project Structure
studyflow/
server/
index.js
routes/
db/
client/
index.html
css/
js/
