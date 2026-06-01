import { getServerSession } from '@repo/auth'
import { redirect } from 'next/navigation'
import ProfileClient from './profile-client'

export default async function ProfilePage() {
    const session = await getServerSession()
    if (!session) redirect('/signin')

    return (
        <ProfileClient
            initialName={session.user.name ?? ''}
            initialEmail={session.user.email}
            initialImage={session.user.image ?? null}
        />
    )
}
