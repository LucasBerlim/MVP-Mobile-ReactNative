import React from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import { Chip, useTheme } from "react-native-paper";

type Parque = { id?: string; _id?: string; nome: string };
type Props = {
  parques: Parque[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function ParquesBar({ parques, selectedId, onSelect }: Props) {
  const theme = useTheme();
  return (
    <View style={[
      styles.container,
      { backgroundColor: (theme.colors as any)?.elevation?.level2 ?? theme.colors.surface }
    ]}>
      <FlatList
        data={parques}
        keyExtractor={(p) => p.id ?? p._id ?? "todos"}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const id = item.id ?? item._id ?? "";
          return (
            <Chip
              compact
              selected={id === selectedId}
              onPress={() => onSelect(id)}
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {item.nome}
            </Chip>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    ...Platform.select({
      android: { elevation: 2 },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  content: { gap: 8 },
  chip: { height: 36 },
  chipText: { fontSize: 12 },
});
