import { randomUUID }from 'node:crypto';
import {and,asc,desc,eq,ilike,isNotNull,sql} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import type { Executor } from '../../db/index.ts';
import { members } from '../../db/schema.ts';
import { normalizeProfile } from './rules.ts';
import type { ProfileInput } from './rules.ts';
export type { ProfileInput }from './rules.ts';
import { like } from '../../lib/sql.ts';
import { paginate } from '../../lib/paginate.ts';

type Status ='visitor'|'alumni';
export const upsert = async (m:{
    id:string;
    name:string;
    email:string | null;
    slackId:string |null
})=>{
    const [row] = await db.insert(members).values(m).onConflictDoUpdate({target:members.id,
        set:{name: m.name,
            email: m.email,
            slackId: m.slackId,
        }
    }).returning();
};

export const get = async (id:string)=>(await db.select().from(members).where(eq(members.id,id)))[0];
export const setStatus = async(
    id:string,
    status:Status,
    ex:Executor = db
):Promise<void>=>{
    await ex.update(members).set({status}).where(eq(members.id,id));
};
export const applySlackDefaults = async(id:string,s:{avatar:string|null;
    title:string |null
},o:{overwrite?:boolean}={}):Promise<void> =>{
    const bio = o.overwrite ? sql`coalesce(${s.title},${members.bio})`:sql`coalesce(${members.bio},${s.title})`;
    await
}