import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  container: {
    flex: 1,
    gap: 12,
  },
  card: {
    ...Platform.select({
      android: { elevation: 1 },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
    borderRadius: 14,
  },
  headerContent: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    marginTop: 4,
  },
  subtle: {
    opacity: 0.8,
  },
  actionsRow: {
    flexDirection: "row",
    columnGap: 8,
    marginTop: 10,
  },

  dialog: {
    borderRadius: 12,
  },

  mt8: { marginTop: 8 },
});
