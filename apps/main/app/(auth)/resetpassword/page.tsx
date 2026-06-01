import type { Metadata } from 'next'
import ResetPasswordClient from './resetpassword-client'

export const metadata: Metadata = {
    title: 'Set New Password',
    description: 'Set a new password for your account.',
    robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
    return <ResetPasswordClient />
}
