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
  TextInput,
} from "react-native";
import tw from "twrnc";
import Toast from "react-native-toast-message";
import DatePicker from "react-native-calendars/src/calendar";
import React, { useEffect, useState } from "react";
import { auth, database } from "../firebase/config";
import {
  ref,
  push,
  onValue,
  remove,
  get,
  child,
  update,
  set,
} from "firebase/database";
import { signOut } from "firebase/auth";
import TimeSlots from "../components/TimeSlots";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const logoImage = require("../assets/logo.png");

const AdminProgramari = () => {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [requestedAppointments, setRequestedAppointments] = useState([]);
  const [
    requestedAppointmentsWithUserName,
    setRequestedAppointmentsWithUserName,
  ] = useState([]);
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [userDetails, setUserDetails] = useState("");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    onValue(ref(database, "appointmentRequests"), (querySnapshot) => {
      const data = querySnapshot.val();
      const requestedAppointments = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setRequestedAppointments(requestedAppointments);

      const fetchUserDetails = async () => {
        const promises = requestedAppointments.map(async (item) => {
          return {
            ...item,
            userName: await getUserFirstAndLastName(item.user),
          };
        });
        const results = await Promise.all(promises);
        setRequestedAppointmentsWithUserName(results);
      };
      fetchUserDetails();
    });

    onValue(ref(database, "adminAppointments"), (querySnapshot) => {
      const data = querySnapshot.val();
      const adminAppointments = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setAdminAppointments(adminAppointments);
    });
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Nu a putut fi obținut tokenul pentru notificări!");
        return;
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          experienceId: "@ProgramariPacienti-ARNlab/ProgramariPacienti-ARNlab",
          projectId: "4acaa94c-420b-42f8-b7c9-0efe2d8db366",
        })
      ).data;
    } else {
      alert("Pentru a primi notificări trebuie să folosiți un dispozitiv real!");
    }

    return token;
  }

  const handleAppointmentSubmit = async (patientFirstName, patientLastName) => {
    const pushToken = await registerForPushNotificationsAsync();
    await set(
      ref(database, `users/${auth.currentUser.uid}/pushToken`),
      pushToken
    );

    if (patientFirstName && patientLastName) {
      push(ref(database, "adminAppointments"), {
        user: patientFirstName + " " + patientLastName,
        date: date.toISOString(),
        time: time.toISOString(),
      });
    } else {
      setModalText("Adaugati numele și prenumele pacientului!");
      setModal(true);
    }
  };

  const handleAppointmentCancel = (index) => {
    const newAppointments = [...appointments];
    newAppointments.splice(index, 1);
    setAppointments(newAppointments);
  };

  const handleRequestedAppointmentCancel = (index) => {
    remove(
      ref(database, `appointmentRequests/${requestedAppointments[index].id}`)
    );
    const newRequestedAppointments = [...requestedAppointments];
    newRequestedAppointments.splice(index, 1);
    setRequestedAppointments(newRequestedAppointments);
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
        bookedTimeSlots.push(new Date(appointment.time).toLocaleTimeString())
      );

    return bookedTimeSlots;
  };

  const navigation = useNavigation();

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

  const handleAccept = async (appointment, userId) => {
    const pushToken = await registerForPushNotificationsAsync();
    await set(
      ref(database, `users/${auth.currentUser.uid}/pushToken`),
      pushToken
    );

    update(ref(database, `appointmentRequests/${appointment.id}`), {
      status: "accepted",
    });

    Toast.show({
      type: "success",
      position: "bottom",
      text1: "Cerere de programare acceptată!",
      text2: "Cererea de programare a fost acceptată cu succes!",
      visibilityTime: 4000,
    });

    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();

      const token =
        users[userId] && users[userId].pushToken
          ? users[userId].pushToken
          : null;

      console.log(token);
      const message = {
        to: token,
        sound: "default",
        title: "Programare acceptată",
        body: "Cererea d-voastră de programare a fost acceptată!",
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
  };

  const handleDeny = async (appointment, userId) => {
    const pushToken = await registerForPushNotificationsAsync();
    await set(
      ref(database, `users/${auth.currentUser.uid}/pushToken`),
      pushToken
    );

    update(ref(database, `appointmentRequests/${appointment.id}`), {
      status: "denied",
    });

    Toast.show({
      type: "success",
      position: "bottom",
      text1: "Cerere de programare refuzată!",
      text2: "Cererea de programare a fost refuzată cu succes!",
      visibilityTime: 4000,
    });

    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const users = snapshot.val();

      const token =
        users[userId] && users[userId].pushToken
          ? users[userId].pushToken
          : null;

      const message = {
        to: token,
        sound: "default",
        title: "Programare refuzată",
        body: "Cererea d-voastră de programare a fost refuzată!",
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
  };

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

  const emptyForm = () => {
    setPatientFirstName("");
    setPatientLastName("");
    setDate(new Date());
    setTime(new Date());
    setShowTimeSlots(false);
  };

  const AppointmentForm = ({
    patientFirstName,
    setPatientFirstName,
    patientLastName,
    setPatientLastName,
  }) => {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.form}>
            <TextInput
              style={{
                height: 40,
                borderColor: "#6b0f0f",
                borderWidth: 2,
                marginBottom: 10,
                paddingLeft: 5,
              }}
              onChangeText={setPatientFirstName}
              value={patientFirstName}
              placeholder="Prenume pacient"
            />
            <TextInput
              style={{
                height: 40,
                borderColor: "#6b0f0f",
                borderWidth: 2,
                marginBottom: 10,
                paddingLeft: 5,
              }}
              onChangeText={setPatientLastName}
              value={patientLastName}
              placeholder="Nume pacient"
            />
            {/* <Text style={styles.label}>
              Date: {date.getFullYear()} - {date.getMonth() + 1} -{" "}
              {date.getDate()}
            </Text> */}
            {date ? (
              <Text style={styles.label}>
                Date: {date.getFullYear()} - {date.getMonth() + 1} -{" "}
                {date.getDate()}
              </Text>
            ) : (
              <Text style={styles.label}>Date:</Text>
            )}
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
            <TouchableOpacity
              onPress={() => {
                if (date && time && patientFirstName && patientLastName) {
                  handleAppointmentSubmit(patientFirstName, patientLastName);
                  Toast.show({
                    type: "success",
                    position: "bottom",
                    text1: "Programare creată",
                    text2: "Pacientul a fost programat cu succes!",
                    visibilityTime: 4000,
                  });
                  emptyForm();
                } else {
                  setModalText(
                    "Completați câmpurile formularului, alegeți ziua și intervalul orar pentru programare"
                  );
                  setModal(true);
                }
              }}
            >
              <Text style={styles.buttonText}>Programează</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const AcceptedAppointments = () => {
    const now = new Date();
    const acceptedFilteredAppointments =
      requestedAppointmentsWithUserName.filter(
        (requestedAppointment) =>
          requestedAppointment.status === "accepted" &&
          new Date(requestedAppointment.date) > now
      );

    const adminFilteredAppointments = adminAppointments.filter(
      (appointment) => new Date(appointment.date) > now
    );

    return (
      <View style={styles.appointments}>
        <Text style={styles.text}>Utilizatori programati personal</Text>
        <View style={{ flex: 1 }}>
          <>
            {acceptedFilteredAppointments.length > 0 ? (
              <FlatList
                data={acceptedFilteredAppointments}
                renderItem={({ item, index }) => {
                  return (
                    <View style={styles.appointment}>
                      <Text style={styles.date}>
                        {new Date(item.date).toLocaleDateString()} -{" "}
                        {new Date(item.time)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        :
                        {new Date(item.time)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}{" "}
                        - {new String(item.userName)}
                      </Text>
                      {/* <TouchableOpacity
                    onPress={() => handleRequestedAppointmentCancel(index)}
                  >
                    <Text style={styles.buttonText}>Anulează</Text>
                  </TouchableOpacity> */}
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <Text style={styles.noDataText}>
                Nicio programare a pacienților acceptată
              </Text>
            )}
          </>
        </View>
        <Text style={styles.text}>Utilizatori programati de administrator</Text>
        <View style={{ flex: 1, marginBottom: 15 }}>
          <>
            {adminFilteredAppointments.length > 0 ? (
              <FlatList
                data={adminFilteredAppointments}
                renderItem={({ item, index }) => {
                  return (
                    <View style={styles.appointment}>
                      <Text style={styles.date}>
                        {new Date(item.date).toLocaleDateString()} -{" "}
                        {new Date(item.time)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        :
                        {new Date(item.time)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}{" "}
                        - {new String(item.user)}
                      </Text>
                      {/* <TouchableOpacity
                  onPress={() => handleRequestedAppointmentCancel(index)}
                >
                  <Text style={styles.buttonText}>Anulează</Text>
                </TouchableOpacity> */}
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <Text style={styles.noDataText}>
                Nicio programare făcută de administrator
              </Text>
            )}
          </>
        </View>
      </View>
    );
  };

  const PendingAppointments = () => {
    const now = new Date();
    const pendingFilteredAppointments =
      requestedAppointmentsWithUserName.filter(
        (requestedAppointment) =>
          requestedAppointment.status === "pending" &&
          new Date(requestedAppointment.date) > now
      );

    return (
      <View style={styles.appointments}>
        <>
          {pendingFilteredAppointments.length > 0 ? (
            <FlatList
              data={pendingFilteredAppointments}
              renderItem={({ item, index }) => {
                // getUserFirstAndLastName(item.user)
                //   .then((result) => setUserDetails(result))
                //   .catch((error) => console.log(error));
                return (
                  <View style={styles.appointment}>
                    <Text style={styles.date}>
                      {new Date(item.date).toLocaleDateString()} -{" "}
                      {new Date(item.time)
                        .getHours()
                        .toString()
                        .padStart(2, "0")}
                      :
                      {new Date(item.time)
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}{" "}
                      - {new String(item.userName)}
                    </Text>
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity
                        onPress={() => handleAccept(item, item.user)}
                      >
                        <Text style={[styles.buttonText, { color: "#03461D" }]}>
                          Accept
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeny(item, item.user)}
                      >
                        <Text style={[styles.buttonText, { color: "#6b0f0f" }]}>
                          Refuz
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <Text style={styles.noDataText}>Nicio programare în așteptare</Text>
          )}
        </>
      </View>
    );
  };

  const RejectedAppointments = () => {
    const rejectedFilteredAppointments =
      requestedAppointmentsWithUserName.filter(
        (requestedAppointment) => requestedAppointment.status === "denied"
      );

    return (
      <View style={styles.appointments}>
        <View style={{ flex: 1 }}>
          <>
            {rejectedFilteredAppointments.length > 0 ? (
              <FlatList
                data={rejectedFilteredAppointments}
                renderItem={({ item, index }) => {
                  return (
                    <View style={styles.appointment}>
                      <Text style={styles.date}>
                        {new Date(item.date).toLocaleDateString()} -{" "}
                        {new Date(item.time)
                          .getHours()
                          .toString()
                          .padStart(2, "0")}
                        :
                        {new Date(item.time)
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}{" "}
                        - {new String(item.userName)}
                      </Text>
                    </View>
                  );
                }}
                listKey={(item) => item.id}
                keyExtractor={(item) => item.id}
              />
            ) : (
              <Text style={styles.noDataText}>Nicio programare refuzată</Text>
            )}
          </>
        </View>
      </View>
    );
  };

  const routes = [
    { key: "appointmentForm", title: "Programare pacient" },
    { key: "pendingAppointments", title: "Programări în așteptare" },
    { key: "acceptedAppointments", title: "Programări acceptate" },
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
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={({ route }) => {
          switch (route.key) {
            case "appointmentForm":
              return AppointmentForm({
                patientFirstName: patientFirstName,
                setPatientFirstName: setPatientFirstName,
                patientLastName: patientLastName,
                setPatientLastName: setPatientLastName,
              });
            case "pendingAppointments":
              return <PendingAppointments />;
            case "acceptedAppointments":
              return <AcceptedAppointments />;
            case "rejectedAppointments":
              return <RejectedAppointments />;
            default:
              return null;
          }
        }}
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

export default AdminProgramari;

const styles = StyleSheet.create({
  text: {
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 5,
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
    flex: 1,
    alignSelf: "stretch",
    marginTop: 15,
    minHeight: 100,
  },
  header: {
    fontSize: 20,
    marginLeft: 10,
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginRight: 30,
    marginLeft: 30,
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
  noDataText: {
    color: "#6b0f0f",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 20,
    alignSelf: "center",
  },
});
