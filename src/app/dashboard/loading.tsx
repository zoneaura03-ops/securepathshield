export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-gray-200" />
        <div className="h-10 w-72 max-w-full rounded bg-gray-200" />
        <div className="h-4 w-80 max-w-full rounded bg-gray-100" />
      </div>
      <div className="h-64 rounded-2xl bg-gradient-to-br from-bank-900/30 to-bank-600/20" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-white shadow-sm" />
    </div>
  );
}
