// Public contract of the members module and the only code that writes the `members` table.
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, ilike, isNotNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import type { Executor } from '../../db/index.ts';
import { members } from '../../db/schema.ts';
import { normalizeProfile } from './rules.ts';
import type { ProfileInput } from './rules.ts';
export type { ProfileInput } from './rules.ts';
import { like } from '../../lib/sql.ts';
import { paginate } from '../../lib/paginate.ts';
type Status = 'visitor' | 'alumni';
export const upsert = async (m: { id: string; name: string; email: string | null; slackId: string | null }) => {
  const [row] = await db.insert(members).values(m).onConflictDoUpdate({ target: members.id, set: { name: m.name, email: m.email, slackId: m.slackId } }).returning();
  if (!row) throw new Error('member upsert returned no row');
  return row;
};
export const get = async (id: string) => (await db.select().from(members).where(eq(members.id, id)))[0];
export const setStatus = async (id: string, status: Status, ex: Executor = db): Promise<void> => { await ex.update(members).set({ status }).where(eq(members.id, id)); };
/** Slack supplies defaults: the avatar always refreshes, the description only fills in when empty (or when overwrite is set). */
export const applySlackDefaults = async (id: string, s: { avatar: string | null; title: string | null }, o: { overwrite?: boolean } = {}): Promise<void> => {
  const bio = o.overwrite ? sql`coalesce(${s.title}, ${members.bio})` : sql`coalesce(${members.bio}, ${s.title})`;
  await db.update(members).set({ avatar: sql`coalesce(${s.avatar}, ${members.avatar})`, bio }).where(eq(members.id, id));
};
type Filters = { q?: string; year?: number | null; skill?: string; loc?: string };
const visible = (f: Filters): SQL => and(eq(members.status, 'alumni'), eq(members.listed, true), ilike(members.name, like(f.q ?? '')),
  f.year ? eq(members.gradYear, f.year) : undefined, f.skill ? sql`${f.skill} = any(${members.skills})` : undefined,
  f.loc ? ilike(members.location, like(f.loc)) : undefined) ?? sql`true`;
export const SORTS = ['name', 'year_desc', 'year_asc'] as const;
export type Sort = (typeof SORTS)[number];
const ORDER: Record<Sort, SQL[]> = {
  name: [asc(members.name), asc(members.id)],
  year_desc: [sql`${members.gradYear} desc nulls last`, asc(members.name), asc(members.id)],
  year_asc: [sql`${members.gradYear} asc nulls last`, asc(members.name), asc(members.id)],
};
export const listAlumni = (o: Filters & { page: number; per: number; sort: Sort }) =>
  db.select({ id: members.id, name: members.name, avatar: members.avatar, gradYear: members.gradYear, currently: members.currently, location: members.location,
    socials: members.socials, email: sql<string | null>`case when ${members.showEmail} then ${members.email} end` })
    .from(members).where(visible(o)).orderBy(...ORDER[o.sort]).limit(o.per).offset((o.page - 1) * o.per);
export const countAlumni = async (f: Filters): Promise<number> => (await db.select({ n: sql<number>`count(*)::int` }).from(members).where(visible(f)))[0]?.n ?? 0;
export const getAlumni = async (id: string) => (await db.select({ id: members.id, name: members.name, bio: members.bio, avatar: members.avatar, github: members.github,
  socials: members.socials, slackId: members.slackId, showSlack: members.showSlack, gradYear: members.gradYear, location: members.location, currently: members.currently,
  skills: members.skills, email: sql<string | null>`case when ${members.showEmail} then ${members.email} end` })
  .from(members).where(and(eq(members.id, id), eq(members.status, 'alumni'), eq(members.listed, true))))[0];
export const listYears = async (): Promise<number[]> =>
  (await db.selectDistinct({ y: members.gradYear }).from(members).where(and(eq(members.status, 'alumni'), eq(members.listed, true), isNotNull(members.gradYear))).orderBy(desc(members.gradYear)))
    .flatMap(r => (r.y === null ? [] : [r.y]));
export const topSkills = async (n = 30): Promise<string[]> =>
  (await db.execute<{ s: string }>(sql`select s from members, unnest(skills) s where status = 'alumni' and listed group by s order by count(*) desc, s limit ${n}`)).rows.map(r => r.s);
export const setProfile = async (id: string, input: ProfileInput): Promise<{ errors: ('grad_year' | 'github')[] }> => {
  const p = normalizeProfile(input);
  if (p.errors.length) return { errors: p.errors };
  await db.update(members).set({ bio: p.bio, github: p.github, socials: p.socials, gradYear: p.gradYear, location: p.location, currently: p.currently,
    skills: p.skills, listed: p.listed, showSlack: p.showSlack, showEmail: p.showEmail }).where(eq(members.id, id));
  return { errors: [] };
};
/** A reviewer adds an alumnus directly. The result is an ordinary alumni row (generated id, no Hack Club sign-in yet); nothing marks it as manual. */
export const addAlumnus = async (input: ProfileInput & { name: string }, ex: Executor = db): Promise<{ id: string | null; errors: ('name' | 'grad_year' | 'github')[] }> => {
  const p = normalizeProfile(input), name = input.name.trim();
  const errors: ('name' | 'grad_year' | 'github')[] = [];
  if (!name) errors.push('name');
  errors.push(...p.errors);
  if (errors.length) return { id: null, errors };
  const id = randomUUID();
  await ex.insert(members).values({ id, name, status: 'alumni', bio: p.bio, github: p.github, socials: p.socials, gradYear: p.gradYear, location: p.location, currently: p.currently, skills: p.skills });
  return { id, errors: [] };
};
export const adminMembers = async (o: { q: string; status: 'alumni' | 'visitor' | 'all'; page: number; per: number }) => {
  const where = and(ilike(members.name, like(o.q)), o.status === 'all' ? undefined : eq(members.status, o.status)) ?? sql`true`;
  const total = (await db.select({ n: sql<number>`count(*)::int` }).from(members).where(where))[0]?.n ?? 0;
  const { page, pages, offset } = paginate(total, o.page, o.per);
  const rows = await db.select({ id: members.id, name: members.name, email: members.email, status: members.status, gradYear: members.gradYear }).from(members).where(where)
    .orderBy(asc(members.name), asc(members.id)).limit(o.per).offset(offset);
  return { rows, total, page, pages };
};