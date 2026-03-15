-- SingleStore bootstrap for Asolaria
-- Run this in the SingleStore SQL editor after workspace status is Running.

CREATE DATABASE IF NOT EXISTS asolaria_control;

CREATE USER IF NOT EXISTS 'asolaria_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON asolaria_control.* TO 'asolaria_app'@'%';
FLUSH PRIVILEGES;

USE asolaria_control;

CREATE TABLE IF NOT EXISTS agent_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload_json JSON NULL,
  KEY idx_event_ts (event_ts),
  KEY idx_source_type (source, event_type)
);

CREATE TABLE IF NOT EXISTS task_runs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(128) NOT NULL,
  run_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) NOT NULL,
  duration_ms BIGINT NULL,
  detail_json JSON NULL,
  KEY idx_task_run_ts (task_id, run_ts),
  KEY idx_status (status)
);
