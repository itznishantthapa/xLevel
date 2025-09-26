import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useThemeStore } from '../../../store/themeStore'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const AppHeader = ({ backButton = false, title }) => {
    const { isLight } = useThemeStore()
    const navigation = useNavigation()

    return (

        <View style={styles.header}>
            <View style={{ flexDirection: 'row' }}>
                {
                    backButton && (
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={isLight ? "#000" : "#fff"} />
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
        paddingTop: 10,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    headingContainer: {

    },
    backButton: {
        marginRight: 16,
        paddingVertical: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headingUnderline: {
        width: 80,
        height: 2,
        borderRadius: 1,
    },
})