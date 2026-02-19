process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targets = [
    { name: '남부유아체험교육원', url: 'https://www.kench.kr' },
    { name: '안전교육관', url: 'https://www.goese.kr' }
];

async function testTarget(target) {
    console.log(`[START] ${target.name} (${target.url})`);
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            // Try removing Upgrade-Insecure-Requests for goese.kr if it causes 400
            // but keep for others?
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'keep-alive'
        };

        const response = await fetch(target.url, {
            method: 'GET',
            headers: headers,
            signal: controller.signal,
            redirect: 'follow', // standard fetch redirect
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        console.log(`[DONE] ${target.name} - Status: ${response.status}`);
        if (!response.ok) {
            console.log(`Error Text: ${response.statusText}`);
            // Peek at body for 400/403 cues
            try {
                const text = await response.text();
                console.log(`Body Sample: ${text.substring(0, 200)}`);
            } catch (e) { }
        }

    } catch (error) {
        console.error(`[FAIL] ${target.name}`);
        console.error('Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
    console.log(`Latency: ${Date.now() - startTime}ms\n`);
}

async function run() {
    console.log('--- Starting Diagnostic ---\n');
    for (const t of targets) {
        await testTarget(t);
    }
    console.log('--- Finished ---');
}

run();
