import { 
  Globe, 
  BarChart, 
  Settings, 
  CreditCard, 
  Clock, 
  Users, 
  Link as LinkIcon,
  Map as MapIcon,
  MessageCircle,
  Home
} from "lucide-react";
import type { NavigationSection } from "./types";

export const mainNavigation: NavigationSection[] = [
  {
    title: "Main",
    items: [
      { name: "Websites", icon: Globe, href: "/websites", rootLevel: true, highlight: true },
      { name: "Domains", icon: LinkIcon, href: "/domains", rootLevel: true },
      { name: "Settings", icon: Settings, href: "/settings", rootLevel: true },
      { name: "Billing", icon: CreditCard, href: "/billing", rootLevel: true },
    ],
  },
  {
    title: "Resources",
    items: [
      { name: "Roadmap", icon: MapIcon, href: "https://trello.com/b/SOUXD4wE/databuddy", rootLevel: true, external: true },
      { name: "Feedback", icon: MessageCircle, href: "https://databuddy.featurebase.app/", rootLevel: true, external: true },
    ],
  }
];

export const websiteNavigation: NavigationSection[] = [
  {
    title: "Analytics",
    items: [
      { name: "Overview", icon: Home, href: "", highlight: true },
      { name: "Sessions", icon: Clock, href: "/sessions" },
      { name: "Profiles", icon: Users, href: "/profiles" },
      { name: "Map", icon: MapIcon, href: "/map" },
    ],
  },
]; 