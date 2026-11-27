import { z } from 'zod';
import { config } from '../config/env.ts';
import { profile } from 'console';
import { title } from 'process';
import { string } from 'zod/v4';
const Reply = z.object({ok:z.boolean(),user:z.object({profile:z.object({image_192:z.string().nullish(),title:z.string().nullish()})}).optional()});
export async function fetchProfile(slackId: string | null): Promise<{ avatar: string | null; title: string | null } | null> {
    if(!config.slackToken||!slackId)return null;
    try{
        const r = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(slackId)}`,{
            headers:{authorization:`Bearer ${config.slackToken}`},signal:AbortSignal.timeout(2500)
        });
        const j = Reply.safeParse(await r.json());
        if(!j.success|| !j.data.ok|| !j.data.user)return null;
        const p = j.data.user.profile;
        return{avatar:p.image_192 ?? null,title:p.title?.trim()||null};
    }catch{return null;}
}