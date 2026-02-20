DROP TABLE IF EXISTS Targets;
DROP TABLE IF EXISTS Logs;

CREATE TABLE Targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    was_cnt INTEGER DEFAULT 0,
    web_cnt INTEGER DEFAULT 0,
    db_info TEXT,
    keyword TEXT,
    interval INTEGER DEFAULT 300,
    is_active INTEGER DEFAULT 1, -- 1: Active, 0: Inactive
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER,
    status INTEGER,
    latency INTEGER,
    result TEXT,
    details TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(target_id) REFERENCES Targets(id)
);

-- Initial Data (Optional)
INSERT INTO Targets (name, url, category, is_active) VALUES 
('경기도교육청', 'https://www.goe.go.kr', '본청', 1),
('북부청사', 'https://www.goe.go.kr/bukbu', '본청', 1);
