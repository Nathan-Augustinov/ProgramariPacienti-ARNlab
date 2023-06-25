import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "../firebase/config";
import {ref, get} from "firebase/database";
import Login from "../screens/Login";
import Register from "../screens/Register";
import HomePage from "../screens/HomePage";
import Programari from "../screens/Programari";
import Rezultate from "../screens/Rezultate";
import AdminProgramari from "../screens/AdminProgramari";
import AdminRezultate from "../screens/AdminRezultate";
import { Entypo, AntDesign } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

const StackNavigator = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Login");


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const userRef = ref(database, `admins/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setInitialRoute("Admin"); 
        } else {
          setInitialRoute("HomePage"); 
        }
      } else {
        setInitialRoute("Login");
      }
    });

    return () => unsubscribe();

  }, []);

  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name="HomePage"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={Register}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminTabNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </SafeAreaProvider>
    </NavigationContainer>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Acasă"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#6b0f0f",
        tabBarInactiveTintColor: "#000000",
        tabBarIcon: ({ color, size }) => {
          if (route.name == "Acasă") {
            return <Entypo name="home" color={color} size={size} />;
          } else if (route.name == "Programări") {
            return <Entypo name="calendar" color={color} size={size} />;
          } else if (route.name == "Rezultate") {
            return <AntDesign name="pdffile1" color={color} size={size} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="Acasă"
        component={HomePage}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Programări"
        component={Programari}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Rezultate"
        component={Rezultate}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Programări"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#6b0f0f",
        tabBarInactiveTintColor: "#000000",
        tabBarIcon: ({ color, size }) => {
          if (route.name == "Programări") {
            return <Entypo name="calendar" color={color} size={size} />;
          } else if (route.name == "Rezultate") {
            return <AntDesign name="pdffile1" color={color} size={size} />;
          }
        },
      })}
    >
      {/* <Tab.Screen name="Administrator" component={AdminScreen} options={{headerShown: false}}/> */}
      <Tab.Screen
        name="Programări"
        component={AdminProgramari}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Rezultate"
        component={AdminRezultate}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default StackNavigator;
