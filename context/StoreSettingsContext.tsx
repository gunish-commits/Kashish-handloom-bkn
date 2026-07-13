'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';

export type StoreSettings = {
  logo_url: string;
  store_name: string;
  primary_whatsapp: string;
  alt_phone?: string;
  email?: string;
  address?: string;
  instagram_url?: string;
  business_hours?: string;
};

const StoreSettingsContext = createContext<StoreSettings | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>({
    logo_url: '/logo.jpg',    // fallback to local file
    store_name: 'Kashish Handloom',
    primary_whatsapp: '+918209455157',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching store settings:', error);
          return;
        }

        if (data) {
          // Fallback check to auto-swap '/logo.png' with '/logo.jpg'
          let logo = data.logo_url;
          if (!logo || logo === '/logo.png') {
            logo = '/logo.jpg';
          }
          setSettings({
            ...data,
            logo_url: logo,
          });
        }
      } catch (err) {
        console.error('Failed to resolve store settings context:', err);
      }
    };

    fetchSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    // If context is used outside provider, return default fallback settings
    return {
      logo_url: '/logo.jpg',
      store_name: 'Kashish Handloom',
      primary_whatsapp: '+918209455157',
    };
  }
  return context;
};
