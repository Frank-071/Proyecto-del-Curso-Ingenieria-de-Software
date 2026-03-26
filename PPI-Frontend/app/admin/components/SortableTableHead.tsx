"use client"

import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { SortField, SortConfig } from "../utils/eventos-filters"

interface SortableTableHeadProps {
  field: SortField
  label: string
  sortConfig: SortConfig
  onSort: (field: SortField) => void
  className?: string
}

export function SortableTableHead({ 
  field, 
  label, 
  sortConfig, 
  onSort,
  className = ""
}: SortableTableHeadProps) {
  const isActive = sortConfig.field === field
  
  return (
    <TableHead
      className={`cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
      onClick={() => onSort(field)}
      style={{ color: "#1f2937", backgroundColor: "#f9fafb" }}
    >
      <div className="flex items-center justify-center gap-2">
        <span>{label}</span>
        {isActive ? (
          sortConfig.order === 'asc' ? (
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

