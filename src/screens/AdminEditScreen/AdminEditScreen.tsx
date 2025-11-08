import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { Button, Card, Divider, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import ParquesBar from "../../components/ParquesBar/ParquesBar";
import ParqueBanner from "../../components/ParqueBanner/ParqueBanner";
import { styles } from "./AdminEditScreen.styles";
import { api1 } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/authContext";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("pt-br");
dayjs.tz.setDefault("America/Sao_Paulo");

type ParqueDTO = { _id?: string; id?: string; nome: string; localizacao?: string; imagem?: string };
type Mode = "evento" | "atividade";
type TipoAtividade = "trilha" | "cachoeira" | "escalada";

type EventoDTO = {
  _id?: string;
  id?: string;
  nome: string;
  descricao: string;
  data: string;
  localizacao: string;
  parque_id: string;
};

type AtividadeDTO = {
  _id?: string;
  id?: string;
  tipo: TipoAtividade;
  nome: string;
  tempo: number;
  localizacao: string;
  imagem: string;
  parque_id: string;
};

const LIST_EVENTOS_PATH = "/eventos";
const LIST_ATIVIDADES_POR_PARQUE = (pid: string) => `/atividades/parque/${pid}`;
const PUT_EVENTO = (id: string) => `/eventos/${id}`;
const PUT_ATIVIDADE = (id: string) => `/atividades/${id}`;
const PARQUES_PATH = "/parques";

const oneLine = (s: string) => s.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();

export default function AdminEditScreen({ navigation }: any) {
  const goBack = () => navigation.navigate("Tabs", { screen: "User" });
  const theme = useTheme();
  const { token, user } = useAuth() as { user: { role?: string } | null; token?: string | null };
  const isAdmin = user?.role === "administrador" || user?.role === "admin";

  const [mode, setMode] = useState<Mode>("evento");
  const [parques, setParques] = useState<ParqueDTO[]>([]);
  const [selectedParqueId, setSelectedParqueId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ _id: string; nome: string; extra?: string }[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  const [evNome, setEvNome] = useState("");
  const [evDescricao, setEvDescricao] = useState("");
  const [evLocal, setEvLocal] = useState("");
  const [evDate, setEvDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [atTipo, setAtTipo] = useState<TipoAtividade>("trilha");
  const [atNome, setAtNome] = useState("");
  const [atTempo, setAtTempo] = useState<string>("");
  const [atLocal, setAtLocal] = useState("");
  const [atImagem, setAtImagem] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeaders = useCallback(async () => {
    const t = token || (await AsyncStorage.getItem("@token"));
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, [token]);

  const fetchParques = useCallback(async () => {
    try {
      const { data } = await api1.get<{ parques: ParqueDTO[] }>(PARQUES_PATH);
      const lista = data?.parques ?? [];
      setParques(lista);
      const firstId = lista[0]?.id ?? lista[0]?._id ?? "";
      setSelectedParqueId((prev) => prev || firstId);
    } catch {
      setParques([]);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert("Acesso negado", "Somente administradores podem acessar esta tela.");
      navigation?.goBack?.();
      return;
    }
    fetchParques();
  }, [fetchParques, isAdmin, navigation]);

  const currentParque = useMemo(() => {
    if (!parques || parques.length === 0) return undefined;
    return parques.find((p) => (p.id ?? p._id) === selectedParqueId) ?? parques[0];
  }, [parques, selectedParqueId]);

  const runSearch = useCallback(
    async (text: string) => {
      const q = text.trim().toLowerCase();
      if (!q || q.length < 2 || !selectedParqueId) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        if (mode === "evento") {
          const { data } = await api1.get(LIST_EVENTOS_PATH, {
            params: { parque_id: selectedParqueId, limit: 500, sort: "asc" },
          });
          const list: EventoDTO[] = data?.eventos ?? [];
          setResults(
            list
              .filter((e) => (e?.nome || "").toLowerCase().includes(q))
              .map((e) => ({
                _id: (e._id || e.id)!,
                nome: e.nome || "(sem nome)",
                extra: dayjs(e.data).format("DD/MM/YYYY HH:mm"),
              }))
          );
        } else {
          const { data } = await api1.get(LIST_ATIVIDADES_POR_PARQUE(selectedParqueId));
          const list: AtividadeDTO[] = data?.atividades ?? [];
          setResults(
            list
              .filter((a) => (a?.nome || "").toLowerCase().includes(q))
              .map((a) => ({
                _id: (a._id || a.id)!,
                nome: a.nome || "(sem nome)",
                extra: `${a.tipo} • ${a.tempo} min`,
              }))
          );
        }
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Falha ao buscar.";
        Alert.alert("Erro", msg);
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [mode, selectedParqueId]
  );

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  const loadSelected = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        setLoading(true);
        setSelectedId(id);
        if (mode === "evento") {
          const { data } = await api1.get<EventoDTO>(`${LIST_EVENTOS_PATH}/${id}`);
          const ev = data as any;
          setSelectedParqueId(ev.parque_id);
          setEvNome(ev.nome || "");
          setEvDescricao(ev.descricao || "");
          setEvLocal(ev.localizacao || "");
          setEvDate(ev.data ? dayjs(ev.data).toDate() : new Date());
        } else {
          const { data } = await api1.get<AtividadeDTO>(`/atividades/${id}`);
          const at = data as any;
          setSelectedParqueId(at.parque_id);
          setAtTipo(at.tipo || "trilha");
          setAtNome(at.nome || "");
          setAtTempo(String(at.tempo ?? ""));
          setAtLocal(at.localizacao || "");
          setAtImagem(at.imagem || "");
        }
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Falha ao carregar item.";
        Alert.alert("Erro", msg);
        setSelectedId("");
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    setQuery("");
    setResults([]);
    setSelectedId("");
    if (mode === "evento") {
      setEvNome("");
      setEvDescricao("");
      setEvLocal("");
      setEvDate(new Date());
    } else {
      setAtTipo("trilha");
      setAtNome("");
      setAtTempo("");
      setAtLocal("");
      setAtImagem("");
    }
  }, [mode]);

  const canSaveEvento = !!selectedId && !!selectedParqueId && evNome.trim().length > 0 && evLocal.trim().length > 0;

  const canSaveAtividade =
    !!selectedId &&
    !!selectedParqueId &&
    atNome.trim().length > 0 &&
    atLocal.trim().length > 0 &&
    atTempo.trim().length > 0 &&
    !isNaN(Number(atTempo)) &&
    Number(atTempo) > 0;

  const saveEvento = async () => {
    if (!canSaveEvento) return;
    try {
      setSaving(true);
      const body = {
        nome: oneLine(evNome),
        descricao: evDescricao.trim(),
        data: dayjs(evDate).toISOString(),
        localizacao: oneLine(evLocal),
        parque_id: selectedParqueId,
      };
      await api1.put(PUT_EVENTO(selectedId), body, { headers: await authHeaders() });
      Alert.alert("Sucesso", "Evento atualizado com sucesso!");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Erro ao atualizar evento.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  };

  const saveAtividade = async () => {
    if (!canSaveAtividade) return;
    try {
      setSaving(true);
      const body = {
        tipo: atTipo,
        nome: oneLine(atNome),
        tempo: Number(atTempo),
        localizacao: oneLine(atLocal),
        imagem: oneLine(atImagem),
        parque_id: selectedParqueId,
      };
      await api1.put(PUT_ATIVIDADE(selectedId), body, { headers: await authHeaders() });
      Alert.alert("Sucesso", "Atividade atualizada com sucesso!");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Erro ao atualizar atividade.";
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
    }
  };

  const hasSelection = !!selectedId;

  const onPickDate = (_: any, date?: Date) => {
    setShowDate(false);
    if (date) {
      const merged = dayjs(evDate).year(date.getFullYear()).month(date.getMonth()).date(date.getDate()).toDate();
      setEvDate(merged);
    }
  };
  const onPickTime = (_: any, date?: Date) => {
    setShowTime(false);
    if (date) {
      const merged = dayjs(evDate).hour(date.getHours()).minute(date.getMinutes()).second(0).millisecond(0).toDate();
    setEvDate(merged);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Button mode="contained-tonal" onPress={goBack} style={{ marginHorizontal: 16, marginTop: 12 }}>
        Voltar
      </Button>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ParquesBar
          parques={parques}
          selectedId={selectedParqueId}
          onSelect={(id) => {
            setSelectedParqueId(id);
            if (query.trim().length >= 2) runSearch(query);
          }}
        />

        {!!currentParque && <ParqueBanner nome={currentParque.nome} imagem={currentParque.imagem} height={132} />}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              O que deseja editar?
            </Text>
            <SegmentedButtons
              value={mode}
              onValueChange={(v) => setMode(v as Mode)}
              buttons={[
                { value: "evento", label: "Evento", icon: "calendar-edit" },
                { value: "atividade", label: "Atividade", icon: "pencil" as any },
              ]}
              style={styles.segment}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.title}>
              Buscar {mode === "evento" ? "evento" : "atividade"}
            </Text>
            <TextInput
              mode="outlined"
              label={`Nome da ${mode}`}
              value={query}
              onChangeText={onChangeQuery}
              right={<TextInput.Icon icon={searching ? "progress-clock" : "magnify"} />}
            />
            <HelperText type="info" visible>
              Digite pelo menos 2 letras para buscar no parque selecionado.
            </HelperText>
            {results.length > 0 && (
              <View style={styles.resultBox}>
                {results.map((r) => (
                  <Button
                    key={r._id}
                    mode={selectedId === r._id ? "contained" : "text"}
                    style={styles.resultItem}
                    disabled={loading}
                    onPress={() => loadSelected(r._id)}
                  >
                    {r.nome} {r.extra ? ` · ${r.extra}` : ""}
                  </Button>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {!hasSelection && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium">Selecione um {mode === "evento" ? "evento" : "atividade"} na busca acima para editar.</Text>
            </Card.Content>
          </Card>
        )}

        {mode === "evento" && hasSelection && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.title}>
                Editar evento
              </Text>
              <TextInput
                mode="outlined"
                label="Nome do evento"
                value={evNome}
                onChangeText={setEvNome}
                maxLength={120}
                style={styles.inputOneLine}
              />
              <HelperText type="error" visible={!evNome.trim()}>
                Obrigatório
              </HelperText>
              <TextInput
                mode="outlined"
                label="Descrição (opcional)"
                value={evDescricao}
                onChangeText={setEvDescricao}
                multiline
                numberOfLines={4}
                style={styles.mt8}
              />
              <TextInput
                mode="outlined"
                label="Localização"
                value={evLocal}
                onChangeText={setEvLocal}
                maxLength={120}
                style={[styles.inputOneLine, styles.mt8]}
              />
              <Divider style={styles.mt8} />
              <View style={styles.row}>
                <TextInput
                  mode="outlined"
                  label="Data"
                  value={dayjs(evDate).format("DD/MM/YYYY")}
                  editable={false}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />}
                  style={[styles.flex, styles.minW0, styles.mr8, styles.mt8, styles.inputOneLine]}
                />
                <TextInput
                  mode="outlined"
                  label="Hora"
                  value={dayjs(evDate).format("HH:mm")}
                  editable={false}
                  right={<TextInput.Icon icon="clock-outline" onPress={() => setShowTime(true)} />}
                  style={[styles.flex, styles.minW0, styles.mt8, styles.inputOneLine]}
                />
              </View>
              {showDate && <DateTimePicker value={evDate} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} onChange={onPickDate} />}
              {showTime && <DateTimePicker value={evDate} mode="time" is24Hour display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onPickTime} />}
              <Button mode="contained" style={styles.submit} onPress={saveEvento} loading={saving} disabled={!canSaveEvento || saving} icon="content-save">
                Salvar alterações
              </Button>
            </Card.Content>
          </Card>
        )}

        {mode === "atividade" && hasSelection && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.title}>
                Editar atividade
              </Text>
              <Text style={styles.label}>Tipo de atividade</Text>
              <SegmentedButtons
                value={atTipo}
                onValueChange={(v) => setAtTipo(v as TipoAtividade)}
                buttons={[
                  { value: "trilha", label: "Trilha", icon: "walk" },
                  { value: "cachoeira", label: "Cachoeira", icon: "waterfall" as any },
                  { value: "escalada", label: "Escalada", icon: "image-filter-hdr" },
                ]}
                style={styles.segment}
              />
              <View style={styles.row}>
                <TextInput
                  mode="outlined"
                  label="Nome da atividade"
                  value={atNome}
                  onChangeText={setAtNome}
                  maxLength={120}
                  style={[styles.inputOneLine, styles.flex, styles.minW0, styles.mr8]}
                />
                <TextInput
                  mode="outlined"
                  label="Tempo (min)"
                  value={atTempo}
                  onChangeText={(t) => setAtTempo(t.replace(/\D+/g, ""))}
                  keyboardType="number-pad"
                  style={[styles.inputOneLine, styles.flex, styles.minW0]}
                />
              </View>
              <HelperText type="error" visible={!atTempo || Number(atTempo) <= 0}>
                {atTempo && Number(atTempo) > 0 ? "" : "Informe minutos (> 0)"}
              </HelperText>
              <TextInput
                mode="outlined"
                label="Localização"
                value={atLocal}
                onChangeText={setAtLocal}
                maxLength={120}
                style={[styles.inputOneLine, styles.mt8]}
              />
              <TextInput
                mode="outlined"
                label="URL da imagem (opcional)"
                value={atImagem}
                onChangeText={setAtImagem}
                keyboardType="url"
                autoCapitalize="none"
                maxLength={200}
                style={[styles.inputOneLine, styles.mt8]}
              />
              <Button mode="contained" style={styles.submit} onPress={saveAtividade} loading={saving} disabled={!canSaveAtividade || saving} icon="content-save">
                Salvar alterações
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
