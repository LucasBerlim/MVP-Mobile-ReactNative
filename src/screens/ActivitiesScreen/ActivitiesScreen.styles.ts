import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  loadingText: { marginTop: 8, textAlign: "center" },
  errorText: { marginBottom: 8, textAlign: "center" },

  search: { marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 8 },

  listContent: { gap: 10, paddingBottom: 80 },
  listContentCentered: { flexGrow: 1, justifyContent: "center" },
  emptyContainer: { alignItems: "center" },

  fab: { position: "absolute", right: 16, bottom: 16 },
});
