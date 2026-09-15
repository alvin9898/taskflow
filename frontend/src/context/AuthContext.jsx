import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("taskflow_token");
        localStorage.removeItem("taskflow_user");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(
      email,
      password
    
    );

    localStorage.setItem(
      "taskflow_token",
      data.token
    );

    localStorage.setItem(
      "taskflow_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data;
  };

  const register = async (
    name,
    email,
    password,
    role
  ) => {
    const data = await registerUser(
      name,
      email,
      password,
      role
    );

    localStorage.setItem(
      "taskflow_token",
      data.token
    );

    localStorage.setItem(
      "taskflow_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
    setUser(null);
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}