import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Heights: 44px on mobile (touch target), 36px from md up (dashboard). `lg` is 44px at every width (public).
// Focus ring comes from the global :focus-visible rule in app/globals.css.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)] active:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_22%)] aria-expanded:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)]",
        outline:
          "border-input bg-background text-foreground hover:bg-muted active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)] aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] active:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)] aria-expanded:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost:
          "text-foreground hover:bg-muted active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)] aria-expanded:bg-muted",
        // Destructive is for confirm dialogs only. The dark tint is lighter so the text keeps 4.5:1.
        destructive:
          "bg-destructive/10 text-destructive hover:border-destructive/50 hover:bg-destructive/15 active:bg-destructive/20 focus-visible:outline-destructive dark:bg-destructive/6 dark:hover:bg-destructive/6 dark:active:bg-destructive/6",
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
      },
      size: {
        default:
          "h-11 gap-2 px-3.5 md:h-9 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-11 gap-1 px-2.5 text-xs md:h-6 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-11 gap-1.5 px-3 md:h-8 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-11 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11 md:size-9",
        "icon-xs":
          "size-11 md:size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-11 md:size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
