import { ReactNode, useState } from 'react';
import Navbar from './Navbar';
import UpgradeModal from './UpgradeModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onUpgradeClick={() => setIsUpgradeModalOpen(true)} />
      <main>{children}</main>
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}
