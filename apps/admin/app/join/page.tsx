import type { Metadata } from 'next'
import JoinClient from './join-client'

export const metadata: Metadata = {
    title: 'Accept Invitation',
    description: 'Set your password to join the admin panel.',
    robots: { index: false, follow: false },
}

export default function JoinPage() {
    return <JoinClient />
}
