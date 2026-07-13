import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, verifyAuth } from '../../../lib/supabase/server';

// Get complaints for logged-in customer
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(complaints || []);
  } catch (error: any) {
    console.error('API Error in GET /api/complaints:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Log a new complaint (customer)
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { order_id, subject, description } = await request.json();

    if (!subject || !description || subject.trim() === '' || description.trim() === '') {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        order_id: order_id && order_id.trim() !== '' ? order_id.trim() : null,
        customer_id: user.id,
        subject: subject.trim(),
        description: description.trim(),
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(complaint);
  } catch (error: any) {
    console.error('API Error in POST /api/complaints:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit complaint' }, { status: 500 });
  }
}
