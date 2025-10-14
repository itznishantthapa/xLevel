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
import { useBanners } from '../../queries/useBanners';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45;
const CARD_HEIGHT = 300;



const GameCarousel = ({ games, handleGameCardPress }) => {
      const { data: banners = [] } = useBanners()

      const shouldShowLabel = banners.length === 0 || !banners.some(banner => banner?.url && banner.url.trim() !== '');
    const { isLight } = useThemeStore();
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title,isLight? {color:'#000000'}:{color:'#EAEAEA'}]}>Create Match</Text>
            </View>

            {/* Games Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 15}
                snapToAlignment="start"
            >
                {games?.map((game, index) => (
                    <Pressable
                        key={game.game_id}
                        style={[
                            styles.gameCard,
                            { marginLeft: index === 0 ? 20 : 0 },
                            isLight ? {borderColor: '#000000'} : {borderColor: '#EAEAEA'}
                        ]}
                        onPress={() => handleGameCardPress(game)}
                        activeOpacity={0.9}
                    >
                        <Image 
                            source={{uri: game.game_logo_url}} 
                            style={{width:100, height:100}}
                        />
                        <Text style={[
                            styles.gameName,
                            isLight ? {color: '#333333'} : {color: '#EAEAEA'}
                        ]}>
                            {!shouldShowLabel ? game.game_name : (
                                <View style={{width: 50, height: 2, backgroundColor:isLight ? '#000000' : '#EAEAEA',alignItems:"center",justifyContent:'center',borderRadius:10}}></View>
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
        marginVertical: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },

        title: {
            fontSize: 16,
            fontWeight: 'bold',
    
          },

    viewAll: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00ff88',
    },
    scrollContainer: {
        paddingRight: 20,
    },
    gameCard: {
        width: 100,
        height: 130,
        marginRight: 15,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        alignItems: 'center',
    },
    gameName: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    gameImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    imageStyle: {
        borderRadius: 20,
    },
    pin:{
        position:'absolute',
        right:10,
        top:10
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    gameInfo: {
        flex: 1,
        padding: 15,
        justifyContent: 'space-between',
    },
    topInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    playersBadge: {
        backgroundColor: 'rgba(0, 255, 136, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    playersText: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '600',
    },
    bottomInfo: {
        alignItems: 'flex-start',
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    playButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    playButtonText: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default GameCarousel;