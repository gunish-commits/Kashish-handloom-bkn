import { createServerClient } from '../../../lib/supabase/server';
import Button from '../../../components/ui/Button';
import { Phone, Mail, MapPin, Instagram, Clock, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Kashish Handloom Bikaner. Reach out via WhatsApp, phone, or visit our retail store.',
};

export default async function ContactPage() {
  const supabase = createServerClient();
  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const primaryWa = settings?.primary_whatsapp || '+918209455157';
  const cleanWa = primaryWa.replace(/\D/g, '');
  const waLink = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}`;

  const altPhone = settings?.alt_phone || '+917976924013';
  const cleanAlt = altPhone.replace(/\D/g, '');
  const altLink = `tel:${cleanAlt.length === 10 ? `+91${cleanAlt}` : altPhone}`;

  // Bulletproof free Google Maps search embed url
  const mapEmbedUrl = `https://maps.google.com/maps?q=Kashish%20Handloom%20Bikaner%20Near%20New%20Taj%20Hotel&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Page Headings */}
        <div className="space-y-1 pb-4 border-b border-gray-150 text-center md:text-left">
          <h1 className="font-display font-light text-3xl md:text-5xl italic text-ink">
            Get in Touch
          </h1>
          <p className="font-sans text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
            Contact us for enquiries, custom bundles, or store location inquiries
          </p>
        </div>

        {/* 2-Column Grid Layout (Details left, map right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details (Left 50%) */}
          <div className="lg:col-span-6 bg-white p-5 md:p-8 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] space-y-6">
            <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider pb-3 border-b border-gray-100 mb-4">
              Contact Details
            </h3>

            <div className="space-y-4 text-sm md:text-base text-gray-600">
              {/* WhatsApp Contact */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Primary WhatsApp / Mobile</span>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-ink hover:text-deep-maroon transition-colors">
                    {primaryWa}
                  </a>
                </div>
              </div>

              {/* Alternate Contact */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-deep-maroon/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-deep-maroon" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Alternate Mobile</span>
                  <a href={altLink} className="font-mono font-semibold text-ink hover:text-deep-maroon transition-colors">
                    {altPhone}
                  </a>
                </div>
              </div>

              {/* Email contact */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-antique-gold/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-antique-gold" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Email Support</span>
                  <a href={`mailto:${settings?.email || 'kashishhandloombkn@gmail.com'}`} className="text-ink hover:text-deep-maroon transition-colors break-all">
                    {settings?.email || 'kashishhandloombkn@gmail.com'}
                  </a>
                </div>
              </div>

              {/* Instagram Contact */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Instagram Handle</span>
                  <a
                    href={settings?.instagram_url || 'https://www.instagram.com/kashish_handlooom'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-deep-maroon transition-colors font-medium"
                  >
                    @kashish_handlooom
                  </a>
                </div>
              </div>

              {/* Address details */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Store Address</span>
                  <p className="text-xs md:text-sm text-ink leading-relaxed whitespace-pre-line">
                    {settings?.address || `Kashish Handloom\nJinnah Road, Coatagate,\nNear New Taj Hotel,\nBikaner, Rajasthan — 334001, India`}
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Business Hours</span>
                  <p className="text-xs md:text-sm text-ink leading-relaxed whitespace-pre-line">
                    {settings?.business_hours || 'Mon–Sat: 10:00 AM – 8:00 PM\nSun: 11:00 AM – 6:00 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Order deep link trigger CTA */}
            <div className="pt-4">
              <Button
                variant="whatsapp"
                href={waLink}
                external
                className="w-full h-12 uppercase tracking-widest text-[11px] font-semibold flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4.5 h-4.5 fill-current text-white shrink-0" />
                <span>Order on WhatsApp Now</span>
              </Button>
            </div>
          </div>

          {/* Google Maps Iframe (Right 50%) */}
          <div className="lg:col-span-6 bg-white p-4 border border-gray-100 rounded-[4px] shadow-[0_2px_8px_rgba(15,10,5,0.03)] h-[482px] flex flex-col justify-between">
            <h3 className="font-sans font-semibold text-sm text-ink uppercase tracking-wider pb-3 border-b border-gray-100 mb-4 shrink-0">
              Location Map
            </h3>
            
            <div className="flex-1 w-full relative">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '4px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kashish Handloom Bikaner Store Location"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
