import type { Metadata } from 'next'
import SignUpClient from './signup-client'

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create your account to get started.',
    robots: { index: false, follow: false },
}

export default function SignUpPage() {
    return <SignUpClient />
}
