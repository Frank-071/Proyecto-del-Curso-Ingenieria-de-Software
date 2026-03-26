import { LucideIcon } from "lucide-react"

interface UserInfoItemProps {
  icon: LucideIcon
  value?: string | number
  label: string
}

export function UserInfoItem({ icon: Icon, value, label }: UserInfoItemProps) {
  const shouldShowValue = typeof value === 'number' || (value && value !== '')
  
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-emerald-600" />
      {shouldShowValue ? (
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{value}</span> {label}
        </span>
      ) : (
        <span className="text-base font-medium text-gray-900">{label}</span>
      )}
    </div>
  )
}

