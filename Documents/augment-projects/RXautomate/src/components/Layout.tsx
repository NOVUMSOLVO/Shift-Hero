"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '../providers/auth-provider';
import NHSApiErrorNotification from './NHSApiErrorNotification';
import PrescriptionNotifications from './prescriptions/PrescriptionNotifications';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { session, userPharmacies, selectedPharmacy, selectPharmacy } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pharmacyMenuOpen, setPharmacyMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const handlePharmacyChange = async (pharmacyId: string) => {
    try {
      await selectPharmacy(pharmacyId);
      setPharmacyMenuOpen(false);
    } catch (error) {
      console.error('Error changing pharmacy:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-nhs-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              RXautomate
            </Link>

            {session && selectedPharmacy && (
              <div className="relative ml-6">
                <button
                  className="flex items-center text-sm font-medium rounded-md bg-nhs-dark-blue px-3 py-1.5 hover:bg-opacity-80 focus:outline-none"
                  onClick={() => setPharmacyMenuOpen(!pharmacyMenuOpen)}
                >
                  <span>{selectedPharmacy.name}</span>
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {pharmacyMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                        Your Pharmacies
                      </div>
                      {userPharmacies.map((pharmacy) => (
                        <button
                          key={pharmacy.id}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            selectedPharmacy.id === pharmacy.id
                              ? 'bg-gray-100 text-nhs-blue font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handlePharmacyChange(pharmacy.id)}
                        >
                          {pharmacy.name}
                          <span className="ml-2 text-xs text-gray-500">({pharmacy.role})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {session ? (
            <>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/prescriptions"
                  className={`hover:text-nhs-pale-blue ${isActive('/prescriptions') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  Prescriptions
                </Link>
                <Link
                  href="/inventory"
                  className={`hover:text-nhs-pale-blue ${isActive('/inventory') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  Inventory
                </Link>
                <Link
                  href="/private"
                  className={`hover:text-nhs-pale-blue ${isActive('/private') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  Private Scripts
                </Link>
                <Link
                  href="/vaccinations"
                  className={`hover:text-nhs-pale-blue ${isActive('/vaccinations') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  Vaccinations
                </Link>
                <Link
                  href="/gdpr"
                  className={`hover:text-nhs-pale-blue ${isActive('/gdpr') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  GDPR
                </Link>
                <Link
                  href="/settings"
                  className={`hover:text-nhs-pale-blue ${isActive('/settings') ? 'font-medium border-b-2 border-white pb-1' : ''}`}
                >
                  Settings
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                {/* Prescription Notifications */}
                <PrescriptionNotifications />

                {/* User menu */}
                <div className="relative">
                  <button
                    className="flex items-center text-sm font-medium rounded-full focus:outline-none"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {session.user?.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name || "User"}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-nhs-dark-blue flex items-center justify-center">
                        <span className="text-white font-medium">
                          {session.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <p className="font-medium">{session.user?.name}</p>
                          <p className="text-xs text-gray-500">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        {(session.user?.role === 'SUPER_ADMIN' || session.user?.role === 'ORG_ADMIN') && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                          onClick={handleSignOut}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden ml-4 text-white"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div>
              <Link
                href="/auth/login"
                className="text-white hover:text-nhs-pale-blue font-medium"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-nhs-dark-blue">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/prescriptions"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/prescriptions')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Prescriptions
              </Link>
              <Link
                href="/inventory"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/inventory')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Inventory
              </Link>
              <Link
                href="/private"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/private')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Private Scripts
              </Link>
              <Link
                href="/vaccinations"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/vaccinations')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Vaccinations
              </Link>
              <Link
                href="/gdpr"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/gdpr')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                GDPR
              </Link>
              <Link
                href="/settings"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/settings')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* NHS API Error Notification */}
      <NHSApiErrorNotification />

      <footer className="bg-nhs-dark-blue text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">RXautomate</h3>
              <p>Automating UK pharmacy processes including NHS prescription handling, inventory management, and more.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/prescriptions" className="hover:text-nhs-pale-blue">Prescriptions</Link></li>
                <li><Link href="/inventory" className="hover:text-nhs-pale-blue">Inventory</Link></li>
                <li><Link href="/private" className="hover:text-nhs-pale-blue">Private Scripts</Link></li>
                <li><Link href="/vaccinations" className="hover:text-nhs-pale-blue">Vaccinations</Link></li>
                <li><Link href="/gdpr" className="hover:text-nhs-pale-blue">GDPR</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact</h3>
              <p>Email: {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@rxautomate.co.uk'}</p>
              <p>Phone: {process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+44 (0)20 1234 5678'}</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-nhs-bright-blue text-center">
            <p>&copy; {new Date().getFullYear()} RXautomate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
