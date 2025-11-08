import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Text, Chip, Searchbar, ActivityIndicator, FAB, useTheme, Button } from "react-native-paper";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { api1 } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import ParquesBar from "../../components/ParquesBar/ParquesBar";
import ParqueBanner from "../../components/ParqueBanner/ParqueBanner";
import EventoCard from "../../components/EventoCard/EventoCard";
import { styles } from "./HomeScreen.styles";

dayjs.extend(utc); dayjs.extend(timezone);
dayjs.locale("pt-br"); dayjs.tz.setDefault("America/Sao_Paulo");

const STORAGE_KEY = "@parqueFiltro";
const PARQUES_PATH = "/parques";
const EVENTOS_POR_PARQUE_PATH = "/eventos/parque";

type EventoDTO = { _id?: string; id?: string; nome: string; descricao: string; data: string; localizacao: string; parque_id: string; };
type EventItem  = { id: string; title: string; date: string; location: string; tags?: string[]; description?: string };
type ParqueDTO  = { _id?: string; id?: string; nome: string; localizacao?: string; imagem?: string };

export default function HomeScreen({ onCreatePress, showCreateFab = false }: { onCreatePress?: () => void; showCreateFab?: boolean }) {
  const theme = useTheme();

  const [parques, setParques] = useState<ParqueDTO[]>([]);
  const [selectedParqueId, setSelectedParqueId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"today" | "week" | "all">("all");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParques, setLoadingParques] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialFilter = useCallback(async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
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

  const mapEventos = (lista: EventoDTO[]): EventItem[] =>
    (lista ?? []).map((e) => ({
      id: e.id ?? e._id ?? `${e.nome}-${e.data}`,
      title: e.nome,
      date: e.data,
      location: e.localizacao,
      description: e.descricao,
      tags: [],
    }));

  const fetchEventos = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (selectedParqueId) {
        const res = await api1.get<{ eventos: EventoDTO[] }>(
          `${EVENTOS_POR_PARQUE_PATH}/${selectedParqueId}`,
          { params: { limit: 0 } }
        );
        setEvents(mapEventos(res.data?.eventos ?? []));
        return;
      }

      const ids = parques.map((p) => p.id ?? p._id).filter((v): v is string => Boolean(v));
      if (ids.length === 0) {
        setEvents([]);
        return;
      }

      const requests = ids.map((pid) =>
        api1.get<{ eventos: EventoDTO[] }>(`${EVENTOS_POR_PARQUE_PATH}/${pid}`, { params: { limit: 0 } })
      );

      const responses = await Promise.allSettled(requests);
      const agregados: EventoDTO[] = [];
      for (const r of responses) {
        if (r.status === "fulfilled") agregados.push(...(r.value.data?.eventos ?? []));
      }
      setEvents(mapEventos(agregados));
    } catch {
      setEvents([]);
      setError("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }, [selectedParqueId, parques]);

  useEffect(() => { loadInitialFilter(); fetchParques(); }, [loadInitialFilter, fetchParques]);

  useEffect(() => {
    if (!loadingParques) fetchEventos();
  }, [fetchEventos, loadingParques]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEventos();
    setRefreshing(false);
  };

  const onSelectParque = async (id: string) => {
    setSelectedParqueId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
    setLoading(true);
    fetchEventos();
  };

  const currentParque = useMemo(() => {
    if (!parques || parques.length === 0) return undefined;
    if (!selectedParqueId) return parques[0];
    return parques.find((p) => (p.id ?? p._id) === selectedParqueId) ?? parques[0];
  }, [parques, selectedParqueId]);

  const filtered = useMemo(() => {
    const now = dayjs(); const next7 = now.add(7, "day");
    return events
      .filter((e) => {
        const d = dayjs(e.date);
        if (filter === "today" && !d.isSame(now, "day")) return false;
        if (filter === "week" && !(d.isAfter(now) && d.isBefore(next7))) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const text = `${e.title} ${e.location} ${(e.tags ?? []).join(" ")} ${e.description ?? ""}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [events, filter, query]);

  const formatDate = (iso: string) => dayjs(iso).tz().format("ddd, DD [de] MMM • HH:mm");

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
        <Text style={styles.loadingText}>Carregando eventos…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loading} edges={["top"]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchEventos}>Tentar novamente</Button>
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
        <Chip selected={filter === "today"} onPress={() => setFilter("today")}>Hoje</Chip>
        <Chip selected={filter === "week"} onPress={() => setFilter("week")}>Próx. 7 dias</Chip>
        <Chip selected={filter === "all"} onPress={() => setFilter("all")}>Todos</Chip>
      </View>

      <Searchbar
        placeholder="Buscar eventos..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listContentCentered]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>Nenhum evento encontrado.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventoCard
            title={item.title}
            subtitle={formatDate(item.date)}
            location={item.location}
            description={item.description}
          />
        )}
      />

      {showCreateFab && <FAB icon="plus" label="Novo evento" onPress={onCreatePress} style={styles.fab} />}
    </SafeAreaView>
  );
}
