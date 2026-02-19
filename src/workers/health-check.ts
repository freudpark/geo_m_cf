import { Target } from '../lib/db';

export interface Env {
    DB: D1Database;
}

export default {
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        // Fetch active targets
        const { results: targets } = await env.DB.prepare(
            "SELECT * FROM Targets WHERE is_active = 1"
        ).all<Target>();

        if (!targets || targets.length === 0) {
            console.log("No active targets to check.");
            return;
        }

        const BATCH_SIZE = 10;
        for (let i = 0; i < targets.length; i += BATCH_SIZE) {
            const batch = targets.slice(i, i + BATCH_SIZE);
            await Promise.allSettled(batch.map(target => checkTarget(target, env.DB)));
        }
    },
};

async function checkTarget(target: Target, db: D1Database): Promise<void> {
    const startTime = Date.now();
    let status = 0;
    let result = 'FAIL';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        // Low-impact: HEAD by default, GET with Range if keyword needed
        const method = target.keyword ? 'GET' : 'HEAD';
        const headers: HeadersInit = {
            'User-Agent': 'EduMonitor/1.0 (Gyeonggi Education)',
        };

        if (target.keyword) {
            headers['Range'] = 'bytes=0-4096'; // Read first 4KB
        }

        const response = await fetch(target.url, {
            method,
            headers,
            signal: controller.signal,
            redirect: 'follow'
        });
        clearTimeout(timeoutId);

        status = response.status;
        const latency = Date.now() - startTime;

        if (response.ok) {
            if (target.keyword) {
                const text = await response.text();
                // Simple substring check
                if (text.includes(target.keyword)) {
                    result = 'OK';
                } else {
                    // Encoding issues might cause failure, but we assume UTF-8 for now
                    // or the user needs to provide exact keyword present in source
                    result = 'FAIL:Keyword Not Found';
                }
            } else {
                result = 'OK';
            }
        } else {
            result = `FAIL:HTTP ${status}`;
        }

        // Save Log
        await db.prepare(
            "INSERT INTO Logs (target_id, status, latency, result) VALUES (?, ?, ?, ?)"
        ).bind(target.id, status, latency, result).run();

    } catch (err: any) {
        const latency = Date.now() - startTime;
        await db.prepare(
            "INSERT INTO Logs (target_id, status, latency, result) VALUES (?, ?, ?, ?)"
        ).bind(target.id, 0, latency, `FAIL:${err.message || 'Error'}`).run();
    }
}
