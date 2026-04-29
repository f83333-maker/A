import * as React from "react"

type ToastActionElement = React.ReactElement<any>

interface ToastProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type { ToastActionElement, ToastProps }
