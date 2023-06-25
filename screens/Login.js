import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import React from "react";
import { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Image, TextInput, TouchableOpacity, useWindowDimensions, ScrollView, Modal, Pressable, } from "react-native";
import InputScrollView from "react-native-input-scroll-view";
import tw from 'twrnc';
import { auth, database } from "../firebase/config";
import { ref, child, get, set} from "firebase/database";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';




const logoImage = require("../assets/logo.png");

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
        experienceId: '@ProgramariPacienti-ARNlab/ProgramariPacienti-ARNlab',
        projectId:'4acaa94c-420b-42f8-b7c9-0efe2d8db366'
      })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}


const Login = () => {
    const [email, setEmail] = useState("");
    const [parola, setParola] = useState("");
    const [modal, setModal] = useState(false);
    const [modalText, setModalText] = useState("");

    const navigation = useNavigation();
    // const IOS_CLIENT_ID = 'your-ios-client-id';
    // const ANDROID_CLIENT_ID = 'your-android-client-id';

    // const handleGoogleLogin = async () => {
    //     try {
    //       const result = await Google.logInAsync({
    //         iosClientId: IOS_CLIENT_ID,
    //         androidClientId: ANDROID_CLIENT_ID,
    //         scopes: ['profile', 'email'],
    //       });
      
    //       if (result.type === 'success') {
    //         // You can now use the token to authenticate with Firebase
    //         const credential = firebase.auth.GoogleAuthProvider.credential(result.idToken, result.accessToken);
    //         firebase.auth().signInWithCredential(credential);
    //       } else {
    //         // User cancelled the Google login process
    //       }
    //     } catch({ message }) {
    //       alert('Google Signin Error: ' + message);
    //     }
    //   };

    const handleSubmit = () => {
        if(!email || !parola){
            setModalText("Toate câmpurile trebuie completate!")
            setModal(true);
        }else{
            if(!isValidEmail(email)){
                setModalText("Vă rugăm introduceți o adresă de e-mail validă!");
                setModal(true);
            }
            else{
                signInWithEmailAndPassword(auth, email, parola)
                    .then(()=>{
                        const user = auth.currentUser;
                        // if(!user.emailVerified){
                        //     signOut(auth)
                        //         .then(() => {
                        //             setModalText("Înainte de a vă putea loga, vă rugăm să vă verificați adresa de e-mail!");
                        //             setModal(true);
                        //         })
                        //         .catch((error) => {
                        //             console.log(error);
                        //         })
                        // }
                        // else{
                            get(child(ref(database), `admins/${user.uid}`))
                                .then(async (snapshot) => {
                                    // const pushToken = await registerForPushNotificationsAsync();
                                    // await set(ref(database, `users/${user.uid}/pushToken`), pushToken);
                                    if(snapshot.exists()){
                                        emptyForm();
                                        goToAdminPage();
                                    }
                                    else{
                                        emptyForm();
                                        goToHomePage();
                                    }
                                })
                                .catch((error) => {
                                    console.error(error);
                                })
                        // }
                    })
                    .catch((error) => {
                        setModalText("Credențialele introduse nu sunt corecte!");
                        setModal(true);
                    })
                
            }
        }
    }

    const handleResetPassword = (email) => {
        if(!email){
            setModalText("Vă rugăm să introduceți adresa de e-mail pentru resetarea parolei!");
            setModal(true);
        }
        else{
            if(!isValidEmail(email)){
                setModalText("Vă rugăm introduceți o adresă de e-mail validă pentru resetarea parolei!");
                setModal(true);
            }
            else{
                sendPasswordResetEmail(auth, email)
                    .then(() => {
                        setModalText("Un e-mail pentru resetarea parolei a fost trimis!");
                        setModal(true);
                    })
                    .catch((error) => {
                        setModalText("A apărut o eroare în timpul resetării parolei!");
                        setModal(true);
                        console.error(error);
                    });
            }
        }
    };
    

    const emptyForm = () =>{
        setEmail("");
        setParola("");
    }

    function isValidEmail(email) {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return regex.test(email);
    }

    const goToRegisterPage = () =>{
        navigation.navigate('Register');
    }

    const goToHomePage = () =>{
        navigation.navigate('HomePage');
    }

    const goToAdminPage = () => {
        navigation.navigate('Admin');
    }

    return (
        <InputScrollView>
            <SafeAreaView style={[tw`bg-white h-full`, {flex:1, justifyContent: "center", minHeight: Math.round(useWindowDimensions().height)}]}>
                <View style={[tw`p-5`, styles.logoImageView]}>
                    <Image 
                        style={styles.logo}
                        source={logoImage} 
                    /> 
                </View>
                <View style={{flex:1, alignItems:"center"}}>
                    <Text style={styles.text}>Loghează-te în cont</Text>
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
                    <TouchableOpacity onPress={() => handleResetPassword(email)}>
                        <Text style={styles.forgotPasswordText}>Parola pierdută?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginTop: 20}} onPress={handleSubmit}>
                        <Text style={styles.text}>Loghează-te</Text>
                    </TouchableOpacity>
                    <View style={{alignItems:"center"}}>
                        <Text style={styles.registerText}>
                            Dacă încă nu ai un cont creat, te poți înregistra 
                        </Text>
                        <TouchableOpacity onPress={goToRegisterPage} style={styles.goToRegisterPageButton}>
                            <Text style={styles.buttonText}>aici</Text>
                        </TouchableOpacity>
                    </View>
                    {/* <TouchableOpacity onPress={handleGoogleLogin}>
                        <Text style={styles.buttonText}>Sign in with Google</Text>
                    </TouchableOpacity> */}
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

export default Login;
const styles = StyleSheet.create({
    text:{
        color: '#6b0f0f',
        fontWeight: 'bold',
        fontSize: 18
    },
    logoImageView:{
        flex: 1,
        alignItems: 'center',
        height:150
    },
    logo:{
        width: 200, 
        height: 150, 
        marginLeft: 25,
        resizeMode: 'contain'
    },
    textInput:{
        borderWidth: 1.5,
        marginTop: 20,
        width: 200,
        height: 45,
        paddingLeft: 5
    },
    registerText:{
        marginTop:15,
    },
    goToRegisterPageButton:{
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
    forgotPasswordText:{
        marginTop:10,
        color:"blue"
    }
});