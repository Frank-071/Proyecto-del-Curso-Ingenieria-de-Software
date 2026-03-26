import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

interface AdminFiltersCardProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filters: {
    label: string
    placeholder: string
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
  }[]
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export function AdminFiltersCard({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  onClearFilters,
  hasActiveFilters
}: AdminFiltersCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                style={{ cursor: 'pointer' }}
              />
            </div>

            {filters.map((filter, index) => (
              <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger style={{ cursor: 'pointer' }}>
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem 
                      key={option.value}
                      value={option.value}
                      className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors duration-150"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
          
          {hasActiveFilters && onClearFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 shrink-0 cursor-pointer transition-colors duration-150"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}