import "@cloudflare/workers-types";

declare global {
    interface CloudflareEnv {
        DB: D1Database;
        [key: string]: unknown;
    }
}
