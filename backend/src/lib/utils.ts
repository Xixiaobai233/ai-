import { Request } from 'express';

/** Express 5 params can be string | string[], force-cast to string */
export function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}
