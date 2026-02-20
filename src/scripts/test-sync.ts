const fetch = require('node-fetch');
// @ts-ignore
global.fetch = fetch;

// Mock process.env for getDB
process.env.NODE_ENV = 'development';

// Mock D1Database for local testing
const mockD1 = {
    prepare: (query: string) => ({
        bind: (...args: any[]) => ({
            run: async () => ({ success: true }),
            all: async () => ({ results: [] }),
            first: async () => null,
        }),
        run: async () => ({ success: true }),
        all: async () => ({ results: [] }),
    }),
    batch: async () => ({ success: true }),
};

// We need to mock the getDB function in actions/index.ts.
// Since we can't easily mock module exports in this simple script without jest,
// we'll copy the core logic of syncGoogleSheet here to test the fetch/parse part.
// This confirms if the URL is valid and CSV parsing works.

import { syncGoogleSheet } from '../actions/index';

// However, syncGoogleSheet imports getDB internally. 
// If we run it, it will try to call getDB.
// In development mode, getDB tries to load '../lib/db/mock'.
// We should ensure '../lib/db/mock' exists or mock it specifically.
// But simpler: just run it and see the logs. The getDB might fail but the FETCH logs should appear first!

async function testSync() {
    console.log('--- Starting Sync Test ---');
    const url = 'https://docs.google.com/spreadsheets/d/1ba41P8uZN0IM5cqSZTUD0bUPdEu4fPasOxG1Dog2xEg/edit?usp=sharing';

    try {
        console.log('Calling syncGoogleSheet...');
        // We expect this to execute fetch and log "Fetch response status".
        // If it fails at DB step, that's fine for now, we want to prove "Click -> Fetch" works.
        const result = await syncGoogleSheet(url);
        console.log('Result:', result);
    } catch (e) {
        console.error('Test Error (likely DB related, which is expected):', e);
    }
}

testSync();
