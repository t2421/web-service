import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <Link href="/" className="mb-8 text-lg font-semibold">
        Web Service
      </Link>
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
