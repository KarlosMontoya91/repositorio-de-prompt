import {
  Bot,
  Braces,
  FilePenLine,
  Image,
  Megaphone,
  Palette,
  Sparkles,
} from 'lucide-react'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa'

const icons = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
  script: FilePenLine,
  marketing: Megaphone,
  image: Image,
  code: Braces,
  palette: Palette,
  bot: Bot,
  sparkles: Sparkles,
}

export default function CategoryIcon({ iconKey, size = 18, strokeWidth = 1.8 }) {
  const Icon = icons[iconKey] || Sparkles
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />
}

export const categoryIconOptions = Object.keys(icons)
