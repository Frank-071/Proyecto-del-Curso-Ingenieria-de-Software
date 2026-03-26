import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Leer cookie HttpOnly (solo el servidor puede hacer esto)
    const token = cookies().get('authToken')?.value
    
    if (!token) {
      return NextResponse.json({ token: null })
    }

    return NextResponse.json({ token })
  } catch (error) {
    // Solo log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting auth token:', error)
    }
    return NextResponse.json(
      { error: 'Failed to get token' }, 
      { status: 500 }
    )
  }
}
