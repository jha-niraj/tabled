export function formatAdminRole(role: string): string {
    switch (role) {
        case "SUPER_ADMIN": return "Super Admin"
        case "TEAM_MEMBER": return "Team Member"
        default: return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }
}
