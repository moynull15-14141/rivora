"use client";

import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            "w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 outline-none transition-all",
            "placeholder:text-gray-400 bg-white",
            error
              ? "border-accent focus:ring-2 focus:ring-accent/30"
              : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20",
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="text-xs text-accent mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
