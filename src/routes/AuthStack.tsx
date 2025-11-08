import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";
import LoginScreen from "../screens/LoginScreen/LoginScreen";
import AppTabs, { AppTabsParamList } from "./AppTabs";

export type AuthStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<AppTabsParamList>; 
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Tabs">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Tabs" component={AppTabs} />
    </Stack.Navigator>
  );
}
