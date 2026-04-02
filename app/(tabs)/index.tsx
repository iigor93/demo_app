import { Image } from 'expo-image';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const BANNER_URL = process.env.EXPO_PUBLIC_BANNER_URL ?? '';
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Screen1() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: BANNER_URL }}
        style={styles.banner}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text style={styles.text}>Привет, это экран 1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    height: SCREEN_HEIGHT / 3,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
});
