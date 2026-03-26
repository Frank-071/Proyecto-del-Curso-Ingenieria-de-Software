"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminPageHeader, AdminPagination, AdminStatsGrid, AdminFiltersCard } from "."
import { PageSpinner } from "@/components/ui/page-spinner"
import { Button } from "@/components/ui/button"
import { useUsuariosAdmin, useUsuariosStats, useUsuariosStatusDialog } from "@/app/admin/hooks"
import { buildUsuariosFilterOptions } from "../utils/usuarios-filter-options"
import { UsuariosStatusDialog } from "./UsuariosStatusDialog"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { UsuariosTable } from "./UsuariosTable"
import { useUsuarios } from "@/lib/hooks/usuarios"

export function UsuariosPageClient() {
    const router = useRouter()
    const usuarioUse = useUsuarios()
    const usuariosAdmin = useUsuariosAdmin()

    const [selectedId, setSelectedId] = useState<number | null>(null)


    const statsData = useUsuariosStats(usuariosAdmin.usuarios)


    const statusDialog = useUsuariosStatusDialog(
        usuariosAdmin.usuarios,
        usuariosAdmin.toggleUsuarioStatus
    )


    const filterDialog = useMemo(() =>
        buildUsuariosFilterOptions(
            usuariosAdmin.filterEstado,
            usuariosAdmin.setFilterEstado,
            usuariosAdmin.searchTerm,
            usuariosAdmin.setSearchTerm
        ),
        [
            usuariosAdmin.filterEstado,
            usuariosAdmin.setFilterEstado,
            usuariosAdmin.searchTerm,
            usuariosAdmin.setSearchTerm
        ]

    )


    const filteredUsuarios = useMemo(() => {
        let result = usuariosAdmin.usuarios || [];

        if (usuariosAdmin.filterEstado && usuariosAdmin.filterEstado !== "todos") {
            const activo = usuariosAdmin.filterEstado === "Activo";
            result = result.filter(u => u.activo === activo);
        }

        if (usuariosAdmin.searchTerm) {
            const term = usuariosAdmin.searchTerm.toLowerCase();

            result = result.filter(u => {
                const nombres = u.nombres?.toLowerCase() || "";
                const apellidos = u.apellidos?.toLowerCase() || "";
                const email = u.email?.toLowerCase() || "";

                return (
                    nombres.includes(term) ||
                    apellidos.includes(term) ||
                    email.includes(term)
                );
            });
        }

        return result;
    }, [usuariosAdmin.usuarios, usuariosAdmin.filterEstado, usuariosAdmin.searchTerm]);


    const handleRowClick = useCallback((id: number) => {
        setSelectedId(id)
    }, [])

    if (!usuariosAdmin.isInitialized) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <PageSpinner message="Cargando usuarios..." />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">

                {/* ERROR */}
                {usuariosAdmin.error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        <p>Error: {usuariosAdmin.error}</p>
                        <button
                            onClick={() => usuariosAdmin.setError(null)}
                            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                            Cerrar
                        </button>
                    </div>
                )}

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div className="flex items-start gap-4">
                        <Link href="/admin" className="shrink-0">
                            <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90 cursor-pointer h-10 w-10 border-0"
                                title="Volver al panel"
                            >
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </Button>
                        </Link>

                        <div className="mt-1">
                            <AdminPageHeader
                                title="Gestión de Usuarios"
                                description="Administra los usuarios registrados en el sistema"
                            />
                        </div>
                    </div>

                </div>

                {/* ESTADÍSTICAS */}
                <div className="mb-8">
                    <AdminStatsGrid stats={statsData} />
                </div>

                {/* FILTROS */}
                <AdminFiltersCard
                    searchTerm={usuariosAdmin.searchTerm}
                    onSearchChange={usuariosAdmin.setSearchTerm}
                    searchPlaceholder="Buscar usuarios..."
                    filters={filterDialog}
                    onClearFilters={usuariosAdmin.handleClearFilters}
                    hasActiveFilters={usuariosAdmin.hasActiveFilters}
                />

                {/* TABLA */}
                <UsuariosTable
                    usuarios={filteredUsuarios}
                    selectedId={selectedId}
                    onRowClick={handleRowClick}
                    onAction={statusDialog.handleAction}
                    sortConfig={usuariosAdmin.sortConfig}
                    onSort={usuariosAdmin.handleSort}
                    isActionLoading={statusDialog.isLoading}
                />

                <UsuariosStatusDialog
                    open={statusDialog.dialogState.open}
                    onOpenChange={statusDialog.closeDialog}
                    usuarioId={statusDialog.dialogState.usuarioId}
                    nombre={statusDialog.dialogState.nombres}
                    usuarios={usuariosAdmin.usuarios}
                    onConfirm={statusDialog.handleConfirmStatusChange}
                    isLoading={statusDialog.isLoading}
                />

                {/* PAGINACIÓN */}
                <AdminPagination
                    pagination={usuariosAdmin.pagination}
                    onPageChange={usuariosAdmin.goToPage}
                    onPrev={usuariosAdmin.prevPage}
                    onNext={usuariosAdmin.nextPage}
                />
            </main>
        </div>
    )
}
