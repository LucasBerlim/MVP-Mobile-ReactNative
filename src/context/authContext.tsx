import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../services/api";

interface AuthContextData {
  signed: boolean;
  user: any;
  signIn(usuario: any): Promise<void>;
  signOut(): void;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(undefined);
  const [signed, setSigned] = useState<boolean>(false);

  useEffect(() => {
    const loadStorageData = async () => {
      const storageUser = await AsyncStorage.getItem("@Usuario:user");
      const token = await AsyncStorage.getItem("@token");
      if (token) setAuthToken(token);
      if (storageUser) {
        setUser(JSON.parse(storageUser));
        setSigned(true);
      }
    };
    loadStorageData();
  }, []);

  const signIn = async (usuario: any) => {
    await AsyncStorage.setItem("@Usuario:user", JSON.stringify(usuario));
    setUser(usuario);
    setSigned(true);
    return Promise.resolve();
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(["@Usuario:user", "@token"]);
    setUser(undefined);
    setSigned(false);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ signed, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};
