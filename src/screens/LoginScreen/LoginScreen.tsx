import React, { useMemo, useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Button, Card, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../../context/authContext";
import { api1, setAuthToken } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./LoginScreen.styles";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../routes/AuthStack";

type NavProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavProp>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(
    () => (!email ? "" : /^\S+@\S+\.\S+$/.test(email) ? "" : "E-mail inválido"),
    [email]
  );

  const goToHome = () => {
    navigation.replace("Tabs", { screen: "Home" }); 
  };

  const passwordError = useMemo(
    () => (!password ? "" : password.length >= 4 ? "" : "Mínimo de 4 caracteres"),
    [password]
  );

  const disabled =
    loading || !email || !password || !!emailError || !!passwordError;

  const onSubmit = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const { data } = await api1.post("/login", { email: email.trim(), password });
      const { token, role, active } = data;
      await AsyncStorage.setItem("@token", token);
      setAuthToken(token);
      await signIn({
        id: String(Date.now()),
        name: email.split("@")[0],
        email: email.trim(),
        role,
        active,
      });
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={goToHome}
          style={{ marginBottom: 12 }}
        >
          Entrar como visitante
        </Button>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Entrar
            </Text>

            <TextInput
              mode="outlined"
              label="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Senha"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              right={
                <TextInput.Icon
                  icon={secure ? "eye-off-outline" : "eye-outline"}
                  onPress={() => setSecure((s) => !s)}
                />
              }
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={loading}
              disabled={disabled}
              style={styles.buttonPrimary}
            >
              Entrar
            </Button>

            <Button mode="text" onPress={() => {}} style={styles.buttonText}>
              Esqueci minha senha
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
