import React from "react";
import { StyleSheet, Platform, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

type Props = { title: string; subtitle: string; location: string; description?: string };

export default function EventoCard({ title, subtitle, location, description }: Props) {
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
        <IconButton icon="share-variant" onPress={() => {}} />
        <IconButton icon="bookmark-outline" onPress={() => {}} />
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

  headerContent: {
    alignItems: "flex-start",
    gap: 4,
    paddingBottom: 4,
  },

  title: {
    marginTop: 4,
  },

  subtle: {
    opacity: 0.8,
  },

  description: {
    lineHeight: 20,
  },

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
