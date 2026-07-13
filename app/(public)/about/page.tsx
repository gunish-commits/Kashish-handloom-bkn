import React from 'react';
import Image from 'next/image';
import Divider from '../../../components/ui/Divider';
import BrandName from '../../../components/ui/BrandName';

export const metadata = {
  title: 'Our Story Since 1976',
  description: 'Learn about the legacy of Kashish Handloom, serving quality fabrics since 1976 in Bikaner, Rajasthan.',
};

export default function AboutPage() {
  const timelineItems = [
    {
      year: '1976',
      icon: '🏪',
      title: 'Founded as "Ahuja Brothers"',
      desc: 'Shri Kishan Lal Ahuja establishes the first handloom store in Bikaner, Rajasthan, building on a foundation of customer trust.',
    },
    {
      year: '2000s',
      icon: '👨‍👦‍👦',
      title: 'Next Generation Joins',
      desc: "Inspired by their father's values, his sons Mr. Manish Ahuja and Mr. Ankit Ahuja join the family business to expand its scope.",
    },
    {
      year: '2005',
      icon: '✨',
      title: 'Rebranded as "Kashish Handloom"',
      desc: 'The brand transitions to its modern retail identity with a vastly expanded product range in Bikaner home furnishings.',
    },
    {
      year: '2025',
      icon: '📱',
      title: 'Digital Transformation Begins',
      desc: 'Kashish Handloom launches online catalog shopping and direct WhatsApp ordering, delivering Bikaner craftsmanship across all of India.',
    },
  ];

  return (
    <div className="flex-1 select-none font-sans bg-[#FAF7F2]">
      
      {/* 1. Hero Section (DARK) */}
      <section className="relative py-24 md:py-32 bg-ink text-warm-ivory overflow-hidden text-center">
        <Image
          src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1600"
          alt="Weaving Textile Background"
          fill
          className="object-cover opacity-30 pointer-events-none"
        />
        <div className="absolute inset-0 bg-ink/75" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 flex flex-col items-center space-y-4">
          <div className="about-hero-brand mb-2">
            <BrandName size="xl" theme="dark" showTagline={true} centered={true} />
          </div>
          <h1 className="font-display font-light text-4xl md:text-6xl italic text-warm-ivory">
            Our Story
          </h1>
          <p className="font-sans text-xs md:text-base text-pale-linen/80 max-w-lg mx-auto leading-relaxed">
            Four decades of handloom heritage from the heart of Rajasthan
          </p>
        </div>
      </section>

      {/* 2. Story Narrative (LIGHT) */}
      <section className="py-16 md:py-24 bg-white-section text-[#1A110A]">
        <div className="max-w-3xl mx-auto px-4 space-y-8 text-center">
          <p className="font-sans font-medium text-[10px] md:text-xs text-deep-maroon tracking-[0.2em] uppercase">
            Established 1976
          </p>
          <h2 className="font-display font-light text-2xl md:text-4xl italic text-ink">
            A Legacy built on Quality
          </h2>
          <div className="w-12 h-px bg-deep-maroon/20 mx-auto" />
          
          <div className="text-sm md:text-base leading-relaxed text-[#1A110A] space-y-6 max-w-2xl mx-auto text-justify sm:text-center">
            <p>
              Kashish Handloom traces its roots back to 1976 when Shri Kishan Lal Ahuja established a handloom store under the name Ahuja Brothers in Bikaner, Rajasthan. His vision was simple: provide high-quality handloom products at affordable prices while maintaining trust and long-lasting relationships with customers.
            </p>
            <p>
              Over the years, the business earned a strong reputation for quality, reliability, and customer satisfaction throughout Bikaner. Inspired by their father's values and dedication, his sons Mr. Manish Ahuja and Mr. Ankit Ahuja joined the family business and continued expanding its reach.
            </p>
            <p>
              In 2005, the modern retail identity Kashish Handloom was launched to serve customers with a wider range of home furnishing and décor products. Today, Kashish Handloom offers a carefully curated collection of bedsheets, curtains, comforters, blankets, pillow covers, table runners, home décor items, and much more.
            </p>
            <p>
              In 2025, Kashish Handloom began its digital transformation, bringing over four decades of trust and experience to customers across India through online shopping and WhatsApp ordering.
            </p>
            <p>
              Our mission remains unchanged: Deliver beautiful handloom products, exceptional quality, and outstanding customer service to every home.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Vertical Timeline (DARK) */}
      <section className="py-16 md:py-24 bg-surface-dark text-warm-ivory relative">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-2">
            <p className="font-sans font-medium text-[10px] md:text-xs text-antique-gold tracking-[0.2em] uppercase">
              Milestones
            </p>
            <h2 className="font-display font-light text-2xl md:text-4xl italic text-warm-ivory">
              Timeline of Weaving Trust
            </h2>
            <Divider />
          </div>

          {/* Timeline Wrapper */}
          <div className="relative border-l border-border-dark/60 md:border-l-0 md:flex md:flex-col space-y-8 md:space-y-0">
            {/* Center line helper on desktop */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-border-dark/65 hidden md:block" />

            {timelineItems.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  className={`relative pl-8 md:pl-0 flex flex-col md:flex-row items-start md:items-center ${
                    isEven ? 'md:justify-start' : 'md:justify-end'
                  }`}
                >
                  {/* Central Node Badge */}
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-1.5 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full bg-surface-mid border border-antique-gold flex items-center justify-center text-sm z-10 shadow-md">
                    {item.icon}
                  </div>

                  {/* Content Bubble Card */}
                  <div
                    className={`w-full md:w-[45%] bg-surface-mid/40 border border-border-dark p-5 rounded-[4px] space-y-2 ${
                      isEven ? 'md:mr-auto' : 'md:ml-auto'
                    }`}
                  >
                    <span className="font-mono font-bold text-sm text-antique-gold tracking-widest block uppercase">
                      {item.year}
                    </span>
                    <h4 className="font-sans font-semibold text-sm md:text-base text-warm-ivory">
                      {item.title}
                    </h4>
                    <p className="font-sans text-xs text-pale-linen/75 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Mission Statement (LIGHT) */}
      <section className="py-16 md:py-20 bg-white-section text-center">
        <div className="max-w-3xl mx-auto px-4">
          <p className="font-sans font-medium text-[10px] md:text-xs text-deep-maroon tracking-[0.2em] uppercase mb-4">
            Our Purpose
          </p>
          <p className="font-display font-light text-2xl md:text-3.5xl italic text-deep-maroon max-w-2xl mx-auto leading-normal">
            "Deliver beautiful handloom products, exceptional quality, and outstanding customer service to every home."
          </p>
        </div>
      </section>

      {/* 5. Founders Cards (DARK) */}
      <section className="py-16 md:py-24 bg-ink text-warm-ivory border-t border-border-dark/30">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-2">
            <p className="font-sans font-medium text-[10px] md:text-xs text-antique-gold tracking-[0.2em] uppercase">
              Leadership
            </p>
            <h2 className="font-display font-light text-2xl md:text-4xl italic text-warm-ivory">
              The Founders
            </h2>
            <Divider />
          </div>

          {/* Grid of Founders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Founder 1 */}
            <div className="bg-surface-dark border border-border-dark/65 p-6 rounded-[2px] text-center space-y-4 hover:border-antique-gold/25 transition-colors duration-300">
              {/* Silhouette Placeholder */}
              <div className="w-24 h-24 rounded-full bg-surface-mid/60 border border-border-dark/70 flex items-center justify-center mx-auto text-gray-500">
                <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="space-y-1 font-sans">
                <h4 className="font-bold text-sm md:text-base text-warm-ivory">Mr. Manish Ahuja</h4>
                <p className="text-xs text-antique-gold font-medium tracking-wide uppercase">Co-Owner, Kashish Handloom</p>
              </div>
            </div>

            {/* Founder 2 */}
            <div className="bg-surface-dark border border-border-dark/65 p-6 rounded-[2px] text-center space-y-4 hover:border-antique-gold/25 transition-colors duration-300">
              {/* Silhouette Placeholder */}
              <div className="w-24 h-24 rounded-full bg-surface-mid/60 border border-border-dark/70 flex items-center justify-center mx-auto text-gray-500">
                <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="space-y-1 font-sans">
                <h4 className="font-bold text-sm md:text-base text-warm-ivory">Mr. Ankit Ahuja</h4>
                <p className="text-xs text-antique-gold font-medium tracking-wide uppercase">Co-Owner, Kashish Handloom</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
