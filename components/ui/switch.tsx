import * as React from "react";
import { cn } from "cn";

// Minimal accessible toggle built on a checkbox, so it submits with native forms.
function Switch({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-slot="switch"
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-input transition-colors",
        "after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-background after:shadow after:transition-transform after:content-['']",
        "checked:bg-primary checked:after:translate-x-4",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Switch };
