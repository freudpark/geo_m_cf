const https = require('https');

// Force SSL ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targetUrl = 'https://www.goese.kr/ko/page/main.do';

async function testConnection() {
    console.log(`[Diagnostic] Testing: ${targetUrl}`);

    try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const agent = new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            // Try forcing lower security ciphers if modern ones fail (legacy server support)
            ciphers: 'ALL',
            secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
        });

        console.log('[Diagnostic] Sending request...');
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive'
            },
            redirect: 'follow',
            agent: agent,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        console.log(`[Diagnostic] Status: ${response.status}`);
        console.log(`[Diagnostic] Headers:`, response.headers);
        console.log(`[Diagnostic] Latency: ${Date.now() - startTime}ms`);

        if (!response.ok) {
            console.log(`[Diagnostic] Body sample:`, (await response.text()).slice(0, 500));
        } else {
            console.log('[Diagnostic] SUCCESS!');
        }

    } catch (error) {
        console.error('[Diagnostic] FAILED!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) console.error('Error Cause:', error.cause);
        if (error.code) console.error('Error Code:', error.code);
    }
}

testConnection();
