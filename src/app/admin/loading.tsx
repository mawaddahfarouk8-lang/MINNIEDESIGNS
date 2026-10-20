export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-10 w-56 rounded-lg bg-petal-soft" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-petal-soft" />
        <div className="h-28 rounded-2xl bg-petal-soft" />
        <div className="h-28 rounded-2xl bg-petal-soft" />
      </div>
      <div className="h-72 rounded-2xl bg-petal-soft" />
    </div>
  );
}
