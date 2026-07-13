import { createServerClient } from '../../../lib/supabase/server';
import Divider from '../../../components/ui/Divider';
import Button from '../../../components/ui/Button';

export const metadata = {
  title: 'Current Offers',
  description: 'Explore the latest quantity bundles, cart discounts, and category offers at Kashish Handloom Bikaner.',
};

// Revalidate page cache every minute
export const revalidate = 60;

export default async function OffersPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const supabase = createServerClient();

  // Fetch active campaigns
  const { data: offers, error } = await supabase
    .from('offers')
    .select('*')
    .eq('active', true)
    .or(`valid_until.is.null,valid_until.gte.${todayStr}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers:', error);
  }

  const activeOffers = offers || [];

  return (
    <div className="flex-1 bg-[#FAF7F2] pb-20 pt-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 select-none">
        
        {/* Page Headings */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <p className="font-sans font-medium text-[10px] md:text-xs text-deep-maroon tracking-[0.2em] uppercase">
            Exclusive Deals
          </p>
          <h1 className="font-display font-light text-3xl md:text-5xl italic text-ink">
            All Current Offers
          </h1>
          <Divider />
        </div>

        {/* Offers Grid: 3 cols desktop, 1 col mobile */}
        {activeOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {activeOffers.map(offer => {
              const filterUrl = offer.category_id
                ? `/shop?category=${offer.category_id}`
                : '/shop';

              const validityText = offer.valid_until
                ? `Valid until: ${new Date(offer.valid_until).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'Limited Time Offer';

              let rewardText = '';
              if (offer.reward_type === 'percent_discount') {
                rewardText = `${offer.reward_value}% OFF`;
              } else if (offer.reward_type === 'fixed_discount') {
                rewardText = `₹${offer.reward_value} OFF`;
              } else if (offer.reward_type === 'fixed_total') {
                rewardText = `Total: ₹${offer.reward_value}`;
              }

              return (
                <div
                  key={offer.id}
                  className="relative bg-white border border-gray-150 border-t-[3px] border-t-antique-gold p-6 rounded-[2px] flex flex-col justify-between h-[300px] hover:shadow-[0_8px_24px_rgba(15,10,5,0.06)] hover:border-antique-gold/40 transition-all duration-300 group overflow-hidden"
                >
                  {/* Sweep Shimmer Sweep Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-antique-gold/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite_linear]" />

                  {/* Card Content Header */}
                  <div className="space-y-3 z-10">
                    <h3 className="font-display font-semibold text-xl md:text-2xl text-ink group-hover:text-deep-maroon transition-colors leading-tight">
                      {offer.title}
                    </h3>
                    <p className="font-sans text-xs text-gray-500 leading-relaxed line-clamp-4">
                      {offer.description}
                    </p>
                  </div>

                  {/* Bottom metrics and trigger */}
                  <div className="space-y-4 z-10 pt-4 border-t border-gray-100">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono font-bold text-2xl text-antique-gold">
                        {rewardText}
                      </span>
                      <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider">
                        {validityText}
                      </span>
                    </div>

                    <Button
                      variant="outline-gold"
                      href={filterUrl}
                      className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold"
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-gray-200 rounded-[4px] bg-white max-w-md mx-auto shadow-xs">
            <span className="text-4xl mb-4 block">🏷️</span>
            <p className="font-sans text-sm text-gray-500">
              There are no active campaigns running at the moment. Keep an eye on Bikaner selections!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
