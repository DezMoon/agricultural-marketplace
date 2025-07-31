"use strict";
// Migration runner for database schema changes
// Usage: npm run migrate or npx ts-node scripts/migrate.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Database connection using same config as main app
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
async function runMigrations() {
    try {
        console.log('🚀 Starting database migrations...');
        // Create migrations table if it doesn't exist
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Get list of executed migrations
        const { rows: executedMigrations } = await pool.query('SELECT filename FROM migrations ORDER BY id');
        const executedFiles = executedMigrations.map(row => row.filename);
        // Get all migration files
        const migrationsDir = path_1.default.join(__dirname, '..', 'migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            console.log('📁 Creating migrations directory...');
            fs_1.default.mkdirSync(migrationsDir, { recursive: true });
        }
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        if (migrationFiles.length === 0) {
            console.log('📄 No migration files found.');
            return;
        }
        // Execute pending migrations
        for (const filename of migrationFiles) {
            if (!executedFiles.includes(filename)) {
                console.log(`⚡ Executing migration: ${filename}`);
                const filePath = path_1.default.join(migrationsDir, filename);
                const sql = fs_1.default.readFileSync(filePath, 'utf8');
                // Execute migration in a transaction
                await pool.query('BEGIN');
                try {
                    await pool.query(sql);
                    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
                    await pool.query('COMMIT');
                    console.log(`✅ Successfully executed: ${filename}`);
                }
                catch (error) {
                    await pool.query('ROLLBACK');
                    console.error(`❌ Failed to execute ${filename}:`, error.message);
                    throw error;
                }
            }
            else {
                console.log(`⏭️  Skipping already executed: ${filename}`);
            }
        }
        console.log('🎉 All migrations completed successfully!');
    }
    catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
// Run migrations
runMigrations();
//# sourceMappingURL=migrate.js.map