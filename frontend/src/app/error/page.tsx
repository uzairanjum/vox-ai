import Link from 'next/link';
import { ROUTES } from '@/utils/auth/supabase-auth';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
        <p className="text-lg mb-8">We encountered an error processing your request.</p>
        <Link 
          href={ROUTES.dashboard}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}