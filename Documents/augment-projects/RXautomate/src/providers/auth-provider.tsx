"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";

type Pharmacy = {
  id: string;
  name: string;
  role: string;
};

type AuthContextType = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  userPharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  selectPharmacy: (pharmacyId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "loading",
  userPharmacies: [],
  selectedPharmacy: null,
  selectPharmacy: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();
  const [userPharmacies, setUserPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Set user pharmacies from session
      setUserPharmacies(session.user.pharmacies || []);
      
      // Set selected pharmacy if it exists in session
      if (session.user.selectedPharmacyId) {
        const pharmacy = (session.user.pharmacies || []).find(
          (p) => p.id === session.user.selectedPharmacyId
        );
        
        if (pharmacy) {
          setSelectedPharmacy(pharmacy);
        }
      }
    }
  }, [session]);

  const selectPharmacy = async (pharmacyId: string) => {
    const pharmacy = userPharmacies.find((p) => p.id === pharmacyId);
    
    if (!pharmacy) {
      throw new Error("Pharmacy not found");
    }
    
    // Update session with selected pharmacy
    await update({
      selectedPharmacyId: pharmacy.id,
      selectedPharmacyName: pharmacy.name,
    });
    
    setSelectedPharmacy(pharmacy);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        userPharmacies,
        selectedPharmacy,
        selectPharmacy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
