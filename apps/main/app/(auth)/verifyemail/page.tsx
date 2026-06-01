import type { Metadata } from 'next'
import VerifyEmailClient from './verifyemail-client'

export const metadata: Metadata = {
    title: 'Verify Your Email',
    description: 'Check your inbox to verify your email address.',
    robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
    return <VerifyEmailClient />
}
