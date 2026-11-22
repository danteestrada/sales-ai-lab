// Thin-line icons in the style of the LinkedIn banner (1.25px strokes, no fill).

export type IconKind = "degree" | "cloud" | "ai" | "data";

export function CredentialIcon({ kind }: { kind: IconKind }) {
  const common = {
    width: 36,
    height: 36,
    viewBox: "0 0 36 36",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "text-ink/80",
    "aria-hidden": true,
  };
  switch (kind) {
    case "degree":
      return (
        <svg {...common}>
          <path d="M4 14 18 8l14 6-14 6z" />
          <path d="M10 17v6c2.5 2.5 13.5 2.5 16 0v-6" />
          <path d="M32 14v7" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M11 26h15a6 6 0 0 0 0-12 8 8 0 0 0-15.2 1.6A5.2 5.2 0 0 0 11 26z" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M18 6v5M18 25v5M6 18h5M25 18h5" />
          <path d="M18 12c.8 3.4 2.6 5.2 6 6-3.4.8-5.2 2.6-6 6-.8-3.4-2.6-5.2-6-6 3.4-.8 5.2-2.6 6-6z" />
        </svg>
      );
    case "data":
      return (
        <svg {...common}>
          <ellipse cx="18" cy="10" rx="10" ry="4" />
          <path d="M8 10v8c0 2.2 4.5 4 10 4s10-1.8 10-4v-8" />
          <path d="M8 18v8c0 2.2 4.5 4 10 4s10-1.8 10-4v-8" />
        </svg>
      );
  }
}
