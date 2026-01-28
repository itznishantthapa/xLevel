import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { scaleHeight, scaleWidth } from '../../utils/scaling';
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";


// Shared styles for use in all match card components
export const sharedStyles = StyleSheet.create({
  card: {
    marginHorizontal: scaleWidth(8),
    marginVertical: scaleHeight(8),
    borderRadius: scaleWidth(25),
    backgroundColor: 'transparent',
    borderWidth: scaleWidth(1.5),
    borderColor: '#333333',
  },
  cardDark: {
    backgroundColor: '#000000',
    borderColor: '#ffffff',
  },
  cardContent: {
    padding: scaleWidth(16),
  },
  mainSection: {
    flexDirection: 'row',
    marginBottom: scaleHeight(16),
  },
  leftSection: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  rightSection: {
    flex: 1,
    paddingLeft: scaleWidth(12),
  },
  gameInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: scaleWidth(8),
    marginBottom: scaleHeight(12),
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    borderWidth: scaleWidth(1),
    borderColor: '#000000',
  },
  gameInfoText: {
    marginLeft: scaleWidth(6),
    fontSize: scaleWidth(14),
    color: '#333333',
    fontWeight: '600',
  },
  gameInfoItemDark: {
    borderColor: '#eaf4f4',
  },
  gameInfoTextDark: {
    color: '#eaf4f4',
  },
  iconContainer: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(6),
  },
  verticalDivider: {
    width: scaleWidth(1),
    backgroundColor: '#e0e0e0',
    marginHorizontal: scaleWidth(8),
  },
  verticalDividerDark: {
    backgroundColor: '#333333',
  },
  gameDetails: {
    gap: scaleWidth(6),
    marginBottom: scaleHeight(12),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d9d9d980',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(6),
  },
  infoLabel: {
    fontSize: scaleWidth(12),
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: scaleWidth(12),
    color: '#333333',
    fontWeight: '600',
    width: '35%',
    
  },
  infoRowDark: {
    backgroundColor: '#1a1a1a',
  },
  infoLabelDark: {
    color: '#cccccc',
  },
  infoValueDark: {
    color: '#ffffff',
  },
  lineThrough: {
    position: 'absolute',
    width: "100%",
    backgroundColor: 'black',
    borderWidth: scaleWidth(1)
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9d9d980',
    padding: scaleWidth(12),
    borderTopRightRadius: scaleWidth(12),
    borderTopLeftRadius: scaleWidth(12),
    marginBottom: scaleHeight(12),
  },
  creatorHeaderDark: {
    backgroundColor: '#1a1a1a',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scaleWidth(12),
  },
  creatorAvatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
 
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scaleWidth(12),
    height: scaleWidth(12),
    borderRadius: scaleWidth(6),
    backgroundColor: '#00bf63',
    borderWidth: scaleWidth(2),
    borderColor: '#ffffff',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: scaleWidth(12),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: scaleHeight(2),
  },
  creatorNameDark: {
    color: '#ffffff',
  },
  creatorLabel: {
    fontSize: scaleWidth(10),
    fontWeight: '500',
    color: '#666666',
    marginBottom: scaleHeight(2),
  },
  creatorLabelDark: {
    color: '#cccccc',
  },
  gameUID: {
    fontSize: scaleWidth(12),
    color: '#666666',
    textDecorationLine: 'underline',
  },
  gameUIDDark: {
    color: '#cccccc',
  },
  rightInfoContainer: {
    marginTop: scaleHeight(4),
    gap: scaleHeight(4),
  },
  statusContainer: {
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(16),
    borderBottomRightRadius: scaleWidth(12),
    borderBottomLeftRadius: scaleWidth(12),
    alignItems: 'center',
    marginTop: scaleHeight(12),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleWidth(6),
  },
  winText: {
    fontSize: scaleWidth(14),
    color: '#00bf63',
    fontWeight: 'bold',
  },
  loseText: {
    fontSize: scaleWidth(14),
    color: '#ffffff',
    fontWeight: 'bold',
  },
  losePotText: {
    color: 'red'
  },
  winPotText: {
    color: '#00bf63'
  },
  sendButton: {
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    marginTop: scaleHeight(8),
  },
  sendButtonContent: {
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: scaleWidth(14),
    fontWeight: 'bold',
    textAlign:'center'
  },
  credentialInput:{
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scaleWidth(1),
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    marginBottom: scaleHeight(8),
  },
  credentialsContainer: {
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(8),
  },
  credentialsGuide: {
    fontSize: scaleWidth(14),
    fontWeight: 'bold',
    color: "#00C851",
    marginBottom: scaleHeight(12),
    marginTop: scaleHeight(12),
    textAlign: "center",
  },
  inputRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  inputWrapper: {
    flex: 1,
  },
  potInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scaleWidth(1),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(8),
    marginBottom: scaleHeight(8),
  },
  potInput: {
    flex: 1,
    fontSize: scaleWidth(12),
    fontWeight: '600',
    padding: 0,

  },
  errorText: {
    color: '#dc2626',
    fontSize: scaleWidth(13),
    textAlign: 'center',
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
  },
  optionalCredentialsText: {
    fontSize: scaleWidth(13),
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: scaleHeight(4),
    opacity: 0.7,
  },
  credentialsDisplayContainer: {
    marginTop: scaleHeight(16),
    marginBottom: scaleHeight(8),
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  credentialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(8),
    gap: scaleWidth(8),
  },
  credentialLabel: {
    fontSize: scaleWidth(13),
  },
  credentialValue: {
    flex: 1,
    fontSize: scaleWidth(13),
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  statusButton: {
    paddingVertical: scaleHeight(12),
    borderWidth: 1,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(12),
  },
  statusText: {
    fontSize: scaleWidth(14),
    fontWeight: '600',
  },
  buttonLine: {
    width: '100%',
    height: 1,
    marginVertical: scaleHeight(12),
  },
  profileFallback: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scaleWidth(2),
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  opponentsSection: {
    marginTop: scaleHeight(8),
  },
  opponentsTitle: {
    fontSize: scaleWidth(14),
    fontWeight: '600',
    marginBottom: scaleHeight(8),
  },
  opponentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(8),
  },
  waitingContainer: {
    width: '100%',
    paddingVertical: scaleHeight(16),
    paddingHorizontal: scaleWidth(16),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    fontSize: scaleWidth(14),
    // fontStyle: 'italic',
  },
  opponentBox: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    borderWidth: scaleWidth(1),
    minWidth: scaleWidth(160),
    marginTop: scaleHeight(8),

  },
  opponentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(10),
  },
  opponentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  opponentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(4),
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(3),
    borderRadius: scaleWidth(6),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: scaleWidth(1),
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmedText: {
    fontSize: scaleWidth(10),
    color: '#000000',
    fontWeight: '600',
  },
  errorMessageContainer: {
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(4),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: scaleWidth(8),
  },
  errorMessageText: {
    fontSize: scaleWidth(12),
    textAlign: 'center',
    fontWeight: '500',
  },
  opponentName: {
    fontSize: scaleWidth(14),
    fontWeight: '700',
    flex: 1,
  },
  opponentLevel: {
    fontSize: scaleWidth(11),
    fontWeight: '500',
    marginTop: scaleHeight(2),
    opacity: 0.8,
  },
  opponentAvatar: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    borderWidth: scaleWidth(2),
    borderColor: '#ffffff',
  },
  opponentAvatarFallback: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scaleWidth(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// InfoRow Component - shared between both cards
export const InfoRow = ({ label, value, isDark, gameMode="", needMoreWidth = false, curveOnTop = false, curveOnBottom = false }) => {
  const isMapCode = label.toLowerCase() === 'map code';
  
  const copyToClipboard = (text) => {
    if (text) {
      Clipboard.setString(text);
      Toast.show("Map Code copied!", Toast.SHORT);
    }
  };

  const renderValue = () => {
    if (isMapCode) {
      return (
        <Pressable onPress={() => copyToClipboard(value)}>
          <Text 
            style={[
              // sharedStyles.infoValue, 
              { fontSize: scaleWidth(10) },
              isDark && sharedStyles.infoValueDark, 
              needMoreWidth && { width: '50%' },
              { textDecorationLine: 'underline' }
            ]} 
            numberOfLines={1}
          >
            {value}
          </Text>
        </Pressable>
      );
    }
    
    return (
      <Text 
        style={[
          sharedStyles.infoValue, 
          isDark && sharedStyles.infoValueDark, 
          needMoreWidth && { width: '50%' }
        ]} 
        numberOfLines={1}
      >
        {gameMode === 'Lone Wolf' ? "Any" : value}
      </Text>
    );
  };

  return (
    <View style={[
      sharedStyles.infoRow, 
      isDark && sharedStyles.infoRowDark, 
      needMoreWidth && { borderRadius: scaleWidth(0) }, 
      curveOnTop && { borderTopRightRadius: scaleWidth(8), borderTopLeftRadius: scaleWidth(8) }, 
      curveOnBottom && { borderBottomRightRadius: scaleWidth(8), borderBottomLeftRadius: scaleWidth(8) }
    ]}>
      <Text style={[sharedStyles.infoLabel, isDark && sharedStyles.infoLabelDark]}>{label}:</Text>
      {renderValue()}
    </View>
  );
};
