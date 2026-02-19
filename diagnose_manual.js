process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targets = [
    { name: '안전교육관(Base)', url: 'https://www.goese.kr', manual: true },
    { name: '안전교육관(Full)', url: 'https://www.goese.kr/ko/page/main.do', manual: true },
    { name: '남부유아(Base)', url: 'https://www.kench.kr', manual: true },
    { name: '남부유아(Full)', url: 'https://www.kench.kr/main.php', manual: true }
];

async function testTarget(t) {
    console.log(`\n[TEST] ${t.name} -> ${t.url}`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(t.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                // Mimic the simple headers I put in monitor.ts
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Connection': 'keep-alive'
            },
            signal: controller.signal,
            redirect: 'manual',
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Location Header: ${response.headers.get('location')}`);

        if (response.status >= 200 && response.status < 400) {
            console.log('RESULT: OK (Healthy)');
        } else {
            console.log('RESULT: FAIL');
        }

    } catch (err) {
        console.log(`ERROR: ${err.message}`);
        console.log('RESULT: FAIL');
    }
}

async function run() {
    for (const t of targets) {
        await testTarget(t);
    }
}

run();
