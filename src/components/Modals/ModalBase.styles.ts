import { Platform, StyleSheet } from "react-native";

export const modalStyles = StyleSheet.create({
  dialog: { borderRadius: 12 },
  mt8: { marginTop: 8 },
  mb4: { marginBottom: 4 },

  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
  },

  resultList: {
    marginTop: 8,
    borderRadius: 8,
    ...Platform.select({
      android: { elevation: 1 },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
  resultItem: {
    justifyContent: "flex-start",
    paddingVertical: 6,
  },
  subtle: { opacity: 0.8 },
});
