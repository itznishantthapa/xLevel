import { StyleSheet, Text, View, Image, ScrollView, Pressable, Modal, StatusBar, TouchableOpacity } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useGuides } from '../../../queries/useGuide';
import { useThemeStore } from '../../../store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../../../components/common/AppIcon';
import { ImageNotFound01Icon, SmartPhone01Icon, ZoomInAreaIcon, Alert01Icon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../header/AppHeader';
import Loader from '../../../component/Loader';
import { spacing, iconSize } from '../../../theme/typography';

const Example = ({ route }) => {
  const navigation = useNavigation();
  const { isLight } = useThemeStore();
  const { data: guides = [], isLoading } = useGuides();
  const [previewImage, setPreviewImage] = useState(null);

  // Get parameters from navigation
  const game = route.params?.game;
  const guideType = route.params?.guideType || 'result';

  // Filter guides based on game_id, game_mode, and guide_type
  const filteredGuide = useMemo(() => {
    if (!game || !guides.length) return null;

    return guides.find(
      (guide) =>
        guide.game_id === game.id &&
        guide.game_mode === game.game_mode &&
        guide.guide_type === guideType
    );
  }, [guides, game, guideType]);

  // Background and text colors
  const bgColor = isLight ? '#ffffff' : '#000000';
  const textColor = isLight ? '#333333' : '#ffffff';
  const secondaryTextColor = isLight ? '#666666' : '#cccccc';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <Loader visible={true} message="Loading examples..." />
      </SafeAreaView>
    );
  }

  if (!filteredGuide) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <AppHeader backButton={true} title="Example" />

        <View style={styles.emptyContainer}>
          <AppIcon icon={ImageNotFound01Icon} size={64} color={secondaryTextColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No example available for this game mode yet.
          </Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            {game?.name} - {game?.game_mode}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <AppHeader backButton={true} title="Example" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Game Info Section */}
          <View style={styles.section}>
            <View style={styles.gameInfoContainer}>
              <AppIcon icon={SmartPhone01Icon} size={spacing.xl} color={textColor} />
              <View style={styles.gameInfoItem}>
                <Text
                  style={[
                    styles.value,
                    {
                      color: textColor,
                      borderBottomColor: textColor,
                      marginLeft: 5
                    }
                  ]}
                >
                  {filteredGuide.game_name}
                </Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text
                  style={[
                    styles.value,
                    {
                      color: textColor,
                      marginLeft: 5,
                      borderBottomColor: textColor
                    }
                  ]}
                >
                  {filteredGuide.game_mode}
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={[styles.instructionText, { color: secondaryTextColor }]}>
              Submit the screenshot same exactly shown in the below format.
            </Text>
          </View>

          {/* Example Screenshots */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Example Screenshot 1</Text>
            <Pressable
              style={[
                styles.exampleImageContainer,
                { 
                  backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
                  borderColor: isLight ? '#cccccc' : '#333333'
                }
              ]}
              onPress={() => setPreviewImage(filteredGuide.image1)}
            >
              <Image
                source={{ uri: filteredGuide.image1 }}
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <View style={styles.tapToEnlargeOverlay}>
                <AppIcon icon={ZoomInAreaIcon} size={iconSize.md} color="#ffffff" />
                <Text style={styles.tapToEnlargeText}>Tap to enlarge</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Example Screenshot 2</Text>
            <Pressable
              style={[
                styles.exampleImageContainer,
                { 
                  backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
                  borderColor: isLight ? '#cccccc' : '#333333'
                }
              ]}
              onPress={() => setPreviewImage(filteredGuide.image2)}
            >
              <Image
                source={{ uri: filteredGuide.image2 }}
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <View style={styles.tapToEnlargeOverlay}>
                <AppIcon icon={ZoomInAreaIcon} size={iconSize.md} color="#ffffff" />
                <Text style={styles.tapToEnlargeText}>Tap to enlarge</Text>
              </View>
            </Pressable>
          </View>

          {/* Warning */}
          <View style={[
            styles.warningContainer,
            { 
              backgroundColor: isLight ? '#f5f5f5' : '#1a1a1a',
              borderColor: isLight ? '#cccccc' : '#333333'
            }
          ]}>
            <AppIcon icon={Alert01Icon} size={iconSize.md} color={isLight ? '#333333' : '#ffffff'} style={styles.warningIcon} />
            <Text style={[styles.warningText, { color: isLight ? '#333333' : '#ffffff' }]}>
              Your screenshots should match this format. Submitting incorrect or fake screenshots may result in account suspension and a 25 point penalty.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <StatusBar
          translucent
          backgroundColor="rgba(0,0,0,0.9)"
          barStyle="light-content"
        />
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPressOut={() => setPreviewImage(null)}
        >
          <Image
            source={{ uri: previewImage }}
            style={styles.modalImage}
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default Example;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  gameInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    borderBottomWidth: 1,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleImageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  exampleImage: {
    width: '100%',
    aspectRatio: 1,
  },
  tapToEnlargeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tapToEnlargeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'left',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
});