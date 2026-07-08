import { StyleSheet, Text, View, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView, Keyboard } from 'react-native'
import React, { useState, useRef } from 'react'
import { AppIcon } from '../../../components/common/AppIcon'
import { CheckIcon, Alert01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { iconSize } from '../../../theme/typography'
import { useThemeStore } from '../../../store/themeStore'
import { CreateGameLayout } from '../../../component/customer/createGame'
import { useAuthStore } from '../../../store/authStore'
import { useBottomSheet } from '../../../context/BottomSheetContext'
import Toast from "react-native-simple-toast"
import * as LocalAuthentication from "expo-local-authentication";
import { ShakeText } from '../../../component/customer/animation'

const AccountDeletion = () => {
  const { isLight } = useThemeStore()
  const [selectedReason, setSelectedReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { delete_user } = useAuthStore()
  const { showConfirmSheet } = useBottomSheet()
  const shakeRef = useRef(null)

  const deletionReasons = [
    { id: '1', label: 'No longer use this platform' },
    { id: '2', label: 'Found better alternative' },
    { id: '3', label: 'Privacy concerns' },
    { id: '4', label: 'Too many emails/notifications' },
    { id: '5', label: 'Difficulty navigating the platform' },
    { id: '6', label: 'Account security concerns' },
    { id: '7', label: 'Personal reasons' },
    { id: '8', label: 'Other' },
  ]

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    textTertiary: isLight ? "#666666" : "#999999",
    border: isLight ? "#eaeaea" : "rgba(255, 255, 255, 0.3)",
    destructive: "#FF4444",
    radioSelected: isLight ? "#000000" : "#ffffff",
    radioUnselected: isLight ? "#cccccc" : "#666666",
  }

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId)
    if (reasonId !== '8') {
      setOtherReason('')
    }
  }






  const handleDeleteAccount = async () => {
    if (!selectedReason) {
      shakeRef.current?.shake()
      return
    }

    if (selectedReason === '8' && !otherReason.trim()) {
      Toast.show('Please specify your reason for deleting the account.')
      return
    }


    Keyboard.dismiss()

    setTimeout(() => {



      // Confirm sheet
      showConfirmSheet({
        title: "Delete Account?",
        message: "Are you sure you want to permanently delete your account?",
        confirmText: "Delete Account",
        cancelText: "Cancel",
        isDestructive: true,
        onConfirm: async () => {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          let canProceed = false;

          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Confirm your identity",
              fallbackLabel: "Use Passcode",
            });
            canProceed = result.success;
          } else {
            // No biometric or lock, continue deletion
            canProceed = true;
          }

          if (canProceed) {
            setIsLoading(true);

            const payload = selectedReason === '8'
              ? {
                reason: 'Other',
                reasonText: otherReason.trim(),
              }
              : {
                reason: deletionReasons.find(reason => reason.id === selectedReason)?.label,
                reasonText: null,
              };

            try {
              await delete_user(payload);
            } catch (error) {
              Toast.show(error?.message || "Account deletion failed.");
            } finally {
              setIsLoading(false);
            }
          }
        },

      });
    }, 100);
  };


  const renderReasonOption = (reason, index) => {
    const isSelected = selectedReason === reason.id
    const isLast = index === deletionReasons.length - 1

    return (
      <Pressable
        key={reason.id}
        style={[
          styles.reasonOption,
          {
            borderBottomColor: colors.border,
            borderBottomWidth: isLast ? 0 : 1
          }
        ]}
        onPress={() => handleReasonSelect(reason.id)}
      >
        <View style={styles.reasonContent}>
          <View style={[
            styles.radioButton,
            {
              borderColor: isSelected ? colors.radioSelected : colors.radioUnselected,
              backgroundColor: isSelected ? colors.radioSelected : 'transparent'
            }
          ]}>
            {isSelected && (
              <AppIcon icon={CheckIcon} size={iconSize.xs} color={isLight ? "#ffffff" : "#000000"} />
            )}
          </View>
          <Text style={[styles.reasonText, { color: colors.text }]}>
            {reason.label}
          </Text>
        </View>
      </Pressable>
    )
  }


  return (
    <CreateGameLayout
      title="Delete Account"
      isLight={isLight}
      isLoading={isLoading}
      onSubmit={handleDeleteAccount}
      buttonTitle="Delete Account"
      loaderMessage="Processing deletion request..."
    >
      <View style={styles.container}>
        {/* Warning Header */}
        <View style={[styles.warningContainer, { backgroundColor: colors.cardBackground }]}>
          <AppIcon icon={Alert01Icon} size={22} color={colors.text} />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>
              Account Deletion Warning
            </Text>
            <Text style={[styles.warningMessage, { color: colors.textSecondary }]}>
              This action will permanently delete your account and all data. This cannot be undone.
            </Text>
          </View>
        </View>

        {/* Reason Selection Section */}
        <View style={styles.section}>
          <ShakeText ref={shakeRef}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Why are you leaving?
            </Text>
          </ShakeText>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Help us improve by sharing your reason
          </Text>
        </View>

        {/* Reason Options */}
        <View style={[styles.reasonsList, { backgroundColor: colors.cardBackground }]}>
          {deletionReasons.map((reason, index) => renderReasonOption(reason, index))}
        </View>

        {/* Other Reason Text Area */}
        {selectedReason === '8' && (
          <View style={styles.section}>
            <Text style={[styles.textAreaLabel, { color: colors.text }]}>
              Please specify:
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              placeholder="Tell us more about your reason..."
              placeholderTextColor={colors.textTertiary}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              value={otherReason}
              onChangeText={setOtherReason}
              maxLength={300}
            />
            <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
              {otherReason.length}/300
            </Text>
          </View>
        )}

        {/* Additional Info */}
        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground }]}>
          <AppIcon icon={InformationCircleIcon} size={iconSize.sm} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Once you confirm the deletion, your account will be instantly and permanently removed from our database.
          </Text>
        </View>
      </View>
    </CreateGameLayout>
  )
}

export default AccountDeletion

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },

  // Warning Section
  warningContainer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Section Headers
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Reason Options
  reasonsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Text Area
  textAreaLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  characterCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  // Info Section
  infoContainer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
})