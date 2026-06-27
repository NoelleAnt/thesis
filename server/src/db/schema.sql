-- Asap-Agap MySQL schema
-- Run via: npm run db:init (from server folder)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('ldrrmo', 'coordinator', 'camp_manager') NOT NULL,
  role_label VARCHAR(100) NOT NULL,
  email VARCHAR(120) DEFAULT '',
  office VARCHAR(120) DEFAULT '',
  center_id VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_center (center_id)
);

CREATE TABLE IF NOT EXISTS evacuation_centers (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(255) NOT NULL,
  barangay VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  coordinator_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  evacuees_total INT NOT NULL DEFAULT 0,
  evacuees_children INT NOT NULL DEFAULT 0,
  evacuees_seniors INT NOT NULL DEFAULT 0,
  evacuees_pregnant INT NOT NULL DEFAULT 0,
  evacuees_pwd INT NOT NULL DEFAULT 0,
  resource_food ENUM('sufficient', 'low', 'critical') NOT NULL DEFAULT 'sufficient',
  resource_water ENUM('sufficient', 'low', 'critical') NOT NULL DEFAULT 'sufficient',
  resource_medicines ENUM('sufficient', 'low', 'critical') NOT NULL DEFAULT 'sufficient',
  resource_hygiene_kits ENUM('sufficient', 'low', 'critical') NOT NULL DEFAULT 'sufficient',
  resource_sleeping_kits ENUM('sufficient', 'low', 'critical') NOT NULL DEFAULT 'sufficient',
  last_updated TIMESTAMP NULL,
  updated_by VARCHAR(100) NULL,
  INDEX idx_centers_status (status),
  INDEX idx_centers_barangay (barangay)
);

CREATE TABLE IF NOT EXISTS resource_requests (
  id VARCHAR(20) PRIMARY KEY,
  center_id VARCHAR(20) NOT NULL,
  resource ENUM('food', 'water', 'medicines', 'hygiene_kits', 'sleeping_kits') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL,
  reason TEXT NOT NULL,
  date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'under_review', 'approved', 'fulfilled', 'denied') NOT NULL DEFAULT 'pending',
  submitted_by VARCHAR(100) NOT NULL,
  reviewed_by VARCHAR(100) NULL,
  reviewed_at TIMESTAMP NULL,
  notes TEXT NULL,
  CONSTRAINT fk_requests_center FOREIGN KEY (center_id) REFERENCES evacuation_centers(id) ON DELETE CASCADE,
  INDEX idx_requests_status (status),
  INDEX idx_requests_center (center_id),
  INDEX idx_requests_priority (priority)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(30) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(36) NULL,
  user_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20) NULL,
  entity_id VARCHAR(30) NULL,
  details TEXT NOT NULL,
  INDEX idx_logs_action (action),
  INDEX idx_logs_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS system_counters (
  name VARCHAR(30) PRIMARY KEY,
  value INT NOT NULL
);
