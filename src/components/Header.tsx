import { X, Heart } from "lucide-react";

type HeaderProps = {
  hearts: number;
  percentage: number;
  onExit?: () => void;
};

export const Header = ({
  hearts,
  percentage,
  onExit,
}: HeaderProps) => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-x-4 px-4 pt-4">
      {onExit && (
        <X
          onClick={onExit}
          className="cursor-pointer text-slate-500 transition hover:opacity-75"
          size={24}
        />
      )}

      <div className="flex-1 mx-4">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center font-bold text-rose-500">
        <Heart className="mr-1" fill="currentColor" size={20} />
        {hearts}
      </div>
    </header>
  );
};
