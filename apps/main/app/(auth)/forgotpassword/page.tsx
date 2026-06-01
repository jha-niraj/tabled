import type { Metadata } from 'next'
import ForgotPasswordClient from './forgotpassword-client'

export const metadata: Metadata = {
    title: 'Forgot Password',
    description: 'Reset your password.',
    robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordClient />
}
