import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: settings, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API Error in /api/delivery:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
