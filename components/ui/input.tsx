import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// Height 44px on mobile (touch target), 40px from md up. Text is 16px on mobile so iOS does not zoom.
// Focus ring comes from the global :focus-visible rule in app/globals.css.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base text-foreground transition-colors duration-150 ease-out file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 disabled:hover:border-input aria-invalid:border-destructive aria-invalid:hover:border-destructive aria-invalid:focus-visible:outline-destructive md:h-10 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
