import connectPg from 'connect-pg-simple';
import { sql } from 'drizzle-orm';
import session from 'express-session';
import { config } from '../config/env.ts';
import { limits } from '../config/limits.ts';
import { db, pool } from '../db/index.ts';
const PgStore = connectPg(session);
export const sessionMiddleware = session({
    name:'hca',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgStore({pool,tableName:'session',createTableIfMissing:false,pruneSessionInterval:15*60,ttl:limits.sessionTtlMs/1000}),
    cookie:{httpOnly:true,secure:config.isProd,sameSite:'lax',maxAge:limits.sessionTtlMs},
})

export const revokeSessions = async (uid:string):Promise<void> =>{
    await db.execute(sql`delete from session where sess->>'uid'=${uid}`);
};