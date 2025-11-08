import React, { useState, useEffect } from "react";
import { Dialog, Button, TextInput, Portal, HelperText } from "react-native-paper";
import { modalStyles as s } from "./ModalBase.styles";

export type ParqueCreate = {
  nome: string;
  localizacao: string;
  endereco: string;
  imagem: string;
};

type Props = {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  defaultValue?: ParqueCreate;
  onDismiss: () => void;
  onSubmit: (data: ParqueCreate) => void;
};

export default function CreateParqueDialog({
  visible, loading, error, defaultValue, onDismiss, onSubmit,
}: Props) {
  const [nome, setNome] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [imagem, setImagem] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    setNome(defaultValue?.nome ?? "");
    setLocalizacao(defaultValue?.localizacao ?? "");
    setEndereco(defaultValue?.endereco ?? "");
    setImagem(defaultValue?.imagem ?? "");
    setFormErr(null);
  }, [visible, defaultValue]);

  function validate(p: ParqueCreate) {
    if (!p.nome.trim()) return "Informe o nome do parque.";
    if (!p.localizacao.trim()) return "Informe a localização (ex.: Teresópolis - RJ).";
    if (!p.endereco.trim()) return "Informe o endereço.";
    if (!p.imagem.trim()) return "Informe a URL da imagem.";
    return null;
  }

  function submit() {
    const payload = { nome: nome.trim(), localizacao: localizacao.trim(), endereco: endereco.trim(), imagem: imagem.trim() };
    const err = validate(payload);
    if (err) { setFormErr(err); return; }
    onSubmit(payload);
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={s.dialog}>
        <Dialog.Title>Adicionar parque</Dialog.Title>
        <Dialog.Content>
          <TextInput mode="outlined" label="Nome" value={nome} onChangeText={(v)=>{setNome(v); setFormErr(null);}} disabled={!!loading} />
          <TextInput mode="outlined" label="Localização (ex.: Teresópolis - RJ)" value={localizacao} onChangeText={(v)=>{setLocalizacao(v); setFormErr(null);}} style={s.mt8} disabled={!!loading} />
          <TextInput mode="outlined" label="Endereço" value={endereco} onChangeText={(v)=>{setEndereco(v); setFormErr(null);}} style={s.mt8} disabled={!!loading} />
          <TextInput mode="outlined" label="URL da imagem" value={imagem} onChangeText={(v)=>{setImagem(v); setFormErr(null);}} autoCapitalize="none" keyboardType="url" style={s.mt8} disabled={!!loading} />
          <HelperText type="error" visible={!!(formErr || error)}>{formErr || error}</HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={!!loading}>Cancelar</Button>
          <Button onPress={submit} loading={!!loading}>Salvar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
