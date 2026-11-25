import { count } from 'console';
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

export const applications = pgTable('applications',{
    id:serial('id').primaryKey(),
    memberId: text('member_id').notNull().unique().references(()=> members.id,{
        onDelete:'cascade'
    }),
    answers: jsonb('answers').notNull().default(sql`'[]'::jsonb`),
    status: applicationStatus('status').notNull().default('pending'),
    score: integer('score'),
    note: text('note'),
    reviewedBy: text('reviewed_by').references(()=>members.id,{onDelete:'set null'}),
    createdAt: ts('created_at'),
},
t=>({scoreRange: check('applications_score_range',sql`${t.score} is null or ${t.score} between 0 and 5`)}));

export const contributions = pgTable('contributions',{
    id:serial('id').primaryKey(),
    applicationId: integer('application_id').notNull().references(()=> applications.id,{onDelete:'cascade'}),
    repoUrl: text('repo_url').notNull(),
},t=>({uniq:unique('contributions_app_repo').on(t.applicationId,t.repoUrl),
    http:check('contributions_http',sql`${t.repoUrl}~ '^https?://'`)
}));
export const audit = pgTable('audit',{
    id: serial('id').primaryKey(),
    applicationId: integer('application_id').references(()=>applications.id,{
        onDelete:'cascade'
    }),
    memberId: text('member_id').references(()=>members.id,{onDelete:'set null'}),
    actor: text('actor').references(()=>members.id,{onDelete:'set null'}),
    action: auditAction('action').notNull(),
    score: integer('score'),
    note:text('note'),
    at: ts('at'),
}, t=>({byApp: index('audit_app').on(t.applicationId,t.at)}));

export const rateLimits = pgTable('rate_limits',{
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    resetAt: timestamp('reset_at',{
        withTimezone:true
    }).notNull(),
},t=>({byReset: index('rate_limits_reset').on(t.resetAt)}));

export const webhookEvents = pgTable('webhook_events',{
    eventId: text('event_id').primaryKey(),
    source: text('source').notNull(),
    receivedAt:ts('recieved_at'),
},t=>({byTime:index('webhook_events_received').on(t.receivedAt)}));