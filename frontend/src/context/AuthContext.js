import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await apiClient.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch full user profile details
      try {
        const profileResponse = await apiClient.get(
          `/users/profile/${response.data.user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        // Normalize postal_code to postalCode for frontend consistency
        const normalizedProfile = {
          ...profileResponse.data,
          postalCode: profileResponse.data.postal_code,
        };
        setUser({
          ...response.data.user,
          ...normalizedProfile,
        });
      } catch {
        // If profile fetch fails, just use the verified token data
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.token);

    // Fetch full profile details
    try {
      const profileResponse = await apiClient.get(
        `/users/profile/${response.data.user.id}`,
        {
          headers: { Authorization: `Bearer ${response.data.token}` },
        },
      );
      // Normalize postal_code to postalCode for frontend consistency
      const normalizedProfile = {
        ...profileResponse.data,
        postalCode: profileResponse.data.postal_code,
      };
      const fullUser = {
        ...response.data.user,
        ...normalizedProfile,
      };
      setUser(fullUser);
      return { ...response.data, user: fullUser };
    } catch {
      setUser(response.data.user);
      return response.data;
    }
  };

  const register = async (email, password, profileData = {}) => {
    const response = await apiClient.post("/auth/register", {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);

      // If profile data provided, update profile after registration
      if (profileData && Object.keys(profileData).length > 0) {
        try {
          await apiClient.put(
            `/users/profile/${response.data.user.id}`,
            profileData,
            {
              headers: { Authorization: `Bearer ${response.data.token}` },
            },
          );
          // Fetch updated profile
          const profileResponse = await apiClient.get(
            `/users/profile/${response.data.user.id}`,
            {
              headers: { Authorization: `Bearer ${response.data.token}` },
            },
          );
          // Normalize postal_code to postalCode for frontend consistency
          const normalizedProfile = {
            ...profileResponse.data,
            postalCode: profileResponse.data.postal_code,
          };
          setUser((prev) => ({
            ...prev,
            ...normalizedProfile,
          }));
        } catch (error) {
          console.error("Error updating profile:", error);
        }
      }
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
