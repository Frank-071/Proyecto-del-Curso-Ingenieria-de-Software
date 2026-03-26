import { Button } from "@/components/ui/button"
import { MoreHorizontal, LucideIcon } from "lucide-react"
import { useClickOutside } from "@/lib/hooks/shared"

interface ActionItem {
  key: string
  label: string
  icon: LucideIcon
  onClick: () => void
  className?: string
}

interface AdminActionsDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  actions: ActionItem[]
}

export function AdminActionsDropdown({ 
  isOpen, 
  onToggle, 
  onClose, 
  actions 
}: AdminActionsDropdownProps) {
  const dropdownRef = useClickOutside<HTMLDivElement>(onClose)

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        className="h-8 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-700 shadow-lg animate-in fade-in-0 zoom-in-95">
          {actions.map((action) => {
            const IconComponent = action.icon
            return (
              <button
                key={action.key}
                className={`relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${action.className || ''}`}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}