import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import {
  TextInput,
  View,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Pressable,
} from "react-native";
import { ref, get } from "firebase/database";
import { auth, database, storage, firestore } from "../firebase/config";
import { ref as stRef, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import Toast from "react-native-toast-message";
import InputScrollView from "react-native-input-scroll-view";

const logoImage = require("../assets/logo.png");

const AdminRezultate = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [modal, setModal] = useState(false);
  const [modalText, setModalText] = useState("");

  const fetchUserByName = async (patientFirstname, patientLastname) => {
    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const users = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      const user = users.find(
        (user) =>
          (user.prenume === patientFirstname &&
            user.nume === patientLastname) ||
          (user.prenume === patientLastname && user.nume === patientFirstname)
      );
      return user ? user.id : null;
    }
  };

  const emptyForm = () => {
    setFirstname("");
    setLastname("");
    setSelectedFile(null);
  };

  const onFilePick = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });
    if (!result.cancelled) {
      setSelectedFile(result);
    }
  };

  const onSubmit = async (patientFirstname, patientLastname) => {
    if (firstname === "" || lastname === "") {
      setModalText("Vă rugăm să introduceți numele și prenumele pacientului!");
      setModal(true);
      return;
    }
    if (!selectedFile || !selectedFile.size) {
      setModalText("Vă rugăm să selectați un fișier pentru încărcare!");
      setModal(true);
      return;
    }

    const user = await fetchUserByName(patientFirstname, patientLastname);
    if (!user) {
      setModalText("Vă rugăm să verificați datele pacientului introduse!");
      setModal(true);
      return;
    }

    const response = await fetch(selectedFile.uri);
    const blob = await response.blob();
    const storageRef = stRef(
      storage,
      `bloodResults/${user}/${selectedFile.name}`
    );
    await uploadBytes(storageRef, blob);

    const docRef = doc(firestore, "results", user, "files", selectedFile.name);
    await setDoc(docRef, {
      filename: selectedFile.name,
      fileRef: `bloodResults/${user}/${selectedFile.name}`,
    });

    Toast.show({
      type: "success",
      position: "bottom",
      text1: "Încărcare reușită!",
      text2: "Rezultatul a fost încărcat cu succes!",
      visibilityTime: 4000,
    });

    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();

      const token =
        users[user] && users[user].pushToken ? users[user].pushToken : null;

      console.log(token);
      const message = {
        to: token,
        sound: "default",
        title: "Rezultate analize încărcate",
        body: "Rezultatele analizelor d-voastră au fost încărcate cu succes!",
        data: {},
      };

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.log("Error:", error));
    }

    emptyForm();
  };

  const navigation = useNavigation();

  const handleLogout = () => {
    signOut(auth);
    goToLoginPage();
  };

  const goToLoginPage = () => {
    navigation.navigate("Login");
  };

  return (
    <InputScrollView>
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
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.text}>Încărcarea rezultatelor pacienților</Text>
          <TextInput
            value={firstname}
            placeholder="Prenume pacient"
            onChangeText={setFirstname}
            style={{
              borderWidth: 1,
              borderColor: "#000",
              borderRadius: 10,
              padding: 10,
              margin: 15,
            }}
          />
          <TextInput
            value={lastname}
            placeholder="Nume pacient"
            onChangeText={setLastname}
            style={{
              borderWidth: 1,
              borderColor: "#000",
              borderRadius: 10,
              padding: 10,
              margin: 15,
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#6b0f0f",
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              marginBottom: 10,
              marginLeft: 25,
              marginRight: 25,
            }}
            onPress={onFilePick}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Alege fișierul
            </Text>
          </TouchableOpacity>
          {selectedFile && selectedFile.size ? (
            <Text style={{ color: "#000", alignSelf: "center" }}>
              Fișier selectat: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(2)} KB)
            </Text>
          ) : (
            <Text style={{ color: "#000", alignSelf: "center" }}>
              Niciun fișier selectat
            </Text>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: "#6b0f0f",
              borderRadius: 10,
              padding: 10,
              marginTop: 10,
              marginBottom: 10,
              marginLeft: 25,
              marginRight: 25,
            }}
            onPress={() => onSubmit(firstname, lastname)}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Încarcă</Text>
          </TouchableOpacity>
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modal}
          onRequestClose={() => {
            setModal(!modal);
          }}
        >
          <View style={styles.containerView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>{modalText}</Text>
              <Pressable
                style={[styles.modalButton, styles.buttonClose]}
                onPress={() => setModal(!modal)}
              >
                <Text style={styles.modalButtonText}>Ok</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Toast />
      </SafeAreaView>
    </InputScrollView>
  );
};

export default AdminRezultate;

const styles = StyleSheet.create({
  text: {
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 20,
    alignSelf: "center",
    marginBottom: 20,
  },
  logoImageView: {
    // alignItems: "center",
    // height: 100,
    // flex: 1,
    alignSelf: "center",
    alignItems: "center",
    height: 100,
    flexDirection: "row",
  },
  logo: {
    width: 200,
    height: 150,
    marginLeft: 0,
    resizeMode: "contain",
    alignSelf: "flex-start",
  },
  containerView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#6b0f0f",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonClose: {
    backgroundColor: "#6b0f0f",
  },
});
