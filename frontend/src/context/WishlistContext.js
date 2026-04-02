import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../utils/apiClient";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      // Get wishlist product IDs
      const wishlistResponse = await apiClient.get(`/wishlist/${user.id}`);
      const wishlistProductIds = wishlistResponse.data.map(
        (item) => item.id || item.product_id,
      );

      // Fetch full product data including images
      const productsResponse = await apiClient.get(`/products`);
      const allProducts = productsResponse.data;

      // Filter products that are in wishlist
      const wishlistWithImages = allProducts.filter((product) =>
        wishlistProductIds.includes(product.id),
      );

      console.log("Wishlist with images:", wishlistWithImages);
      setWishlist(wishlistWithImages);
      setWishlistIds(new Set(wishlistWithImages.map((item) => item.id)));
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      // Fallback: still try to show wishlist from API even if images fail
      try {
        const response = await apiClient.get(`/wishlist/${user.id}`);
        setWishlist(response.data);
        setWishlistIds(new Set(response.data.map((item) => item.id)));
      } catch (fallbackError) {
        console.error("Fallback wishlist fetch also failed:", fallbackError);
      }
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      alert("Please sign in to add items to wishlist");
      return;
    }

    try {
      await apiClient.post(`/wishlist/${user.id}/add`, { productId });
      wishlistIds.add(productId);
      setWishlistIds(new Set(wishlistIds));
      // Optionally fetch updated wishlist
      await fetchWishlist();
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;

    try {
      await apiClient.delete(`/wishlist/${user.id}/remove`, {
        data: { productId },
      });
      wishlistIds.delete(productId);
      setWishlistIds(new Set(wishlistIds));
      // Optionally fetch updated wishlist
      await fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistIds.has(productId);
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
