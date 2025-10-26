import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { requireAuth } from '@/lib/auth';

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {session?.user?.name}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
          <p className="mt-2 text-sm text-gray-600">Email: {session?.user?.email || 'N/A'}</p>
          <p className="mt-1 text-sm text-gray-600">Name: {session?.user?.name || 'N/A'}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Extension Token</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your authentication token is automatically synced to localStorage and sessionStorage for
            extension access.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="mt-2 text-sm text-gray-600">
            Access your settings and manage your account preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};
