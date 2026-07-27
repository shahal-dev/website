import type { NavigationMenuItem } from '@nuxt/ui'

export const navLinks: NavigationMenuItem[] = [{
  label: 'Home',
  icon: 'i-lucide-home',
  to: '/'
}, {
  label: 'Projects',
  icon: 'i-lucide-folder',
  to: '/projects'
}, {
  label: 'Gallery',
  icon: 'i-lucide-camera',
  to: '/gallery'
}, {
  label: 'Blog',
  icon: 'i-lucide-file-text',
  to: '/blog'
}, {
  label: 'Publications',
  icon: 'i-lucide-graduation-cap',
  to: '/publications'
}, {
  label: 'About',
  icon: 'i-lucide-user',
  to: '/about'
}]
