export function LogoLoader({
  fullScreen = true,
  transparent = false,
}: {
  fullScreen?: boolean;
  transparent?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center ${transparent ? "bg-transparent" : "bg-[#f7f8fa]"} ${fullScreen ? "min-h-screen" : "min-h-[55vh]"}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Secure Path Bank"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/95 px-9 py-7 shadow-[0_18px_55px_rgba(10,23,40,.14)] backdrop-blur">
        <svg viewBox="0 0 64 64" className="h-20 w-20" fill="none" aria-hidden>
          <path d="M11 11.5 23.5 14 32 10l8.5 4L53 11.5v18.2C53 43.5 45.4 53.2 32 59 18.6 53.2 11 43.5 11 29.7V11.5Z" stroke="#d6b45f" strokeWidth="4.2" strokeLinejoin="round" strokeDasharray="160" strokeDashoffset="160">
            <animate attributeName="stroke-dashoffset" values="160;0;0" keyTimes="0;.62;1" dur="1.9s" repeatCount="indefinite" />
          </path>
          <g fill="#d6b45f" opacity="0">
            <path d="M16.5 42.5c7.5-7.8 15.3-13 23.4-15.6-6 4.8-10.8 10.8-14.5 18-2.7-1.1-5.7-1.9-8.9-2.4Z" />
            <path d="M23.8 50.2c5-10.7 11.9-18.7 20.8-24.1-6.3 7.2-10.9 16.4-13.8 27.7-2.5-1-4.8-2.2-7-3.6Z" />
            <path d="M32.9 55.2c2.1-12.1 6.7-21.9 13.9-29.6l-1.2 8.1 4.2-13.4-13.6 4.1 7.2-.5c-7.7 7.2-12 17-12.8 29.6.7.6 1.5 1.2 2.3 1.7Z" />
            <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.35;.68;1" dur="1.9s" repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values="-2 3;0 0;0 0" dur="1.9s" repeatCount="indefinite" />
          </g>
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#0a1728]">
          Secure Path <span className="text-[#b78a32]">Bank</span>
        </span>
      </div>
      <span className="sr-only">Loading Secure Path Bank</span>
    </div>
  );
}