import React, { useMemo, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  HelperText,
  List,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/authContext";
import { styles } from "./UserScreen.styles";

import {
  updateName as svcUpdateName,
  updateEmail as svcUpdateEmail,
  changePassword as svcChangePassword,
} from "../../services/user.service";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "../../routes/AdminStack";

type AdminNav = NativeStackNavigationProp<AdminStackParamList>;

export default function UserScreen() {

  function isAdminRole(role?: string | null) {
    return (role ?? "").toString().trim().toLowerCase() === "administrador";
  }

  const navigation = useNavigation<AdminNav>();
  const theme = useTheme();
  const { user, signIn, signOut, token: ctxToken } = useAuth() as {
    user: { email: string; name?: string; role?: string } | null;
    token?: string | null;
    signIn: (u: any) => Promise<void>;
    signOut: () => void;
  };

  const [openName, setOpenName] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openPass, setOpenPass] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailCurrentPass, setEmailCurrentPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const base = (user?.name || user?.email || "U").trim();
    const parts = base.split(/\s+/).slice(0, 2);
    return parts.map((p: string) => p[0]?.toUpperCase() || "").join("");
  }, [user]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const onSaveName = async () => {
    if (!user) return;
    const newName = name.trim() || user.name || "";
    if (!newName) {
      Alert.alert("Nome inválido", "Informe um nome válido.");
      return;
    }
    try {
      setSaving(true);
      const res = await svcUpdateName(newName);
      await signIn({ ...user, name: res.name });
      setOpenName(false);
    } catch (e: any) {
      Alert.alert("Erro ao salvar nome", e?.response?.data?.detail || "Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveEmail = async () => {
    if (!user) return;
    const newEmail = email.trim().toLowerCase();
    if (!validateEmail(newEmail)) {
      setEmailErr("Informe um e-mail válido.");
      return;
    }
    if (!emailCurrentPass.trim()) {
      setEmailErr("Informe sua senha atual para confirmar a troca de e-mail.");
      return;
    }
    setEmailErr(null);

    try {
      setSaving(true);
      const res = await svcUpdateEmail(newEmail, emailCurrentPass);
      if (res.token) {
        await AsyncStorage.setItem("@token", res.token);
        await signIn({ ...user, email: res.email, token: res.token, role: res.role, active: res.active });
      } else {
        await signIn({ ...user, email: res.email });
      }
      setOpenEmail(false);
      setEmailCurrentPass("");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        (e?.response?.status === 401 ? "Senha atual incorreta." :
          e?.response?.status === 400 ? "Dados inválidos." :
            e?.response?.status === 409 ? "Este e-mail já está em uso." :
              "Não foi possível alterar o e-mail.");
      Alert.alert("Erro ao salvar e-mail", msg);
    } finally {
      setSaving(false);
    }
  };

  const onSavePassword = async () => {
    if (newPass.length < 6) {
      setPassErr("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassErr("A confirmação não coincide com a nova senha.");
      return;
    }
    setPassErr(null);
    try {
      setSaving(true);
      await svcChangePassword(currentPass, newPass);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setOpenPass(false);
      Alert.alert("Senha alterada", "Sua senha foi atualizada com sucesso.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        (e?.response?.status === 401 ? "Senha atual incorreta." : "Não foi possível alterar a senha.");
      Alert.alert("Erro ao salvar senha", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content style={styles.headerContent}>
              <Avatar.Text size={80} label={initials || "U"} />
              <Text variant="titleMedium" style={styles.title}>
                {user?.name || "Usuário"}
              </Text>
              <Text variant="bodySmall" style={styles.subtle}>
                {user?.email}
              </Text>
              <Text variant="bodySmall" style={styles.subtle}>
                Role: {user?.role ?? "user"}
              </Text>

              <View style={styles.actionsRow}>
                <Button
                  mode="contained"
                  icon="account-edit"
                  onPress={() => {
                    setName(user?.name ?? "");
                    setOpenName(true);
                  }}
                >
                  Editar nome
                </Button>
                <Button mode="outlined" icon="logout" onPress={signOut}>
                  Sair
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card>
            <Card.Title title="Ações" />
            <Card.Content style={{ flexDirection: "row", gap: 8 }}>
              <Button
                mode="contained"
                onPress={() => {
                  if (!isAdminRole(user?.role)) {
                    Alert.alert("Acesso restrito", "Somente administradores podem criar eventos.");
                    return;
                  }

                  (navigation as any).navigate("Admin", {
                    screen: "AdminCreate",
                    params: { preset: "evento" },
                  });

                }}
              >
                Criar evento ou atividade
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <List.Section>
              <List.Subheader>Conta</List.Subheader>

              <List.Item
                title="Alterar e-mail"
                description="Atualize seu endereço de e-mail"
                left={(p) => <List.Icon {...p} icon="email-edit-outline" />}
                right={(p) => <List.Icon {...p} icon="chevron-right" />}
                onPress={() => {
                  setEmail(user?.email ?? "");
                  setEmailCurrentPass("");
                  setEmailErr(null);
                  setOpenEmail(true);
                }}
              />
              <Divider />

              <List.Item
                title="Alterar senha"
                description="Defina uma nova senha com segurança"
                left={(p) => <List.Icon {...p} icon="form-textbox-password" />}
                right={(p) => <List.Icon {...p} icon="chevron-right" />}
                onPress={() => {
                  setCurrentPass("");
                  setNewPass("");
                  setConfirmPass("");
                  setPassErr(null);
                  setOpenPass(true);
                }}
              />
            </List.Section>
          </Card>

          <Card style={styles.card}>
            <List.Section>
              <List.Subheader>Preferências</List.Subheader>

              <List.Item
                title="Notificações"
                description="Preferências de alertas"
                left={(p) => <List.Icon {...p} icon="bell-outline" />}
                onPress={() => { }}
              />
              <Divider />
              <List.Item
                title="Privacidade"
                description="Permissões e dados"
                left={(p) => <List.Icon {...p} icon="lock-outline" />}
                onPress={() => { }}
              />
              <Divider />
              <List.Item
                title="Sobre"
                description="Versão e informações"
                left={(p) => <List.Icon {...p} icon="information-outline" />}
                onPress={() => { }}
              />
            </List.Section>
          </Card>

          <Portal>
            <Dialog visible={openName} onDismiss={() => setOpenName(false)} style={styles.dialog}>
              <Dialog.Title>Editar nome</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  mode="outlined"
                  label="Nome"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  disabled={saving}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setOpenName(false)} disabled={saving}>Cancelar</Button>
                <Button onPress={onSaveName} loading={saving}>Salvar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <Portal>
            <Dialog visible={openEmail} onDismiss={() => setOpenEmail(false)} style={styles.dialog}>
              <Dialog.Title>Alterar e-mail</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  mode="outlined"
                  label="Novo e-mail"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailErr) setEmailErr(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  disabled={saving}
                />
                <TextInput
                  mode="outlined"
                  label="Senha atual"
                  value={emailCurrentPass}
                  onChangeText={setEmailCurrentPass}
                  autoCapitalize="none"
                  secureTextEntry
                  style={styles.mt8}
                  disabled={saving}
                />
                <HelperText type="error" visible={!!emailErr}>
                  {emailErr}
                </HelperText>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setOpenEmail(false)} disabled={saving}>Cancelar</Button>
                <Button onPress={onSaveEmail} loading={saving}>Salvar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <Portal>
            <Dialog visible={openPass} onDismiss={() => setOpenPass(false)} style={styles.dialog}>
              <Dialog.Title>Alterar senha</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  mode="outlined"
                  label="Senha atual"
                  value={currentPass}
                  onChangeText={(v) => {
                    setCurrentPass(v);
                    if (passErr) setPassErr(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  disabled={saving}
                />
                <TextInput
                  mode="outlined"
                  label="Nova senha"
                  value={newPass}
                  onChangeText={(v) => {
                    setNewPass(v);
                    if (passErr) setPassErr(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.mt8}
                  disabled={saving}
                />
                <TextInput
                  mode="outlined"
                  label="Confirmar nova senha"
                  value={confirmPass}
                  onChangeText={(v) => {
                    setConfirmPass(v);
                    if (passErr) setPassErr(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.mt8}
                  disabled={saving}
                />
                <HelperText type="error" visible={!!passErr}>
                  {passErr}
                </HelperText>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setOpenPass(false)} disabled={saving}>Cancelar</Button>
                <Button onPress={onSavePassword} loading={saving}>Salvar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
