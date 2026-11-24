import type { RequestHandler } from "express";
import helmet from "helmet";
import { config } from "../config/env.ts";
import { originAllowed } from "./origin.ts"
const SAFE = new Set(['GET','HEAD','OPTIONS']);
