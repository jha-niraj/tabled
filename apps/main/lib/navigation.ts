import {
    Home, User, type LucideIcon
} from "lucide-react"

export interface NavigationItem {
    name: string
    path: string
    icon: LucideIcon
    children?: NavigationItem[]
    requiredPermission?: string
}

export interface NavigationConfig {
    primary: NavigationItem[]
    secondary: NavigationItem[]
}

// Base navigation for the main customer-facing app.
// Add product-specific routes here as you build.
export const mainNavigation: NavigationConfig = {
    primary: [
        {
            name: "Home",
            path: "home",
            icon: Home,
        },
        {
            name: "Profile",
            path: "profile",
            icon: User,
        },
    ],
    secondary: [],
}

// Keep backward-compat alias used by legacy sidebar.tsx
export const adminNavigation = mainNavigation
