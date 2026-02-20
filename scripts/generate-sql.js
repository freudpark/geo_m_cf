const fs = require('fs');

// Helper to parse CSV
function parseCSV(text) {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/[\uFEFF\u200B]/g, ''));

    return lines.slice(1).map(line => {
        if (!line.trim()) return null;

        const values = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
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
            const key = header;
            obj[key] = values[index] !== undefined ? values[index] : '';
            return obj;
        }, {});
    }).filter(row => row !== null && Object.values(row).some(v => v));
}

function findValue(row, ...keys) {
    const rowKeys = Object.keys(row);
    for (const searchKey of keys) {
        if (row[searchKey] !== undefined && row[searchKey] !== '') return row[searchKey];
        for (const rKey of rowKeys) {
            if (rKey.trim() === searchKey) return row[rKey];
        }
        for (const rKey of rowKeys) {
            if (rKey.replace(/\s/g, '').includes(searchKey.replace(/\s/g, ''))) return row[rKey];
        }
    }
    return undefined;
}

try {
    const csvText = fs.readFileSync('data.csv', 'utf-8');
    const rows = parseCSV(csvText);

    const targets = rows.map(row => {
        const name = findValue(row, '홈페이지명', '사이트명', '이름', 'Name', 'Site');
        const urlVal = findValue(row, 'URL', '주소', 'Address', 'Link');
        const ip = findValue(row, 'IP', '아이피', 'ip');
        const category = findValue(row, '구분', '분류', 'Category', 'Type');
        const wasVal = findValue(row, 'WAS', 'WAS수', 'was_cnt', 'WAS Count', 'WAS목록', 'WAS서버');
        const webVal = findValue(row, 'WEB', 'WEB수', 'web_cnt', 'WEB Count', 'WEB목록', 'WEB서버');

        return {
            name: name || 'Unknown',
            url: urlVal,
            was_cnt: wasVal ? parseInt(wasVal, 10) : 0,
            web_cnt: webVal ? parseInt(webVal, 10) : 0,
            db_info: ip || '',
            category: category || '지역교육청'
        };
    }).filter(t => t.url && (t.url.startsWith('http') || t.url.startsWith('https')));

    console.log(`-- Parsed ${targets.length} valid targets`);

    let sql = 'DELETE FROM Targets;\n';

    // Split into batches of 10 to avoid SQL length limits
    const batchSize = 10;
    for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const values = batch.map(t => {
            const escape = str => str.replace(/'/g, "''");
            return `('${escape(t.name)}', '${escape(t.url)}', ${t.was_cnt}, ${t.web_cnt}, '${escape(t.db_info)}', '${t.category}', 1, 5, CURRENT_TIMESTAMP)`;
        });
        sql += `INSERT INTO Targets (name, url, was_cnt, web_cnt, db_info, category, is_active, interval, created_at) VALUES \n${values.join(',\n')};\n`;
    }

    // Save persistent URL
    sql += `INSERT OR REPLACE INTO Metadata (key, value) VALUES ('last_synced_url', 'https://docs.google.com/spreadsheets/d/1ba41P8uZN0IM5cqSZTUD0bUPdEu4fPasOxG1Dog2xEg/edit?usp=sharing');\n`;

    fs.writeFileSync('data.sql', sql);
    console.log('Successfully wrote data.sql');

} catch (e) {
    console.error('Error:', e);
}
