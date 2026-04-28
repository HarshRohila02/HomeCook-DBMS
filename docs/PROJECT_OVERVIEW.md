# Unisphere — Project Overview

## Problem Statement

College students lack a unified platform for managing daily campus activities. They currently rely on separate systems, WhatsApp groups, and notice boards for mess menus, gate passes, shuttle bookings, lost & found items, and campus entry/exit tracking. This fragmentation leads to missed information, delays, and inefficiency.

**Unisphere** solves this by providing a single web-based super app that centralizes all campus operations for students and administrative hosts.

---

## Objectives

1. Provide a centralized platform for campus life management
2. Enable role-based access (Student vs Host) with appropriate permissions
3. Implement full CRUD operations backed by a normalized MySQL database
4. Demonstrate core DBMS concepts: joins, views, stored procedures, triggers, transactions, indexing, normalization
5. Build a responsive, modern web interface for real-world usability

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite (SPA) |
| **Styling** | Vanilla CSS with custom design system |
| **Routing** | React Router v6 |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0 (via MySQL Workbench) |
| **DB Driver** | mysql2/promise (connection pooling) |
| **Auth** | localStorage-based session (no JWT) |

---

## Modules

### 1. Authentication
- Student registration (role hardcoded to `student`)
- Login with email/password
- Host role assigned via database
- Logout clears localStorage

### 2. Dashboard
- Greeting with student name and date
- Campus IN/OUT status from latest campus log
- Quick-access module cards
- Mess menu preview for today

### 3. Mess Menu
- Date-based menu display (Yesterday / Today / Tomorrow)
- Meal types: Breakfast, Lunch, Snacks, Dinner
- Star rating and review submission
- Host can add, edit, delete menu items

### 4. Community
- Social feed with posts, likes, and comments
- Image URL support
- Like/unlike toggle
- Threaded comments per post

### 5. Lost & Found
- Students report lost items; Hosts report found items
- Claim system: student claims → host approves/rejects
- Search with backend SQL LIKE filtering
- Token code tracking

### 6. Gatepass
- Student requests gatepass with destination, date, time
- Host approves/rejects with status-aware buttons
- Statuses: Pending → Approved → Security Out → Security In
- Color-coded status badges
- Trigger auto-creates campus log on SecurityOut/SecurityIn

### 7. Shuttle
- View available shuttles with seat counts
- Student booking with duplicate prevention
- Transaction-based seat decrementing (SELECT ... FOR UPDATE)
- Host CRUD: add, edit, delete shuttles

### 8. Campus Logs
- IN/OUT log history filtered by logged-in user
- Status filter (All / IN / OUT)
- Backend-driven filtering with SQL WHERE

### 9. Profile
- Dynamic user data from database
- Change password
- Submit feedback
- Blocked users (host-only feature)
- Surveys placeholder
- Logout

### 10. Host Dashboard
- Administrative control panel
- Links to: Mess Management, Lost & Found Claims, Gatepass Approvals, Shuttle Management, Campus Logs

### 11. Analytics (API)
- `GET /api/analytics/summary`
- Uses: GROUP BY, HAVING, LEFT JOIN, subqueries, Views, SUM/MAX/MIN, CONCAT/COALESCE

---

## Database Schema

- **Database:** `unisphere_db`
- **Engine:** InnoDB (all tables)
- **Character Set:** utf8mb4

### Tables (11)

| Table | Purpose | Key Relationships |
|---|---|---|
| `users` | Student and host accounts | Referenced by all other tables |
| `mess_menus` | Daily meal schedules | One per (date, meal_type) |
| `mess_reviews` | Student ratings/feedback | FK → users, mess_menus |
| `community_posts` | Social feed posts | FK → users |
| `community_comments` | Comments on posts | FK → community_posts, users |
| `lost_found_items` | Lost and found reports | FK → users |
| `lost_found_claims` | Claim requests on found items | FK → lost_found_items, users |
| `gatepasses` | Gate pass requests | FK → users |
| `shuttles` | Shuttle schedules | Referenced by shuttle_bookings |
| `shuttle_bookings` | Student bookings | FK → users, shuttles (composite unique) |
| `campus_logs` | IN/OUT log entries | FK → users |
| `feedback` | User feedback submissions | FK → users |

---

## User Roles

| Role | Access |
|---|---|
| **Student** | Dashboard, Mess (view + review), Community, Lost & Found (lost items + claim), Gatepass (request), Shuttle (book), Campus Logs, Profile |
| **Host** | All student access + Mess Management (CRUD), Lost & Found (found items + approve claims), Gatepass (approve/reject/mark IN/OUT), Shuttle (CRUD), Host Dashboard |

---

## How to Run

### 1. Start MySQL
Ensure MySQL Server is running and `unisphere_db` is imported.

### 2. Start Backend
```bash
cd server
node server.js
```
Server runs on `http://localhost:5000`

### 3. Start Frontend
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 4. Test Accounts
- Register a new student account
- To create a host: `UPDATE users SET role = 'host' WHERE email = 'your@email.com';`

---

## Project Structure

```
DBMS/
├── server/                    # Backend
│   ├── server.js              # Express app entry
│   ├── db.js                  # MySQL connection pool
│   ├── controllers/           # Business logic (10 controllers)
│   ├── routes/                # API route definitions (10 route files)
│   └── middleware/            # Role-based access middleware
├── src/                       # Frontend
│   ├── pages/                 # React page components (15+ pages)
│   ├── components/shared/     # Reusable UI components
│   ├── services/              # API service layer with fallback
│   ├── data/                  # Dummy fallback data
│   └── styles/                # CSS design system
├── unishpere sql scripts.sql  # Complete SQL (schema, FKs, data, views, procedures, trigger, queries)
├── docs/                      # Documentation
└── package.json
```

---

## Team

| Name | Role | University |
|---|---|---|
| Harsh Rohila | Developer | BML Munjal University |
