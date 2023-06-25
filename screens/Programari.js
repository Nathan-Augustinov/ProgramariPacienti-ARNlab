import {
  View,
  Text,
  SafeAreaView,
  Image,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import tw from "twrnc";
import Toast from "react-native-toast-message"
import DatePicker from "react-native-calendars/src/calendar";
import { useEffect, useState } from "react";
import { auth, database } from "../firebase/config";
import { ref, push, onValue, remove, get, set} from "firebase/database";
import TimeSlots from "../components/TimeSlots";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const logoImage = require("../assets/logo.png");

const Programari = () => {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [requestedAppointments, setRequestedAppointments] = useState([]);
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
      onValue(ref(database, "appointmentRequests"), (querySnapshot) => {
        const data = querySnapshot.val();
        let requestedPatientsAppointments = data ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          })) : []; 
        setRequestedAppointments(requestedPatientsAppointments);
      });
    onValue(ref(database, "adminAppointments"), (querySnapshot) => {
      const data = querySnapshot.val();
      const adminAppointments = data ? Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      })) : [];
      setAdminAppointments(adminAppointments);
    });
  }, []);

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

  const handleAppointmentSubmit = async () => {
    const pushToken = await registerForPushNotificationsAsync();
    await set(ref(database, `users/${auth.currentUser.uid}/pushToken`), pushToken);

    push(ref(database, "appointmentRequests"), {
      user: auth.currentUser.uid,
      date: date.toISOString(),
      time: time.toISOString(),
      status: "pending",
    });

    const snapshot = await get(ref(database, 'admins'));
    if(snapshot.exists()){
      const admins = snapshot.val();
      const tokens = [];

      for (const adminId in admins) {
        const tokenSnapshot = await get(ref(database, `users/${adminId}/pushToken`));
        if (tokenSnapshot.exists()) {
          tokens.push(tokenSnapshot.val());
        }
      }

      for (const token of tokens) {
        const message = {
          to: token, 
          sound: "default",
          title: "Cerere de programare nouă",
          body: "O cerere de programare nouă a fost primită!",
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
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log('Error:', error));;
      }
    }

  };

  const handleRequestedAppointmentCancel = async (id) => {
    const pushToken = await registerForPushNotificationsAsync();
    await set(ref(database, `users/${auth.currentUser.uid}/pushToken`), pushToken);

    remove(
      ref(database, `appointmentRequests/${id}`)
    );
    const newRequestedAppointments = requestedAppointments.filter(appointment => appointment.id !== id);
    setRequestedAppointments(newRequestedAppointments);

    Toast.show({
      type: "success",
      position: "bottom",
      text1: "Programare anulată!",
      text2: "Programarea a fost anulată cu succes!",
      visibilityTime: 4000,
    });

    const snapshot = await get(ref(database, 'admins'));
    if(snapshot.exists()){
      const admins = snapshot.val();
      const tokens = [];

      for (const adminId in admins) {
        const tokenSnapshot = await get(ref(database, `users/${adminId}/pushToken`));
        if (tokenSnapshot.exists()) {
          tokens.push(tokenSnapshot.val());
        }
      }

      for (const token of tokens) {
        const message = {
          to: token, 
          sound: "default",
          title: "Programare/Cerere de programare anulată",
          body: "O programare sau cerere de programare a fost anulată!",
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
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log('Error:', error));;
      }
    }
  };

  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 8; hour < 11; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        timeSlots.push(time);
      }
    }
    return timeSlots;
  };

  const fetchBookedTimeSlots = (date) => {
    const bookedTimeSlots = [];
    requestedAppointments
      .filter(
        (appointment) =>
          appointment.date === date.toISOString() &&
          (appointment.status === "accepted" ||
            appointment.status === "pending")
      )
      .forEach((appointment) =>
        bookedTimeSlots.push(new Date(appointment.time).toLocaleTimeString())
      );

    adminAppointments
      .filter((appointment) => appointment.date === date.toISOString())
      .forEach((appointment) => 
        bookedTimeSlots.push(new Date(appointment.time).toLocaleTimeString()));

    return bookedTimeSlots;
  };

  const emptyForm = () => {
    setDate(null);
    setTime(null);
    setShowTimeSlots(false);
  }

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      renderLabel={({ route, focused, color }) => (
        <Text style={{ color, fontSize: 12, textTransform: "capitalize" }}>
          {route.title}
        </Text>
      )}
      indicatorStyle={{ backgroundColor: "white" }}
      style={{ backgroundColor: "#6b0f0f" }}
    />
  );

  const AppointmentForm = () => {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.form}>
            {date ?  <Text style={styles.label}>
              Date: {date.getFullYear()} - {date.getMonth() + 1} -{" "}
              {date.getDate()}
            </Text> : <Text style={styles.label}>
              Date: 
            </Text>}
            <DatePicker
              style={styles.input}
              date={date}
              mode="date"
              minDate={today}
              onDayPress={(day) => {
                const newDate = new Date(day.dateString);
                if (newDate.getDay() == 6 || newDate.getDay() == 0) {
                  setModalText("În weekend nu se fac programări!");
                  setModal(true);
                } else {
                  setDate(newDate);
                  const bookedSlots = fetchBookedTimeSlots(newDate);
                  setBookedTimeSlots(bookedSlots);
                  setShowTimeSlots(true);
                }
              }}
            />

            {showTimeSlots && (
              <View>
                <Text style={styles.label}>Time:</Text>
                <TimeSlots
                  timeSlots={generateTimeSlots()}
                  timeSlotSelected={time && time.toLocaleTimeString()}
                  bookedTimeSlots={bookedTimeSlots}
                  onTimeSelected={(selectedTime) => {
                    const timeParts = selectedTime.split(":");
                    const newTime = new Date(date.toDateString());
                    newTime.setHours(parseInt(timeParts[0], 10));
                    newTime.setMinutes(parseInt(timeParts[1], 10));
                    newTime.setSeconds(0);
                    newTime.setMilliseconds(0);
                    setTime(newTime);
                  }}
                />
              </View>
            )}
            <TouchableOpacity onPress={() => {
              if(date && time){
                handleAppointmentSubmit();
                Toast.show({
                  type: 'success',
                  position: 'bottom',
                  text1: 'Programare creată',
                  text2: 'Vă rugăm să așteptați după acceptul laboratorului!', 
                  visibilityTime: 4000
                });
                emptyForm();
              }
              else{
                setModalText("Alegeți ziua și intervalul orar pentru programare!");
                setModal(true);
              }
            }}>
              <Text style={styles.buttonText}>Programează-te</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const AcceptedAppointments = () => {
    const now = new Date();
    const userAcceptedAppointments = requestedAppointments.filter(
      (appointment) =>
        appointment.user === auth.currentUser.uid &&
        appointment.status === "accepted" && 
        new Date(appointment.date) > now
    );

    return (
      <View style={styles.appointments}>
        <>
          {userAcceptedAppointments.length > 0 ? (
          <FlatList
            data={userAcceptedAppointments}
            renderItem={({ item, index }) => (
              <View style={styles.appointment}>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleDateString()} -{" "}
                  {new Date(item.time).getHours().toString().padStart(2,'0')}:{new Date(item.time).getMinutes().toString().padStart(2,'0')}                
                </Text>
                <TouchableOpacity
                  onPress={() => handleRequestedAppointmentCancel(item.id)}
                >
                  <Text style={styles.buttonText}>Anulează</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />) : (<Text style={styles.noDataText}>Nicio programare acceptată</Text>)}
        </>
        
      </View>
    );
  };

  const PendingAppointments = () => {
    const now = new Date();
    const userPendingAppointments = requestedAppointments.filter(
      (requestedAppointment) =>
        requestedAppointment.user === auth.currentUser.uid &&
        requestedAppointment.status === "pending" && 
        new Date(requestedAppointment.date) > now
    );

    return (
      <View style={styles.appointments}>
        <>
        {userPendingAppointments.length > 0 ? (
          <FlatList
            data={userPendingAppointments}
            renderItem={({ item, index }) => (
              <View style={styles.appointment}>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleDateString()} -{" "}
                  {new Date(item.time).getHours().toString().padStart(2,'0')}:{new Date(item.time).getMinutes().toString().padStart(2,'0')}               
                </Text>
                <TouchableOpacity
                  onPress={() => handleRequestedAppointmentCancel(item.id)}
                >
                  <Text style={styles.buttonText}>Anulează</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />) : (<Text style={styles.noDataText}>Nicio programare în așteptare</Text>)}
        </>
        
      </View>
    );
  };

  const RejectedAppointments = () => {
    const userRejectedAppointments = requestedAppointments.filter(
      (requestedAppointment) =>
        requestedAppointment.user === auth.currentUser.uid &&
        requestedAppointment.status === "denied"
    );

    return (
      <View style={styles.appointments}>
        <View style={{ flex: 1 }}>
          <>
            {userRejectedAppointments.length > 0 ? (
              <FlatList
                data={userRejectedAppointments}
                renderItem={({ item, index }) => (
                  <View style={styles.appointment}>
                    <Text style={styles.date}>
                      {new Date(item.date).toLocaleDateString()} -{" "}
                      {new Date(item.time).getHours().toString().padStart(2,'0')}:{new Date(item.time).getMinutes().toString().padStart(2,'0')}
                    </Text>
                  </View>
                )}
                listKey={(item) => item.id}
                keyExtractor={(item) => item.id}
              />) : (<Text style={styles.noDataText}>Nicio programare refuzată</Text>)}
          </>
          
        </View>
      </View>
    );
  };

  const routes = [
    { key: "appointmentForm", title: "Programare" },
    { key: "acceptedAppointments", title: "Programări acceptate" },
    { key: "pendingAppointments", title: "Programări în așteptare" },
    { key: "rejectedAppointments", title: "Programări refuzate" },
  ];

  return (
    <SafeAreaView
      style={[
        tw`bg-white h-full`,
        { flex: 1, minHeight: Math.round(useWindowDimensions().height) },
      ]}
    >
      <View style={[tw`p-5`, styles.logoImageView]}>
        <Image style={styles.logo} source={logoImage} />
      </View>
      
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={SceneMap({
          appointmentForm: AppointmentForm,
          acceptedAppointments: AcceptedAppointments,
          pendingAppointments: PendingAppointments,
          rejectedAppointments: RejectedAppointments,
        })}
        onIndexChange={setTabIndex}
        initialLayout={{
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
        }}
        renderTabBar={renderTabBar}
      />
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
  );
};

export default Programari;

const styles = StyleSheet.create({
  text: {
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 18,
  },
  logoImageView: {
    alignItems: "center",
    height: 100,
  },
  logo: {
    width: 200,
    height: 150,
    marginLeft: 25,
    resizeMode: "contain",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
  },
  form: {
    alignSelf: "stretch",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: "center",
  },
  input: {
    borderWidth: 2,
    borderColor: "#6b0f0f",
    padding: 5,
    marginBottom: 10,
    borderRadius: 4,
    margin: 3,
  },
  appointments: {
    alignSelf: "stretch",
    marginTop: 15,
    minHeight: 100,
  },
  header: {
    fontSize: 20,
    marginLeft: 10,
    marginBottom: 8,
  },
  appointment: {
    borderWidth: 1,
    borderColor: "#6b0f0f",
    borderRadius: 4,
    padding: 8,
    margin: 5,
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    alignSelf: "center",
  },
  timeInput: {
    alignSelf: "center",
  },
  buttonText: {
    alignSelf: "center",
    fontSize: 20,
    color: "#6b0f0f",
    marginBottom: 20,
    marginTop: 10,
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
  noDataText:{
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 20,
    alignSelf:"center"
  }
});
