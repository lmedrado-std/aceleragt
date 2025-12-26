
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

/**
 * Realiza o logout global, limpando todas as chaves de autenticação da sessão.
 */
export function logoutAll() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('adminAuthenticated');
  
  // Remove todos os tokens de loja
  Object.keys(sessionStorage)
    .filter(key => key.startsWith('storeAuthenticated-'))
    .forEach(key => sessionStorage.removeItem(key));
    
  // Remove todos os tokens de vendedor
  Object.keys(sessionStorage)
    .filter(key => key.startsWith('sellerAuthenticated-'))
    .forEach(key => sessionStorage.removeItem(key));
}

/**
 * Realiza o logout de uma loja específica, limpando a sessão da loja e de todos os vendedores.
 */
export function logoutStore(storeId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`storeAuthenticated-${storeId}`);
}

/**
 * Realiza o logout de um vendedor específico.
 */
export function logoutSeller(sellerId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`sellerAuthenticated-${sellerId}`);
}
    
