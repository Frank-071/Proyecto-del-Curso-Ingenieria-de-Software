"use client"

import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { SortField, SortConfig } from "../utils/usuarios-filters"

interface SortableTableHeadUsuariosProps {
  field: SortField
  label: string
  sortConfig: SortConfig
  onSort: (field: SortField) => void
  className?: string
  align?: "left" | "center" | "right"
}

export function SortableTableHeadUsuarios({
  field,
  label,
  sortConfig,
  onSort,
  className = "",
  align = "center"
}: SortableTableHeadUsuariosProps) {
  const isActive = sortConfig.field === field
  const justifyClass =
    align === "left" ? "justify-start" :
    align === "right" ? "justify-end" :
    "justify-center"
  const textClass =
    align === "left" ? "text-left" :
    align === "right" ? "text-right" :
    "text-center"

  return (
    <TableHead
      className={`cursor-pointer hover:bg-gray-100 transition-colors select-none ${textClass} ${className}`}
      onClick={() => onSort(field)}
      style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}
    >
      <div className={`flex items-center gap-2 ${justifyClass} ${textClass}`}>
        <span>{label}</span>
        {isActive ? (
          sortConfig.order === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-40" />
        )}
      </div>
    </TableHead>
  )
}
