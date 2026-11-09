import { Instagram, Facebook, Youtube, Twitter, Mail, Globe, Phone, Linkedin } from 'lucide-react'
import type { ReactNode } from 'react'
import { TikTokIcon } from './icons'
import type { Social } from '../types'

export function platformIcon(platform: string): ReactNode {
  switch ((platform || '').toLowerCase()) {
    case 'instagram':
      return <Instagram size={16} />
    case 'facebook':
      return <Facebook size={16} />
    case 'tiktok':
      return <TikTokIcon size={16} />
    case 'youtube':
      return <Youtube size={16} />
    case 'x':
    case 'twitter':
      return <Twitter size={16} />
    case 'linkedin':
      return <Linkedin size={16} />
    case 'email':
      return <Mail size={16} />
    case 'phone':
      return <Phone size={16} />
    default:
      return <Globe size={16} />
  }
}

export function SocialLinks({ socials }: { socials: Social[] }) {
  if (!socials?.length) return null
  return (
    <div className="footer-socials">
      {socials.map((s, i) => (
        <a key={i} className="social-pill" href={s.url} target="_blank" rel="noopener noreferrer">
          {platformIcon(s.platform)}
          <span>{s.label || s.platform}</span>
        </a>
      ))}
    </div>
  )
}
