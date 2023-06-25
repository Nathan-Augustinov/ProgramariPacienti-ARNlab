import {
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  View,
} from "react-native";

const TimeSlots = ({
  timeSlots,
  timeSlotSelected,
  bookedTimeSlots,
  onTimeSelected,
}) => {
  return (
    <ScrollView
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
      }}
    >
      {timeSlots.map((timeSlot, index) => {
        const isBooked = bookedTimeSlots.includes(timeSlot + ":00");
        const isSelected = timeSlotSelected === timeSlot + ":00";

        const timeSlotStyle = [
          styles.timeSlot,
          isBooked && styles.bookedTimeSlot,
          isSelected && styles.selectedTimeSlot,
        ];

        return (
          <TouchableOpacity
            key={index}
            style={timeSlotStyle}
            onPress={() => !isBooked && onTimeSelected(timeSlot)}
            disabled={isBooked}
          >
            <Text>{timeSlot}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    justifyContent: "space-around",
    marginBottom: 10,
  },
  timeSlot: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedTimeSlot: {
    backgroundColor: "#6b0f0f",
  },
  bookedTimeSlot: {
    backgroundColor: "grey",
  },
});

export default TimeSlots;
