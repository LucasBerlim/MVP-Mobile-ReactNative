import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminCreateScreen from "../screens/AdminCreateScreen/AdminCreateScreen";
import HomeScreen from "../screens/HomeScreen/HomeScreen";
import UserScreen from "../screens/UserScreen/UserScreen";

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminCreate: { preset?: "evento" } | undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={UserScreen}
        options={{ title: "Painel administrativo" }}
      />
      <Stack.Screen
        name="AdminCreate"
        component={AdminCreateScreen}
        options={{ title: "Novo cadastro", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
