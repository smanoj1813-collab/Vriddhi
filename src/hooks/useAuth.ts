import { useContext } from "react";
import AuthContext from "../modules/auth/context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null as unknown,
      isLoading: false,
      isAuthenticated: false,
      login: async () => {},
      logout: async () => {},
      hasRole: () => false,
      hasPermission: () => false,
    };
  }
  return context;
}
