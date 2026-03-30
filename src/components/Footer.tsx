import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "../lib/utils";

type FooterProps = {
  onCheck: () => void;
  status: "correct" | "error" | "pending" | "completed";
  disabled?: boolean;
};

export const Footer = ({
  onCheck,
  status,
  disabled,
}: FooterProps) => {
  return (
    <footer
      className={cn(
        "h-24 border-t-2 lg:h-32 fixed bottom-0 left-0 right-0 bg-white",
        status === "correct" && "border-transparent bg-green-100",
        status === "error" && "border-transparent bg-rose-100"
      )}
    >
      <div className="mx-auto flex h-full max-w-4xl items-center justify-between px-4">
        {status === "correct" && (
          <div className="flex items-center text-base font-bold text-green-500 lg:text-2xl">
            <CheckCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            回答正确！
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center text-base font-bold text-rose-500 lg:text-2xl">
            <XCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            再试一次。
          </div>
        )}

        <button
          disabled={disabled}
          onClick={onCheck}
          className={cn(
            "ml-auto px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all border-b-4 active:border-b-2",
            status === "error"
              ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-500/90"
              : "bg-green-500 text-white border-green-600 hover:bg-green-500/90",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {status === "pending" && "检查答案"}
          {status === "correct" && "下一题"}
          {status === "error" && "重试"}
          {status === "completed" && "继续"}
        </button>
      </div>
    </footer>
  );
};
