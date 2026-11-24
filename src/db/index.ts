import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type {NodePgQueryResultHKT} from 'drizzle-orm/node-postgres';
import { migrate as runMigrations } from 'drizzle-orm/node-postgres/migrator';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import pg from 'pg';
import { config } from '../config/env.ts';
import { logger } from '../logger.ts';
import * as schema from './schema.ts';

export const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
});


pool.on('error', e=> logger.error({msg: e.message}, 'pg pool error'));

export const db = drizzle(pool, {schema});

export type Executor = PgDatabase<NodePgQueryResultHKT, typeof schema>;

export const migrate = async () : Promise<void> => {
    const lock = await pool.connect();
    try {
        await lock.query('select pg_advisory_lock(727274)')
        await runMigrations(db, { migrationsFolder: 'drizzle' });
    }
    finally {
        await lock.query('select pg_advisory_unlock(727274)').catch(()=> undefined);
        lock.release();
    }
};

export const close =()=> pool.end();
export const purgeExpired = async()=>{
    await db.execute(sql`delete from rate_limits where reset_at < now()`);
    await db.execute(sql`delete from webhook_events where received_at < now() - interval'24 hours'`);

};