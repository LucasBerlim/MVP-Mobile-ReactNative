import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    ScrollView,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import {
    Button,
    Card,
    Divider,
    HelperText,
    SegmentedButtons,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import ParquesBar from "../../components/ParquesBar/ParquesBar";
import ParqueBanner from "../../components/ParqueBanner/ParqueBanner";

import { styles } from "./AdminCreateScreen.styles";
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

const PARQUES_PATH = "/parques";
const POST_EVENTO_PATH = "/eventos";
const POST_ATIVIDADE_PATH = "/atividades";

export default function AdminCreateScreen({ navigation }: any) {
    const goToUser = () => navigation.navigate("Tabs", { screen: "User" });
    const theme = useTheme();
    const { token, user } = useAuth() as {
        user: { role?: string } | null;
        token?: string | null;
    };

    const isAdmin = user?.role === "administrador" || user?.role === "admin";

    const [mode, setMode] = useState<Mode>("evento");

    const [parques, setParques] = useState<ParqueDTO[]>([]);
    const [selectedParqueId, setSelectedParqueId] = useState<string>("");

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

    const canSubmitEvento =
        !!selectedParqueId && evNome.trim().length > 0 && evLocal.trim().length > 0;

    const canSubmitAtividade =
        !!selectedParqueId &&
        atNome.trim().length > 0 &&
        atLocal.trim().length > 0 &&
        atTempo.trim().length > 0 &&
        !isNaN(Number(atTempo)) &&
        Number(atTempo) > 0;

    const submitEvento = async () => {
        if (!canSubmitEvento) {
            Alert.alert("Campos obrigatórios", "Preencha nome e localização do evento.");
            return;
        }
        try {
            setLoading(true);
            const body = {
                nome: evNome.trim(),
                descricao: evDescricao.trim(),
                data: dayjs(evDate).toISOString(),
                localizacao: evLocal.trim(),
                parque_id: selectedParqueId,
            };
            await api1.post(POST_EVENTO_PATH, body, { headers: await authHeaders() });
            Alert.alert("Sucesso", "Evento criado com sucesso!");
            setEvNome("");
            setEvDescricao("");
            setEvLocal("");
            setEvDate(new Date());
        } catch (e: any) {
            const msg = e?.response?.data?.detail || "Não foi possível criar o evento.";
            Alert.alert("Erro", msg);
        } finally {
            setLoading(false);
        }
    };

    const submitAtividade = async () => {
        if (!canSubmitAtividade) {
            Alert.alert("Campos obrigatórios", "Preencha nome, tempo (minutos) e localização.");
            return;
        }
        try {
            setLoading(true);
            const body = {
                tipo: atTipo,
                nome: atNome.trim(),
                tempo: Number(atTempo),
                localizacao: atLocal.trim(),
                imagem: atImagem.trim(),
                parque_id: selectedParqueId,
            };
            await api1.post(POST_ATIVIDADE_PATH, body, { headers: await authHeaders() });
            Alert.alert("Sucesso", "Atividade criada com sucesso!");
            setAtNome("");
            setAtTempo("");
            setAtLocal("");
            setAtImagem("");
            setAtTipo("trilha");
        } catch (e: any) {
            const msg = e?.response?.data?.detail || "Não foi possível criar a atividade.";
            Alert.alert("Erro", msg);
        } finally {
            setLoading(false);
        }
    };

    const onPickDate = (_: any, date?: Date) => {
        setShowDate(false);
        if (date) {
            const merged = dayjs(evDate)
                .year(date.getFullYear())
                .month(date.getMonth())
                .date(date.getDate())
                .toDate();
            setEvDate(merged);
        }
    };

    const onPickTime = (_: any, date?: Date) => {
        setShowTime(false);
        if (date) {
            const merged = dayjs(evDate)
                .hour(date.getHours())
                .minute(date.getMinutes())
                .second(0)
                .millisecond(0)
                .toDate();
            setEvDate(merged);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >

            <Button
                mode="contained-tonal"
                onPress={goToUser}
                style={{ marginHorizontal: 16, marginTop: 12 }}
            >
                Voltar
            </Button>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <ParquesBar
                    parques={parques}
                    selectedId={selectedParqueId}
                    onSelect={setSelectedParqueId}
                />

                {!!currentParque && (
                    <ParqueBanner nome={currentParque.nome} imagem={currentParque.imagem} height={132} />
                )}

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.title}>
                            O que deseja criar?
                        </Text>
                        <SegmentedButtons
                            value={mode}
                            onValueChange={(v) => setMode(v as Mode)}
                            buttons={[
                                { value: "evento", label: "Evento", icon: "calendar-plus" },
                                { value: "atividade", label: "Atividade", icon: "hiking" as any },
                            ]}
                            style={styles.segment}
                        />
                    </Card.Content>
                </Card>

                {mode === "evento" && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.title}>
                                Novo evento
                            </Text>

                            <TextInput
                                mode="outlined"
                                label="Nome do evento"
                                value={evNome}
                                onChangeText={setEvNome}
                            />
                            <HelperText type="error" visible={!evNome.trim()}>
                                {evNome.trim() ? "" : "Obrigatório"}
                            </HelperText>

                            <TextInput
                                mode="outlined"
                                label="Descrição (opcional)"
                                value={evDescricao}
                                onChangeText={setEvDescricao}
                                multiline
                                style={styles.mt8}
                            />

                            <TextInput
                                mode="outlined"
                                label="Localização"
                                value={evLocal}
                                onChangeText={setEvLocal}
                                style={styles.mt8}
                            />
                            <HelperText type="error" visible={!evLocal.trim()}>
                                {evLocal.trim() ? "" : "Obrigatório"}
                            </HelperText>

                            <Divider style={styles.mt8} />

                            <View style={styles.row}>
                                <TextInput
                                    mode="outlined"
                                    label="Data"
                                    value={dayjs(evDate).format("DD/MM/YYYY")}
                                    editable={false}
                                    right={
                                        <TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />
                                    }
                                    style={[styles.flex, styles.mr8, styles.mt8]}
                                />
                                <TextInput
                                    mode="outlined"
                                    label="Hora"
                                    value={dayjs(evDate).format("HH:mm")}
                                    editable={false}
                                    right={
                                        <TextInput.Icon icon="clock-outline" onPress={() => setShowTime(true)} />
                                    }
                                    style={[styles.flex, styles.mt8]}
                                />
                            </View>

                            {showDate && (
                                <DateTimePicker
                                    value={evDate}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "inline" : "default"}
                                    onChange={onPickDate}
                                />
                            )}
                            {showTime && (
                                <DateTimePicker
                                    value={evDate}
                                    mode="time"
                                    is24Hour
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    onChange={onPickTime}
                                />
                            )}

                            <Button
                                mode="contained"
                                style={styles.submit}
                                onPress={submitEvento}
                                loading={loading}
                                disabled={loading || !canSubmitEvento}
                                icon="content-save"
                            >
                                Salvar evento
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {mode === "atividade" && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.title}>
                                Nova atividade
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

                            <TextInput
                                mode="outlined"
                                label="Nome da atividade"
                                value={atNome}
                                onChangeText={setAtNome}
                            />
                            <HelperText type="error" visible={!atNome.trim()}>
                                {atNome.trim() ? "" : "Obrigatório"}
                            </HelperText>

                            <View style={styles.row}>
                                <TextInput
                                    mode="outlined"
                                    label="Tempo (min)"
                                    value={atTempo}
                                    onChangeText={(t) => setAtTempo(t.replace(/\D+/g, ""))}
                                    keyboardType="number-pad"
                                    style={[styles.flex, styles.mr8]}
                                />
                                <TextInput
                                    mode="outlined"
                                    label="Localização"
                                    value={atLocal}
                                    onChangeText={setAtLocal}
                                    style={styles.flex}
                                />
                            </View>
                            <HelperText type="error" visible={!atTempo || Number(atTempo) <= 0}>
                                {atTempo && Number(atTempo) > 0 ? "" : "Informe minutos (> 0)"}
                            </HelperText>

                            <TextInput
                                mode="outlined"
                                label="URL da imagem (opcional)"
                                value={atImagem}
                                onChangeText={setAtImagem}
                                style={styles.mt8}
                                keyboardType="url"
                                autoCapitalize="none"
                            />

                            <Button
                                mode="contained"
                                style={styles.submit}
                                onPress={submitAtividade}
                                loading={loading}
                                disabled={loading || !canSubmitAtividade}
                                icon="content-save"
                            >
                                Salvar atividade
                            </Button>
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
