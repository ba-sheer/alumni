import { z } from 'zod';
import { limits } from '../config/limits.ts'

export const pageParam = z.coerce.number().int().min(1).max(limits.maxPage).catch(1);
export const searchParam = z.string().max(80).catch('');