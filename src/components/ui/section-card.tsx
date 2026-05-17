import { cn } from "@/lib/utils";

type SectionCardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
};

export function SectionCard({ as = "section", className, children, ...rest }: SectionCardProps) {
  const Tag = as;
  return (
    <Tag className={cn("bg-card rounded-lg border p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}
