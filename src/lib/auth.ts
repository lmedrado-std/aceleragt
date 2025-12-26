
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
  
  // Lista de chaves para remover
  const keysToRemove: string[] = [];

  // Encontra todas as chaves relevantes
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key === 'adminAuthenticated' || key.startsWith('storeAuthenticated-') || key.startsWith('sellerAuthenticated-'))) {
      keysToRemove.push(key);
    }
  }

  // Remove as chaves encontradas
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
}


/**
 * Realiza o logout de uma loja específica, limpando a sessão da loja.
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
    
