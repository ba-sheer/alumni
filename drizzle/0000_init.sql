CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TYPE "member_status" AS ENUM ('visitor','alumni');
CREATE TYPE "application_status" AS ENUM('pending','approved','rejected');
CREATE TYPE "audit_action" AS ENUM ('approved','rejected','reopened','removed');
CREATE TABLE "members"(
    "id" text PRIMARY KEY NOT NULL ,"name" text DEFAULT '' NOT NULL "email" text,"slack_id" text,
    "status""member_status" DEFAULT 'visitor' NOT NULL,"bio" text,"github" text,"socials" text,
    "avatar" text,
    "grad_year" integer,"location"text,"currently"text,"skills"text[] DEFAULT '{}'::text[] NOT NULL,
    "listed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "members_grad_year_range"CHECK("grad_year"is null or "grad_year" between 1990 and 2100)
);