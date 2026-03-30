import { cn } from "../lib/utils";

type ResultCardProps = {
  value: number;
  variant: "points" | "hearts";
  label?: string;
};

export const ResultCard = ({ value, variant, label }: ResultCardProps) => {
  const displayLabel = label || (variant === "points" ? "总积分" : "剩余生命");

  return (
    <div
      className={cn(
        "w-full rounded-2xl border-2",
        variant === "points" && "border-orange-400",
        variant === "hearts" && "border-rose-500"
      )}
    >
      <div
        className={cn(
          "rounded-t-xl p-2 text-center text-xs font-bold uppercase text-white",
          variant === "points" && "bg-orange-400",
          variant === "hearts" && "bg-rose-500"
        )}
      >
        {displayLabel}
      </div>

      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-white p-6 text-2xl font-bold",
          variant === "points" && "text-orange-400",
          variant === "hearts" && "text-rose-500"
        )}
      >
        {value}
      </div>
    </div>
  );
};
