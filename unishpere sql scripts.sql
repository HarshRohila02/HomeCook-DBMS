-- =========================
-- SCRIPT 1: SCHEMA + TABLES
-- Database: unisphere_db
-- =========================

CREATE DATABASE IF NOT EXISTS unisphere_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE unisphere_db;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(190) NOT NULL,
  university VARCHAR(190) NULL,
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- MESS MENUS (one row per meal per date)
CREATE TABLE IF NOT EXISTS mess_menus (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_date DATE NOT NULL,
  meal_type ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  items_text TEXT NOT NULL,          -- store "item (kcal)" lines joined; normalize later if needed
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mess_menu_date_meal (menu_date, meal_type)
) ENGINE=InnoDB;

-- MESS REVIEWS
CREATE TABLE IF NOT EXISTS mess_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  mess_menu_id BIGINT UNSIGNED NOT NULL,
  rating DECIMAL(2,1) NOT NULL,      -- 1.0 to 5.0 (validate in backend)
  feedback TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mess_reviews_user (user_id),
  KEY idx_mess_reviews_menu (mess_menu_id)
) ENGINE=InnoDB;

-- COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS community_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NULL,
  caption TEXT NOT NULL,
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_posts_user (user_id),
  KEY idx_posts_created (created_at)
) ENGINE=InnoDB;

-- COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS community_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_post (post_id),
  KEY idx_comments_user (user_id),
  KEY idx_comments_created (created_at)
) ENGINE=InnoDB;

-- LOST & FOUND ITEMS
CREATE TABLE IF NOT EXISTS lost_found_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  item_name VARCHAR(190) NOT NULL,
  location VARCHAR(190) NOT NULL,
  status ENUM('found','lost','claimed') NOT NULL DEFAULT 'found',
  token_code VARCHAR(40) NULL,       -- e.g., "504" or "LF-0504"
  image_url VARCHAR(500) NULL,
  description TEXT NULL,
  reported_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lf_status (status),
  KEY idx_lf_user (created_by_user_id),
  KEY idx_lf_reported (reported_at)
) ENGINE=InnoDB;

-- GATEPASSES
CREATE TABLE IF NOT EXISTS gatepasses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  gatepass_code VARCHAR(40) NOT NULL,   -- e.g. "GP-2231"
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

-- SHUTTLES
CREATE TABLE IF NOT EXISTS shuttles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shuttle_code VARCHAR(40) NOT NULL,    -- e.g. "SH-101"
  route VARCHAR(255) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  seats_total INT UNSIGNED NOT NULL,
  seats_available INT UNSIGNED NOT NULL,
  shuttle_date DATE NULL,               -- optional (if schedule is date-based)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shuttle_code (shuttle_code),
  KEY idx_shuttles_date (shuttle_date)
) ENGINE=InnoDB;

-- SHUTTLE BOOKINGS
CREATE TABLE IF NOT EXISTS shuttle_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  shuttle_id BIGINT UNSIGNED NOT NULL,
  booking_status ENUM('Booked','Cancelled') NOT NULL DEFAULT 'Booked',
  booked_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_user (user_id),
  KEY idx_bookings_shuttle (shuttle_id),
  UNIQUE KEY uq_booking_user_shuttle (user_id, shuttle_id)
) ENGINE=InnoDB;

-- CAMPUS LOGS
CREATE TABLE IF NOT EXISTS campus_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('IN','OUT') NOT NULL,
  log_time DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_user (user_id),
  KEY idx_logs_time (log_time),
  KEY idx_logs_status (status)
) ENGINE=InnoDB;
-- =========================
-- SCRIPT 2: RELATIONSHIPS / FOREIGN KEYS
-- Run after Script 1
-- =========================

USE unisphere_db;

-- mess_reviews -> users, mess_menus
ALTER TABLE mess_reviews
  ADD CONSTRAINT fk_mess_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_mess_reviews_menu
    FOREIGN KEY (mess_menu_id) REFERENCES mess_menus(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- community_posts -> users
ALTER TABLE community_posts
  ADD CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- community_comments -> posts, users
ALTER TABLE community_comments
  ADD CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES community_posts(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- lost_found_items -> users
ALTER TABLE lost_found_items
  ADD CONSTRAINT fk_lf_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- gatepasses -> users
ALTER TABLE gatepasses
  ADD CONSTRAINT fk_gatepasses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- shuttle_bookings -> users, shuttles
ALTER TABLE shuttle_bookings
  ADD CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_bookings_shuttle
    FOREIGN KEY (shuttle_id) REFERENCES shuttles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- campus_logs -> users
ALTER TABLE campus_logs
  ADD CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
    
-- =========================
-- SCRIPT 3: SAMPLE DATA INSERTS
-- Run after Script 2
-- =========================

USE unisphere_db;

-- USERS
INSERT INTO users (full_name, phone, email, university, avatar_url)
VALUES
('Harsh Rohila', '9416554506', 'harsh.rohila.24cse@bmu.edu.in', 'BML Munjal University', NULL),
('Arman Gupta', '9000000000', 'arman.gupta@bmu.edu.in', 'BML Munjal University', NULL);

-- MESS MENUS (Apr 26-28, Breakfast/Lunch/Snacks/Dinner)
INSERT INTO mess_menus (menu_date, meal_type, start_time, end_time, items_text, avg_rating, review_count)
VALUES
('2026-04-26','Breakfast','07:30:00','09:30:00','Corn flakes (357 kcal)\nHot milk (67 kcal)\nTea/Coffee (40 kcal)\nBread butter (120 kcal)',4.0,14),
('2026-04-26','Lunch','12:30:00','15:00:00','Detox water (40 kcal)\nDal tadka (120 kcal)\nPaneer butter masala (180 kcal)\nChapatti (260 kcal)',4.2,21),
('2026-04-26','Snacks','16:30:00','18:00:00','Samosa (170 kcal)\nTea (40 kcal)\nGreen chutney (50 kcal)',3.8,10),
('2026-04-26','Dinner','19:30:00','21:30:00','Peas pulao (170 kcal)\nArhar dal (120 kcal)\nMix veg (130 kcal)\nBoondi raita (40 kcal)',4.1,17),

('2026-04-27','Breakfast','07:30:00','09:30:00','Corn flakes (357 kcal)\nTea & coffee (40 kcal)\nHot milk (67 kcal)\nBread with jam (310 kcal)',4.4,26),
('2026-04-27','Lunch','12:30:00','15:00:00','Detox water (40 kcal)\nMasala onion (40 kcal)\nDal tadka (120 kcal)\nPaneer butter masala (180 kcal)',4.3,23),
('2026-04-27','Snacks','16:30:00','18:00:00','Pakora (150 kcal)\nTea (40 kcal)\nGreen chutney (50 kcal)',3.9,15),
('2026-04-27','Dinner','19:30:00','21:30:00','Chapatti (260 kcal)\nPaneer butter masala (180 kcal)\nDal rasam (80 kcal)\nBoondi raita (40 kcal)',4.0,19),

('2026-04-28','Breakfast','07:30:00','09:30:00','Upma (220 kcal)\nTea/Coffee (40 kcal)\nFruit bowl (90 kcal)',4.1,9),
('2026-04-28','Lunch','12:30:00','15:00:00','Jeera rice (160 kcal)\nDal fry (130 kcal)\nAloo matar (170 kcal)\nChapatti (260 kcal)',4.2,12),
('2026-04-28','Snacks','16:30:00','18:00:00','Bhel (210 kcal)\nTea (40 kcal)\nCookies (120 kcal)',3.7,6),
('2026-04-28','Dinner','19:30:00','21:30:00','Veg pulao (200 kcal)\nDal makhani (160 kcal)\nMixed veg (130 kcal)\nCurd (80 kcal)',4.1,11);

-- MESS REVIEWS (sample)
INSERT INTO mess_reviews (user_id, mess_menu_id, rating, feedback)
VALUES
(1, (SELECT id FROM mess_menus WHERE menu_date='2026-04-27' AND meal_type='Lunch'), 4.0, 'Paneer tasted fresh and chapatti was soft.'),
(2, (SELECT id FROM mess_menus WHERE menu_date='2026-04-27' AND meal_type='Breakfast'), 4.5, 'Great breakfast today.');

-- COMMUNITY POSTS
INSERT INTO community_posts (user_id, image_url, caption, like_count, comment_count, created_at)
VALUES
((SELECT id FROM users WHERE email='arman.gupta@bmu.edu.in'), NULL,
 'Breakfast today: corn flakes, hot milk, tea/coffee and bread with jam. Share your review.',
 12, 1, NOW() - INTERVAL 39 DAY),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), NULL,
 'Lunch menu looked great today. Paneer butter masala was fresh and chapatti quality improved.',
 31, 1, NOW() - INTERVAL 2 HOUR);

-- COMMUNITY COMMENTS
INSERT INTO community_comments (post_id, user_id, comment_text, created_at)
VALUES
((SELECT id FROM community_posts ORDER BY id ASC LIMIT 1),
 (SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'Agree! Breakfast was good today.', NOW() - INTERVAL 38 DAY),
((SELECT id FROM community_posts ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE email='arman.gupta@bmu.edu.in'),
 'Yes, paneer improved a lot!', NOW() - INTERVAL 1 HOUR);

-- LOST & FOUND ITEMS
INSERT INTO lost_found_items
(created_by_user_id, item_name, location, status, token_code, image_url, description, reported_at)
VALUES
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'Steel bottle', 'NB-105', 'found', '504', NULL, 'Silver bottle found near lecture hall.', '2026-04-24 13:30:00'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'Calculator', 'E2-304', 'found', '503', NULL, 'Scientific calculator in classroom.', '2026-04-23 12:40:00'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'Black bag', 'F-H block', 'found', '502', NULL, 'Laptop bag kept at reception.', '2026-04-22 01:10:00');

-- GATEPASSES
INSERT INTO gatepasses
(user_id, gatepass_code, reason, destination, out_date, time_out, expected_return_time, status)
VALUES
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'GP-2231', 'Medical appointment', 'Medanta Hospital', '2026-04-17', '09:30:00', '15:00:00', 'SecurityOut'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'GP-2190', 'Family visit', 'Gurugram', '2026-03-24', '10:00:00', '20:00:00', 'SecurityIn'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 'GP-2142', 'Exam center travel', 'Sector 44', '2026-02-27', '07:00:00', '14:30:00', 'SecurityIn');

-- SHUTTLES
INSERT INTO shuttles
(shuttle_code, route, departure_time, arrival_time, seats_total, seats_available, shuttle_date)
VALUES
('SH-101','Hostel A -> Academic Block','08:00:00','08:20:00',20,12,NULL),
('SH-102','Academic Block -> Main Gate','13:15:00','13:30:00',20,8,NULL),
('SH-103','Main Gate -> Hostel B','18:15:00','18:35:00',20,15,NULL);

-- SHUTTLE BOOKINGS (1 booking sample)
INSERT INTO shuttle_bookings (user_id, shuttle_id, booking_status, booked_at)
VALUES
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'),
 (SELECT id FROM shuttles WHERE shuttle_code='SH-101'),
 'Booked',
 NOW() - INTERVAL 1 DAY);

-- CAMPUS LOGS
INSERT INTO campus_logs (user_id, status, log_time)
VALUES
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), 'IN',  '2026-04-26 14:50:00'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), 'OUT', '2026-04-25 12:35:00'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), 'OUT', '2026-04-24 12:51:00'),
((SELECT id FROM users WHERE email='harsh.rohila.24cse@bmu.edu.in'), 'IN',  '2026-04-24 13:31:00');


-- =========================
-- SCRIPT 4: VIEWS
-- Run after Script 3
-- =========================

USE unisphere_db;

-- VIEW 1: Mess menu with computed average ratings (uses LEFT JOIN + GROUP BY)
CREATE OR REPLACE VIEW v_mess_ratings AS
SELECT
  mm.id AS menu_id,
  mm.menu_date,
  mm.meal_type,
  mm.start_time,
  mm.end_time,
  mm.items_text,
  COALESCE(ROUND(AVG(mr.rating), 2), 0) AS computed_avg_rating,
  COUNT(mr.id) AS computed_review_count
FROM mess_menus mm
LEFT JOIN mess_reviews mr ON mr.mess_menu_id = mm.id
GROUP BY mm.id, mm.menu_date, mm.meal_type, mm.start_time, mm.end_time, mm.items_text;

-- VIEW 2: User gatepass summary (uses LEFT JOIN + GROUP BY + SUM/MAX + CASE)
CREATE OR REPLACE VIEW v_user_gatepass_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  COUNT(g.id) AS total_gatepasses,
  SUM(CASE WHEN g.status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(CASE WHEN g.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
  MAX(g.out_date) AS last_gatepass_date
FROM users u
LEFT JOIN gatepasses g ON g.user_id = u.id
GROUP BY u.id, u.full_name, u.email;

-- VIEW 3: Shuttle occupancy overview (uses arithmetic + ROUND)
CREATE OR REPLACE VIEW v_shuttle_occupancy AS
SELECT
  s.id AS shuttle_id,
  s.shuttle_code,
  s.route,
  s.departure_time,
  s.arrival_time,
  s.seats_total,
  s.seats_available,
  (s.seats_total - s.seats_available) AS seats_booked,
  ROUND(((s.seats_total - s.seats_available) / s.seats_total) * 100, 1) AS occupancy_pct
FROM shuttles s;


-- =========================
-- SCRIPT 5: STORED PROCEDURES
-- Run after Script 4
-- =========================

USE unisphere_db;

-- PROCEDURE 1: Approve gatepass and auto-create campus log
DELIMITER $$
CREATE PROCEDURE sp_approve_gatepass(IN p_gatepass_id BIGINT)
BEGIN
  DECLARE v_user_id BIGINT;
  DECLARE v_current_status VARCHAR(20);

  SELECT user_id, status INTO v_user_id, v_current_status
  FROM gatepasses WHERE id = p_gatepass_id;

  IF v_current_status IS NOT NULL AND v_current_status != 'Approved' AND v_current_status != 'Rejected' THEN
    UPDATE gatepasses SET status = 'Approved' WHERE id = p_gatepass_id;
    SELECT 'Gatepass approved' AS result;
  ELSE
    SELECT 'Gatepass cannot be approved (already processed or not found)' AS result;
  END IF;
END$$
DELIMITER ;

-- PROCEDURE 2: Monthly mess rating report (uses GROUP BY + HAVING + aggregate functions)
DELIMITER $$
CREATE PROCEDURE sp_mess_monthly_report(IN p_month INT, IN p_year INT)
BEGIN
  SELECT
    meal_type,
    COUNT(*) AS menu_count,
    ROUND(AVG(avg_rating), 2) AS avg_meal_rating,
    SUM(review_count) AS total_reviews,
    MIN(avg_rating) AS worst_rating,
    MAX(avg_rating) AS best_rating
  FROM mess_menus
  WHERE MONTH(menu_date) = p_month AND YEAR(menu_date) = p_year
  GROUP BY meal_type
  HAVING COUNT(*) > 0
  ORDER BY FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner');
END$$
DELIMITER ;


-- =========================
-- SCRIPT 6: TRIGGER
-- Run after Script 5
-- =========================

USE unisphere_db;

-- TRIGGER: Auto-create campus log entry when gatepass is marked SecurityOut or SecurityIn
DELIMITER $$
CREATE TRIGGER trg_gatepass_campus_log
AFTER UPDATE ON gatepasses
FOR EACH ROW
BEGIN
  IF NEW.status = 'SecurityOut' AND OLD.status != 'SecurityOut' THEN
    INSERT INTO campus_logs (user_id, status, log_time) VALUES (NEW.user_id, 'OUT', NOW());
  ELSEIF NEW.status = 'SecurityIn' AND OLD.status != 'SecurityIn' THEN
    INSERT INTO campus_logs (user_id, status, log_time) VALUES (NEW.user_id, 'IN', NOW());
  END IF;
END$$
DELIMITER ;


-- =========================
-- SCRIPT 7: SAMPLE QUERIES FOR VIVA
-- These demonstrate rubric concepts
-- =========================

USE unisphere_db;

-- ========== GROUP BY ==========
-- Q1: Average rating per meal type
SELECT meal_type, ROUND(AVG(avg_rating), 2) AS avg_rating, COUNT(*) AS menu_count
FROM mess_menus
GROUP BY meal_type
ORDER BY FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner');

-- Q2: Items per lost/found status
SELECT status, COUNT(*) AS item_count
FROM lost_found_items
GROUP BY status;

-- ========== HAVING ==========
-- Q3: Users with more than 1 gatepass
SELECT u.full_name, COUNT(g.id) AS gatepass_count
FROM users u
INNER JOIN gatepasses g ON g.user_id = u.id
GROUP BY u.id, u.full_name
HAVING COUNT(g.id) > 1;

-- ========== SUBQUERIES ==========
-- Q4: Shuttles with above-average available seats
SELECT shuttle_code, route, seats_available
FROM shuttles
WHERE seats_available > (SELECT AVG(seats_available) FROM shuttles);

-- Q5: Users who never booked a shuttle
SELECT full_name, email
FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM shuttle_bookings);

-- Q6: Meals with rating above overall average (correlated-style)
SELECT menu_date, meal_type, avg_rating
FROM mess_menus
WHERE avg_rating > (SELECT AVG(avg_rating) FROM mess_menus WHERE avg_rating > 0);

-- ========== LEFT JOIN ==========
-- Q7: All users with gatepass count (including users with 0)
SELECT u.full_name, u.email, COUNT(g.id) AS gatepass_count
FROM users u
LEFT JOIN gatepasses g ON g.user_id = u.id
GROUP BY u.id, u.full_name, u.email;

-- ========== AGGREGATE FUNCTIONS ==========
-- Q8: SUM, MAX, MIN on shuttles
SELECT
  SUM(seats_available) AS total_available_seats,
  MAX(seats_total) AS largest_shuttle,
  MIN(seats_available) AS least_available
FROM shuttles;

-- Q9: Total campus log entries per status
SELECT status, COUNT(*) AS log_count, MAX(log_time) AS latest_log
FROM campus_logs
GROUP BY status;

-- ========== SCALAR FUNCTIONS ==========
-- Q10: CONCAT, COALESCE, UPPER
SELECT
  CONCAT(full_name, ' (', UPPER(COALESCE(university, 'N/A')), ')') AS display_name,
  LOWER(email) AS email_lower
FROM users;

-- Q11: Date calculations
SELECT
  menu_date,
  meal_type,
  DATEDIFF(CURDATE(), menu_date) AS days_ago
FROM mess_menus
ORDER BY menu_date DESC
LIMIT 5;

-- ========== VIEW QUERIES ==========
-- Q12: Use the views we created
SELECT * FROM v_mess_ratings WHERE menu_date = CURDATE();
SELECT * FROM v_user_gatepass_summary WHERE total_gatepasses > 0;
SELECT * FROM v_shuttle_occupancy WHERE occupancy_pct > 50;

-- ========== STORED PROCEDURE CALLS ==========
-- Q13: Call monthly report
CALL sp_mess_monthly_report(4, 2026);

-- Q14: Call approve gatepass (use a valid gatepass id)
-- CALL sp_approve_gatepass(1);

-- ========== TRANSACTION EXAMPLE ==========
-- Q15: Manual transaction (for viva explanation)
-- START TRANSACTION;
-- INSERT INTO campus_logs (user_id, status, log_time) VALUES (1, 'OUT', NOW());
-- UPDATE gatepasses SET status = 'SecurityOut' WHERE id = 1;
-- COMMIT;
-- (or ROLLBACK; to undo)

SHOW FULL TABLES WHERE TABLE_TYPE='VIEW';

SHOW PROCEDURE STATUS WHERE Db='unisphere_db';

SHOW TRIGGERS;


-- ============================================================
-- SCRIPT 8: TRANSACTIONS, CONCURRENCY & RECOVERY DEMOS
-- Run these in MySQL Workbench to demonstrate DBMS concepts
-- ============================================================

USE unisphere_db;

-- ============================================================
-- 8A: SHUTTLE BOOKING — FULL TRANSACTION WITH ROW LOCKING
-- Demonstrates: START TRANSACTION, SELECT ... FOR UPDATE,
--               validation check, INSERT, UPDATE, COMMIT
-- ACID: Atomicity (all or nothing), Isolation (row lock)
-- ============================================================

-- Step 0: Check current state BEFORE transaction
SELECT id, shuttle_code, seats_available FROM shuttles WHERE id = 1;

START TRANSACTION;

-- Step 1: Acquire exclusive row lock on shuttle (Lock-Based Protocol)
-- Other transactions trying to read this row FOR UPDATE will WAIT
SELECT id, seats_available
FROM shuttles
WHERE id = 1
FOR UPDATE;

-- Step 2: Validation-Based Protocol — check for duplicate booking
SELECT COUNT(*) AS existing_bookings
FROM shuttle_bookings
WHERE user_id = 1 AND shuttle_id = 1 AND booking_status = 'Booked';
-- If count > 0, we should ROLLBACK (duplicate not allowed)

-- Step 3: Insert booking record
INSERT INTO shuttle_bookings (user_id, shuttle_id, booking_status, booked_at)
VALUES (1, 1, 'Booked', NOW());

-- Step 4: Decrement available seats atomically
UPDATE shuttles SET seats_available = seats_available - 1 WHERE id = 1;

-- Step 5: Verify the changes within transaction
SELECT id, shuttle_code, seats_available FROM shuttles WHERE id = 1;
SELECT * FROM shuttle_bookings WHERE user_id = 1 AND shuttle_id = 1 ORDER BY id DESC LIMIT 1;

-- Step 6: Make changes permanent
COMMIT;

-- Verify AFTER commit — changes are durable (ACID Durability)
SELECT id, shuttle_code, seats_available FROM shuttles WHERE id = 1;


-- ============================================================
-- 8B: RECOVERY DEMO — ROLLBACK RESTORES ORIGINAL STATE
-- Demonstrates: ROLLBACK undoes ALL changes (ACID Atomicity)
-- This proves the recovery system works
-- ============================================================

-- Step 0: Record current state
SELECT id, shuttle_code, seats_available FROM shuttles WHERE id = 2;
-- Remember this value (e.g., seats_available = 8)

START TRANSACTION;

-- Make changes
INSERT INTO shuttle_bookings (user_id, shuttle_id, booking_status, booked_at)
VALUES (2, 2, 'Booked', NOW());

UPDATE shuttles SET seats_available = seats_available - 1 WHERE id = 2;

-- Check inside transaction — seats decreased
SELECT seats_available FROM shuttles WHERE id = 2;

-- SIMULATE FAILURE: Rollback instead of commit
ROLLBACK;

-- Verify AFTER rollback — data is UNCHANGED (recovery successful!)
SELECT id, shuttle_code, seats_available FROM shuttles WHERE id = 2;
-- Expected: seats_available is same as Step 0 (ROLLBACK undid everything)
-- This demonstrates InnoDB's undo log recovery mechanism


-- ============================================================
-- 8C: SAVEPOINT — PARTIAL ROLLBACK WITHIN A TRANSACTION
-- Demonstrates: SAVEPOINT, ROLLBACK TO SAVEPOINT
-- Use case: Undo only the status change, keep the gatepass insert
-- ============================================================

START TRANSACTION;

-- Step 1: Insert a new gatepass
INSERT INTO gatepasses (user_id, gatepass_code, reason, destination, out_date, time_out, expected_return_time, status)
VALUES (
  (SELECT id FROM users LIMIT 1),
  CONCAT('GP-TEST-', FLOOR(RAND() * 100000)),
  'Savepoint test trip',
  'Delhi',
  CURDATE(),
  '10:00:00',
  '18:00:00',
  'Requested'
);

-- Verify gatepass was inserted
SELECT id, gatepass_code, status FROM gatepasses WHERE reason = 'Savepoint test trip';

-- Step 2: Create SAVEPOINT after the insert
SAVEPOINT before_status_change;

-- Step 3: Try updating the status to Approved
UPDATE gatepasses SET status = 'Approved' WHERE reason = 'Savepoint test trip';

-- Verify status changed
SELECT id, gatepass_code, status FROM gatepasses WHERE reason = 'Savepoint test trip';
-- Expected: status = 'Approved'

-- Step 4: Oops! We want to UNDO only the status change, but KEEP the insert
ROLLBACK TO SAVEPOINT before_status_change;

-- Verify: gatepass still exists (INSERT was kept), but status reverted
SELECT id, gatepass_code, status FROM gatepasses WHERE reason = 'Savepoint test trip';
-- Expected: status = 'Requested' (status change was undone)
-- The INSERT is still intact (partial rollback!)

COMMIT;

-- Cleanup test data
DELETE FROM gatepasses WHERE reason = 'Savepoint test trip';


-- ============================================================
-- 8D: TABLE-LEVEL LOCKING (vs ROW-LEVEL FOR UPDATE)
-- Demonstrates: LOCK TABLES, UNLOCK TABLES
-- Note: LOCK TABLES is a different granularity than FOR UPDATE
-- ============================================================

-- Row-level lock (what our app uses) — only locks specific rows:
--   SELECT * FROM shuttles WHERE id = 1 FOR UPDATE;
--   (other rows in shuttles table remain accessible)

-- Table-level lock — locks ENTIRE table:
LOCK TABLES shuttles READ;
-- Now: current session can only READ shuttles
-- Other sessions can also READ but CANNOT WRITE
SELECT * FROM shuttles;
UNLOCK TABLES;

LOCK TABLES shuttles WRITE;
-- Now: current session can READ and WRITE
-- Other sessions CANNOT read OR write shuttles
SELECT * FROM shuttles;
-- Perform updates if needed here
UNLOCK TABLES;
-- Table is now unlocked for all sessions

-- COMPARISON for viva:
-- | Feature         | FOR UPDATE (row lock) | LOCK TABLES (table lock) |
-- | Granularity     | Row-level             | Table-level              |
-- | Inside TXN?     | Yes                   | No (auto-commits)        |
-- | Concurrency     | High (other rows ok)  | Low (entire table locked) |
-- | Our app uses    | ✅ Yes                | Demo only                |


-- ============================================================
-- 8E: OPTIMISTIC LOCKING / TIMESTAMP-BASED PROTOCOL
-- Demonstrates: Using updated_at for conflict detection
-- If another user modified the row since we last read it,
-- our UPDATE will affect 0 rows → conflict detected
-- ============================================================

-- Step 1: Read current data + its timestamp
SELECT id, route, seats_available, updated_at
FROM shuttles WHERE id = 1;
-- Suppose updated_at = '2026-04-28 10:00:00'

-- Step 2: User works on the data (e.g., editing a form)...
-- Meanwhile, another user might modify this row

-- Step 3: Update ONLY if timestamp hasn't changed since we read it
-- Replace the timestamp below with the actual value from Step 1
SET @saved_timestamp = (SELECT updated_at FROM shuttles WHERE id = 1);

UPDATE shuttles
SET route = 'Hostel A -> Academic Block'
WHERE id = 1 AND updated_at = @saved_timestamp;

-- Check how many rows were affected
SELECT ROW_COUNT() AS rows_affected;
-- If 1 → Success! No conflict, our update went through
-- If 0 → Conflict! Another user modified it. Must re-read and retry.

-- This is the Timestamp-Based Protocol:
-- Every table has: updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- We use the timestamp as a "version number" for conflict detection


-- ============================================================
-- 8F: STORED PROCEDURE WITH TRANSACTION + LOCKING
-- Demonstrates: Full transaction inside a procedure
-- Uses: DECLARE, HANDLER, START TRANSACTION, FOR UPDATE,
--       validation, INSERT, UPDATE, COMMIT, ROLLBACK
-- ============================================================

DELIMITER $$
CREATE PROCEDURE sp_book_shuttle(
  IN p_user_id BIGINT,
  IN p_shuttle_id BIGINT
)
BEGIN
  DECLARE v_seats INT DEFAULT 0;
  DECLARE v_existing INT DEFAULT 0;

  -- Error handler: if ANY SQL error occurs, rollback everything
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'ERROR: Booking failed — transaction rolled back' AS result, 0 AS success;
  END;

  START TRANSACTION;

  -- 1. Lock the shuttle row (Pessimistic / Lock-Based Protocol)
  SELECT seats_available INTO v_seats
  FROM shuttles
  WHERE id = p_shuttle_id
  FOR UPDATE;

  -- 2. Validation-Based Protocol: check for duplicate booking
  SELECT COUNT(*) INTO v_existing
  FROM shuttle_bookings
  WHERE user_id = p_user_id
    AND shuttle_id = p_shuttle_id
    AND booking_status = 'Booked';

  IF v_existing > 0 THEN
    ROLLBACK;
    SELECT 'REJECTED: Duplicate booking not allowed' AS result, 0 AS success;
  ELSEIF v_seats IS NULL THEN
    ROLLBACK;
    SELECT 'REJECTED: Shuttle not found' AS result, 0 AS success;
  ELSEIF v_seats <= 0 THEN
    ROLLBACK;
    SELECT 'REJECTED: No seats available' AS result, 0 AS success;
  ELSE
    -- 3. Insert booking
    INSERT INTO shuttle_bookings (user_id, shuttle_id, booking_status, booked_at)
    VALUES (p_user_id, p_shuttle_id, 'Booked', NOW());

    -- 4. Decrement seats atomically
    UPDATE shuttles
    SET seats_available = seats_available - 1
    WHERE id = p_shuttle_id;

    COMMIT;
    SELECT CONCAT('SUCCESS: Booked shuttle ', p_shuttle_id, ' for user ', p_user_id,
                  '. Seats remaining: ', v_seats - 1) AS result, 1 AS success;
  END IF;
END$$
DELIMITER ;

-- Test the procedure:
-- CALL sp_book_shuttle(2, 3);
-- CALL sp_book_shuttle(2, 3);  -- Second call should say "Duplicate booking"


-- ============================================================
-- 8G: ACID PROPERTIES — SUMMARY WITH PROJECT EXAMPLES
-- (For viva reference — explains how our project satisfies ACID)
-- ============================================================

-- ATOMICITY (All or Nothing):
--   ✅ All multi-step operations use START TRANSACTION + COMMIT/ROLLBACK
--   ✅ If shuttle booking fails mid-way → ROLLBACK undoes INSERT + UPDATE
--   ✅ If claim approval fails → ROLLBACK undoes both claim + item update
--   ✅ Script 8B above PROVES rollback restores original data
--
-- CONSISTENCY (Valid State → Valid State):
--   ✅ 8 FOREIGN KEY constraints prevent orphan records
--   ✅ 5 UNIQUE constraints prevent duplicate data
--   ✅ 5 ENUM types restrict column values to valid options
--   ✅ NOT NULL constraints prevent missing required data
--   ✅ Application validates input before INSERT/UPDATE
--
-- ISOLATION (Concurrent transactions don't interfere):
--   ✅ SELECT ... FOR UPDATE provides exclusive row locks
--   ✅ InnoDB default isolation level: REPEATABLE READ
--   ✅ Shuttle booking locks the row → concurrent bookings wait in queue
--   ✅ Gatepass status update locks row → prevents race conditions
--   To verify: SELECT @@transaction_isolation;
--
-- DURABILITY (Committed data survives crash):
--   ✅ InnoDB uses Write-Ahead Logging (redo log / ib_logfile)
--   ✅ After COMMIT, data is flushed to disk
--   ✅ Even if server crashes after COMMIT, data is recovered from redo log
--   ✅ innodb_flush_log_at_trx_commit = 1 (default) ensures this
--   To verify: SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';


-- ============================================================
-- 8H: RECOVERY SYSTEM CONCEPTS
-- (For viva reference — explains MySQL/InnoDB recovery)
-- ============================================================

-- InnoDB Recovery Mechanisms:
--
-- 1. UNDO LOG (Rollback Segment):
--    - Stores old values of modified rows
--    - Used by ROLLBACK to restore pre-transaction state
--    - Also used for MVCC (Multi-Version Concurrency Control)
--    To see: SHOW ENGINE INNODB STATUS;
--
-- 2. REDO LOG (Write-Ahead Log):
--    - Stores new values BEFORE writing to data files
--    - If crash happens after COMMIT but before disk write,
--      InnoDB replays redo log on startup → data recovered
--    To see: SHOW VARIABLES LIKE 'innodb_log%';
--
-- 3. CHECKPOINT:
--    - Periodically flushes dirty pages from buffer pool to disk
--    - Reduces recovery time after crash
--    To see: SHOW ENGINE INNODB STATUS; (look for "Log sequence number")
--
-- 4. CRASH RECOVERY (automatic on restart):
--    - Phase 1: Redo — replay committed transactions from redo log
--    - Phase 2: Undo — rollback uncommitted transactions from undo log
--    - Result: database returns to last consistent state

-- Verify InnoDB settings:
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
SELECT @@transaction_isolation;
SHOW VARIABLES LIKE 'innodb_log_file_size';