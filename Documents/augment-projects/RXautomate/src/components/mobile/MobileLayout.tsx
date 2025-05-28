"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pill, Calendar, Package, User, Settings, Home } from 'lucide-react';

interface MobileNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function MobileNavItem({ href, icon, label, isActive }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center px-2 py-2 text-xs ${
        isActive ? 'text-primary' : 'text-gray-500'
      }`}
    >
      <div className={`mb-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16">
        <MobileNavItem 
          href="/mobile" 
          icon={<Home size={20} />} 
          label="Home" 
          isActive={pathname === '/mobile'}
        />
        <MobileNavItem 
          href="/mobile/prescriptions" 
          icon={<Pill size={20} />} 
          label="Prescriptions" 
          isActive={pathname.includes('/mobile/prescriptions')}
        />
        <MobileNavItem 
          href="/mobile/appointments" 
          icon={<Calendar size={20} />} 
          label="Appointments" 
          isActive={pathname.includes('/mobile/appointments')}
        />
        <MobileNavItem 
          href="/mobile/inventory" 
          icon={<Package size={20} />} 
          label="Inventory" 
          isActive={pathname.includes('/mobile/inventory')}
        />
        <MobileNavItem 
          href="/mobile/settings" 
          icon={<Settings size={20} />} 
          label="Settings" 
          isActive={pathname.includes('/mobile/settings')}
        />
      </nav>
    </div>
  );
}
