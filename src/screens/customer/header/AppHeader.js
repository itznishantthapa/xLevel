import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useThemeStore } from '../../../store/themeStore'
import { useNavigation } from '@react-navigation/native'
import { AppIcon } from '../../../components/common/AppIcon'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { fontSize, iconSize, spacing } from '../../../theme/typography'

const BACK_BUTTON_SIZE = 32
const HEADER_ROW_HEIGHT = 32

const AppHeader = ({ backButton = false, title, rightAction }) => {
  const { isLight } = useThemeStore()
  const navigation = useNavigation()
  const textColor = isLight ? '#000' : '#fff'

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.sideSlot}>
          {backButton ? (
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <AppIcon icon={ArrowLeft01Icon} size={iconSize.lg} color={textColor} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.titleSlot}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={[styles.sideSlot, styles.rightSideSlot]}>
          {rightAction ?? null}
        </View>
      </View>

      <View style={[styles.headingUnderline, { backgroundColor: textColor }]} />
    </View>
  )
}

export default AppHeader

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxs,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: HEADER_ROW_HEIGHT,
  },
  sideSlot: {
    width: BACK_BUTTON_SIZE,
    height: HEADER_ROW_HEIGHT,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSideSlot: {
    alignItems: 'flex-end',
  },
  titleSlot: {
    flex: 1,
    height: HEADER_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xxs,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  headingUnderline: {
    width: 56,
    height: 1.5,
    borderRadius: 1,
    marginTop: spacing.xxs,
  },
})
