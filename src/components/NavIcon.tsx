import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  FlaskConical,
  FolderHeart,
  LayoutDashboard,
  Pill,
  Stethoscope,
  UserSearch,
  Users,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  BarChart3,
  UserSearch,
  Stethoscope,
  FlaskConical,
  FolderHeart,
  Pill,
  CalendarCheck,
}

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Activity
  return <Icon className={className} aria-hidden="true" />
}
