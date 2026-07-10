import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";
import { fontSize, spacing } from '../../theme/typography';


// Shared styles for use in all match card components
export const sharedStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  cardDark: {
    backgroundColor: '#000000',
    borderColor: '#ffffff',
  },
  cardContent: {
    padding: spacing.md,
  },
  mainSection: {
    flexDirection: 'row',
    marginBottom: fontSize.xs,
  },
  leftSection: {
    flex: 1,
    paddingRight: spacing.md,
  },
  rightSection: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  gameInfoHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
    borderWidth: 1,
    borderColor: '#000000',
  },
  gameInfoText: {
    flexShrink: 1,
    marginLeft: 6,
    fontSize: fontSize.base,
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
    width: spacing["2xl"],
    height: spacing["2xl"],
    borderRadius: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: spacing.sm,
  },
  verticalDividerDark: {
    backgroundColor: '#333333',
  },
  gameDetails: {
    gap: 6,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d9d9d980',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: spacing.md,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: spacing.md,
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
    borderWidth: 1
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9d9d980',
    padding: fontSize.xs,
    borderTopRightRadius: spacing.md,
    borderTopLeftRadius: spacing.md,
    marginBottom: spacing.sm,
  },
  creatorHeaderDark: {
    backgroundColor: '#1a1a1a',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: spacing.xl,
 
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: spacing.md,
    height: spacing.md,
    borderRadius: 6,
    backgroundColor: '#00bf63',
    borderWidth: spacing.xxs,
    borderColor: '#ffffff',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: spacing.md,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: spacing.xxs,
  },
  creatorNameDark: {
    color: '#ffffff',
  },
  creatorLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: '#666666',
    marginBottom: spacing.xxs,
  },
  creatorLabelDark: {
    color: '#cccccc',
  },
  gameUID: {
    fontSize: spacing.md,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  gameUIDDark: {
    color: '#cccccc',
  },
  rightInfoContainer: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 0,
    alignItems: 'center',
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  winText: {
    fontSize: fontSize.base,
    color: '#00bf63',
    fontWeight: 'bold',
  },
  loseText: {
    fontSize: fontSize.base,
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
    paddingVertical: fontSize.base,
    borderRadius: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  sendButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: fontSize.base,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign:'center'
  },
  credentialInput:{
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  credentialsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  credentialsGuide: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    textAlign: "center",
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: fontSize.xs,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
  },
  potInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: fontSize.base,
    paddingVertical: fontSize.base,
    borderRadius: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  potInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  optionalCredentialsText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  credentialsDisplayContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  credentialsInputContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  credentialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: fontSize.xs,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    gap: spacing.sm,
  },
  credentialLabel: {
    fontSize: 13,
  },
  credentialValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  statusButton: {
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  statusText: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  buttonLine: {
    width: '100%',
    height: 1,
    marginVertical: spacing.sm,
  },
  profileFallback: {
    width: 40,
    height: 40,
    borderRadius: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: spacing.xxs,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  opponentsSection: {
    marginTop: spacing.sm,
  },
  opponentsTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  opponentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  waitingContainer: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    fontSize: fontSize.base,
    // fontStyle: 'italic',
  },
  opponentBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    minWidth: 160,
    marginTop: spacing.sm,

  },
  opponentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fontSize.xs,
  },
  opponentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  opponentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmedText: {
    fontSize: fontSize.xs,
    color: '#000000',
    fontWeight: '600',
  },
  errorMessageContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: spacing.sm,
  },
  errorMessageText: {
    fontSize: spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  opponentName: {
    fontSize: fontSize.base,
    fontWeight: '700',
    flex: 1,
  },
  opponentLevel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing.xxs,
    opacity: 0.8,
  },
  opponentAvatar: {
    width: spacing["3xl"],
    height: spacing["3xl"],
    borderRadius: spacing.lg,
    borderWidth: spacing.xxs,
    borderColor: '#ffffff',
  },
  opponentAvatarFallback: {
    width: spacing["3xl"],
    height: spacing["3xl"],
    borderRadius: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: spacing.xxs,
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
              { fontSize: fontSize.xs },
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
      needMoreWidth && { borderRadius: 0 }, 
      curveOnTop && { borderTopRightRadius: spacing.sm, borderTopLeftRadius: spacing.sm }, 
      curveOnBottom && { borderBottomRightRadius: spacing.sm, borderBottomLeftRadius: spacing.sm }
    ]}>
      <Text style={[sharedStyles.infoLabel, isDark && sharedStyles.infoLabelDark]}>{label}:</Text>
      {renderValue()}
    </View>
  );
};
