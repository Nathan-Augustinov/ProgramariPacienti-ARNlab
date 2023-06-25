import { useNavigation } from "@react-navigation/native";
import React from "react";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import InputScrollView from "react-native-input-scroll-view";
import tw from "twrnc";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { auth, database, currentUser } from "../firebase/config";
import { ref, set } from "firebase/database";

const logoImage = require("../assets/logo.png");

const Register = () => {
  const navigation = useNavigation();

  const [nume, setNume] = useState("");
  const [prenume, setPrenume] = useState("");
  const [cnp, setCnp] = useState("");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [confirmaParola, setConfirmaParola] = useState("");
  const [modal, setModal] = useState(false);
  const [modalText, setModalText] = useState("");

  const handleSubmit = () => {
    if(!nume || !prenume || !cnp || !email || !parola || !confirmaParola){
      setModalText("Toate câmpurile trebuie completate!")
      setModal(true);
    }
    else{
      if(!isValidEmail(email)){
        setModalText("Vă rugăm introduceți o adresă de e-mail validă!");
        setModal(true);
      }
      else{
        if(parola !== confirmaParola){
          setModalText("Cele două parole nu coincid!");
          setModal(true);
        }
        else{
          createUserWithEmailAndPassword(auth, email, parola)
            .then((userCredentials)=> {
              const user = userCredentials.user;
              saveUserDetails(user.uid);
              sendEmailVerification(user)
                .then(() => {
                  console.log("E-mail verification sent!");
                  setModalText("Vă rugăm să vă verificați adresa de e-mail!");
                  setModal(true);
                })
                .catch((error) => {
                  console.error("Failed to send verification e-mail!", error);
                })
              goToLoginPage();
              emptyForm();
            })
            .catch((error) => {
              setModalText("Adresa de e-mail este deja utilizată!");
              setModal(true);
            })
        }
      }
    }
  }
// auth.currentUser.sendEmailVerification({
              //   handleCodeInApp: true,
              //   url: "programaripacienti-arnlab.firebaseapp.com"
              // })
              //   .then(() => {
              //     onAuthStateChanged((user) => {
              //       if(user.emailVerified){
              //         saveUserDetails(userCredentials.user.uid);
              //         goToLoginPage();
              //       }
              //     })
              //   })
              //   .catch((error) => {
              //     console.log(error.message);
              //     setModalText("Eroare la trimiterea email-ului de verificare. Vă rugăm încercați din nou!");
              //     setModal(true);
              //   })
              // console.log(auth.currentUser);
  const emptyForm = () => {
    setNume("");
    setPrenume("");
    setCnp("");
    setEmail("");
    setParola("");
    setConfirmaParola("");
  }

  const saveUserDetails = (userId) => {
    set(ref(database, 'users/'+userId), {
      nume: nume,
      prenume: prenume,
      CNP: cnp
    });
  }

  function isValidEmail(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return regex.test(email);
  }

  const goToLoginPage = () => {
    navigation.navigate("Login");
  }

  return (
    <InputScrollView>
      <SafeAreaView style={[tw`bg-white h-full`, { flex: 1, minHeight: Math.round(useWindowDimensions().height)}]}>
        <View style={[tw`p-5`, styles.logoImageView]}>
          <Image style={styles.logo} source={logoImage} />
        </View>
        <View style={{flex: 1, alignItems: "center", }}>
          <Text style={styles.text}>Creează-ți un cont în aplicație</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Nume"
            value={nume}
            onChangeText={setNume}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Prenume"
            value={prenume}
            onChangeText={setPrenume}
            />
          <TextInput
            style={styles.textInput}
            placeholder="CNP"
            value={cnp}
            onChangeText={setCnp}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Parola"
            value={parola}
            onChangeText={setParola}
            secureTextEntry={true}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Confirma parola"
            value={confirmaParola}
            onChangeText={setConfirmaParola}
            secureTextEntry={true}
          />
          <TouchableOpacity style={{ marginTop: 20 }} onPress={handleSubmit}>
            <Text style={styles.text}>Înregistrează-te</Text>
          </TouchableOpacity>
          <View style={{alignItems:"center"}}>
              <Text style={styles.loginText}>
                  Dacă ai deja un cont creat, te poți loga 
              </Text>
              <TouchableOpacity onPress={goToLoginPage} style={styles.goToLoginPageButton}>
                  <Text style={styles.buttonText}>aici</Text>
              </TouchableOpacity>
          </View>
        </View>
        <Modal
            animationType="slide"
            transparent={true}
            visible={modal}
            onRequestClose={()=>{setModal(!modal)}}
        >
            <View style={styles.containerView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>{modalText}</Text>
                    <Pressable style={[styles.modalButton, styles.buttonClose]} onPress={()=>setModal(!modal)}>
                        <Text style={styles.modalButtonText}>Ok</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
      </SafeAreaView>
    </InputScrollView>
    
  );
};

export default Register;
const styles = StyleSheet.create({
  text: {
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 18,
  },
  logoImageView: {
    flex: 1,
    alignItems: "center",
    height: 150,
  },
  logo: {
    width: 200,
    height: 150,
    marginLeft: 25,
    resizeMode: "contain",
  },
  textInput: {
    borderWidth: 1.5,
    marginTop: 20,
    width: 200,
    height: 45,
    paddingLeft: 5
  },
  loginText:{
    marginTop:15
  },
  gotToLoginPageButton:{
      marginLeft:5
  },
  buttonText:{
      marginTop:5,
      color: "#6b0f0f",
      fontWeight:"bold"
  },
  containerView:{
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop:22
  },
  modalView:{
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#6b0f0f",
      shadowOffset: {
          width: 0,
          height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
  },
  modalText:{
      marginBottom: 15,
      textAlign: "center",
      fontSize:20
  },
  modalButton:{
      borderRadius: 20,
      padding: 10,
      elevation: 2
  },
  modalButtonText:{
      color: "white",
      fontWeight: "bold",
      textAlign: "center"
  },
  buttonClose: {
      backgroundColor: "#6b0f0f",
  },
});
