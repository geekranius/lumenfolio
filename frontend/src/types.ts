export interface Social {
  platform: string
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
  contact: { email: string; phone: string; address: string; city: string }
  socials: Social[]
  embeds: Embed[]
  seo: { title: string; description: string; image: string; keywords: string }
  showCalendar: boolean
  showPosts: boolean
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
  sort_order: number
  status: string
  created_at: string
  image_count: number
  cover: string | null
}

export interface ImageItem {
  id: string
  gallery_id: string
  width: number | null
  height: number | null
  alt: string | null
  caption: string | null
  tags: string[]
  sort_order: number
  variants: number[]
  src: string
  srcset: string
  placeholder: string
  full: string
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  time: string | null
  location: string | null
  gallery_id: string | null
  status: string
  created_at: string
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string | null
  cover: string | null
  tags: string[]
  status: string
  published_at: string
  created_at: string
}

export interface PageItem {
  id: string
  slug: string
  title: string
  body: string | null
  status: string
  created_at: string
}
