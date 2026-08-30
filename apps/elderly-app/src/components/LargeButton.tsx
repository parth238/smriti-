import type { ButtonHTMLAttributes, ReactNode } from "react";

type LargeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "quiet";
};

export function LargeButton({
  children,
  tone = "primary",
  className = "",
  ...props
}: LargeButtonProps) {
  const tones = {
    primary: "bg-gamosa-red text-rice-white",
    secondary: "bg-tea-garden text-rice-white",
    quiet: "bg-white text-deep-hill border-2 border-mist-blue",
  };
  return (
    <button
      className={`pressable min-h-tap w-full rounded-2xl px-5 py-3 text-button-label ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
