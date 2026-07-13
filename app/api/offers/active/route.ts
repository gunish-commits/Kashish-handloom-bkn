import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const supabase = createServerClient();

    // Fetch active offers whose expiration is null or in the future
    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .or(`valid_until.is.null,valid_until.gte.${todayStr}`);

    if (error) {
      throw error;
    }

    return NextResponse.json(offers);
  } catch (error: any) {
    console.error('API Error in /api/offers/active:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
