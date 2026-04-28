# Unisphere — SQL Queries Documentation

This document catalogs all SQL queries used in the Unisphere project, organized by DBMS rubric category. Each query includes its purpose, the SQL, where it's used, and the expected output format.

---

## 1. DDL — Data Definition Language

### Q1: Create Database
```sql
CREATE DATABASE IF NOT EXISTS unisphere_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```
**File:** `unishpere sql scripts.sql` (Script 1, Line 6)

### Q2: Create Table (example — gatepasses)
```sql
CREATE TABLE IF NOT EXISTS gatepasses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  gatepass_code VARCHAR(40) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  out_date DATE NOT NULL,
  time_out TIME NOT NULL,
  expected_return_time TIME NOT NULL,
  status ENUM('Requested','SecurityIn','SecurityOut','Approved','Rejected') NOT NULL DEFAULT 'Requested',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gatepass_code (gatepass_code),
  KEY idx_gatepasses_user (user_id),
  KEY idx_gatepasses_date (out_date)
) ENGINE=InnoDB;
```
**Concepts:** PRIMARY KEY, UNIQUE KEY, INDEX (KEY), ENUM, DEFAULT, AUTO_INCREMENT, NOT NULL

### Q3: Add Foreign Key Constraint
```sql
ALTER TABLE gatepasses
  ADD CONSTRAINT fk_gatepasses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
```
**File:** `unishpere sql scripts.sql` (Script 2)

---

## 2. DML — Data Manipulation Language

### Q4: INSERT with subquery
```sql
INSERT INTO mess_reviews (user_id, mess_menu_id, rating, feedback)
VALUES
(1, (SELECT id FROM mess_menus WHERE menu_date='2026-04-27' AND meal_type='Lunch'), 4.0, 'Paneer tasted fresh.');
```
**Concepts:** INSERT INTO, subquery in VALUES

### Q5: UPDATE
```sql
UPDATE mess_menus SET avg_rating = ?, review_count = ? WHERE id = ?;
```
**File:** `messController.js` — used inside transaction after calculating new average

### Q6: DELETE
```sql
DELETE FROM mess_menus WHERE id = ?;
```
**File:** `messController.js` — host delete menu item

---

## 3. DQL — Data Query Language

### Q7: SELECT with WHERE, ORDER BY, LIMIT
```sql
SELECT id, full_name, phone, email, university, avatar_url AS profile_image, role
FROM users WHERE id = ? LIMIT 1;
```
**File:** `userController.js`

### Q8: SELECT DISTINCT
```sql
SELECT DISTINCT menu_date FROM mess_menus ORDER BY menu_date ASC;
```
**File:** `messController.js` — fetches unique dates for date tab navigation

### Q9: LIKE (search/filter)
```sql
SELECT * FROM lost_found_items
WHERE status = ?
  AND (item_name LIKE ? OR location LIKE ? OR token_code LIKE ? OR description LIKE ?)
ORDER BY reported_at DESC, id DESC;
```
**File:** `lostFoundController.js` — backend-driven search with `%pattern%`

---

## 4. JOINs

### Q10: INNER JOIN (multi-table)
```sql
SELECT c.id, c.item_id, c.user_id, c.claim_message, c.claim_status, c.created_at,
       i.item_name, i.location, i.status AS item_status,
       u.full_name AS claimant_name
FROM lost_found_claims c
INNER JOIN lost_found_items i ON i.id = c.item_id
INNER JOIN users u ON u.id = c.user_id
ORDER BY c.created_at DESC, c.id DESC;
```
**File:** `lostFoundController.js` — 3-table join to show claim details with item and user info

### Q11: INNER JOIN (shuttle bookings)
```sql
SELECT b.id, b.user_id, b.shuttle_id, b.booking_status, b.booked_at,
       s.route, s.departure_time, s.arrival_time
FROM shuttle_bookings b
INNER JOIN shuttles s ON s.id = b.shuttle_id
WHERE b.user_id = ? AND b.booking_status = 'Booked'
ORDER BY b.booked_at DESC, b.id DESC;
```
**File:** `shuttleController.js`

### Q12: LEFT JOIN (all users with gatepass count)
```sql
SELECT u.full_name, u.email, COUNT(g.id) AS gatepass_count
FROM users u
LEFT JOIN gatepasses g ON g.user_id = u.id
GROUP BY u.id, u.full_name, u.email;
```
**File:** `analyticsController.js` — returns count=0 for users with no gatepasses

**Expected output:**
| full_name | email | gatepass_count |
|---|---|---|
| Harsh Rohila | harsh.rohila.24cse@bmu.edu.in | 3 |
| Arman Gupta | arman.gupta@bmu.edu.in | 0 |

---

## 5. GROUP BY & HAVING

### Q13: GROUP BY with aggregates
```sql
SELECT meal_type, ROUND(AVG(avg_rating), 2) AS avg_rating, COUNT(*) AS menu_count
FROM mess_menus
GROUP BY meal_type
ORDER BY FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner');
```
**File:** `analyticsController.js`

**Expected output:**
| meal_type | avg_rating | menu_count |
|---|---|---|
| Breakfast | 4.17 | 3 |
| Lunch | 4.23 | 3 |
| Snacks | 3.80 | 3 |
| Dinner | 4.07 | 3 |

### Q14: HAVING — filter grouped results
```sql
SELECT u.full_name, COUNT(g.id) AS gatepass_count
FROM users u
INNER JOIN gatepasses g ON g.user_id = u.id
GROUP BY u.id, u.full_name
HAVING COUNT(g.id) > 1;
```
**File:** `unishpere sql scripts.sql` (Script 7, Q3)

### Q15: GROUP BY with SUM/MIN/MAX (stored procedure)
```sql
SELECT meal_type, COUNT(*) AS menu_count,
       ROUND(AVG(avg_rating), 2) AS avg_meal_rating,
       SUM(review_count) AS total_reviews,
       MIN(avg_rating) AS worst_rating,
       MAX(avg_rating) AS best_rating
FROM mess_menus
WHERE MONTH(menu_date) = ? AND YEAR(menu_date) = ?
GROUP BY meal_type
HAVING COUNT(*) > 0;
```
**File:** Stored procedure `sp_mess_monthly_report` — called via `CALL sp_mess_monthly_report(4, 2026);`

---

## 6. Subqueries

### Q16: Subquery in WHERE (comparison)
```sql
SELECT shuttle_code, route, seats_available
FROM shuttles
WHERE seats_available > (SELECT AVG(seats_available) FROM shuttles);
```
**File:** `analyticsController.js`

### Q17: Subquery with NOT IN
```sql
SELECT full_name, email FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM shuttle_bookings);
```
**File:** `analyticsController.js`

### Q18: Subquery in INSERT VALUES
```sql
INSERT INTO community_posts (user_id, image_url, caption)
VALUES ((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), NULL, 'Great lunch today!');
```
**File:** `unishpere sql scripts.sql` (Script 3)

---

## 7. Aggregate Functions

| Function | Usage | File |
|---|---|---|
| `AVG(rating)` | Average mess review rating | `messController.js` |
| `COUNT(*)` | Review count, gatepass count | `messController.js`, `analyticsController.js` |
| `SUM(review_count)` | Total reviews per meal type | `analyticsController.js` |
| `MAX(out_date)` | Latest gatepass date | `v_user_gatepass_summary` view |
| `MIN(avg_rating)` | Worst rating | `sp_mess_monthly_report` procedure |
| `SUM(CASE WHEN...)` | Conditional counting | `v_user_gatepass_summary` view |

---

## 8. Scalar Functions

| Function | Usage | File |
|---|---|---|
| `ROUND(value, 2)` | Round avg rating to 2 decimals | `messController.js` |
| `NOW()` | Current timestamp for bookings, logs | `shuttleController.js`, `gatepassController.js` |
| `CURDATE()` | Current date for menu queries | `messController.js` |
| `ABS(DATEDIFF(...))` | Nearest date calculation | `messController.js` |
| `GREATEST(0, x)` | Prevent negative like counts | `communityController.js` |
| `FIELD(col, 'a', 'b')` | Custom sort order | `messController.js` |
| `CONCAT(a, b, c)` | Build display name | `analyticsController.js` |
| `UPPER(value)` | Uppercase university name | `analyticsController.js` |
| `COALESCE(value, default)` | Null-safe default | `analyticsController.js`, `v_mess_ratings` |
| `LOWER(email)` | Lowercase email | `unishpere sql scripts.sql` Q10 |
| `DATEDIFF(a, b)` | Days between dates | `messController.js`, Script 7 Q11 |

---

## 9. Views

### V1: `v_mess_ratings` — Mess menu with computed ratings
```sql
SELECT * FROM v_mess_ratings WHERE menu_date = CURDATE();
```
**Uses:** LEFT JOIN, GROUP BY, AVG, COUNT, COALESCE, ROUND

### V2: `v_user_gatepass_summary` — User gatepass summary
```sql
SELECT * FROM v_user_gatepass_summary WHERE total_gatepasses > 0;
```
**Uses:** LEFT JOIN, GROUP BY, COUNT, SUM, MAX, CASE WHEN

### V3: `v_shuttle_occupancy` — Shuttle seat stats
```sql
SELECT * FROM v_shuttle_occupancy WHERE occupancy_pct > 50;
```
**Uses:** Arithmetic, ROUND

---

## 10. Stored Procedures

### SP1: `sp_approve_gatepass(gatepass_id)`
```sql
CALL sp_approve_gatepass(1);
```
**Uses:** DECLARE, SELECT INTO, IF/ELSE, UPDATE

### SP2: `sp_mess_monthly_report(month, year)`
```sql
CALL sp_mess_monthly_report(4, 2026);
```
**Uses:** GROUP BY, HAVING, AVG, SUM, MIN, MAX, COUNT, FIELD, ORDER BY

---

## 11. Trigger

### `trg_gatepass_campus_log`
```sql
-- Fires AFTER UPDATE on gatepasses
-- When status changes to SecurityOut → inserts campus_log with 'OUT'
-- When status changes to SecurityIn → inserts campus_log with 'IN'
```
**Uses:** AFTER UPDATE, NEW/OLD references, IF/ELSEIF, INSERT

---

## 12. Transactions

### Shuttle Booking Transaction
```sql
-- BEGIN TRANSACTION
SELECT * FROM shuttles WHERE id = ? LIMIT 1 FOR UPDATE;  -- row lock
-- Check seats > 0, check no duplicate booking
INSERT INTO shuttle_bookings (...) VALUES (...);
UPDATE shuttles SET seats_available = seats_available - 1 WHERE id = ?;
-- COMMIT (or ROLLBACK on error)
```
**File:** `shuttleController.js`
**ACID:** Atomicity (rollback on error), Consistency (FK constraints), Isolation (FOR UPDATE lock), Durability (commit)

---

## 13. Indexing

### Indexes in the project (15 explicit + PKs + UNIQUEs)

| Table | Index Name | Columns | Purpose |
|---|---|---|---|
| mess_reviews | idx_mess_reviews_user | user_id | Fast lookup by reviewer |
| mess_reviews | idx_mess_reviews_menu | mess_menu_id | Fast lookup by menu item |
| community_posts | idx_posts_user | user_id | Fast lookup by author |
| community_posts | idx_posts_created | created_at | Fast sort by date |
| community_comments | idx_comments_post | post_id | Fast lookup by post |
| community_comments | idx_comments_user | user_id | Fast lookup by commenter |
| community_comments | idx_comments_created | created_at | Fast sort by date |
| lost_found_items | idx_lf_status | status | Fast filter by status |
| lost_found_items | idx_lf_user | created_by_user_id | Fast lookup by reporter |
| lost_found_items | idx_lf_reported | reported_at | Fast sort by date |
| gatepasses | idx_gatepasses_user | user_id | Fast lookup by student |
| gatepasses | idx_gatepasses_date | out_date | Fast filter by date |
| shuttles | idx_shuttles_date | shuttle_date | Fast filter by date |
| shuttle_bookings | idx_bookings_user | user_id | Fast lookup by student |
| shuttle_bookings | idx_bookings_shuttle | shuttle_id | Fast lookup by shuttle |
| campus_logs | idx_logs_user | user_id | Fast filter by student |
| campus_logs | idx_logs_time | log_time | Fast sort by time |
| campus_logs | idx_logs_status | status | Fast filter IN/OUT |

**Verify in MySQL Workbench:**
```sql
SHOW INDEX FROM gatepasses;
SHOW INDEX FROM campus_logs;
```
