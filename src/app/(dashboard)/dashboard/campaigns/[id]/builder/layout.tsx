export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
