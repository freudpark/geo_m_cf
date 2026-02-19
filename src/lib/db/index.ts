export interface Target {
    id: number;
    name: string;
    url: string;
    was_cnt?: number;
    web_cnt?: number;
    db_info?: string;
    keyword?: string;
    interval?: number;
    is_active: number; // 1 or 0
    category?: string; // 지역교육청, 본청/직속기관
    created_at?: string;
}

export interface LogResult {
    target_id: number;
    status: number;
    latency: number;
    result: 'OK' | 'FAIL' | string;
    details?: string; // JSON string of { web, was, db } status
    checked_at?: string;
}

export async function get_targets(db: D1Database): Promise<Target[]> {
    try {
        const { results } = await db
            .prepare("SELECT * FROM Targets WHERE is_active = 1")
            .all<Target>();
        return results || [];
    } catch (e) {
        console.error("Error fetching targets:", e);
        return [];
    }
}

export async function save_log(db: D1Database, log: LogResult): Promise<void> {
    try {
        await db
            .prepare(
                "INSERT INTO Logs (target_id, status, latency, result) VALUES (?, ?, ?, ?)"
            )
            .bind(log.target_id, log.status, log.latency, log.result)
            .run();
    } catch (e) {
        console.error("Error saving log:", e);
    }
}
