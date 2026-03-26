import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface AdminPageHeaderProps {
  title: string
  description: string
  buttonText?: string
  onButtonClick?: () => void
}

export function AdminPageHeader({ 
  title, 
  description, 
  buttonText, 
  onButtonClick 
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      {buttonText && onButtonClick && (
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90" 
          onClick={onButtonClick}
          style={{ cursor: 'pointer' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      )}
    </div>
  )
}