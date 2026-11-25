import { eq } from "drizzle-orm";
import type { Request, RequestHandler } from "express";
import { config } from "../../config/env.ts";
import { db } from "../../db/index.ts";
import { HttpError } from "../../lib/errors.ts";
import { members } from "../../db/schema.ts";
