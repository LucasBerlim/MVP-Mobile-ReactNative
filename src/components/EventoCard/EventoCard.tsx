import React from "react";
import {
  StyleSheet,
  Platform,
  View,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Card, IconButton, Text } from "react-native-paper";
import * as Calendar from "expo-calendar";

type Props = {
  title: string;
  subtitle: string;
  location: string;
  description?: string;
};

export default function EventoCard({
  title,
  subtitle,
  location,
  description,
}: Props) {
  const onShare = async () => {
    try {
      const message = `🌿 Confira este evento:\n\n📍 ${title}\n📅 ${subtitle}\n📌 Local: ${location}\n\n${description ?? ""}\n\n#TerêVerde`;
      const result = await Share.share({ message });
      if (result.action !== Share.sharedAction && result.action !== Share.dismissedAction) return;
    } catch (error) {
      Alert.alert("Erro ao compartilhar", String(error));
    }
  };

  const parseStart = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const addToCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Não foi possível acessar o calendário.");
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const target =
        calendars.find((c) => c.allowsModifications) ??
        calendars[0];
      if (!target) {
        Alert.alert("Erro", "Nenhum calendário disponível.");
        return;
      }
      const startDate = parseStart(subtitle);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      await Calendar.createEventAsync(target.id, {
        title,
        location,
        notes: description,
        startDate,
        endDate,
        timeZone: "America/Sao_Paulo",
      });
      Alert.alert("Sucesso", "Evento adicionado ao calendário.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível adicionar o evento.");
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={title}
        subtitle={subtitle}
        titleStyle={styles.title}
        subtitleStyle={styles.subtle}
      />
      <Card.Content>
        <Text style={[styles.subtle, styles.mb6]}>Local: {location}</Text>
        {!!description && (
          <Text numberOfLines={3} style={styles.description}>
            {description}
          </Text>
        )}
      </Card.Content>
      <View style={styles.actionsRow}>
        <IconButton icon="share-variant" onPress={onShare} />
        <IconButton icon="bookmark-outline" onPress={addToCalendar} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "visible",
    ...Platform.select({
      android: { elevation: 1 },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
    marginBottom: 12,
  },
  title: { marginTop: 4 },
  subtle: { opacity: 0.8 },
  description: { lineHeight: 20 },
  mb6: { marginBottom: 6 },
  actionsRow: {
    flexDirection: "row",
    columnGap: 8,
    marginTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 6,
    alignItems: "center",
  },
});
