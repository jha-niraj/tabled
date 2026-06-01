import { auth } from './auth'
import { headers } from 'next/headers'

export async function getServerSession() {
    const h = await headers()
    return auth.api.getSession({ headers: h })
}

export async function requireServerSession() {
    const session = await getServerSession()
    if (!session) throw new Error('Unauthorized')
    return session
}
