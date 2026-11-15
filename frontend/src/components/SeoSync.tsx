import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import { useSite } from '../store'
import type { Gallery, Post, PageItem } from '../types'

function setMeta(selector: string, attrs: Record<string, string>, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(selector)
  if (!node) {
    node = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => node!.setAttribute(key, value))
    document.head.append(node)
  }
  node.setAttribute('content', content)
}

function setPageMeta(input: { title: string; description: string; image: string; keywords: string; type?: string; schema: Record<string, unknown> }) {
  const canonical = `${window.location.origin}${window.location.pathname}`
  document.title = input.title
  setMeta('meta[name="description"]', { name: 'description' }, input.description)
  setMeta('meta[name="keywords"]', { name: 'keywords' }, input.keywords)
  setMeta('meta[name="robots"]', { name: 'robots' }, 'index,follow,max-image-preview:large')
  for (const [property, content] of Object.entries({
    'og:title': input.title,
    'og:description': input.description,
    'og:type': input.type || 'website',
    'og:url': canonical,
    'og:site_name': input.title.split(' — ').at(-1) || input.title,
    'og:image': input.image,
    'og:image:alt': input.title,
    'twitter:card': input.image ? 'summary_large_image' : 'summary',
    'twitter:title': input.title,
    'twitter:description': input.description,
    'twitter:image': input.image,
  })) setMeta(`meta[property="${property}"]`, { property }, content)
  let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonicalLink) {
    canonicalLink = document.createElement('link')
    canonicalLink.rel = 'canonical'
    document.head.append(canonicalLink)
  }
  canonicalLink.href = canonical
  let jsonLd = document.head.querySelector<HTMLScriptElement>('script[data-page-schema="true"]')
  if (!jsonLd) {
    jsonLd = document.createElement('script')
    jsonLd.type = 'application/ld+json'
    jsonLd.dataset.pageSchema = 'true'
    document.head.append(jsonLd)
  }
  jsonLd.textContent = JSON.stringify(input.schema)
}

export function SeoSync() {
  const { pathname } = useLocation()
  const { site } = useSite()

  useEffect(() => {
    let active = true
    const origin = window.location.origin
    const keywords = site.seo.keywords || ''
    const description = site.seo.description || site.description || site.tagline
    const siteUrl = `${origin}/`
    const apply = (meta: Parameters<typeof setPageMeta>[0]) => { if (active) setPageMeta(meta) }
    apply({
      title: site.seo.title || `${site.name} — ${site.tagline}`,
      description,
      image: site.seo.image ? new URL(site.seo.image, origin).href : '',
      keywords,
      schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: siteUrl, description, inLanguage: site.locale },
    })

    const gallerySlug = pathname.match(/^\/gallery\/([^/]+)/)?.[1]
    const postSlug = pathname.match(/^\/post\/([^/]+)/)?.[1]
    const pageSlug = pathname.match(/^\/page\/([^/]+)/)?.[1]
    if (gallerySlug) {
      api.get<{ gallery: Gallery }>(`/api/galleries/${gallerySlug}`).then(({ gallery }) => {
        const title = `${gallery.title} — ${site.name}`
        const tags = gallery.tags || []
        const image = gallery.cover ? new URL(gallery.cover, origin).href : ''
        apply({ title, description: gallery.description || description, image, keywords: [...new Set([...tags, ...keywords.split(',').map((tag) => tag.trim()).filter(Boolean)])].join(', '), schema: { '@context': 'https://schema.org', '@type': 'ImageGallery', name: gallery.title, url: `${origin}${pathname}`, description: gallery.description || description, keywords: tags.join(', '), image: image || undefined, isPartOf: { '@type': 'WebSite', name: site.name, url: siteUrl } } })
      }).catch(() => {})
    } else if (postSlug) {
      api.get<Post>(`/api/posts/${postSlug}`).then((post) => {
        const title = `${post.title} — ${site.name}`
        const image = post.cover ? new URL(post.cover, origin).href : ''
        apply({ title, description: post.excerpt || description, image, keywords: [...new Set([...(post.tags || []), ...keywords.split(',').map((tag) => tag.trim()).filter(Boolean)])].join(', '), type: 'article', schema: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt || description, datePublished: post.published_at, image: image || undefined, keywords: (post.tags || []).join(', '), mainEntityOfPage: `${origin}${pathname}`, author: { '@type': 'Person', name: site.name } } })
      }).catch(() => {})
    } else if (pageSlug) {
      api.get<PageItem>(`/api/pages/${pageSlug}`).then((page) => {
        const title = `${page.title} — ${site.name}`
        const pageDescription = (page.body || '').replace(/<[^>]*>/g, '').trim().slice(0, 160) || description
        apply({ title, description: pageDescription, image: '', keywords, schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: pageDescription, url: `${origin}${pathname}`, isPartOf: { '@type': 'WebSite', name: site.name, url: siteUrl } } })
      }).catch(() => {})
    }
    return () => { active = false }
  }, [pathname, site])

  return null
}
