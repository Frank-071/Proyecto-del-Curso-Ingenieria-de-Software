import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    // Solo validar que el token existe (el backend valida el resto)
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' }, 
        { status: 400 }
      )
    }

    // Setear cookie HttpOnly para máxima seguridad y compatibilidad
    const isHttps = request.url?.startsWith('https://') || false;
    cookies().set('authToken', token, {
      httpOnly: true,           // No accesible desde JavaScript (protección XSS)
      secure: isHttps,          // Solo secure si realmente hay HTTPS
      sameSite: 'lax',          // Mejor compatibilidad que 'strict'
      maxAge: 60 * 60 * 24,     // 1 día
      path: '/'                 // Disponible en toda la aplicación
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Solo log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error setting auth token:', error)
    }
    return NextResponse.json(
      { error: 'Failed to set token' }, 
      { status: 500 }
    )
  }
}
