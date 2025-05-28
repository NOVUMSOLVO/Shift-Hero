import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      organizationId?: string | null;
      organizationName?: string | null;
      pharmacies?: Array<{
        id: string;
        name: string;
        role: string;
      }>;
      selectedPharmacyId?: string | null;
      selectedPharmacyName?: string | null;
      isSmartcardUser?: boolean;
      smartcardRights?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId?: string | null;
    organizationName?: string | null;
    pharmacies?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    selectedPharmacyId?: string | null;
    selectedPharmacyName?: string | null;
    isSmartcardUser?: boolean;
    smartcardRights?: string[];
  }
}
