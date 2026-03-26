import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Eliminar cookie HttpOnly
    cookies().delete('authToken')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    // Solo log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error removing auth token:', error)
    }
    return NextResponse.json(
      { error: 'Failed to remove token' }, 
      { status: 500 }
    )
  }
}
