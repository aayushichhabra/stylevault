import { View, StyleSheet } from "react-native";
import { Avatar } from "../../components/Avatar";

export const AvatarScreen = () => {
  return (
    <View style={styles.container}>
      <Avatar
        shoulders={0.6}
        chest={0.4}
        waist={0.2}
        hips={0.3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
});