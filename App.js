import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import openDB from "./db";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

const db = openDB();

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState(null); // variável para armazenar as localizações

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    try {
      const jsonValue = await AsyncStorage.getItem("@darkMode");
      if (jsonValue !== null) {
        setIsSwitchOn(JSON.parse(jsonValue));
      }
    } catch (e) {
      // error reading value
    }
  }

  // darkMode switch event
  async function onToggleSwitch() {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    try {
      await AsyncStorage.setItem("@darkMode", JSON.stringify(newValue));
    } catch (e) {
      // saving error
    }
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    // pede a permissão de localização ao usuário
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permissão de localização negada");
      setIsLoading(false);
      return;
    }

    try {
      // localização real do dispositivo
      const location = await Location.getCurrentPositionAsync({});
      const coords = location.coords;

      // insere a nova localização no banco de dados
      await db.runAsync(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?)",
        [coords.latitude, coords.longitude]
      );
    } catch (e) {
      console.log("Erro ao capturar localização", e);
    }

    // recarrega a lista para exibir a nova localização
    await loadLocations();
    setIsLoading(false);
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    setIsLoading(true);

    const rows = await db.getAllAsync(
      "SELECT * FROM locations ORDER BY id DESC",
      []
    );

    setLocations(rows);
    setIsLoading(false);
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
