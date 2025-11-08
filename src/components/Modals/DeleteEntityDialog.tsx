import React from "react";
import { View } from "react-native";
import { Dialog, Button, Text, TextInput, Portal, HelperText } from "react-native-paper";
import { modalStyles as s } from "./ModalBase.styles";

export type DeleteTarget = "evento" | "atividade";

type Result = { _id: string; nome: string; extra?: string };

type Props = {
  visible: boolean;
  type: DeleteTarget;
  query: string;
  selectedId: string;
  results: Result[];
  loading?: boolean;
  searching?: boolean;
  error?: string | null;
  onChangeType: (t: DeleteTarget) => void;
  onChangeQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onDismiss: () => void;
  onSubmit: () => void;
};

export default function DeleteEntityDialog({
  visible, type, query, selectedId, results, loading, searching, error,
  onChangeType, onChangeQuery, onSelect, onDismiss, onSubmit,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={s.dialog}>
        <Dialog.Title>Excluir</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={s.mb4}>Tipo</Text>

          <View style={s.toggleRow}>
            <Button mode={type === "evento" ? "contained" : "outlined"} onPress={() => onChangeType("evento")} style={s.toggleBtn}>
              Evento
            </Button>
            <Button mode={type === "atividade" ? "contained" : "outlined"} onPress={() => onChangeType("atividade")} style={s.toggleBtn}>
              Atividade
            </Button>
          </View>

          <TextInput
            mode="outlined"
            label={`Buscar ${type} por nome`}
            value={query}
            onChangeText={onChangeQuery}
            autoCapitalize="sentences"
            style={s.mt8}
            disabled={!!loading}
            right={<TextInput.Icon icon={searching ? "progress-clock" : "magnify"} />}
          />

          {query.trim().length >= 2 && (
            <View style={s.resultList}>
              {results.length === 0 && !searching ? (
                <Text style={s.subtle}>Nenhum resultado encontrado.</Text>
              ) : (
                results.map((item) => (
                  <Button
                    key={item._id}
                    mode={selectedId === item._id ? "contained" : "text"}
                    onPress={() => onSelect(item._id)}
                    style={s.resultItem}
                  >
                    {item.nome}{item.extra ? `  ·  ${item.extra}` : ""}
                  </Button>
                ))
              )}
            </View>
          )}

          {!!selectedId && (
            <TextInput
              mode="outlined"
              label="Selecionado (ID)"
              value={selectedId}
              editable={false}
              style={s.mt8}
            />
          )}

          <HelperText type="error" visible={!!error}>{error}</HelperText>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={!!loading}>Cancelar</Button>
          <Button onPress={onSubmit} loading={!!loading} disabled={!selectedId}>Excluir</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
