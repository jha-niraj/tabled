import { getServerSession } from '@repo/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
    const session = await getServerSession()
    if (!session) redirect('/signin')

    const { user } = session

    // Gate: require email verification before home
    if (!user.emailVerified) {
        redirect('/verifyemail?email=' + encodeURIComponent(user.email))
    }

    return (
        <div style={{ maxWidth: 640 }}>
            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--so-ink-4)', marginBottom: 16 }}>
                Dashboard
            </p>
            <h1 style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 450, letterSpacing: '-0.025em', color: 'var(--so-ink)', margin: '0 0 8px' }}>
                Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--so-ink-3)', marginBottom: 40 }}>
                You&apos;re signed in and the auth is working.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--so-line)', border: '1px solid var(--so-line)', borderRadius: 12, overflow: 'hidden' }}>
                {[
                    { label: 'Name', value: user.name || '-' },
                    { label: 'Email', value: user.email },
                    { label: 'Role', value: (user as { role?: string }).role || 'USER' },
                    { label: 'User ID', value: user.id },
                ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', background: 'var(--so-bg)', gap: 16 }}>
                        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--so-ink-4)', minWidth: 72 }}>
                            {row.label}
                        </span>
                        <span style={{ fontFamily: row.label === 'User ID' ? 'var(--font-geist-mono)' : 'inherit', fontSize: row.label === 'User ID' ? 12 : 14, color: 'var(--so-ink-2)' } as React.CSSProperties}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
