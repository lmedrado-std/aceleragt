"use client";

export const trackSellerView = async (sellerId: string) => {
  try {
    // We don't need to wait for this to complete
    fetch(`/api/sellers/${sellerId}/track-view`, {
      method: "POST",
    });
  } catch (error) {
    // Silently fail, this is not a critical feature
    console.error("Failed to track seller view:", error);
  }
};

    