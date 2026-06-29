import Image from "next/image";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
};

const sizeMap = {
  xs: { container: "h-6 w-6 text-[10px]", px: 24, dot: "h-1.5 w-1.5" },
  sm: { container: "h-8 w-8 text-xs", px: 32, dot: "h-2 w-2" },
  md: { container: "h-10 w-10 text-sm", px: 40, dot: "h-2.5 w-2.5" },
  lg: { container: "h-16 w-16 text-xl", px: 64, dot: "h-3 w-3" },
  xl: { container: "h-24 w-24 text-3xl", px: 96, dot: "h-3.5 w-3.5" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  src,
  name,
  size = "md",
  isOnline = false,
  className = "",
}: AvatarProps) {
  const { container, px, dot } = sizeMap[size];

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`relative overflow-hidden rounded-full bg-primary/10 ${container} ${className}`}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            fill
            sizes={`${px}px`}
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-semibold text-primary">
            {initials(name)}
          </span>
        )}
      </div>
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-white bg-primary ${dot}`}
        />
      )}
    </div>
  );
}
