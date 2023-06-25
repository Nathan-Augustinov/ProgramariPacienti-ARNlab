import { signOut } from "firebase/auth";
import { View, Text, SafeAreaView, Image, StyleSheet, useWindowDimensions, TouchableOpacity, Button} from "react-native";
import tw from 'twrnc';
import { auth, storage, firestore } from "../firebase/config";
import { doc, setDoc, collection, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MapView, {Marker} from "react-native-maps";
import { Linking } from "react-native";
import * as Location from 'expo-location';
import { useEffect, useState} from "react";
import * as DocumentPicker from 'expo-document-picker';
import { ref as stRef, uploadBytes, getDownloadURL, deleteObject} from "firebase/storage";
import * as FileSystem from 'expo-file-system';


const logoImage = require("../assets/logo.png");
const imagineMicroscop = require("../assets/imagine_microscop.png");
const locatie = require("../assets/locatie.jpeg");
const eprubete = require("../assets/eprubete.jpeg");
const aparat = require("../assets/aparat.jpeg");
const eprubeteInAparat = require("../assets/eprubete_in_aparat.jpeg");
const interiorAparat = require("../assets/interior_aparat.jpeg");
const microscop = require("../assets/microscop.jpeg");
const microscopFull = require("../assets/microscop_full.jpeg");
const noUserProfileImage = require("../assets/user_profile.png");


const HomePage = () => {
    const [location, setLocation] = useState(null);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [userProfileImage, setUserProfileImage] = useState(null);


    const navigation = useNavigation();

    useEffect(() => {
        getProfileImage();
    },[]);

    const setCurrentLocation = async () => {
        let {permissionStatus} = await Location.requestForegroundPermissionsAsync();
            if(permissionStatus !== 'granted'){
                console.log('Permission was denied');
                return;
            }
            let location = await Location.getCurrentPositionAsync();
            setLocation(location);
    }

    const handleProfilePress = () => {
        setDropdownOpen(!isDropdownOpen);
    }
    
    const handleSelectProfilePicture = async () => {
        const result = await DocumentPicker.getDocumentAsync({type:'image/*', copyToCacheDirectory: true});
        if(result.type === 'success'){
            const profileImagesCollection = collection(firestore, `profileImages/${auth.currentUser.uid}/profileImage`);
            const profileImagesSnapshot = await getDocs(profileImagesCollection);
            
            profileImagesSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
                const fileRef = stRef(storage, doc.data().fileRef);
                await deleteObject(fileRef);
            });
            const response = await fetch(result.uri);
            const blob = await response.blob();
            const imagePath = `profileImages/${auth.currentUser.uid}/${result.name}`;
            const imageRef = stRef(storage, imagePath);
            await uploadBytes(imageRef, blob);

            const docRef = doc(firestore, "profileImages", auth.currentUser.uid, "profileImage", result.name);
            await setDoc(docRef, {
                filename: result.name,
                fileRef: `profileImages/${auth.currentUser.uid}/${result.name}`,
            });
            getProfileImage();
        }
    }

    const getProfileImage = async () => {
        const userProfileImage = collection(firestore, "profileImages", auth.currentUser.uid, "profileImage");
        const snapshot = await getDocs(userProfileImage);
        snapshot.forEach(async (doc) => {
            const url = await getDownloadURL(stRef(storage, doc.data().fileRef));
            const downloadedImageUrl = FileSystem.documentDirectory + doc.data().filename;
            await FileSystem.downloadAsync(url, downloadedImageUrl);
            setUserProfileImage(downloadedImageUrl);
            return;
        })
    }

    const handleLogout = () => {
        signOut(auth);
        goToLoginPage();
    }

    const goToLoginPage = () => {
        navigation.navigate('Login');
    }

    const mapDirections = async () => {
        let {status} = await Location.requestForegroundPermissionsAsync();
        if(status !== 'granted'){
            alert('Permission was denied');
            return;
        }
        let location = await Location.getCurrentPositionAsync();
        const originLatitude = location.coords.latitude;
        const originLongitude = location.coords.longitude;
        const destinationLatitude = 46.18668692462725;
        const destinationLongitude = 21.31402752287927;
        const label = "Locatie ARNlab";
        const url = `https://www.google.com/maps/dir/?api=1&origin=${originLatitude},${originLongitude}&destination=${destinationLatitude},${destinationLongitude}&travelmode=driving`;
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
    }

    return (
        <SafeAreaView style={[tw`bg-white h-full`, {flex:1, minHeight: Math.round(useWindowDimensions().height)}]}>
            <View style={[tw`p-5`, styles.logoImageView]}>
                <Image 
                    style={styles.logo}
                    source={logoImage} 
                /> 
                <TouchableOpacity 
                    style={{alignSelf:"flex-start", marginTop: 20, marginLeft:90, backgroundColor:"#fff", width: 50, height: 50, borderRadius: 25}}
                    onPress={handleProfilePress}    
                >
                    <Image
                        source={userProfileImage ? {uri: userProfileImage} : noUserProfileImage}
                        style={{width: 50, height: 50, borderRadius: 25}}
                    />
                </TouchableOpacity>
                {isDropdownOpen && (
                    <View style={{position: "absolute", top: 90, right: 10, width: 150, backgroundColor: "#6b0f0f", zIndex:1, marginTop: 5}}>
                        <TouchableOpacity style={{borderColor:"black", borderWidth:2, height: 35}} onPress={handleSelectProfilePicture}>
                            <Text style={{alignSelf:"center", marginTop: 5, fontWeight:"bold", color:"white"}}>Alege imagine de profil</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{borderColor:"black", borderWidth:2, height: 35}} onPress={handleLogout}>
                            <Text style={{alignSelf:"center", marginTop: 5, fontWeight:"bold", color:"white"}}>Delogare</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <Image 
                source={microscop}
                style={styles.microscop}
            />
            {/* <Swiper autoplay={true} autoplayTimeout={2.5} style={styles.swiper}>
                <View style={styles.slide}>
                    <Image style={styles.image} source={locatie} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={imagineMicroscop} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={aparat} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={eprubeteInAparat} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={microscop} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={eprubete} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={interiorAparat} />
                </View>
                <View style={styles.slide}>
                    <Image style={styles.image} source={microscopFull} />
                </View>
            </Swiper> */}

            <View style={styles.textView}>
            
                <Text style={styles.introText}>
                    ARNlab este un laborator medical din Arad care efectuează o gamă completă de analize medicale, 
                    cu o aparatură medicală performantă, având un personal medical specializat dedicat, 
                    interesat să ofere servicii de calitate clienților săi cu ajutorul aparaturii de ultima generație 
                    ce acoperă o gamă largă de investigații biochimice, hematologice, imunologice și microbiologice.
                </Text>
            </View>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 46.18668692462725, 
                    longitude: 21.31402752287927,
                    latitudeDelta: 0.025,
                    longitudeDelta: 0.025
                }}
            >
                <Marker 
                    coordinate={{
                        latitude: 46.18668692462725, 
                        longitude: 21.31402752287927,
                    }}
                    title="Locatie ARNlab"
                />
            </MapView>
            <TouchableOpacity style={styles.mapButton} onPress={mapDirections}>
                <Text style={styles.textMapButton}>Click aici pentru direcții</Text>
            </TouchableOpacity>
            
                
        </SafeAreaView>
    );
}

export default HomePage;
const styles = StyleSheet.create({
    text:{
        color: '#6b0f0f',
        fontWeight: 'bold',
        fontSize: 18
    },
    logoImageView:{
        flex: 1,
        alignSelf: "center",
        alignItems: 'center',
        height:150,
        flexDirection:"row"
    },
    logo:{
        width: 200, 
        height: 150, 
        marginLeft: 0,
        resizeMode: 'contain',
        alignSelf:"flex-start"
    },
    textView:{
        position:"absolute",
        top:235,
        marginLeft:15,
        marginRight:15
    },
    introText:{
        textAlign:"center",
        fontWeight:"400"
    },
    map:{
        position:"absolute",
        top: 375,
        alignSelf:"center",
        width:"80%",
        height:"40%"
    },
    mapButton:{
        position:"absolute",
        top: 700,
        alignSelf:"center",
    },
    textMapButton:{
        color: '#6b0f0f',
        fontSize:20
    },
    microscop:{
        position: "absolute",
        top:100,
        // marginLeft:15,
        // marginRight:25,
        height:125,
        width: "100%"
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // image: {
    //     width: '100%',
    //     height: '100%',
    // },
    // swiper:{
    //     position: "absolute",
    //     top: 0,
    //     height: 150,
    //     width: "100%",
    // }
});