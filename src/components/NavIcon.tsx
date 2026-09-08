import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  FlaskConical,
  FolderHeart,
  Globe2,
  Home,
  LayoutDashboard,
  Pill,
  Settings,
  Stethoscope,
  UserPlus,
  UserSearch,
  Users,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Home,
  Users,
  UserPlus,
  BarChart3,
  UserSearch,
  Stethoscope,
  FlaskConical,
  FolderHeart,
  Pill,
  CalendarCheck,
  CalendarDays,
  Globe2,
  Settings,
}

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Activity
  return <Icon className={className} aria-hidden="true" />
}
