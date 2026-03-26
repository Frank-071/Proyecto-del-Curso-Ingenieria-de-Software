import { useState, useEffect, useCallback, useRef } from 'react'
import { usuariosService, type UsuariosListarParams } from '@/lib/api/services/usuarios'
import type { UsuarioDisplay, UsuarioRequest, UsuarioResponse } from '@/lib/types/entities/usuario'
import type { PaginationMetadata } from '@/lib/types/shared/api-responses'

export interface UseUsuariosReturn {
    usuarios: UsuarioDisplay[]
    usuariosAll: UsuarioDisplay[]     
    loading: boolean
    error: string | null
    isInitialized: boolean
    pagination: PaginationMetadata

    fetchUsuarios: (params?: UsuariosListarParams) => Promise<void>
    fetchUsuariosAll: () => Promise<void>    
    toggleUsuarioStatus: (id: number, activar: boolean) => Promise<{ success: boolean; error: string | null }>

    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void

    setError: (error: string | null) => void
}

export const useUsuarios = (): UseUsuariosReturn => {
    const [usuarios, setUsuarios] = useState<UsuarioDisplay[]>([])
    const [usuariosAll, setUsuariosAll] = useState<UsuarioDisplay[]>([])
    const usuariosRef = useRef<UsuarioDisplay[]>([])
    const usuariosAllRef = useRef<UsuarioDisplay[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    const [pagination, setPagination] = useState<PaginationMetadata>({
        skip: 0,
        limit: 10,
        total: 0,
        hasNext: false,
        hasPrev: false,
        currentPage: 1,
        totalPages: 0
    })

    const isMountedRef = useRef(true)
    const paginationRef = useRef(pagination)


    const fetchUsuarios = useCallback(async (params: UsuariosListarParams = {}) => {
        const { skip = 0, limit = 10, ...rest } = params

        setLoading(true)
        setError(null)

        try {
            const result = await usuariosService.listar({ skip, limit, ...rest })

            if (result.success) {
                const usuariosMapeados = result.data.map((u: UsuarioResponse) => ({
                    ...u,
                    estado: u.activo ? 'Activo' : 'Inactivo',
                    fechaRegistro: u.fecha_creacion
                        ? (() => {
                            const f = new Date(u.fecha_creacion)
                            return `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth() + 1)
                                .toString().padStart(2, '0')}/${f.getFullYear()}`
                        })()
                        : ''
                }))

                setUsuarios(usuariosMapeados)
                usuariosRef.current = usuariosMapeados
                setPagination(result.pagination)
            } else {
                setError('Error al cargar usuarios')
            }
        } catch {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }, [])


    const fetchUsuariosAll = useCallback(async () => {
        try {
            
            const result = await usuariosService.listar({ skip: 0, limit: 5000 })

            if (result.success) {
                if (isMountedRef.current) {
                    const allUsuarios = result.data.map((u: UsuarioResponse) => ({ ...u }))
                    setUsuariosAll(allUsuarios)
                    usuariosAllRef.current = allUsuarios
                }
            }
        } catch (err) {
            console.error("Error cargando usuariosAll", err)
        }
    }, [])


    const toggleUsuarioStatus = useCallback(async (id: number, activar: boolean) => {
        setLoading(true)
        setError(null)

        const { skip, limit } = paginationRef.current

        try {
            const result = await usuariosService.toggleStatus(id, activar)

            if (result.success) {
                await fetchUsuarios({ skip, limit })
                await fetchUsuariosAll()
                return { success: true, error: null }
            } else {
                const msg = result.detail || `Error al ${activar ? 'activar' : 'desactivar'} usuario`
                setError(msg)
                return { success: false, error: msg }
            }
        } catch {
            const msg = 'Error de conexión'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }, [fetchUsuarios, fetchUsuariosAll])


    useEffect(() => {
        paginationRef.current = pagination
    }, [pagination])

    const goToPage = useCallback((page: number) => {
        const skip = (page - 1) * paginationRef.current.limit
        fetchUsuarios({ skip, limit: paginationRef.current.limit })
    }, [fetchUsuarios])

    const nextPage = useCallback(() => {
        if (paginationRef.current.hasNext) {
            goToPage(paginationRef.current.currentPage + 1)
        }
    }, [goToPage])

    const prevPage = useCallback(() => {
        if (paginationRef.current.hasPrev) {
            goToPage(paginationRef.current.currentPage - 1)
        }
    }, [goToPage])

    
    useEffect(() => {
        const init = async () => {
            await fetchUsuarios()
            await fetchUsuariosAll()
            setIsInitialized(true)
        }

        if (!isInitialized) init()
    }, [isInitialized, fetchUsuarios, fetchUsuariosAll])

    
    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return {
        usuarios,
        usuariosAll,        
        loading,
        error,
        isInitialized,
        pagination,

        fetchUsuarios,
        fetchUsuariosAll,
        toggleUsuarioStatus,

        goToPage,
        nextPage,
        prevPage,

        setError
    }
}
