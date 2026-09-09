import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="card-surface p-8 max-w-md mx-auto mt-12 text-center">
      <h1 className="text-2xl font-bold mb-2 text-[#161414]">Create an Account</h1>
      <p className="text-sm text-gray-600 mb-6">Exclusive to verified @cit.edu students.</p>
      <Link href="/login" className="btn-outline w-full inline-block">
        Already have an account? Log In
      </Link>
    </div>
  );
}