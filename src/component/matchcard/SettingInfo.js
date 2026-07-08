import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { sharedStyles } from './sharedStyleAndInfo'
import { AppIcon } from '../../components/common/AppIcon'
import { GearsIcon } from '@hugeicons/core-free-icons'
import { spacing, iconSize } from '../../theme/typography'
import { useThemeStore } from '../../store/themeStore'

const SettingInfo = () => {
  const { isLight } = useThemeStore()
  const colors ={
    backgroundColor: isLight ? "#000000" : "#eaf4f4",
    textColor: isLight ? "#ffffff" : "#000000",
    iconColor: isLight ? "#ffffff" : "#000000",
  }
  return (
    <View style={{ marginTop: 0,marginBottom:spacing.sm }}>
      <View style={[styles.settingInfoContainer, { backgroundColor: colors.backgroundColor }]}>
        <AppIcon icon={GearsIcon} size={iconSize.sm} color={colors.iconColor} />
        <Text style={[styles.settingInfoText, { color: colors.textColor }]}>Settings</Text>

      </View>
    </View>
  )
}

export default SettingInfo

const styles = StyleSheet.create({
    settingInfoContainer:{
        borderBottomRightRadius:0,
        borderBottomLeftRadius:0,
        borderTopRightRadius:spacing.md,
        borderTopLeftRadius:spacing.md,
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",

    },
    settingInfoText:{
        color: "#000000",
        fontWeight: "bold",
        fontSize: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    }

})