import { StyleSheet} from "react-native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StackNavigator from "./navigation/AppNavigator";
import { LogBox } from "react-native";

const Stack = createNativeStackNavigator();

LogBox.ignoreLogs(['AsyncStorage has been extracted']);

export default function App() {

  return(
    <StackNavigator />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
