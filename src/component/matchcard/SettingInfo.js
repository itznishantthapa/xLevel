import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { sharedStyles } from './sharedStyleAndInfo'
import { scaleHeight, scaleWidth } from '../../utils/scaling'
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons'
import { useThemeStore } from '../../store/themeStore'

const SettingInfo = () => {
  const { isLight } = useThemeStore()
  const colors ={
    backgroundColor: isLight ? "#000000" : "#eaf4f4",
    textColor: isLight ? "#ffffff" : "#000000",
    iconColor: isLight ? "#ffffff" : "#000000",
  }
  return (
    <View style={{ marginTop: scaleHeight(0),marginBottom:scaleHeight(8) }}>
      <View style={[styles.settingInfoContainer, { backgroundColor: colors.backgroundColor }]}>
        <FontAwesome name="gears" size={scaleWidth(16)} color={colors.iconColor} />
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
        borderTopRightRadius:scaleWidth(12),
        borderTopLeftRadius:scaleWidth(12),
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",

    },
    settingInfoText:{
        color: "#000000",
        fontWeight: "bold",
        fontSize: scaleWidth(16),
        paddingHorizontal: scaleWidth(12),
        paddingVertical: scaleHeight(8),
    }

})