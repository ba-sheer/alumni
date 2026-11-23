import { sql }from 'drizzle-orm';
import { boolean, check, index, integer,jsonb,pgEnum, pgTable, serial, text,timestamp,unique} from 'drizzle-orm/pg-core';
export const memberStatus = pgEnum('member_status',['visitor','alumni']);
export const applicationStatus = pgEnum('application_status',['pending','approved','rejected']);
export const auditAction = pgEnum('audit_action',['approved','rejected','reopened','removed']);
const ts =(name:string)=>timestamp(name,{withTimezone:true}).notNull().defaultNow();

export const members = pgTable('members',{
    id: text('id').primaryKey(),
    name: text('name').notNull().default(''),
    email: text('email'),
    slackId: text('slack_id'),
    status: memberStatus('status').notNull().default('visitor'),
    bio: text('bio'),
    github: text('github'),
    socials: text('socials'),
    gradYear: integer('grad_year'),
    location: text('location'),
    currently:text('currently'),
    skills: text('skills').array().notNull().default(sql`'{}'::text[]`),
    listed: boolean('listed').notNull().default(true),
    showSlack: boolean('show_slack').notNull().default(true),
    showEmail: boolean('show_email').notNull().default(true),
    createdAt: ts('created_at'),
    updatedAt: ts('updated_at'),
},t=>({gradYearRange: check('members_grad_year_range',sql`${t.gradYear}is null or ${t.gradYear} between 1900 and 2100`),
alumniOrder:index('members_alumni_order').on(t.name,t.id).where(sql`${t.status} = 'alumni'`),
}));