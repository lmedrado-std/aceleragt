
"use client";

// utils/auth.ts
export function isAdminGlobal(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('adminAuthenticated') === 'true';
}
export function isStoreAuthenticated(storeId: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`storeAuthenticated-${storeId}`) === 'true';
}
export function isSellerAuthenticated(sellerId: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';
}

    