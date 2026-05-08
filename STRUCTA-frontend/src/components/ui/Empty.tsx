import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function Empty({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-dark-600 bg-dark-800/40 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full border border-dark-600 bg-dark-900 text-purple-300">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="font-heading text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mx-auto max-w-md text-sm text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
