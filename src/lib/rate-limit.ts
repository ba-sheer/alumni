import { sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import type { IncrementResponse } from "express-rate-limit";
import { limits } from "../config/limits.ts";
import { db } from "../db/index.ts";

export class PgRateLimitStore implements Store{
    prefix: string;
    windowMs: number;
    constructor(prefix:string,windowMs: number = limits.rate.windowMs){
        this.prefix = prefix;
        this.windowMs = windowMs;
    }
    init(options:Options):void {this.windowMs = options.windowMs;}
    async increment(key:string): Promise<IncrementResponse>{
        const k = `${this.prefix}:${key}`;
        const res = await db.execute<{count:number;reset_at:Date}>(sql`insert into rate_limits (key,count,reser_at) values (${k},1,now()+${this.windowMs}*interval'1 milliscond)`)
    }
}