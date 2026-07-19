import { View, Text, StyleSheet, Pressable, TextInput, Animated } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { AppIcon } from '../../../components/common/AppIcon'
import {
  IdentificationIcon,
  ArrowDataTransferDiagonalIcon,
} from '@hugeicons/core-free-icons'
import { fontSize, spacing, iconSize, radius } from '../../../theme/typography'

export const STORE_PROFILE_AGREEMENT_TEXT = 'Yes, the game name and UID are correct.'

const StoreProfileSection = ({
  isLight,
  profileType,
  setProfileType,
  ownFields = [],
  otherFields = [],
}) => {
  const profileToggleAnim = useRef(new Animated.Value(profileType === 'own' ? 0 : 1)).current
  const profileContentAnim = useRef(new Animated.Value(1)).current
  const [toggleTrackWidth, setToggleTrackWidth] = useState(0)

  useEffect(() => {
    Animated.spring(profileToggleAnim, {
      toValue: profileType === 'own' ? 0 : 1,
      useNativeDriver: true,
      tension: 140,
      friction: 16,
    }).start()
  }, [profileType, profileToggleAnim])

  useEffect(() => {
    profileContentAnim.setValue(0)
    Animated.timing(profileContentAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [profileType, profileContentAnim])

  const cardSurface = isLight ? '#f5f5f5' : '#141414'
  const cardBorder = isLight ? '#e0e0e0' : '#2a2a2a'
  const toggleInset = spacing.xs
  const toggleGap = spacing.xs
  const toggleSlotWidth = toggleTrackWidth > 0
    ? (toggleTrackWidth - toggleInset * 2 - toggleGap) / 2
    : 0

  return (
    <View style={[styles.profilePanel, { backgroundColor: cardSurface }]}>
      <View
        style={styles.profileSegmentTrack}
        onLayout={(event) => setToggleTrackWidth(event.nativeEvent.layout.width)}
      >
        {toggleSlotWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.profileSegmentIndicator,
              {
                width: toggleSlotWidth,
                left: toggleInset,
                backgroundColor: isLight ? '#000000' : '#ffffff',
                transform: [{
                  translateX: profileToggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, toggleSlotWidth + toggleGap],
                  }),
                }],
              },
            ]}
          />
        ) : null}

        <Pressable
          style={styles.profileSegmentOption}
          onPress={() => setProfileType('own')}
        >
          <AppIcon
            icon={IdentificationIcon}
            size={iconSize.md}
            color={profileType === 'own'
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#666666' : '#999999')}
          />
          <Text
            style={[
              styles.profileToggleText,
              {
                color: profileType === 'own'
                  ? (isLight ? '#ffffff' : '#000000')
                  : (isLight ? '#333333' : '#ffffff'),
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            My Profile
          </Text>
        </Pressable>

        <Pressable
          style={styles.profileSegmentOption}
          onPress={() => setProfileType('other')}
        >
          <AppIcon
            icon={ArrowDataTransferDiagonalIcon}
            size={iconSize.md}
            color={profileType === 'other'
              ? (isLight ? '#ffffff' : '#000000')
              : (isLight ? '#666666' : '#999999')}
          />
          <Text
            style={[
              styles.profileToggleText,
              {
                color: profileType === 'other'
                  ? (isLight ? '#ffffff' : '#000000')
                  : (isLight ? '#333333' : '#ffffff'),
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Another Profile
          </Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.profileInfoAttached,
          {
            borderTopColor: cardBorder,
            opacity: profileContentAnim,
            transform: [{
              translateY: profileContentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            }],
          },
        ]}
      >
        {profileType === 'own' ? (
          ownFields.map((field, index) => (
            <View key={field.label}>
              {index > 0 ? (
                <View style={[styles.profileInfoDivider, { backgroundColor: cardBorder }]} />
              ) : null}
              <View style={styles.profileInfoRow}>
                <Text style={[styles.profileInfoLabel, { color: isLight ? '#666666' : '#999999' }]}>
                  {field.label}
                </Text>
                <Text
                  style={[styles.profileInfoValue, { color: isLight ? '#000000' : '#ffffff' }]}
                  numberOfLines={1}
                >
                  {field.value || 'Not Set'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          otherFields.map((field) => (
            <View
              key={field.placeholder}
              style={[styles.profileInputRow, {
                borderColor: cardBorder,
                backgroundColor: isLight ? '#ffffff' : '#1a1a1a',
              }]}
            >
              <TextInput
                style={[styles.profileTextInput, { color: isLight ? '#000000' : '#ffffff' }]}
                placeholder={field.placeholder}
                placeholderTextColor={isLight ? '#999999' : '#666666'}
                value={field.value}
                onChangeText={field.onChangeText}
                keyboardType={field.keyboardType || 'default'}
                autoCapitalize={field.autoCapitalize || 'none'}
              />
            </View>
          ))
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  profilePanel: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  profileSegmentTrack: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  profileSegmentIndicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.md,
  },
  profileSegmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.md,
    zIndex: 1,
  },
  profileToggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    width: '100%',
  },
  profileInfoAttached: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  profileInfoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  profileInfoValue: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '600',
    textAlign: 'right',
  },
  profileInfoDivider: {
    height: 1,
    width: '100%',
  },
  profileInputRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  profileTextInput: {
    fontSize: fontSize.base,
    fontWeight: '500',
    padding: 0,
  },
})

export default StoreProfileSection
