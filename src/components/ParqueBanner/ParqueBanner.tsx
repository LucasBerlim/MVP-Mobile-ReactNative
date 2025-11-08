import React from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";

type Props = { nome: string; imagem?: string; height?: number };
export default function ParqueBanner({ nome, imagem, height = 132 }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.banner, { height }]}>
      {imagem ? (
        <>
          <Image source={{ uri: imagem }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlay} />
          <Text numberOfLines={1} style={styles.title}>{nome}</Text>
        </>
      ) : (
        <View style={[styles.image, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text numberOfLines={1} style={styles.title}>{nome}</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    borderRadius: 12, overflow: "hidden", marginBottom: 12, marginTop: 10,
    ...Platform.select({
      android: { elevation: 2 },
      default: { shadowColor:"#000", shadowOpacity:0.15, shadowRadius:6, shadowOffset:{width:0, height:2} }
    }),
  },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  title: {
    position: "absolute", left: 12, bottom: 10, right: 12,
    color: "#fff", fontSize: 18, fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
