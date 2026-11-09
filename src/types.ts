export interface Env {
  DB: D1Database
  BUCKET: R2Bucket
  AI: Ai
  ASSETS: Fetcher
  ADMIN_PASSWORD: string
  ADMIN_JWT_SECRET: string
  RAPIDRAW_API_KEY?: string
  MCP_API_KEY?: string
  SITE_ID?: string
  ENABLE_AI?: string
  DEFAULT_LOCALE?: string
  PUBLIC_BASE_URL?: string
}

export interface Social {
  platform: string // instagram | facebook | tiktok | youtube | x | behance | vimeo | website | email
  url: string
  label?: string
}

export interface Embed {
  platform: string
  url: string
  caption?: string
}

export interface SiteSettings {
  name: string
  tagline: string
  description: string
  logo: string
  avatar: string
  locale: 'hr' | 'en'
  theme: 'dark' | 'light' | 'auto'
  accent: string
  about: string
  contact: {
    email: string
    phone: string
    address: string
    city: string
  }
  socials: Social[]
  embeds: Embed[]
  seo: {
    title: string
    description: string
    image: string
    keywords: string
  }
  showCalendar: boolean
  showPosts: boolean
  design: Record<string, any>
}

export interface Gallery {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image_id: string | null
  event_date: string | null
  event_end_date: string | null
  location: string | null
  tags: string[]
  context?: string | null
  sort_order: number
  status: string
  created_at: string
  image_count: number
  cover: string | null
}

export interface ImageRecord {
  id: string
  gallery_id: string
  width: number | null
  height: number | null
  alt: string | null
  caption: string | null
  tags: string[]
  variants: number[]
  sort_order: number
  created_at: string
}
