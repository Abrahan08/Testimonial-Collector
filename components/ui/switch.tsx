import * as React from "react";
import { cn } from "cn";

// Minimal accessible toggle built on a checkbox, so it submits with native forms.
// `before:` is an invisible hit area that grows the touch target toward 44px on mobile.
// Focus ring comes from the global :focus-visible rule in app/globals.css.
function Switch({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-slot="switch"
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-input transition-colors duration-150 ease-out hover:bg-muted-foreground",
        "before:absolute before:-inset-3 before:content-[''] md:before:-inset-1",
        "after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-background after:transition-transform after:duration-150 after:ease-out after:content-['']",
        "checked:bg-primary checked:hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)] checked:after:translate-x-4",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-input disabled:checked:hover:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Switch };
