import { sign, verify } from 'hono/jwt'
import type { Env } from '../types'
import { err } from './helpers'

const EXP = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days (unused legacy)

export async function signToken(env: Env): Promise<string> {
  // Compute expiry at request time (not module load) so tokens are always valid.
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
  return sign({ sub: 'admin', role: 'admin', exp }, env.ADMIN_JWT_SECRET, 'HS256')
}

export async function verifyToken(token: string, env: Env): Promise<boolean> {
  try {
    await verify(token, env.ADMIN_JWT_SECRET, 'HS256')
    return true
  } catch {
    return false
  }
}

export function getBearer(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

// Hono middleware for protected routes. Reads env from the request context.
export async function requireAdmin(c: any, next: any): Promise<Response | void> {
  const env = c.env as Env
  const token = getBearer(c.req.raw)
  if (!token || !(await verifyToken(token, env))) {
    return err('Neovlašten pristup (unauthorized).', 401)
  }
  await next()
}
