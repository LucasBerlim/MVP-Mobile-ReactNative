import React from "react";
import { Dialog, Button, TextInput, Portal } from "react-native-paper";
import { modalStyles as s } from "./ModalBase.styles";

type Props = {
  visible: boolean;
  name: string;
  loading?: boolean;
  onChangeName: (v: string) => void;
  onDismiss: () => void;
  onSubmit: () => void;
};

export default function EditNameDialog({
  visible, name, loading, onChangeName, onDismiss, onSubmit,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={s.dialog}>
        <Dialog.Title>Editar nome</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Nome"
            value={name}
            onChangeText={onChangeName}
            autoCapitalize="words"
            disabled={!!loading}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={!!loading}>Cancelar</Button>
          <Button onPress={onSubmit} loading={!!loading}>Salvar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
