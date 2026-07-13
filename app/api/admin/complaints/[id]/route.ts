import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../../lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(complaint);
  } catch (error: any) {
    console.error(`API Error in PUT /api/admin/complaints/[id]:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update complaint' }, { status: 500 });
  }
}
