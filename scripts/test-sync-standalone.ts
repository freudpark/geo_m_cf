const fetch = require('node-fetch');
// @ts-ignore
global.fetch = fetch;

// Helper to parse CSV (Copied from actions/index.ts)
function parseCSV(text: string): any[] {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    // Clean headers: remove quotes and invisible characters
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/[\uFEFF\u200B]/g, ''));

    return lines.slice(1).map(line => {
        // Skip empty lines
        if (!line.trim()) return null;

        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { // Handle escaped quotes
                    currentValue += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        return headers.reduce((obj, header, index) => {
            // Map known headers (Korean) to English keys
            const key = header;
            obj[key] = values[index] !== undefined ? values[index] : '';
            return obj;
        }, {} as any);
    }).filter((row: any) => row !== null && Object.values(row).some(v => v));
}

// Helper to safely find a key in a row object ignoring whitespace
function findValue(row: any, ...keys: string[]) {
    const rowKeys = Object.keys(row);
    for (const searchKey of keys) {
        // 1. Exact match
        if (row[searchKey] !== undefined && row[searchKey] !== '') return row[searchKey];

        // 2. Trimmed match
        for (const rKey of rowKeys) {
            if (rKey.trim() === searchKey) return row[rKey];
        }

        // 3. Includes match (e.g. " 홈페이지명 " matches "홈페이지명")
        for (const rKey of rowKeys) {
            if (rKey.replace(/\s/g, '').includes(searchKey.replace(/\s/g, ''))) return row[rKey];
        }
    }
    return undefined;
}

async function testSync() {
    console.log('--- Starting Standalone Sync Test ---');
    const url = 'https://docs.google.com/spreadsheets/d/1ba41P8uZN0IM5cqSZTUD0bUPdEu4fPasOxG1Dog2xEg/edit?usp=sharing';

    try {
        let exportUrl = url;

        // Convert standard Google Sheet URL to CSV export URL
        if (url.includes('docs.google.com/spreadsheets/d/')) {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
            }
        }

        console.log(`[Sync] Fetching CSV from: ${exportUrl}`);
        const response = await fetch(exportUrl);

        console.log(`[Sync] Fetch response status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch. Status: ${response.status}`);
        }

        const csvText = await response.text();
        console.log(`[Sync] CSV text length: ${csvText.length}`);

        const rows = parseCSV(csvText);
        console.log(`[Sync] Parsed rows count: ${rows.length}`);

        if (rows.length === 0) {
            console.error('CSV parsed but 0 rows found.');
            return;
        }

        console.log(`[Sync] Parsed Headers:`, Object.keys(rows[0]));
        // console.log(`[Sync] First Row Sample:`, rows[0]);

        // Map columns with fuzzy matching
        const targets = rows.map((row: any) => {
            const name = findValue(row, '홈페이지명', '사이트명', '이름', 'Name', 'Site');
            const urlVal = findValue(row, 'URL', '주소', 'Address', 'Link');
            const ip = findValue(row, 'IP', '아이피', 'ip');
            const category = findValue(row, '구분', '분류', 'Category', 'Type');

            const wasVal = findValue(row, 'WAS', 'WAS수', 'was_cnt', 'WAS Count', 'WAS목록', 'WAS서버');
            const webVal = findValue(row, 'WEB', 'WEB수', 'web_cnt', 'WEB Count', 'WEB목록', 'WEB서버');

            // Debugging first row
            if (row === rows[0]) {
                console.log('[Sync Debug] Row Keys:', Object.keys(row));
                console.log('[Sync Debug] Found WAS:', wasVal);
                console.log('[Sync Debug] Found WEB:', webVal);
            }

            return {
                name: name || 'Unknown',
                url: urlVal,
                was_cnt: wasVal ? parseInt(wasVal, 10) : 0,
                web_cnt: webVal ? parseInt(webVal, 10) : 0,
                db_info: ip || '',
                keyword: undefined,
                interval: 5,
                is_active: 1,
                category: category || '지역교육청'
            };
        }).filter((t: any) => t.url && (t.url.startsWith('http') || t.url.startsWith('https')));

        console.log(`[Sync] Valid targets found: ${targets.length}`);

        // Generate SQL
        const values = targets.map((t: any) => {
            const escape = (str: string) => str.replace(/'/g, "''");
            return `('${escape(t.name)}', '${escape(t.url)}', ${t.was_cnt}, ${t.web_cnt}, '${escape(t.db_info)}', '${t.category || '지역교육청'}', 1, 5, CURRENT_TIMESTAMP)`;
        });

        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < values.length; i += batchSize) {
            batches.push(values.slice(i, i + batchSize));
        }

        console.log('--- SQL STATEMENTS START ---');
        console.log('DELETE FROM Targets;');
        batches.forEach(batch => {
            console.log(`INSERT INTO Targets (name, url, was_cnt, web_cnt, db_info, category, is_active, interval, created_at) VALUES ${batch.join(',\n')};`);
        });
        console.log('--- SQL STATEMENTS END ---');

    } catch (e: any) {
        console.error('Test Error:', e);
    }
}

testSync();
