import { Target } from './index';

// ============================================================================
// EDGE-SAFE Mock Database
// This file contains ZERO Node.js specific imports (no fs, no path).
// It is purely in-memory and safe to import from any runtime.
// ============================================================================

// Global In-Memory Store
declare global {
    var _mockMemoryDB: Target[];
    var _mockLogs: any[];
}

// Initialize Global Stores if not present
if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any)._mockMemoryDB) (globalThis as any)._mockMemoryDB = [];
    if (!(globalThis as any)._mockLogs) (globalThis as any)._mockLogs = [];
}

function getMemoryDB(): Target[] {
    return (globalThis as any)._mockMemoryDB || [];
}

function setMemoryDB(data: Target[]) {
    (globalThis as any)._mockMemoryDB = data;
}

function getMemoryLogs(): any[] {
    return (globalThis as any)._mockLogs || [];
}

function pushMemoryLog(log: any) {
    if (!(globalThis as any)._mockLogs) (globalThis as any)._mockLogs = [];
    (globalThis as any)._mockLogs.push(log);
}

export const mockDB = {
    prepare: (query: string) => {
        const runQuery = async (args: any[] = []) => {
            let targets = getMemoryDB();

            if (query.includes('INSERT INTO Targets')) {
                const newTarget = {
                    id: (targets.length > 0 ? Math.max(...targets.map(t => t.id)) : 0) + 1,
                    name: args[0],
                    url: args[1],
                    was_cnt: args[2] || 0,
                    web_cnt: args[3] || 0,
                    db_info: args[4] || '',
                    keyword: args[5],
                    interval: args[6] || 5,
                    is_active: args[7] !== undefined ? args[7] : 1,
                    category: args[8] || '교육지원청',
                    created_at: new Date().toISOString()
                };
                targets.push(newTarget);
                setMemoryDB(targets);
                return { success: true };
            }
            if (query.includes('UPDATE Targets')) {
                const id = args[1];
                const isActive = args[0];
                targets = targets.map(t => t.id === id ? { ...t, is_active: isActive } : t);
                setMemoryDB(targets);
                return { success: true };
            }
            if (query.includes('DELETE FROM Targets')) {
                if (query.includes('WHERE id =')) {
                    const id = args[0];
                    targets = targets.filter(t => t.id !== id);
                } else {
                    targets = [];
                }
                setMemoryDB(targets);
                return { success: true };
            }
            if (query.includes('INSERT INTO Logs')) {
                const newLog = {
                    id: getMemoryLogs().length + 1,
                    target_id: args[0],
                    status: args[1],
                    latency: args[2],
                    result: args[3],
                    checked_at: args[4] ? new Date(args[4]).toISOString() : new Date().toISOString()
                };
                pushMemoryLog(newLog);
                return { success: true };
            }
            return { success: true };
        };

        const allQuery = async <T>(args: any[] = []) => {
            const targets = getMemoryDB();

            if (query.includes('SELECT * FROM Targets')) {
                let results = [...targets];

                if (query.includes('WHERE id =')) {
                    const id = args[0];
                    results = results.filter(t => t.id === id);
                } else if (query.includes('WHERE is_active = 1')) {
                    results = results.filter(t => t.is_active === 1);
                }

                if (query.includes('ORDER BY id DESC')) {
                    results.sort((a, b) => b.id - a.id);
                } else if (query.includes('ORDER BY id ASC')) {
                    results.sort((a, b) => a.id - b.id);
                }

                return { results };
            }
            if (query.includes('SELECT * FROM Logs')) {
                const targetId = args[0];
                const logs = getMemoryLogs()
                    .filter((l: any) => l.target_id === targetId)
                    .sort((a: any, b: any) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());

                return { results: logs.length > 0 ? [logs[0]] : [] };
            }
            return { results: [] };
        };

        const stmt = {
            bind: (...args: any[]) => ({
                all: async <T>() => allQuery<T>(args),
                run: async () => runQuery(args),
                first: async <T>() => (await allQuery<T>(args)).results?.[0] || null,
                raw: async () => [],
            }),
            all: async <T>() => allQuery<T>(),
            run: async () => runQuery(),
            first: async <T>() => (await allQuery<T>()).results?.[0] || null,
            raw: async () => [],
        };
        return stmt;
    },
    batch: async (statements: any[]) => {
        const results = [];
        for (const stmt of statements) {
            if (stmt && typeof stmt.run === 'function') {
                results.push(await stmt.run());
            }
        }
        return results;
    }
};
