import { Target } from './index';

// Global In-Memory Store (Fallback for Edge Runtime)
declare global {
    var _mockMemoryDB: Target[];
    var _mockLogs: any[];
}

// Initialize Global Stores if not present
if (!global._mockMemoryDB) global._mockMemoryDB = [];
if (!global._mockLogs) global._mockLogs = [];

// Node.js FS (Only available in Node Environment)
let fs: any;
let path: any;
let DB_PATH = '';

// Helper to check environment and load modules
function isNodeEnv() {
    return process.env.NODE_ENV === 'development' && typeof process !== 'undefined' && process.versions && process.versions.node;
}

function ensureFs() {
    if (!isNodeEnv()) return false;
    try {
        if (!fs) {
            fs = require('fs');
            path = require('path');
            DB_PATH = path.join(process.cwd(), 'mock-db.json');
        }
        return true;
    } catch (e) {
        return false;
    }
}

const DEFAULT_TARGETS: Target[] = [];

function loadDB(): Target[] {
    // 1. Try Loading from Disk (Node Dev Only)
    if (ensureFs()) {
        try {
            if (!fs.existsSync(DB_PATH)) {
                fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_TARGETS, null, 2), 'utf-8');
                return DEFAULT_TARGETS;
            }
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            const fileData = JSON.parse(data);

            // Sync Disk -> Memory (so we have latest)
            global._mockMemoryDB = fileData;
            return fileData;
        } catch (e) {
            console.error('[MockDB] Failed to load DB from disk', e);
        }
    }

    // 2. Fallback to In-Memory (Edge / Production / FS Error)
    // console.log('[MockDB] Using In-Memory Store directly (No Persistence)');
    return global._mockMemoryDB || DEFAULT_TARGETS;
}

function saveDB(data: Target[]) {
    // 1. Update In-Memory
    global._mockMemoryDB = data;

    // 2. Try Saving to Disk (Node Dev Only)
    if (ensureFs()) {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        } catch (e) {
            console.error('[MockDB] Failed to save DB to disk', e);
        }
    }
}

export const mockDB = {
    prepare: (query: string) => {
        const runQuery = async (args: any[] = []) => {
            let targets = loadDB();

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
                saveDB(targets);
                return { success: true };
            }
            if (query.includes('UPDATE Targets')) {
                const id = args[1];
                const isActive = args[0];
                targets = targets.map(t => t.id === id ? { ...t, is_active: isActive } : t);
                saveDB(targets);
                return { success: true };
            }
            if (query.includes('DELETE FROM Targets')) {
                if (query.includes('WHERE id =')) {
                    const id = args[0];
                    targets = targets.filter(t => t.id !== id);
                } else {
                    // Delete All
                    console.log('[MockDB] Deleting ALL targets');
                    targets = [];
                }
                saveDB(targets);
                return { success: true };
            }
            // Logs
            if (query.includes('INSERT INTO Logs')) {
                const newLog = {
                    id: global._mockLogs ? global._mockLogs.length + 1 : 1,
                    target_id: args[0],
                    status: args[1],
                    latency: args[2],
                    result: args[3],
                    checked_at: args[4] ? new Date(args[4]).toISOString() : new Date().toISOString()
                };
                if (!global._mockLogs) global._mockLogs = [];
                global._mockLogs.push(newLog);
                return { success: true };
            }
            return { success: true };
        };

        const allQuery = async <T>(args: any[] = []) => {
            const targets = loadDB();

            if (query.includes('SELECT * FROM Targets')) {
                let results = targets;

                // Simple filter implementation
                if (query.includes('WHERE id =')) {
                    const id = args[0];
                    results = results.filter(t => t.id === id);
                } else if (query.includes('WHERE is_active = 1')) {
                    results = results.filter(t => t.is_active === 1);
                }

                // Handle ORDER BY (Basic)
                if (query.includes('ORDER BY id DESC')) {
                    results.sort((a, b) => b.id - a.id);
                } else if (query.includes('ORDER BY id ASC')) {
                    results.sort((a, b) => a.id - b.id);
                }

                return { results };
            }
            if (query.includes('SELECT * FROM Logs')) {
                const targetId = args[0];

                // Sort by checked_at DESC and LIMIT 1
                const logs = (global._mockLogs || [])
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
        console.log(`[MockDB] Batch execution of ${statements.length} items`);
        const results = [];
        for (const stmt of statements) {
            if (stmt && typeof stmt.run === 'function') {
                results.push(await stmt.run());
            }
        }
        return results;
    }
};
