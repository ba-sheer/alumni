import { sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import type { IncrementResponse } from "express-rate-limit";
import { limits } from "../config/limits.ts";
import { db } from "../db/index.ts";