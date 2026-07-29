import {
  Home,
  Archive,
  Users,
  UsersRound,
  Camera,
  UtensilsCrossed,
  Landmark,
  CalendarClock,
  MapPin,
  FileText,
  Mic,
  Settings,
  HelpCircle,
  Sparkles,
  HeartHandshake,
  Bell,
  MessageCircle,
  Award,
  Network,
  FolderHeart,
  Clock3,
  Share2,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const navItems: NavItem[] = [
  { label: 'Home', href: '/app', icon: Home, description: 'Your dashboard' },
  { label: 'Rooted Studio', href: '/app/studio', icon: Sparkles, description: 'AI content creation' },
  { label: 'Archive Explorer', href: '/app/archive', icon: Archive, description: 'Browse everything' },
  { label: 'People', href: '/app/people', icon: Users, description: 'Family members' },
  { label: 'Families', href: '/app/families', icon: UsersRound, description: 'Family groups' },
  { label: 'Memories', href: '/app/memories', icon: Camera, description: 'Stories and moments' },
  { label: 'Photos', href: '/app/photos', icon: Camera, description: 'Photo gallery' },
  { label: 'Recipes', href: '/app/recipes', icon: UtensilsCrossed, description: 'Family recipes' },
  { label: 'Traditions', href: '/app/traditions', icon: Landmark, description: 'Customs and rituals' },
  { label: 'Timeline', href: '/app/timeline', icon: CalendarClock, description: 'Your family chronology' },
  { label: 'Family Tree', href: '/app/family-tree', icon: Network, description: 'Visual family relationships' },
  { label: 'Memory Map', href: '/app/memory-map', icon: MapPin, description: 'Places in your family history' },
  { label: 'Collections', href: '/app/heritage-collections', icon: FolderHeart, description: 'Themed heritage collections' },
  { label: 'Time Capsules', href: '/app/time-capsules', icon: Clock3, description: 'Messages for the future' },
  { label: 'Collaboration', href: '/app/collaboration', icon: HeartHandshake, description: 'Family collaboration' },
  { label: 'Discussions', href: '/app/discussions', icon: MessageCircle, description: 'Family conversations' },
  { label: 'Milestones', href: '/app/milestones', icon: Award, description: 'Collaboration achievements' },
  { label: 'Settings', href: '/app/settings', icon: Settings, description: 'Account and preferences' },
  { label: 'Help', href: '/app/help', icon: HelpCircle, description: 'Guides and support' },
];

export const secondaryNavItems: NavItem[] = [
  { label: 'Places', href: '/app/places', icon: MapPin, description: 'Significant locations' },
  { label: 'Events', href: '/app/events', icon: CalendarClock, description: 'Milestones' },
  { label: 'Documents', href: '/app/documents', icon: FileText, description: 'Letters and files' },
  { label: 'Voice Memories', href: '/app/voice', icon: Mic, description: 'Audio recordings' },
  { label: 'Notifications', href: '/app/notifications', icon: Bell, description: 'Your notification centre' },
  { label: 'Social Studio', href: '/app/studio/social', icon: Share2, description: 'Social media preparation' },
];
