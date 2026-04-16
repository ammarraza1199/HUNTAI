/**
 * frontend/lib/auth.ts
 * HuntAI - Open Source Auth Service
 * Handles OTP and Google Login via FastAPI Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const authAPI = {
  /**
   * Triggers a 6-digit OTP to the user's email via the backend.
   */
  sendOTP: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Failed to send OTP" }));
        throw new Error(error.detail || "Failed to send OTP");
    }
    return res.json();
  },

  /**
   * Verifies the OTP and returns a JWT.
   */
  verifyOTP: async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Invalid OTP" }));
        throw new Error(error.detail || "Invalid OTP");
    }
    const data = await res.json();
    
    // SAVE TOKEN AND USER DATA
    if (data.access_token) {
        localStorage.setItem("huntai_access_token", data.access_token);
        localStorage.setItem("huntai_user", JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Logs in via Google OAuth credential.
   */
  googleLogin: async (credentialToken: string) => {
    const res = await fetch(`${API_BASE}/auth/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credentialToken }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Google login failed" }));
        throw new Error(error.detail || "Google login failed");
    }
    const data = await res.json();
    
    if (data.access_token) {
        localStorage.setItem("huntai_access_token", data.access_token);
        localStorage.setItem("huntai_user", JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Logs the user out locally.
   */
  logout: () => {
    localStorage.removeItem("huntai_access_token");
    localStorage.removeItem("huntai_user");
    window.location.href = "/login";
  },

  /**
   * Retrieves the current local session/token.
   */
  getToken: () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("huntai_access_token");
    }
    return null;
  },

  /**
   * Retrieves stored user info.
   */
  getUser: () => {
    if (typeof window !== "undefined") {
        const user = localStorage.getItem("huntai_user");
        return user ? JSON.parse(user) : null;
    }
    return null;
  }
};
