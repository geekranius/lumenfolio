import type { Env } from '../types'

export function siteId(env: Env): string {
  return (env.SITE_ID || 'default').trim() || 'default'
}

export function imageKey(env: Env, galleryId: string, imageId: string, width: string | number): string {
  return `galleries/${galleryId}/${imageId}/${width}.webp`
}

export function imagePath(env: Env, galleryId: string, imageId: string, width: string | number): string {
  return `/files/galleries/${galleryId}/${imageId}/${width}.webp`
}

export function pickWidth(variants: number[], preferred = 640): number {
  if (!variants.length) return preferred
  const exact = variants.find((v) => v === preferred)
  if (exact) return exact
  const larger = variants.filter((v) => v >= preferred).sort((a, b) => a - b)[0]
  return larger ?? variants[variants.length - 1]
}

export async function serveObject(env: Env, key: string): Promise<Response> {
  const obj = await env.BUCKET.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  headers.set('access-control-allow-origin', '*')
  return new Response(obj.body, { headers })
}

export async function deleteObjectPrefix(env: Env, prefix: string): Promise<void> {
  // R2 list + delete. Lists are paginated; cap at 1000 to stay within limits.
  const listed = await env.BUCKET.list({ prefix, limit: 1000 })
  for (const o of listed.objects) {
    await env.BUCKET.delete(o.key)
  }
}
