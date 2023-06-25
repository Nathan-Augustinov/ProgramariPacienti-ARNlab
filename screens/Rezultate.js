import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, Image, StyleSheet, useWindowDimensions, TouchableOpacity} from "react-native";
import tw from 'twrnc';
import { collection, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref } from "firebase/storage";
import * as FileSystem from 'expo-file-system';
import { firestore, auth, storage } from "../firebase/config";
import * as IntentLauncher from 'expo-intent-launcher';

const logoImage = require("../assets/logo.png");
const nothingFoundImage = require("../assets/nothing_found.png");

const loadUserResults = async (userId) => {
  const userFilesCollection = collection(firestore, 'results', userId, 'files');
  const snapshot = await getDocs(userFilesCollection);

  const results = [];
  snapshot.forEach((doc) => {
    results.push(doc.data());
  });

  return results;
}

const Rezultate = () => {
  const [results, setResults] = useState([]);

  const userId = auth.currentUser.uid;

  useEffect(() => {
    async function fetchResults() {
      const userResults = await loadUserResults(userId);
      setResults(userResults);
    }
    fetchResults();
  }, [userId]);

  // const tempFileUri = FileSystem.documentDirectory + 'temp_' + fileName;
  // await FileSystem.downloadAsync(url, tempFileUri);
  // console.log(tempFileUri);
  // console.log(decryptedFileUri);
  // await FileSystem.deleteAsync(tempFileUri);
  const handleFileView= async (fileRef, fileName) => {
    const url = await getDownloadURL(ref(storage, fileRef));
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.downloadAsync(url, fileUri);

    try {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);    
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: "application/pdf",
      });
    }catch(e){
        console.log(e.message);
    }
  }


  return (
      <SafeAreaView style={[tw`bg-white h-full`, {flex:1, minHeight: Math.round(useWindowDimensions().height), justifyContent: 'flex-start'}]}>
          <View style={[tw`p-5`, styles.logoImageView]}>
              <Image 
                  style={styles.logo}
                  source={logoImage} 
              /> 
          </View>
          <View style={styles.container}>
            <Text style={styles.title}>Rezultatele analizelor dumneavoastră</Text>
            {results.length > 0 ? results.map((result, index) => (
              <View key={index} style={styles.result}>
                <Text style={styles.filename}>{result.filename}</Text>
                <View style={styles.buttons}>
                  {/* <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleFileDownload(result.fileRef, result.filename)}
                  >
                    <Text style={styles.buttonText}>Download</Text>
                  </TouchableOpacity> */}
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleFileView(result.fileRef, result.filename)}
                  >
                    <Text style={styles.buttonText}>Deschideți fișierul PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )) : (
              <View style={styles.resultsFileNotFound}>
                <Image 
                    style={styles.logo}
                    source={nothingFoundImage} 
                /> 
                <Text style={styles.noDataText}>Rezultatele analizelor dumneavoastră</Text>
                <Text style={{marginTop: 5, color: "#000", fontWeight: "bold", fontSize: 14}}> nu sunt disponibile!</Text>
              </View>
                )}
          </View>
      </SafeAreaView>
  );
}

export default Rezultate;

const styles = StyleSheet.create({
    text: {
      color: "#6b0f0f",
      fontWeight: "bold",
      fontSize: 18,
    },
    logoImageView: {
      // flex: 1,
      alignItems: "center",
      height: 150,
    },
    logo: {
      width: 200,
      height: 150,
      marginLeft: 25,
      resizeMode: "contain",
    },
    container: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    result: {
      marginBottom: 20,
      borderWidth: 2,
      marginLeft: 10,
      marginRight: 10,
      padding: 10,
      borderColor: "#6b0f0f"
    },
    filename: {
      textAlign: 'center',
      marginBottom: 10,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-evenly'
    },
    button: {
      padding: 10,
      backgroundColor: '#6b0f0f',
      borderRadius: 5,
    },
    buttonText: {
      color: 'white',
    },
    title:{
      color: "#6b0f0f",
      fontWeight: "bold",
      fontSize: 18,
      alignSelf: 'center',
      marginBottom: 25
    },
    noDataText:{
      color: "#000",
      fontWeight: "bold",
      fontSize: 14,
      marginTop: 20,
      alignSelf:"center"
    },
    resultsFileNotFound:{
      alignItems: "center",
    }
});