import React from "react";
import { useAuth } from "../context/authContext";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";

export default function Routes() {
  const { user } = useAuth();
  return user ? <AppStack /> : <AuthStack />;
}
