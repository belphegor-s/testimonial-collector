export default function KudosoLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Kudoso"
    >
      <rect width="100" height="100" rx="24" fill="#18181b" />
      {/* Stem */}
      <path d="M33 18 L33 82" stroke="white" strokeWidth="9" strokeLinecap="round" />
      {/* Arm + leg — single S-curve, script style */}
      <path
        d="M67 23 C60 28 42 41 33 50 C42 59 60 72 67 77"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
