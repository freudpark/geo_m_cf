// Mock Cloudflare D1 types for Vercel build compatibility
// Since we removed @cloudflare/workers-types to fix build conflicts

declare global {
    interface D1Result<T = unknown> {
        results?: T[];
        success: boolean;
        error?: string;
        meta?: any;
    }

    interface D1PreparedStatement {
        bind(...args: any[]): D1PreparedStatement;
        first<T = unknown>(colName?: string): Promise<T | null>;
        run<T = unknown>(): Promise<D1Result<T>>;
        all<T = unknown>(): Promise<D1Result<T>>;
        raw<T = unknown>(): Promise<T[]>;
    }

    interface D1Database {
        prepare(query: string): D1PreparedStatement;
        dump(): Promise<ArrayBuffer>;
        batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
        exec<T = unknown>(query: string): Promise<D1Result<T>>;
    }

    interface CloudflareEnv {
        DB: D1Database;
    }
}

export { };
