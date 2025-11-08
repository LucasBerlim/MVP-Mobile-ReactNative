import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen/HomeScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen/ActivitiesScreen";
import UserScreen from "../screens/UserScreen/UserScreen";
import { useAuth } from "../context/authContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AppTabsParamList = {
  Home: undefined;
  Activities: undefined;
  User: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppTabs() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2E7D32",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Eventos",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Activities"
        component={ActivitiesScreen}
        options={{
          title: "Atividades",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="User"
        component={UserScreen}
        options={{
          title: "Usuário",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              navigation.navigate("Login" as never);
            }
          },
        }}
      />
    </Tab.Navigator>
  );
}
