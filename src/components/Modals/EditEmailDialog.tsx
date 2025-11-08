import React from "react";
import { Dialog, Button, TextInput, Portal, HelperText } from "react-native-paper";
import { modalStyles as s } from "./ModalBase.styles";

type Props = {
  visible: boolean;
  email: string;
  currentPass: string;
  loading?: boolean;
  error?: string | null;
  onChangeEmail: (v: string) => void;
  onChangeCurrentPass: (v: string) => void;
  onDismiss: () => void;
  onSubmit: () => void;
};

export default function EditEmailDialog({
  visible, email, currentPass, loading, error,
  onChangeEmail, onChangeCurrentPass, onDismiss, onSubmit,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={s.dialog}>
        <Dialog.Title>Alterar e-mail</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Novo e-mail"
            value={email}
            onChangeText={onChangeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={!!loading}
          />
          <TextInput
            mode="outlined"
            label="Senha atual"
            value={currentPass}
            onChangeText={onChangeCurrentPass}
            secureTextEntry
            autoCapitalize="none"
            style={s.mt8}
            disabled={!!loading}
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={!!loading}>Cancelar</Button>
          <Button onPress={onSubmit} loading={!!loading}>Salvar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
