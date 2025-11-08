import React, { useMemo, useRef, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Text,
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

import { api1 } from "../../services/api";

import EditNameDialog from "../../components/Modals/EditNameDialog";
import EditEmailDialog from "../../components/Modals/EditEmailDialog";
import ChangePasswordDialog from "../../components/Modals/ChangePasswordDialog";
import CreateParqueDialog, { ParqueCreate as ParqueCreateDialogType } from "../../components/Modals/CreateParqueDialog";
import DeleteEntityDialog from "../../components/Modals/DeleteEntityDialog";

type AdminNav = NativeStackNavigationProp<AdminStackParamList>;
type DeleteTarget = "evento" | "atividade";

export type ParqueCreate = {
  nome: string;
  localizacao: string;
  endereco: string;
  imagem: string;
};

async function createParque(data: ParqueCreate) {
  const res = await api1.post("/parques", data);
  return res.data;
}

function isMongoId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v.trim());
}

async function deleteByType(type: DeleteTarget, id: string) {
  const path = type === "evento" ? `/eventos/${id}` : `/atividades/${id}`;
  const res = await api1.delete(path);
  return res.data;
}

export default function UserScreen() {
  function isAdminRole(role?: string | null) {
    return (role ?? "").toString().trim().toLowerCase() === "administrador";
  }

  const navigation = useNavigation<AdminNav>();
  const theme = useTheme();
  const { user, signIn, signOut } = useAuth() as {
    user: { email: string; name?: string; role?: string } | null;
    token?: string | null;
    signIn: (u: any) => Promise<void>;
    signOut: () => void;
  };

  const [openName, setOpenName] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openPass, setOpenPass] = useState(false);
  const [openParque, setOpenParque] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailCurrentPass, setEmailCurrentPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passErr, setPassErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [parqueErr, setParqueErr] = useState<string | null>(null);
  const [savingParque, setSavingParque] = useState(false);

  const [deleteType, setDeleteType] = useState<DeleteTarget>("evento");
  const [deleteId, setDeleteId] = useState("");
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [deleteQuery, setDeleteQuery] = useState("");
  const [deleteResults, setDeleteResults] = useState<
    { _id: string; nome: string; tipo: "evento" | "atividade"; extra?: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const initials = useMemo(() => {
    const base = (user?.name || user?.email || "U").trim();
    const parts = base.split(/\s+/).slice(0, 2);
    return parts.map((p: string) => p[0]?.toUpperCase() || "").join("");
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" as never }],
    });
  };

  async function fetchEventosPorTodosParquesFiltrados(q: string) {
    const parquesRes = await api1.get("/parques");
    const parques = parquesRes.data?.parques ?? [];
    const qq = q.trim().toLowerCase();
    const agregados: { _id: string; nome: string; tipo: "evento"; extra?: string }[] = [];

    for (const p of parques) {
      const pid = p?._id || p?.id;
      if (!pid) continue;
      try {
        const r = await api1.get("/eventos", { params: { parque_id: pid, limit: 500, sort: "asc" } });
        const eventos: any[] = r.data?.eventos ?? [];
        for (const e of eventos) {
          const nome = e?.nome || "";
          if (nome.toLowerCase().includes(qq)) {
            agregados.push({
              _id: e?._id || e?.id,
              nome,
              tipo: "evento",
              extra: `${e?.localizacao ?? ""} • ${p?.nome ?? ""}`,
            });
          }
        }
      } catch {}
    }
    return agregados;
  }

  async function fetchAtividadesPorTodosParquesFiltradas(q: string) {
    const parquesRes = await api1.get("/parques");
    const parques = parquesRes.data?.parques ?? [];
    const qq = q.trim().toLowerCase();
    const agregados: { _id: string; nome: string; tipo: "atividade"; extra?: string }[] = [];

    for (const p of parques) {
      const pid = p?._id || p?.id;
      if (!pid) continue;
      try {
        const r = await api1.get(`/atividades/parque/${pid}`);
        const atividades: any[] = r.data?.atividades ?? [];
        for (const a of atividades) {
          const nome = a?.nome || "";
          if (nome.toLowerCase().includes(qq)) {
            agregados.push({
              _id: a?._id || a?.id,
              nome,
              tipo: "atividade",
              extra: `${a?.tipo ?? ""} • ${p?.nome ?? ""}`,
            });
          }
        }
      } catch {}
    }
    return agregados;
  }

  async function fetchCandidates(type: DeleteTarget, q: string) {
    if (q.trim().length < 2) return [];
    if (type === "evento") return fetchEventosPorTodosParquesFiltrados(q);
    return fetchAtividadesPorTodosParquesFiltradas(q);
  }

  const onSearchDelete = (q: string) => {
    setDeleteQuery(q);
    setDeleteErr(null);
    setDeleteResults([]);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await fetchCandidates(deleteType, q);
        setDeleteResults(results);
      } catch (e: any) {
        setDeleteErr(e?.response?.data?.detail || "Falha ao buscar.");
      } finally {
        setSearching(false);
      }
    }, 300);
  };

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

  const validateParque = (p: ParqueCreate) => {
    if (!p.nome.trim()) return "Informe o nome do parque.";
    if (!p.localizacao.trim()) return "Informe a localização (ex.: Teresópolis - RJ).";
    if (!p.endereco.trim()) return "Informe o endereço.";
    if (!p.imagem.trim()) return "Informe a URL da imagem (pode ser http://...).";
    return null;
  };

  const onCreateParque = async (payloadFromDialog?: ParqueCreateDialogType) => {
    const payload: ParqueCreate = payloadFromDialog
      ? {
          nome: payloadFromDialog.nome.trim(),
          localizacao: payloadFromDialog.localizacao.trim(),
          endereco: payloadFromDialog.endereco.trim(),
          imagem: payloadFromDialog.imagem.trim(),
        }
      : { nome: "", localizacao: "", endereco: "", imagem: "" };

    const err = validateParque(payload);
    if (err) {
      setParqueErr(err);
      return;
    }
    try {
      setSavingParque(true);
      setParqueErr(null);
      const data = await createParque(payload);
      Alert.alert("Parque criado", data?.message || "✅ Parque cadastrado com sucesso!");
      setOpenParque(false);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Não foi possível criar o parque.";
      setParqueErr(msg);
    } finally {
      setSavingParque(false);
    }
  };

  const onDelete = async () => {
    const id = deleteId.trim();
    if (!id) {
      setDeleteErr("Selecione um item para excluir.");
      return;
    }
    if (!isMongoId(id)) {
      setDeleteErr("ID inválido (esperado ObjectId de 24 hex).");
      return;
    }
    if (!isAdminRole(user?.role)) {
      Alert.alert("Acesso restrito", "Somente administradores podem excluir registros.");
      return;
    }

    Alert.alert(
      "Confirmar exclusão",
      `Excluir ${deleteType} com ID:\n${id}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              setDeleteErr(null);
              const data = await deleteByType(deleteType, id);
              Alert.alert("Excluído", data?.message || "Registro excluído com sucesso.");
              setOpenDelete(false);
              setDeleteId("");
              setDeleteQuery("");
              setDeleteResults([]);
            } catch (e: any) {
              const msg =
                e?.response?.data?.detail ||
                (e?.response?.status === 404
                  ? "Registro não encontrado."
                  : "Não foi possível excluir.");
              setDeleteErr(msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
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
                <Button mode="outlined" icon="logout" onPress={handleSignOut}>
                  Sair
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card>
            <Card.Title title="Ações" />
            <Card.Content style={styles.actionsSection}>
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
                style={styles.fullButton}
              >
                Criar evento ou atividade
              </Button>

              <Button
                mode="contained"
                onPress={() => {
                  if (!isAdminRole(user?.role)) {
                    Alert.alert("Acesso restrito", "Somente administradores podem criar eventos.");
                    return;
                  }
                  (navigation as any).navigate("Admin", {
                    screen: "AdminEdit",
                    params: { preset: "evento" },
                  });
                }}
                style={styles.fullButton}
              >
                Editar evento ou atividade
              </Button>

              <Button
                mode="outlined"
                icon="plus"
                onPress={() => {
                  if (!isAdminRole(user?.role)) {
                    Alert.alert("Acesso restrito", "Somente administradores podem adicionar parques.");
                    return;
                  }
                  setParqueErr(null);
                  setOpenParque(true);
                }}
                style={styles.fullButton}
              >
                Adicionar parque
              </Button>

              <Button
                mode="outlined"
                icon="delete-outline"
                onPress={() => {
                  if (!isAdminRole(user?.role)) {
                    Alert.alert("Acesso restrito", "Somente administradores podem excluir registros.");
                    return;
                  }
                  setDeleteErr(null);
                  setDeleteType("evento");
                  setDeleteId("");
                  setDeleteQuery("");
                  setDeleteResults([]);
                  setOpenDelete(true);
                }}
                style={styles.fullButton}
              >
                Excluir evento ou atividade
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
                onPress={() => {}}
              />
              <Divider />
              <List.Item
                title="Privacidade"
                description="Permissões e dados"
                left={(p) => <List.Icon {...p} icon="lock-outline" />}
                onPress={() => {}}
              />
              <Divider />
              <List.Item
                title="Sobre"
                description="Versão e informações"
                left={(p) => <List.Icon {...p} icon="information-outline" />}
                onPress={() => {}}
              />
            </List.Section>
          </Card>
        </View>
      </ScrollView>

      <EditNameDialog
        visible={openName}
        name={name}
        loading={saving}
        onChangeName={setName}
        onDismiss={() => setOpenName(false)}
        onSubmit={onSaveName}
      />

      <EditEmailDialog
        visible={openEmail}
        email={email}
        currentPass={emailCurrentPass}
        loading={saving}
        error={emailErr}
        onChangeEmail={(v) => { setEmail(v); if (emailErr) setEmailErr(null); }}
        onChangeCurrentPass={setEmailCurrentPass}
        onDismiss={() => setOpenEmail(false)}
        onSubmit={onSaveEmail}
      />

      <ChangePasswordDialog
        visible={openPass}
        current={currentPass}
        next={newPass}
        confirm={confirmPass}
        loading={saving}
        error={passErr}
        onChangeCurrent={(v) => { setCurrentPass(v); if (passErr) setPassErr(null); }}
        onChangeNext={(v) => { setNewPass(v); if (passErr) setPassErr(null); }}
        onChangeConfirm={(v) => { setConfirmPass(v); if (passErr) setPassErr(null); }}
        onDismiss={() => setOpenPass(false)}
        onSubmit={onSavePassword}
      />

      <CreateParqueDialog
        visible={openParque}
        loading={savingParque}
        error={parqueErr}
        onDismiss={() => setOpenParque(false)}
        onSubmit={onCreateParque}
      />

      <DeleteEntityDialog
        visible={openDelete}
        type={deleteType}
        query={deleteQuery}
        selectedId={deleteId}
        results={deleteResults}
        loading={deleting}
        searching={searching}
        error={deleteErr}
        onChangeType={(t) => {
          setDeleteType(t);
          setDeleteQuery("");
          setDeleteResults([]);
          setDeleteErr(null);
        }}
        onChangeQuery={onSearchDelete}
        onSelect={(id) => { setDeleteId(id); setDeleteErr(null); }}
        onDismiss={() => setOpenDelete(false)}
        onSubmit={onDelete}
      />
    </KeyboardAvoidingView>
  );
}
