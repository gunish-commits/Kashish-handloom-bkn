import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('API Error in /api/categories:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
