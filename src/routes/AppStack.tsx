import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppTabs from "./AppTabs";
import AdminStack from "../routes/AdminStack";
import { useAuth } from "../context/authContext";

export type AppStackParamList = {
  Tabs: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().trim() === "administrador";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      {isAdmin && <Stack.Screen name="Admin" component={AdminStack} />}
    </Stack.Navigator>
  );
}
