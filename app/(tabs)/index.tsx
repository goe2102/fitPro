import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { logoutUser } from '../../methods/auth/auth';

export default function HomeScreen() {
  const { colors, spacing } = useAppTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        paddingTop: spacing.GLOBAL_MARGIN_TOP,
        paddingHorizontal: spacing.PADDING_HORIZONTAL
      }
    ]}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        FitPro Home
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});