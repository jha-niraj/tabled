"use server"

import { getServerSession } from '@repo/auth'
import { passwordChangedEmail, welcomeEmail } from '@repo/auth'
import { db } from '@repo/db'
import { user } from '@repo/db/schema'
import { eq } from '@repo/db'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { name: string }): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!data.name.trim()) return { success: false, error: 'Name cannot be empty' }

    await db
        .update(user)
        .set({ name: data.name.trim(), updatedAt: new Date() })
        .where(eq(user.id, session.user.id))

    revalidatePath('/profile')
    revalidatePath('/home')
    return { success: true }
}

export async function updateAvatar(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!imageUrl.startsWith('https://')) return { success: false, error: 'Invalid image URL' }

    await db
        .update(user)
        .set({ image: imageUrl, updatedAt: new Date() })
        .where(eq(user.id, session.user.id))

    revalidatePath('/profile')
    return { success: true }
}

export async function notifyPasswordChanged(): Promise<void> {
    const session = await getServerSession()
    if (!session) return

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    await resend.emails
        .send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com',
            to: session.user.email,
            subject: 'Your password was changed',
            html: passwordChangedEmail({ name: session.user.name ?? session.user.email }),
        })
        .catch(console.error)
}

export async function sendWelcomeEmail(): Promise<void> {
    const session = await getServerSession()
    if (!session) return

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    await resend.emails
        .send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com',
            to: session.user.email,
            subject: 'Welcome!',
            html: welcomeEmail({ name: session.user.name ?? session.user.email }),
        })
        .catch(console.error)
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await db.delete(user).where(eq(user.id, session.user.id))
    return { success: true }
}
