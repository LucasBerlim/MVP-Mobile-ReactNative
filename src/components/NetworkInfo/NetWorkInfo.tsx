import React, { useEffect, useRef, useState } from "react";
import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { Banner, Snackbar, Text } from "react-native-paper";

export default function NetWorkInfo() {
  const netInfo = useNetInfo();
  const [showReconnect, setShowReconnect] = useState(false);
  const prevOffline = useRef<boolean>(false);

  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  const isExpensive = netInfo.details?.isConnectionExpensive === true;
  const connLabel =
    netInfo.type && netInfo.type !== "unknown" ? netInfo.type : "desconhecida";

  useEffect(() => {
    if (prevOffline.current && !isOffline) setShowReconnect(true);
    prevOffline.current = !!isOffline;
  }, [isOffline]);

  const tryReconnect = () => {
    NetInfo.fetch().then(() => {});
  };

  return (
    <>
      <Banner
        visible={!!isOffline}
        icon="wifi-off"
        actions={[
          { label: "Tentar novamente", onPress: tryReconnect },
        ]}
        style={{ marginHorizontal: 8, marginTop: 8 }}
      >
        <Text style={{ fontWeight: "600" }}>Sem conexão à internet.</Text>{" "}
        <Text>
          Verifique sua rede ({connLabel}
          {isExpensive ? " • conexão medida" : ""}).
        </Text>
      </Banner>

      <Snackbar
        visible={showReconnect}
        onDismiss={() => setShowReconnect(false)}
        duration={1800}
      >
        Conectado novamente ({connLabel}
        {isExpensive ? " • conexão medida" : ""})
      </Snackbar>
    </>
  );
}
