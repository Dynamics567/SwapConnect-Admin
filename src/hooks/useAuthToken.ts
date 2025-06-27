import { useState, useEffect } from "react";

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // get from URL first
    const params = new URLSearchParams(window.location.search);
    const tokenFromParams = params.get("token");

    if (tokenFromParams) {
      localStorage.setItem("token", tokenFromParams);
      setToken(tokenFromParams);
    } else {
      const tokenFromStorage = localStorage.getItem("token");
      setToken(tokenFromStorage);
    }
  }, []);

  return token;
};
