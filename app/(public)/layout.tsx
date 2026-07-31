import React from 'react';
import AnnouncementTicker from '../../components/layout/AnnouncementTicker';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import WhatsAppFloatingButton from '../../components/ui/WhatsAppFloatingButton';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementTicker />
      <Header />
      <main className="flex-1 flex flex-col page-fade-in">{children}</main>
      <Footer />
      <WhatsAppFloatingButton />
    </>
  );
}
