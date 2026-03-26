import * as React from "react"
import { cn } from "@/lib/utils"

type CancelButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const CancelButton = React.forwardRef<HTMLButtonElement, CancelButtonProps>(
  ({ className, children = "Cancelar", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("cancel-button rounded-md text-sm font-medium", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

CancelButton.displayName = "CancelButton"
