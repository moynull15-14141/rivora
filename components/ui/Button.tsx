"use client";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export default function Button({
  loading = false,
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed w-full";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] focus:ring-primary/40",
    ghost:
      "bg-transparent text-primary border border-primary hover:bg-primary/5 focus:ring-primary/30",
  };

  return (
    <button
      disabled={loading || disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
