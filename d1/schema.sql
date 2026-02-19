-- EduMonitor D1 Database Schema

-- Targets: Monitoring targets (websites)
DROP TABLE IF EXISTS Targets;
CREATE TABLE IF NOT EXISTS Targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- 홈페이지명 (예: 경기도교육청)
  url TEXT NOT NULL, -- 접속 주소
  was_cnt INTEGER DEFAULT 0, -- WAS 수
  web_cnt INTEGER DEFAULT 0, -- WEB 수
  db_info TEXT, -- DB 정보 (예: Oracle 19c)
  keyword TEXT, -- 점검 키워드 (해킹 감지용)
  interval INTEGER DEFAULT 5, -- 점검 주기 (분)
  is_active INTEGER DEFAULT 1, -- 활성화 여부 (1: 활성, 0: 비활성)
  category TEXT DEFAULT '지역교육청', -- 구분 (지역교육청, 본청/직속기관)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Logs: Monitoring history
DROP TABLE IF EXISTS Logs;
CREATE TABLE IF NOT EXISTS Logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER NOT NULL,
  status INTEGER, -- HTTP Status code
  latency INTEGER, -- ms
  result TEXT, -- OK, FAIL:Reason
  details TEXT, -- JSON Details { web, was, db }
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_id) REFERENCES Targets(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_target_id_checked_at ON Logs(target_id, checked_at DESC);
