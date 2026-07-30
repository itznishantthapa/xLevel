import { Pressable, Text, View } from 'react-native'
import { AppIcon } from '../../components/common/AppIcon'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { fontSize, iconSize, spacing } from '../../theme/typography'
import { sharedStyles } from './sharedStyleAndInfo'

const getLabelBadgeStyle = (isLight) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 6,
  backgroundColor: isLight ? '#e9ecef' : '#2a2a2a',
  marginRight: fontSize.xs,
})

const getCopyButtonStyle = (isLight) => ({
  padding: 6,
  borderRadius: spacing.sm,
  backgroundColor: isLight ? '#e9ecef' : '#2a2a2a',
})

const getRowContainerStyle = (isLight) => ({
  borderColor: isLight ? '#000000' : '#ffffff',
  backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a',
})

export const RoomCredentialRow = ({ label, value, onPress, isLight }) => (
  <Pressable
    onPress={onPress}
    style={[sharedStyles.potInputContainer, getRowContainerStyle(isLight)]}
  >
    <View style={getLabelBadgeStyle(isLight)}>
      <Text
        style={{
          color: isLight ? '#495057' : '#adb5bd',
          fontSize: fontSize.xs,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
    <Text
      style={{
        flex: 1,
        minWidth: 0,
        color: isLight ? '#212529' : '#ffffff',
        fontWeight: '600',
        fontSize: 13,
      }}
      numberOfLines={1}
      ellipsizeMode="middle"
    >
      {value}
    </Text>
    <View style={getCopyButtonStyle(isLight)}>
      <AppIcon icon={Copy01Icon} size={iconSize.sm} color={isLight ? '#495057' : '#adb5bd'} />
    </View>
  </Pressable>
)

export const RoomCredentialsBlock = ({ title, isLight, children, style }) => (
  <View
    style={[
      sharedStyles.credentialsDisplayContainer,
      { marginTop: 0, marginBottom: 0, paddingHorizontal: 0 },
      style,
    ]}
  >
    {title ? (
      <Text
        style={[
          sharedStyles.credentialsGuide,
          { color: isLight ? '#495057' : '#adb5bd', marginTop: 0 },
        ]}
      >
        {title}
      </Text>
    ) : null}
    <View>{children}</View>
  </View>
)
