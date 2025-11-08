import React from "react";
import { Dialog, Button, TextInput, Portal, HelperText } from "react-native-paper";
import { modalStyles as s } from "./ModalBase.styles";

type Props = {
  visible: boolean;
  current: string;
  next: string;
  confirm: string;
  loading?: boolean;
  error?: string | null;
  onChangeCurrent: (v: string) => void;
  onChangeNext: (v: string) => void;
  onChangeConfirm: (v: string) => void;
  onDismiss: () => void;
  onSubmit: () => void;
};

export default function ChangePasswordDialog({
  visible, current, next, confirm, loading, error,
  onChangeCurrent, onChangeNext, onChangeConfirm, onDismiss, onSubmit,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={s.dialog}>
        <Dialog.Title>Alterar senha</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="Senha atual"
            value={current}
            onChangeText={onChangeCurrent}
            secureTextEntry
            autoCapitalize="none"
            disabled={!!loading}
          />
          <TextInput
            mode="outlined"
            label="Nova senha"
            value={next}
            onChangeText={onChangeNext}
            secureTextEntry
            autoCapitalize="none"
            style={s.mt8}
            disabled={!!loading}
          />
          <TextInput
            mode="outlined"
            label="Confirmar nova senha"
            value={confirm}
            onChangeText={onChangeConfirm}
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
