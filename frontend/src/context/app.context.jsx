import { createContext, useContext, useEffect, useState } from "react";

const initialAppContext = {
  isAuthenticated: false,
  setIsAuthenticated: () => {
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
  },
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  setUser: () => {},
  isSeller: false,
  setIsSeller: () => {},
  reset: () => {},
};

export const AppContext = createContext(initialAppContext);

export const useAuth = () => useContext(AppContext);

// Provider
export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("user");
  });

  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem("user");
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const [isSeller, setIsSeller] = useState(() => {
    const userInfo = localStorage.getItem("user");
    if (!userInfo) return false;
    const parsed = JSON.parse(userInfo);
    return parsed.role === "seller";
  });

  useEffect(() => {
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUser(parsed);
      setIsAuthenticated(true);
      setIsSeller(parsed.role === "seller");
    }
  }, []);
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
      setIsSeller(user.role === "seller");
    } else {
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setIsSeller(false);
    }
  }, [user]);

  const reset = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        isSeller,
        setIsSeller,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
