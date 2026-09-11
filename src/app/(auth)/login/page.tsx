import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="card-surface p-8 max-w-md mx-auto mt-12 text-center">
      <h1 className="text-2xl font-bold mb-2 text-[#161414]">Log In to QuestGo</h1>
      <p className="text-sm text-gray-600 mb-6">Welcome back! Please enter your CIT-U student credentials.</p>
      <Link href="/dashboard" className="btn-primary w-full inline-block">
        Go to Dashboard (Demo)
      </Link>
    </div>
  );
}