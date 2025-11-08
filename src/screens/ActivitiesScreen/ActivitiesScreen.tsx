import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { ActivityIndicator, Button, Chip, FAB, Searchbar, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { api1 } from "../../services/api";

import ParquesBar from "../../components/ParquesBar/ParquesBar";
import ParqueBanner from "../../components/ParqueBanner/ParqueBanner";
import EventoCard from "../../components/EventoCard/EventoCard";

import { styles } from "./ActivitiesScreen.styles";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("pt-br");
dayjs.tz.setDefault("America/Sao_Paulo");

const STORAGE_PARK_KEY = "@parqueFiltro";
const PARQUES_PATH = "/parques";
const ATIVIDADES_POR_PARQUE_PATH = "/atividades/parque";

type ParqueDTO = { _id?: string; id?: string; nome: string; localizacao?: string; imagem?: string };
type TipoAtividade = "trilha" | "cachoeira" | "escalada";
type AtividadeDTO = {
  _id?: string; id?: string;
  tipo: TipoAtividade;
  nome: string;
  tempo: number;
  localizacao: string;
  imagem?: string;
  parque_id: string;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  description?: string;
};

export default function ActivitiesScreen({
  onCreatePress,
  showCreateFab = false,
}: {
  onCreatePress?: () => void;
  showCreateFab?: boolean;
}) {
  const theme = useTheme();

  const [parques, setParques] = useState<ParqueDTO[]>([]);
  const [selectedParqueId, setSelectedParqueId] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<"all" | TipoAtividade>("all");
  const [query, setQuery] = useState("");

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParques, setLoadingParques] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialFilter = useCallback(async () => {
    const stored = await AsyncStorage.getItem(STORAGE_PARK_KEY);
    if (stored !== null) setSelectedParqueId(stored);
  }, []);

  const fetchParques = useCallback(async () => {
    try {
      setLoadingParques(true);
      const res = await api1.get<{ parques: ParqueDTO[] }>(PARQUES_PATH);
      setParques(res.data?.parques ?? []);
    } catch {
      setParques([]);
    } finally {
      setLoadingParques(false);
    }
  }, []);

  const mapAtividades = (lista: AtividadeDTO[]): ActivityItem[] =>
    (lista ?? []).map((a) => ({
      id: a.id ?? a._id ?? `${a.nome}-${a.parque_id}`,
      title: a.nome,
      subtitle: `${capitalize(a.tipo)} • ${a.tempo} min`,
      location: a.localizacao,
    }));

  const fetchActivities = useCallback(
    async (pid?: string, tipo?: "all" | TipoAtividade) => {
      try {
        setError(null);
        setLoading(true);

        const parqueId = typeof pid === "string" ? pid : selectedParqueId;
        const tipoSel = (tipo ?? selectedTipo);
        const tipoParam = tipoSel === "all" ? undefined : tipoSel;

        if (parqueId) {
          try {
            const res = await api1.get<{ atividades: AtividadeDTO[] }>(
              `${ATIVIDADES_POR_PARQUE_PATH}/${parqueId}`,
              { params: tipoParam ? { tipo: tipoParam } : {} }
            );
            setActivities(mapAtividades(res.data?.atividades ?? []));
          } catch (err: any) {
            if (err?.response?.status === 404) {
              setActivities([]);
            } else {
              throw err;
            }
          }
          return;
        }

        const ids = parques.map((p) => p.id ?? p._id).filter((v): v is string => Boolean(v));
        if (ids.length === 0) {
          setActivities([]);
          return;
        }

        const requests = ids.map((idEach) =>
          api1.get<{ atividades: AtividadeDTO[] }>(
            `${ATIVIDADES_POR_PARQUE_PATH}/${idEach}`,
            { params: tipoParam ? { tipo: tipoParam } : {} }
          )
        );

        const responses = await Promise.allSettled(requests);
        const agregadas: AtividadeDTO[] = [];
        for (const r of responses) {
          if (r.status === "fulfilled") {
            agregadas.push(...(r.value.data?.atividades ?? []));
          } else {
            const st = (r as any)?.reason?.response?.status;
            if (st !== 404) {
            }
          }
        }

        setActivities(mapAtividades(agregadas));
      } catch {
        setActivities([]);
        setError("Erro ao carregar atividades");
      } finally {
        setLoading(false);
      }
    },
    [selectedParqueId, selectedTipo, parques]
  );

  useEffect(() => {
    loadInitialFilter();
    fetchParques();
  }, [loadInitialFilter, fetchParques]);

  useEffect(() => {
    if (!loadingParques) fetchActivities();
  }, [fetchActivities, loadingParques]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const onSelectParque = async (id: string) => {
    setSelectedParqueId(id);
    await AsyncStorage.setItem(STORAGE_PARK_KEY, id);
    setLoading(true);
    fetchActivities(id, selectedTipo);
  };

  const currentParque = useMemo(() => {
    if (!parques || parques.length === 0) return undefined;
    if (!selectedParqueId) return parques[0];
    return parques.find((p) => (p.id ?? p._id) === selectedParqueId) ?? parques[0];
  }, [parques, selectedParqueId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter((a) =>
      `${a.title} ${a.subtitle} ${a.location}`.toLowerCase().includes(q)
    );
  }, [activities, query]);

  if (loadingParques) {
    return (
      <SafeAreaView style={styles.loading} edges={["top"]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando parques…</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading} edges={["top"]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando atividades…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loading} edges={["top"]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchActivities()}>
          Tentar novamente
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ParquesBar
        parques={[{ id: "", nome: "Todos" } as ParqueDTO, ...parques]}
        selectedId={selectedParqueId}
        onSelect={onSelectParque}
      />

      {!!currentParque && (
        <ParqueBanner nome={currentParque.nome} imagem={currentParque.imagem} height={132} />
      )}

      <View style={styles.filterRow}>
        <Chip selected={selectedTipo === "all"} onPress={() => { setSelectedTipo("all"); fetchActivities(selectedParqueId, "all"); }}>Todos</Chip>
        <Chip selected={selectedTipo === "trilha"} onPress={() => { setSelectedTipo("trilha"); fetchActivities(selectedParqueId, "trilha"); }}>Trilha</Chip>
        <Chip selected={selectedTipo === "cachoeira"} onPress={() => { setSelectedTipo("cachoeira"); fetchActivities(selectedParqueId, "cachoeira"); }}>Cachoeira</Chip>
        <Chip selected={selectedTipo === "escalada"} onPress={() => { setSelectedTipo("escalada"); fetchActivities(selectedParqueId, "escalada"); }}>Escalada</Chip>
      </View>

      <Searchbar
        placeholder="Buscar atividades..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listContentCentered]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>Nenhuma atividade encontrada.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventoCard title={item.title} subtitle={item.subtitle} location={item.location} />
        )}
      />

      {showCreateFab && (
        <FAB icon="plus" label="Nova atividade" onPress={onCreatePress} style={styles.fab} />
      )}
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
