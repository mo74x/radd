import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface ShellLocation {
  id: string;
  name: string;
  isPrimary?: boolean;
}

export interface ShellBusiness {
  id?: string;
  name?: string;
  plan?: string;
}

export interface ShellNotificationStatus {
  channel: 'telegram' | 'whatsapp' | 'email';
  connected: boolean;
  target?: string;
}
