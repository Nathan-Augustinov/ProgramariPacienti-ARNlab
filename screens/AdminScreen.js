import { useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { Button } from "react-native-elements";
import { useEffect } from "react";
import { onValue, ref, get, child, update } from "firebase/database";
import { database, auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";

const logoImage = require("../assets/logo.png");

const AdminScreen = () => {
  const [requestedAppointments, setRequestedAppointments] = useState([]);
  const [userDetails, setUserDetails] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    onValue(ref(database, "appointmentRequests"), (querySnapshot) => {
      const data = querySnapshot.val();
      const requestedAppointments = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setRequestedAppointments(requestedAppointments);
    });
  }, []);

  const handleLogout = () => {
    signOut(auth);
    goToLoginPage();
  };

  const goToLoginPage = () => {
    navigation.navigate("Login");
  };

  const getUserFirstAndLastName = async (userId) => {
    try {
      const snapshot = await get(child(ref(database), `users/${userId}`));
      if (snapshot.exists()) {
        return snapshot.val().nume + " " + snapshot.val().prenume;
      } else {
        return "";
      }
    } catch (error) {
      console.log(error);
      return "";
    }
  };

  const handleAccept = (appointment) => {
    update(ref(database, `appointmentRequests/${appointment.id}`), {
      status: "accepted",
    });
  };

  const handleDeny = (appointment) => {
    update(ref(database, `appointmentRequests/${appointment.id}`), {
      status: "denied",
    });
  };
  return (
    <SafeAreaView
      style={[
        tw`bg-white h-full`,
        { flex: 1, minHeight: Math.round(useWindowDimensions().height) },
      ]}
    >
      <View style={[tw`p-5`, styles.logoImageView]}>
        <Image style={styles.logo} source={logoImage} />
        <TouchableOpacity
          style={{
            alignSelf: "flex-start",
            marginTop: 20,
            marginLeft: 90,
            backgroundColor: "#6b0f0f",
            width: 50,
            height: 50,
            borderRadius: 25,
          }}
          onPress={handleLogout}
        >
          {/* <Image
                        source={userProfileImage}
                        style={{width: 50, height: 50, borderRadius: 25}}
                    /> */}
          <Text style={{ marginTop: 12, marginLeft: 3, fontWeight: "bold" }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  logoImageView: {
    flex: 1,
    alignSelf: "center",
    alignItems: "center",
    height: 150,
    flexDirection: "row",
  },
  logo: {
    width: 200,
    height: 150,
    marginLeft: 0,
    resizeMode: "contain",
    alignSelf: "flex-start",
  },
  appointment: {
    borderWidth: 1,
    borderColor: "#6b0f0f",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    margin: 5,
  },
  date: {
    fontSize: 16,
    alignSelf: "center",
  },
  flatlist: {
    position: "absolute",
    top: 100,
    width: "100%",
  },
  button: {
    color: "#6b0f0f",
  },
  buttonText: {
    alignSelf: "center",
    fontSize: 20,
    marginBottom: 15,
    marginTop: 10,
  },
});
