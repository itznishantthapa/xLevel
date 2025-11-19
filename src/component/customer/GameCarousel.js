import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ImageBackground,
    Dimensions,
    Image,
} from 'react-native';
import { Entypo } from "@expo/vector-icons"
import { useThemeStore } from '../../store/themeStore';
import { useUtils } from '../../queries/useUtils';
import { scaleWidth, scaleHeight } from '../../utils/scaling';

const { width } = Dimensions.get('window');
const CARD_WIDTH = scaleWidth(100);
const CARD_HEIGHT = scaleHeight(130);



const GameCarousel = ({ games, handleGameCardPress }) => {
    const { data: utils = [] } = useUtils()

    const shouldShowLabel = utils?.qr;
    const { isLight } = useThemeStore();
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, isLight ? { color: '#000000' } : { color: '#EAEAEA' }]}>Create Match</Text>
            </View>

            {/* Games Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + scaleWidth(15)}
                snapToAlignment="start"
            >
                {games?.map((game, index) => (
                    <Pressable
                        key={game.game_id}
                        style={[
                            styles.gameCard,
                            { marginLeft: index === 0 ? scaleWidth(20) : 0 },
                            isLight ? { borderColor: '#1A1A1A' } : { borderColor: '#EAEAEA' }
                        ]}
                        onPress={() => handleGameCardPress(game)}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: game.game_logo_url }}
                            style={{ width: scaleWidth(100), height: scaleHeight(100) }}
                        />
                        <Text style={[
                            styles.gameName,
                            isLight ? { color: '#333333' } : { color: '#EAEAEA' }
                        ]}>
                            {shouldShowLabel ?
                                game.game_name :
                                (
                                    <View style={{ width: scaleWidth(50), height: scaleHeight(2), backgroundColor: isLight ? '#000000' : '#EAEAEA', alignItems: "center", justifyContent: 'center', borderRadius: scaleWidth(10) }}></View>
                                )}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: scaleHeight(20),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scaleWidth(20),
        marginBottom: scaleHeight(15),
    },

    title: {
        fontSize: scaleWidth(16),
        fontWeight: 'bold',

    },

    viewAll: {
        fontSize: scaleWidth(16),
        fontWeight: '600',
        color: '#00ff88',
    },
    scrollContainer: {
        paddingRight: scaleWidth(20),
    },
    gameCard: {
        width: scaleWidth(100),
        height: scaleHeight(130),
        marginRight: scaleWidth(15),
        borderRadius: scaleWidth(25),
        overflow: 'hidden',
        borderWidth: 1.5,
        alignItems: 'center',
    },
    gameName: {
        fontSize: scaleWidth(12),
        fontWeight: '600',
        marginTop: scaleHeight(4),
        textAlign: 'center',
    },
    gameImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    imageStyle: {
        borderRadius: scaleWidth(20),
    },
    pin: {
        position: 'absolute',
        right: scaleWidth(10),
        top: scaleHeight(10)
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    gameInfo: {
        flex: 1,
        padding: scaleWidth(15),
        justifyContent: 'space-between',
    },
    topInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: scaleWidth(8),
        paddingVertical: scaleHeight(4),
        borderRadius: scaleWidth(12),
        backdropFilter: 'blur(10px)',
    },
    categoryText: {
        color: '#fff',
        fontSize: scaleWidth(10),
        fontWeight: '600',
    },
    playersBadge: {
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        paddingHorizontal: scaleWidth(8),
        paddingVertical: scaleHeight(4),
        borderRadius: scaleWidth(12),
    },
    playersText: {
        color: '#00ff88',
        fontSize: scaleWidth(10),
        fontWeight: '600',
    },
    bottomInfo: {
        alignItems: 'flex-start',
    },
    gameTitle: {
        fontSize: scaleWidth(18),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: scaleHeight(10),
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    playButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: scaleWidth(20),
        paddingVertical: scaleHeight(8),
        borderRadius: scaleWidth(20),
        alignSelf: 'flex-start',
    },
    playButtonText: {
        color: '#333',
        fontSize: scaleWidth(12),
        fontWeight: 'bold',
    },
});

export default GameCarousel;