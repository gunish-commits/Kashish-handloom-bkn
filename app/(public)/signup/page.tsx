'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '';
    const redirectQuery = redirect ? `&redirect=${encodeURIComponent(redirect)}` : '';
    router.replace(`/login?tab=signup${redirectQuery}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center font-sans">
      <div className="animate-pulse text-antique-gold font-display italic text-xl">
        Redirecting to registration portal...
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center font-sans">
        <div className="animate-pulse text-antique-gold font-display italic text-xl">
          Redirecting to registration portal...
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
