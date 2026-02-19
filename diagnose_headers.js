process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Headers that worked in CURL (from previous success)
// User-Agent: curl/8.16.0
// Accept: */*

const curlHeaders = {
    'User-Agent': 'curl/8.16.0',
    'Accept': '*/*',
    'Connection': 'keep-alive'
};

// Headers that failed (from my previous attempt)
const modernHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Connection': 'keep-alive'
};

async function testWithHeaders(name, url, headers) {
    console.log(`\n[Testing] ${name} with headers:`, JSON.stringify(headers));
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            signal: controller.signal,
            redirect: 'manual',
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.status >= 200 && response.status < 400) console.log('PASS');
        else console.log('FAIL');

    } catch (e) {
        console.log('ERROR:', e.message);
    }
}

async function run() {
    // Test goese.kr with failed headers (to confirm failure)
    await testWithHeaders('Goese (Modern)', 'https://www.goese.kr', modernHeaders);
    // Test goese.kr with curl headers (to confirm success)
    await testWithHeaders('Goese (Curl-like)', 'https://www.goese.kr', curlHeaders);

    // Test kench.kr
    await testWithHeaders('Kench (Modern)', 'https://www.kench.kr', modernHeaders);
    await testWithHeaders('Kench (Curl-like)', 'https://www.kench.kr', curlHeaders);
}

run();
