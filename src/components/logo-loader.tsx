export function LogoLoader({
  fullScreen = true,
  transparent = false,
}: {
  fullScreen?: boolean;
  transparent?: boolean;
}) {
  const path = "M32 59 C32 49 19 45 19 34 C19 24 28 20 32 14 C36 20 45 24 45 34 C45 45 32 49 32 59";
  const pathLeft = "M32 59 C32 49 23 44 23 34 C23 25 29 20 32 14 C37 20 41 25 41 34 C41 44 32 49 32 59";

  return (
    <div
      className={`grid place-items-center ${transparent ? "bg-transparent" : "bg-[#f7f9fc]"} ${fullScreen ? "min-h-screen" : "min-h-[55vh]"}`}
      role="status"
      aria-live="polite"
      aria-label="Loading SecurePath Bank"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/92 px-8 py-6 shadow-[0_18px_55px_rgba(16,35,63,.12)] backdrop-blur">
        <svg viewBox="0 0 64 64" className="h-20 w-20" aria-hidden>
          <path d="M7 9 25 16v30L7 55V9Z" fill="#10233F" />
          <path d="m57 9-18 7v30l18 9V9Z" fill="#10233F" />
          <path
            d={path}
            fill="none"
            stroke="#2563EB"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
          >
            <animate attributeName="d" values={`${path};${pathLeft};${path}`} dur="1.7s" repeatCount="indefinite" />
            <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.05s" repeatCount="indefinite" />
          </path>
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-[.24em] text-[#10233F]">
          SecurePath Bank
        </span>
      </div>
      <span className="sr-only">Loading SecurePath Bank</span>
    </div>
  );
}