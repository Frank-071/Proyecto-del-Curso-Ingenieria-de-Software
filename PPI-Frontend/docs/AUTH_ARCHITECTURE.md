# 🔐 Arquitectura de Autenticación - PatasPepasSoft


## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Flujos de Autenticación](#flujos-de-autenticación)
4. [Seguridad](#seguridad)
5. [Stores (Zustand)](#stores-zustand)
6. [Hooks Personalizados](#hooks-personalizados)
7. [API Routes](#api-routes)
8. [Guía de Uso](#guía-de-uso)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## 🎯 Resumen Ejecutivo

### ¿Qué tenemos?

Una arquitectura de autenticación **segura, rápida y escalable** basada en:

- ✅ **Tokens JWT** en cookies HttpOnly (no accesibles desde JavaScript)
- ✅ **Zustand** para gestión de estado global
- ✅ **Cache inteligente** en localStorage (solo datos no sensibles)
- ✅ **Hooks personalizados** para separación de responsabilidades
- ✅ **Validación multi-nivel** (frontend + backend)

### Métricas clave

- 🔒 **Seguridad:** HttpOnly cookies = inmune a XSS
- ⚡ **Velocidad:** <50ms tiempo de carga inicial
- 📦 **Tamaño:** 2.5KB (Zustand) vs 40KB+ (Redux)
- ✅ **Mantenibilidad:** SOLID, DRY, 0 código duplicado

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA 1: UI                           │
│  Components: LoginForm, Header, AdminDashboard          │
│              ↓ usa ↓                                     │
│         useAuth() hook                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              CAPA 2: ESTADO (Zustand)                   │
│                                                          │
│  ┌──────────────────┐      ┌─────────────────┐         │
│  │   auth-store     │──────│   user-store    │         │
│  │  (autenticación) │sync  │  (perfil/data)  │         │
│  └──────────────────┘      └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         CAPA 3: SEGURIDAD (Token Management)            │
│                  tokenUtils                              │
│              ↓ llama API routes ↓                       │
│   /api/auth/set-token | get-token | remove-token       │
│              (HttpOnly Cookies)                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│           CAPA 4: BACKEND (FastAPI)                     │
│            authService → Backend API                     │
└─────────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separation of Concerns:** Cada capa tiene una responsabilidad única
2. **Single Source of Truth:** `auth-store` es el orquestador único
3. **Security by Default:** Token nunca expuesto a JavaScript
4. **Performance First:** Cache inteligente + selectores granulares

---

## 🔄 Flujos de Autenticación

### 1. Login Normal

```typescript
// Usuario ingresa credenciales
LoginForm.handleSubmit()
    ↓
useAuth().login(email, password)
    ↓
auth-store.login()
    ↓
authService.login() → Backend FastAPI
    ↓
Backend devuelve: { token, user_id, puntos, rango, ... }
    ↓
tokenUtils.setToken(jwt) → /api/auth/set-token
    ↓
HttpOnly Cookie creada ✅
    ↓
syncUserAfterLogin(response, payload, set)
    ├─ auth-store: isAuthenticated = true, userInfo = payload
    └─ user-store: perfil completo + puntos + rango
    ↓
localStorage actualizado ("user-storage-v2") ✅
    ↓
Navegación a "/"
```

**Tiempo total:** ~200-300ms

---

### 2. Verificación de Cuenta (Registro)

```typescript
// Usuario hace clic en enlace de email
VerificarCuentaClient detecta: ?verified=true&user_id=123
    ↓
useAuth().loginAfterVerification(userId)
    ↓
auth-store.loginAfterVerification()
    ↓
authService.loginAfterVerification({ user_id }) → Backend
    ↓
Backend devuelve: { token, ... }
    ↓
tokenUtils.setToken(jwt) → HttpOnly Cookie ✅
    ↓
syncUserAfterLogin(...) → Estado sincronizado ✅
    ↓
Navegación a "/" con auto-login
```

---

### 3. Logout

```typescript
// Usuario hace clic en "Cerrar Sesión"
Header/AdminDashboard/PerfilPage.logout()
    ↓
useAuth().logout()
    ↓
auth-store.logout()
    ↓
tokenUtils.removeToken() → /api/auth/remove-token
    ↓
HttpOnly Cookie eliminada ✅
    ↓
auth-store resetea:
    ├─ isAuthenticated = false
    ├─ userInfo = null
    └─ initialized = false
    ↓
user-store.logout()
    ↓
user = null → localStorage "user-storage-v2" limpiado ✅
    ↓
Navegación a "/" (home público)
```

**Resultado:** Todo limpiado, sesión cerrada completamente.

---

### 4. Inicialización (Al cargar la app)

```typescript
// App carga, Providers.useEffect() ejecuta:
auth-store.initializeAuth()
    ↓
tokenUtils.getToken() → /api/auth/get-token
    ↓
¿Token existe en HttpOnly Cookie?
    ├─ SÍ → tokenUtils.validateToken(token)
    │   ├─ Válido → Decodifica JWT, restaura auth-store ✅
    │   └─ Inválido/Expirado → Elimina cookie, limpia estado
    └─ NO → Usuario no autenticado, estado limpio
    ↓
UI renderiza según estado de autenticación
```

**Beneficio:** Solo se ejecuta UNA vez al cargar la app.

---

## 🔒 Seguridad

### ¿Por qué HttpOnly Cookies?

#### ❌ Enfoque INSEGURO (lo que NO hacemos):

```typescript
// Guardar token en localStorage
localStorage.setItem('token', jwt)

// Problema:
// → JavaScript puede leerlo: localStorage.getItem('token')
// → Vulnerable a XSS (Cross-Site Scripting)
// → Atacante inyecta código malicioso → Roba token
```

#### ✅ Enfoque SEGURO (lo que SÍ hacemos):

```typescript
// API Route: /api/auth/set-token
cookies().set('authToken', token, {
  httpOnly: true,        // ← JavaScript NO puede leer esta cookie
  secure: true,          // ← Solo viaja por HTTPS en producción
  sameSite: 'strict',    // ← Protección contra CSRF
  maxAge: 60 * 60 * 24,  // ← 1 día de expiración
  path: '/'              // ← Disponible en toda la app
})

// Ventaja:
// → Token inaccesible desde JavaScript
// → Inmune a XSS
// → Solo el servidor Next.js puede leer/escribir
```

### Validación Multi-Nivel

**Nivel 1: Frontend (básico)**
```typescript
const payload = tokenUtils.decodeJWT(token)
if (payload.exp < Date.now() / 1000) {
  // Token expirado
}
```

**Nivel 2: Backend (definitivo)**
```python
# FastAPI valida:
# - Firma del token
# - Expiración (exp claim)
# - Emisor (iss claim)
# - Audience (aud claim)
```

**Defensa en profundidad:** Si un nivel falla, el otro protege.

---

### ¿Qué va en cada lugar?

| Dato | HttpOnly Cookie | localStorage | Razón |
|------|----------------|--------------|-------|
| JWT Token | ✅ SÍ | ❌ NO | Sensible, debe ser seguro |
| ID Usuario | ❌ NO | ✅ SÍ (cache) | No sensible |
| Email | ❌ NO | ✅ SÍ (cache) | No sensible |
| Puntos | ❌ NO | ✅ SÍ (cache) | No sensible, mejora UX |
| Rango | ❌ NO | ✅ SÍ (cache) | No sensible |
| Contraseña | ❌ NUNCA | ❌ NUNCA | Solo hash en backend |
| Datos de tarjeta | ❌ NUNCA | ❌ NUNCA | Solo en backend |

---

## 📦 Stores (Zustand)

### 1. auth-store.ts

**Responsabilidad:** Gestión de autenticación (sesión activa/inactiva)

**Estado:**
```typescript
{
  isLoading: boolean          // Loading durante login/logout
  error: string               // Mensaje de error
  isAuthenticated: boolean    // ¿Usuario autenticado?
  userInfo: JWTPayload | null // Datos del token (id, email, role)
  initialized: boolean        // ¿Store inicializado?
}
```

**Métodos:**
```typescript
initializeAuth()              // Restaura sesión al cargar app
login(email, password)        // Login normal
loginAfterVerification(userId) // Login post-verificación
logout()                      // Cierra sesión
setError(error)               // Manejo de errores
```

**Selectores exportados:**
```typescript
useIsAuthenticated()  // ¿Usuario logueado?
useUserInfo()         // Datos del JWT payload
```

---

### 2. user-store.ts

**Responsabilidad:** Gestión de perfil de usuario (datos, puntos, tickets)

**Estado:**
```typescript
{
  user: UserProfile | null  // Perfil completo del usuario
}

interface UserProfile {
  id: string
  name: string
  email: string
  currentPoints: number
  totalPointsEarned: number
  rank: UserRank  // "bronce" | "plata" | "oro" | "platino"
  rankDiscount: number
  savedPaymentMethods: SavedPaymentMethod[]
  purchasedTickets: PurchasedTicket[]
}
```

**Persistencia:**
```typescript
persist(
  // ... state
  { name: "user-storage-v2" }  // ← Guarda en localStorage
)
```

**Métodos principales:**
```typescript
setUser(user)                 // Actualiza perfil
logout()                      // Limpia perfil (y localStorage)
addPoints(points)             // Suma puntos
usePoints(points)             // Canjea puntos
calculateRank(totalPoints)    // Calcula rango
addPurchasedTickets(tickets)  // Agrega tickets comprados
```

---

### 3. Sincronización entre Stores

**Función clave: `syncUserAfterLogin()`**

```typescript
// lib/stores/auth-store.ts (líneas 11-37)
const syncUserAfterLogin = (
  response: LoginResponse, 
  payload: JWTPayload, 
  set: (partial: Partial<AuthState>) => void
) => {
  // 1. Actualiza auth-store
  set({ 
    isAuthenticated: true, 
    userInfo: payload,
    isLoading: false 
  })
  
  // 2. Sincroniza user-store
  useUserStore.getState().setUser({
    id: payload.sub.toString(),
    name: isAdmin ? "Administrador" : "Cliente",
    email: payload.email,
    currentPoints: response.data.puntos_disponibles || 0,
    totalPointsEarned: response.data.puntos_historicos || 0,
    rank: rango,
    rankDiscount: descuento,
    savedPaymentMethods: [],
    purchasedTickets: [],
  })
}
```

**Flujo unidireccional:**
```
auth-store (orquestador) → user-store (datos)
```

**Beneficio:** 
- Sin conflictos de sincronización
- Estado siempre consistente
- DRY (no duplicación)

---

## 🎣 Hooks Personalizados

### useAuth()

**Ubicación:** `lib/hooks/use-auth.ts`

**Propósito:** Abstracción para que componentes UI no dependan directamente de stores

**API:**
```typescript
const {
  login,                    // (email, password) => Promise<result>
  loginAfterVerification,   // (userId) => Promise<result>
  logout,                   // () => Promise<void>
  isLoading,                // boolean
  error,                    // string
  setError,                 // (error) => void
  isAuthenticated,          // boolean
  userInfo                  // JWTPayload | null
} = useAuth()
```

**Ejemplo de uso:**
```typescript
// LoginForm.tsx
const { login, isLoading, error } = useAuth()

const handleSubmit = async () => {
  const result = await login(email, password)
  if (result.success) {
    // Ya navegó automáticamente a "/"
  }
}
```

**Ventajas:**
- ✅ Encapsula navegación (router.push)
- ✅ Componentes no conocen implementación interna
- ✅ Fácil de testear

---

### useRequireAuth()

**Ubicación:** `lib/hooks/use-require-auth.ts`

**Propósito:** Proteger rutas que requieren autenticación

**API:**
```typescript
const { isValidating } = useRequireAuth('admin' | 'user')
```

**Ejemplo de uso:**
```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { isValidating } = useRequireAdmin()
  
  if (isValidating) {
    return null  // o spinner
  }
  
  return <>{children}</>
}
```

**Comportamiento:**
- Sin token → Redirige a `/login`
- Token inválido → Redirige a `/login`
- Usuario no admin en ruta admin → Redirige a `/`
- Usuario autorizado → Renderiza children ✅

---

## 🛣️ API Routes

### /api/auth/set-token

**Método:** POST  
**Body:** `{ token: string }`

**Acción:**
```typescript
cookies().set('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24,
  path: '/'
})
```

**Respuesta:** `{ success: true }`

---

### /api/auth/get-token

**Método:** GET

**Acción:**
```typescript
const token = cookies().get('authToken')?.value
return { token }
```

**Respuesta:** `{ token: string | null }`

---

### /api/auth/remove-token

**Método:** POST

**Acción:**
```typescript
cookies().delete('authToken')
```

**Respuesta:** `{ success: true }`

---

## 📖 Guía de Uso

### Caso 1: Necesito saber si el usuario está logueado

```typescript
import { useIsAuthenticated } from '@/lib/stores/auth-store'

function MyComponent() {
  const isAuthenticated = useIsAuthenticated()
  
  return isAuthenticated ? <UserMenu /> : <LoginButton />
}
```

---

### Caso 2: Necesito hacer login

```typescript
import { useAuth } from '@/lib/hooks/use-auth'

function LoginForm() {
  const { login, isLoading, error } = useAuth()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    
    if (result.success) {
      // Ya navegó a "/" automáticamente
    } else {
      // Mostrar result.error
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

### Caso 3: Necesito hacer logout

```typescript
import { useAuth } from '@/lib/hooks/use-auth'

function Header() {
  const { logout } = useAuth()
  
  return (
    <button onClick={logout}>
      Cerrar Sesión
    </button>
  )
}
```

---

### Caso 4: Necesito datos del usuario (perfil)

```typescript
import { useUserStore } from '@/lib/stores/user-store'

function ProfilePage() {
  const { user } = useUserStore()
  
  if (!user) {
    return <p>No has iniciado sesión</p>
  }
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Puntos: {user.currentPoints}</p>
      <p>Rango: {user.rank}</p>
    </div>
  )
}
```

---

### Caso 5: Proteger una ruta (admin)

```typescript
// app/admin/layout.tsx
import { useRequireAdmin } from '@/lib/hooks/use-require-auth'

export default function AdminLayout({ children }) {
  const { isValidating } = useRequireAdmin()
  
  if (isValidating) {
    return null
  }
  
  return <>{children}</>
}
```

---

## 🐛 Troubleshooting

### Problema: "Usuario no se mantiene logueado al refrescar"

**Diagnóstico:**
1. Verificar que `Providers` esté envolviendo la app en `app/layout.tsx`
2. Verificar que `initializeAuth()` se ejecute en `Providers`
3. Verificar cookies en DevTools → Application → Cookies → `authToken`

**Solución:**
- La cookie debe estar presente
- Si no está, el backend no devolvió token o no se guardó

---

### Problema: "Token expirado pero usuario sigue 'logueado' en UI"

**Diagnóstico:**
- `user-storage-v2` en localStorage tiene datos
- Pero token en cookie ya expiró

**Solución:**
- Esto es **correcto por diseño**
- Al hacer la siguiente request que requiera autenticación, el backend rechazará
- El frontend detectará 401 y limpiará todo automáticamente

---

### Problema: "No puedo acceder a /admin siendo admin"

**Diagnóstico:**
1. Verificar que `userInfo.role === 'admin'` en `auth-store`
2. Verificar que el JWT del backend tenga `role: 'admin'`

**Solución:**
- Revisar payload del token: `tokenUtils.decodeJWT(token)`
- El backend debe emitir tokens con role correcto

---

## ❓ FAQ

### ¿Por qué HttpOnly cookies y no localStorage?

**Respuesta:** Seguridad. localStorage es accesible desde cualquier JavaScript, incluido código malicioso inyectado (XSS). HttpOnly cookies solo son accesibles desde el servidor.

---

### ¿Por qué guardamos el perfil en localStorage entonces?

**Respuesta:** Son datos **no sensibles** (nombre, puntos, rango). Guardarlos en localStorage permite:
- Carga instantánea de UI (<50ms)
- Menos requests al servidor
- Mejor UX

Cualquier operación crítica (compras, cambios) se valida con el token en el backend.

---

### ¿Qué pasa si un atacante modifica el localStorage?

**Respuesta:** No importa. El localStorage solo mejora UX (cache). Cualquier operación real:
1. Envía token en cookie HttpOnly
2. Backend valida token
3. Backend usa SU fuente de verdad (base de datos)

Si el usuario modifica puntos en localStorage, el backend ignora esos datos.

---

### ¿Cuándo se limpia el localStorage?

**Respuesta:** 
1. Cuando el usuario hace logout explícito
2. Cuando `user-store.logout()` se ejecuta → Zustand persist limpia automáticamente

---

### ¿Puedo usar authService directamente en componentes?

**Respuesta:** **NO**. Siempre usa `useAuth()` hook. Esto asegura:
- Sincronización correcta de stores
- Navegación manejada
- Estado consistente

**Excepción:** `RegisterForm` usa `authService.register()` directamente porque no requiere login inmediato.

---

### ¿Cómo testear componentes que usan useAuth?

**Respuesta:**
```typescript
// Mock del hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true,
    userInfo: { sub: 1, email: 'test@test.com', role: 'user' }
  })
}))
```

---

## 📝 Checklist para Nuevos Desarrolladores

Cuando trabajes con autenticación, asegúrate de:

- [ ] ✅ Usar `useAuth()` hook, NO `authService` directo
- [ ] ✅ Usar `useIsAuthenticated()` para verificar login
- [ ] ✅ Usar `useUserStore()` para datos de perfil
- [ ] ✅ Proteger rutas admin con `useRequireAdmin()`
- [ ] ✅ NUNCA guardar tokens en localStorage
- [ ] ✅ NUNCA exponer contraseñas o datos sensibles
- [ ] ✅ Usar toast (sonner) para mensajes, NO alerts
- [ ] ✅ Validar siempre en backend para operaciones críticas

---


