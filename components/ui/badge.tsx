import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap transition-colors duration-150 ease-out has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      // Tints plus a text label, never color alone. Neutral is `secondary`.
      variant: {
        default:
          "bg-accent text-accent-foreground [a]:hover:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_6%)]",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:outline-destructive dark:bg-destructive/6 [a]:hover:bg-destructive/15 dark:[a]:hover:bg-destructive/6",
        outline:
          "border-input text-foreground [a]:hover:bg-muted",
        ghost:
          "text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
