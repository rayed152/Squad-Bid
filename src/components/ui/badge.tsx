import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-squad-border bg-squad-panel text-gray-200",
        accent: "border-squad-accent/40 bg-squad-accent/15 text-squad-accent",
        gold: "border-amber-400/40 bg-amber-400/15 text-amber-300",
        outline: "border-white/20 bg-transparent text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
