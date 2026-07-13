import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  const token = authHeader.split(' ')[1];
  const client = createServerClient();
  
  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || 'Unauthorized' };
    }
    return { user, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Internal Auth Error' };
  }
}
export async function verifyAdmin(request: Request) {
  const { user, error } = await verifyAuth(request);
  if (error || !user) {
    return { user: null, error };
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || 'kashishhandloombkn@gmail.com';
  if (user.email !== adminEmail && user.email !== 'kashishhandloombkn@gmail.com') {
    return { user: null, error: 'Forbidden: Access restricted to administrator accounts.' };
  }
  
  return { user, error: null };
}
