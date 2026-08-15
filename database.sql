-- =================================================================
-- T2 Laundry — Database Schema & Seed Data (MySQL 8+ compatible)
-- "Time & Trust" | Premium Garment Care Concierge
-- =================================================================

DROP DATABASE IF EXISTS t2_laundry;
CREATE DATABASE t2_laundry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE t2_laundry;

-- -----------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------

CREATE TABLE categories (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  description   TEXT,
  icon          VARCHAR(60),
  image_url     VARCHAR(512),
  display_order INT DEFAULT 0,
  active        BOOLEAN DEFAULT TRUE,
  created_date  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id               VARCHAR(36) PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  slug             VARCHAR(120) NOT NULL,
  description      TEXT,
  icon             VARCHAR(60),
  base_price       DECIMAL(10,2) DEFAULT 0,
  turnaround_hours INT DEFAULT 48,
  active           BOOLEAN DEFAULT TRUE,
  created_date     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id                    VARCHAR(36) PRIMARY KEY,
  name                  VARCHAR(150) NOT NULL,
  category              VARCHAR(120) NOT NULL,
  description           TEXT,
  image_url             VARCHAR(512),
  wash_price            DECIMAL(10,2) DEFAULT 0,
  iron_price            DECIMAL(10,2) DEFAULT 0,
  wash_iron_price       DECIMAL(10,2) DEFAULT 0,
  dryclean_price        DECIMAL(10,2) DEFAULT 0,
  eligible_subscription BOOLEAN DEFAULT TRUE,
  popular              BOOLEAN DEFAULT FALSE,
  active               BOOLEAN DEFAULT TRUE,
  display_order        INT DEFAULT 0,
  created_date         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE subscription_plans (
  id                  VARCHAR(36) PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  slug                VARCHAR(120),
  price               DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(8) DEFAULT 'QAR',
  period              VARCHAR(20) DEFAULT 'month',
  pieces_per_booking  INT,
  bookings_per_month  INT,
  eligible_items      INT,
  features            JSON,
  is_vip              BOOLEAN DEFAULT FALSE,
  popular             BOOLEAN DEFAULT FALSE,
  active              BOOLEAN DEFAULT TRUE,
  created_date        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE members (
  id               VARCHAR(36) PRIMARY KEY,
  full_name        VARCHAR(150) NOT NULL,
  email            VARCHAR(180),
  phone            VARCHAR(40) NOT NULL,
  plan_name        VARCHAR(120),
  status           ENUM('active','expired','paused','cancelled') DEFAULT 'active',
  start_date       DATE,
  end_date         DATE,
  bookings_used    INT DEFAULT 0,
  bookings_allowed INT DEFAULT 4,
  items_used       INT DEFAULT 0,
  items_allowed    INT DEFAULT 20,
  created_date     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id              VARCHAR(36) PRIMARY KEY,
  order_code      VARCHAR(20) NOT NULL,
  customer_name   VARCHAR(150) NOT NULL,
  customer_phone  VARCHAR(40) NOT NULL,
  customer_email  VARCHAR(180),
  address         TEXT,
  pickup_type     ENUM('pickup','drop') DEFAULT 'pickup',
  pickup_date     DATE,
  pickup_slot     VARCHAR(40),
  items           JSON,
  total           DECIMAL(10,2) DEFAULT 0,
  status          ENUM('pending','picked_up','in_facility','quality_check',
                       'out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  payment_status  ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
  subscription_id VARCHAR(36),
  notes           TEXT,
  created_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_code (order_code)
);

-- -----------------------------------------------------------------
-- Seed: Categories
-- -----------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, icon, display_order, active) VALUES
(UUID(),'Traditional Wear','traditional','Thobes, Kurtas, Jalabiyas, Shimagh & Ghutra — specialist care for regional garments.','Shirt',1,TRUE),
(UUID(),'Western Wear','western','Shirts, suits, dresses, trousers and everyday western garments.','Layers',2,TRUE),
(UUID(),'Footwear','footwear','Sneakers, leather shoes, heels and boots — restored and refreshed.','Footprints',3,TRUE),
(UUID(),'Home & Carpet','home','Bedsheets, curtains, blankets, carpets and rugs — deep cleaned.','Home',4,TRUE),
(UUID(),'Specialty Care','specialty','Wedding dresses, couture, leather and delicates — handled with couture-grade care.','Crown',5,TRUE),
(UUID(),'Accessories','accessories','Ties, scarves, belts and small leather goods.','Sparkles',6,TRUE);

-- -----------------------------------------------------------------
-- Seed: Services
-- -----------------------------------------------------------------
INSERT INTO services (id, name, slug, description, icon, base_price, turnaround_hours, active) VALUES
(UUID(),'Wash & Fold','wash-fold','Gentle machine wash, expertly folded. Perfect for everyday wear.','Droplets',12,24,TRUE),
(UUID(),'Iron & Press','iron-press','Crisp, crease-free pressing on every garment.','Wind',8,24,TRUE),
(UUID(),'Wash & Iron','wash-iron','Wash and press in one — ready to wear.','WashingMachine',15,24,TRUE),
(UUID(),'Dry Clean','dry-clean','Solvent care for delicates, suits and stains.','Sparkles',25,48,TRUE),
(UUID(),'Footwear Care','footwear','Clean, deodorise and restore your shoes.','Footprints',20,48,TRUE),
(UUID(),'Home & Carpet','home-care','Deep clean for linens, curtains, carpets and rugs.','Home',30,72,TRUE);

-- -----------------------------------------------------------------
-- Seed: Subscription Plans
-- -----------------------------------------------------------------
INSERT INTO subscription_plans
  (id, name, slug, price, currency, period, pieces_per_booking, bookings_per_month, eligible_items, features, is_vip, popular, active)
VALUES
(UUID(),'T2 VIP','t2-vip',109,'QAR','month',20,4,20,
  JSON_ARRAY('Free pickup & delivery','Priority booking','Real-time tracking','Up to 4 service bookings / month','20 eligible items / month','24h priority turnaround'),TRUE,TRUE,TRUE),
(UUID(),'Pay As You Go','pay-as-you-go',0,'QAR','month',0,0,0,
  JSON_ARRAY('No commitment','Pay per item','Order anytime','Standard turnaround'),FALSE,FALSE,TRUE);

-- -----------------------------------------------------------------
-- Seed: Items (sample of the catalogue)
-- -----------------------------------------------------------------
INSERT INTO items (id, name, category, wash_price, iron_price, wash_iron_price, dryclean_price, popular, eligible_subscription, display_order, active) VALUES
(UUID(),'Thobe','Traditional Wear',12,8,18,0,TRUE,TRUE,1,TRUE),
(UUID(),'Kurta','Traditional Wear',10,7,16,0,FALSE,TRUE,2,TRUE),
(UUID(),'Jalabiya','Traditional Wear',12,8,18,25,FALSE,TRUE,3,TRUE),
(UUID(),'Shimagh','Traditional Wear',0,6,0,15,FALSE,TRUE,4,TRUE),
(UUID(),'Ghutra','Traditional Wear',0,5,0,12,FALSE,TRUE,5,TRUE),
(UUID(),'Formal Shirt','Western Wear',10,7,15,18,TRUE,TRUE,6,TRUE),
(UUID(),'Trousers','Western Wear',10,7,15,20,FALSE,TRUE,7,TRUE),
(UUID(),'Suit (2-piece)','Western Wear',0,0,0,55,FALSE,TRUE,8,TRUE),
(UUID(),'Dress','Western Wear',12,8,18,28,FALSE,TRUE,9,TRUE),
(UUID(),'Sneakers','Footwear',0,0,0,35,TRUE,TRUE,10,TRUE),
(UUID(),'Leather Shoes','Footwear',0,0,0,30,FALSE,TRUE,11,TRUE),
(UUID(),'Bedsheet (set)','Home & Carpet',18,0,0,0,FALSE,TRUE,12,TRUE),
(UUID(),'Carpet (per sqm)','Home & Carpet',0,0,0,25,FALSE,TRUE,13,TRUE),
(UUID(),'Wedding Dress','Specialty Care',0,0,0,150,TRUE,FALSE,14,TRUE),
(UUID(),'Leather Jacket','Specialty Care',0,0,0,60,FALSE,TRUE,15,TRUE);

-- -----------------------------------------------------------------
-- Seed: Sample members
-- -----------------------------------------------------------------
INSERT INTO members (id, full_name, email, phone, plan_name, status, start_date, end_date, bookings_used, bookings_allowed, items_used, items_allowed) VALUES
(UUID(),'Ahmed Al-Rashid','ahmed@example.com','+974 5555 1000','T2 VIP','active','2026-08-01','2026-08-31',1,4,5,20),
(UUID(),'Layla Hassan','layla@example.com','+974 5555 1001','T2 VIP','active','2026-07-15','2026-08-14',3,4,16,20),
(UUID(),'Omar Saif','omar@example.com','+974 5555 1002','Pay As You Go','active','2026-08-10',NULL,0,0,0,0);

-- -----------------------------------------------------------------
-- Seed: Sample orders
-- -----------------------------------------------------------------
INSERT INTO orders (id, order_code, customer_name, customer_phone, pickup_type, pickup_slot, items, total, status, payment_status, created_date) VALUES
(UUID(),'T2-A1B2C3','Ahmed Al-Rashid','+974 5555 1000','pickup','10:00 - 12:00',
  JSON_ARRAY(JSON_OBJECT('name','Thobe','category','Traditional Wear','service','Wash & Iron','quantity',3,'price',18)),54,'in_facility','unpaid','2026-08-14 09:30:00'),
(UUID(),'T2-D4E5F6','Layla Hassan','+974 5555 1001','pickup','14:00 - 16:00',
  JSON_ARRAY(JSON_OBJECT('name','Wedding Dress','category','Specialty Care','service','Dry Clean','quantity',1,'price',150)),150,'quality_check','paid','2026-08-13 11:00:00'),
(UUID(),'T2-G7H8I9','Omar Saif','+974 5555 1002','drop','08:00 - 10:00',
  JSON_ARRAY(JSON_OBJECT('name','Sneakers','category','Footwear','service','Footwear Care','quantity',1,'price',35)),35,'delivered','paid','2026-08-10 08:15:00');

-- END OF SQL SCRIPT