import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get active session user details from Supabase auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL || 'kashishhandloombkn@gmail.com';
  const isUserAdmin = user && (user.email === adminEmail || user.email === 'kashishhandloombkn@gmail.com');

  // Only protect /admin routes (except /admin/login itself)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')
  ) {
    if (!user || !isUserAdmin) {
      // No session or not admin — redirect to admin login
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in as admin and tries to access /admin/login
  if (
    request.nextUrl.pathname === '/admin/login' &&
    user &&
    isUserAdmin
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match only admin routes for performance and safety
    '/admin/:path*',
  ],
};
