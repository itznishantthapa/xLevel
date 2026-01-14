import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Linking,
    Platform,
    StatusBar,
} from 'react-native';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.blackonedevs.levelesportmatchmaking';
const APP_STORE_URL = 'https://apps.apple.com/app/id123456789'; // Replace with actual App Store ID

const UpdateScreen = () => {
    const handleUpdate = () => {
        const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
        Linking.openURL(storeUrl).catch(() => { });
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.card}>
                <Text style={styles.title}>New Update Available</Text>
                <Text style={styles.description}>
                    A new version of the app is available.{'\n'}Please update to continue.
                </Text>
                <Pressable
                    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                    onPress={handleUpdate}
                >
                    <Text style={styles.buttonText}>UPDATE</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 0,
        padding: 24,

        // iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,

        // Android
        elevation: 24,
    },

    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: '#666666',
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        alignSelf: 'flex-end',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    buttonPressed: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00bf63',
        letterSpacing: 0.5,
    },
});

export default UpdateScreen;
