import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 text-lg font-semibold">
        Web Service
      </Link>
      <div className="bg-card w-full max-w-sm rounded-lg border p-8 shadow-sm">{children}</div>
    </div>
  );
}
