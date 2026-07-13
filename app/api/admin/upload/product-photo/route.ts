import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '../../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await verifyAdmin(request);
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucketName = 'product-photos';
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // Auto-create bucket if missing
      if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
        });

        if (bucketError) throw bucketError;

        // Retry upload
        const { error: retryError } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    // Resolve public link URL
    const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error: any) {
    console.error('API Error in product-photo upload:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
