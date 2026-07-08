import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useThemeStore } from '../../../store/themeStore'
import { useNavigation } from '@react-navigation/native'
import { AppIcon } from '../../../components/common/AppIcon'
import { ChevronLeftIcon } from '@hugeicons/core-free-icons'
import { fontSize, iconSize, spacing } from '../../../theme/typography'

const AppHeader = ({ backButton = false, title }) => {
    const { isLight } = useThemeStore()
    const navigation = useNavigation()

    return (

        <View style={styles.header}>
            <View style={{ flexDirection: 'row' }}>
                {
                    backButton && (
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <AppIcon
                                icon={ChevronLeftIcon}
                                size={iconSize.lg}
                                color={isLight ? "#000" : "#fff"}
                            />
                        </Pressable>
                    )
                }
                <Text style={[styles.headerTitle, { color: isLight ? "#000" : "#fff" }]}>
                    {title}
                </Text>

            </View>

            <View style={[styles.headingUnderline, { backgroundColor: isLight ? "#000000" : "#ffffff" }]} />
        </View>
    )
}

export default AppHeader

const styles = StyleSheet.create({
    header: {
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    headingContainer: {

    },
    backButton: {
        marginRight: spacing.lg,
        paddingVertical: spacing.xs,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: '600',
    },
    headingUnderline: {
        width: 80,
        height: 2,
        borderRadius: 1,
    },
})
