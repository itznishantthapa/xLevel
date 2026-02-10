"use client"

import { StatusBar, StyleSheet, Text, View, Image, ScrollView, Pressable, Platform, Linking } from "react-native"
import Loader from "../../component/Loader"
import { SafeAreaView } from "react-native-safe-area-context"
import { useEffect, useState } from "react"
import { useNavigation } from "@react-navigation/native"
import { AntDesign, Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from "@expo/vector-icons"
import Toast from "react-native-simple-toast"
import { useBottomSheet } from "../../context/BottomSheetContext"

// Store Imports
import { useAuthStore } from "../../store/authStore"
import { useThemeStore } from "../../store/themeStore"
import { useGameProfiles } from "../../queries/useGameProfiles"
import AppHeader from "./header/AppHeader"
import { scaleWidth } from "../../utils/scaling"

/**
 * Profile Screen Component
 * Clean, organized profile with user info, game profiles, and settings
 */
const Profile = () => {
  // Constants for legal URLs
  const PRIVACY_URL = "https://level.com.np/privacy";
  const TERMS_URL = "https://level.com.np/terms";

  // Global state and hooks
  const navigation = useNavigation()
  const { user, logout } = useAuthStore()
  const { isLight, toggleTheme } = useThemeStore()
  const { data: gameProfiles = [] } = useGameProfiles()
  const { showConfirmSheet } = useBottomSheet()

  // Local state
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await logout()
    } catch (error) {
      if (__DEV__) console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = () => navigation.navigate("editProfile")

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_URL).catch(err => {
      if (__DEV__) console.error('Error opening privacy URL:', err);
      Toast.show('Could not open Privacy Policy', Toast.SHORT);
    });
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL(TERMS_URL).catch(err => {
      if (__DEV__) console.error('Error opening terms URL:', err);
      Toast.show('Could not open Terms of Service', Toast.SHORT);
    });
  };

  const colors = {
    background: isLight ? "#ffffff" : "#000000",
    cardBackground: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
    text: isLight ? "#000000" : "#ffffff",
    textSecondary: isLight ? "rgba(51, 51, 51, 0.7)" : "rgba(255, 255, 255, 0.7)",
    textTertiary: isLight ? "#666666" : "#999999",
    border: isLight ? "#eaeaea" : "rgba(255, 255, 255, 0.3)",
    destructive: "#FF4444",
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Loader visible={isLoading} message="Logging out..." size={50} />
      <StatusBar translucent backgroundColor="transparent" barStyle={isLight ? "dark-content" : "light-content"} />

      <SafeAreaView style={styles.container}>
        {
          Platform.OS === 'ios' && (
            <AppHeader
              backButton={true}
              title={'Profile'}
            />
          )
        }

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.profileHeader, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.profileImageContainer}>
              {user?.profile_picture ? (
                <Image source={{ uri: user?.profile_picture }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImageFallback, { backgroundColor: colors.cardBackground }]}>
                  <Octicons name="feed-person" size={32} color={colors.text} />
                </View>
              )}
              
              {/* Pro/Hckr Tag - Only show if user owns AND has it active */}
              {(user?.enhancer?.active_pro_tag || user?.enhancer?.active_hacker_tag) && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: [{ translateX: -12 }],
                  backgroundColor: isLight ? '#000000' : '#ffffff',
                  paddingHorizontal: scaleWidth(6),
                  paddingVertical: scaleWidth(2),
                  borderRadius: scaleWidth(8),
                  borderWidth: scaleWidth(1),
                  borderColor: isLight ? '#ffffff' : '#000000',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}>
                  <Text style={{
                    color: isLight ? '#ffffff' : '#000000',
                    fontSize: scaleWidth(8),
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {user?.enhancer?.active_hacker_tag ? 'Hckr' : 'Pro'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.playerName, { color: colors.text }]}>
                
                {
                user?.full_name ? `${user.full_name}` : "(⁠◠⁠‿⁠◕⁠)"
                
                }
                
                </Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>

            <Pressable onPress={handleEditProfile} style={styles.editButton}>
              <MaterialIcons name="edit" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.mainContent}>
            {/* Game Profiles Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Game Profiles</Text>
                <Pressable style={styles.addButton} onPress={() => navigation.navigate("setupGameInfo")}>
                  <MaterialIcons name="add" size={18} color="#00bf63" />
                  <Text style={styles.addButtonText}>Add Game Profiles</Text>
                </Pressable>
              </View>

              {gameProfiles?.length > 0 ? (
                <View style={styles.gameProfilesList}>
                  {gameProfiles.map((profile) => (
                    <Pressable
                      key={profile.game_id}
                      style={[styles.gameCard, { backgroundColor: colors.cardBackground }]}
                      onPress={() => navigation.navigate("editGameInfo", {
                        profile,
                        game: {
                          game_id: profile.game_id,
                          game_name: profile.game_name,
                          game_mode: profile.game_mode,
                          game_logo_url: profile.game_logo_url
                        }
                      })}
                    >
                      <View style={styles.gameCardHeader}>
                        <Text style={[styles.gameCardTitle, { color: colors.text }]}>{profile.game_name}</Text>
                        <MaterialIcons name="edit" size={16} color={colors.textTertiary} />
                      </View>
                      <Text style={[styles.gameCardDetails, { color: colors.textSecondary }]}>
                        {profile.game_username}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
                  <MaterialIcons name="sports-esports" size={28} color={colors.textTertiary} />
                  <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
                    No game profiles added yet
                  </Text>
                </View>
              )}
            </View>

                        {/* Actions Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Exchange</Text>
              <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable
                  style={[styles.actionRow]}
                  onPress={() => navigation.navigate("exchange")}
                >
                  <View style={styles.actionContent}>
                    <Ionicons name="sparkles-outline" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Enhancements</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
                </View>
            </View>

            {/* Account Info Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Info</Text>
              <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(user?.created_at)}</Text>
              </View>
            </View>

            {/* App Settings Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable onPress={toggleTheme} style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Scheme</Text>
                    <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                      Switch between light and dark themes
                    </Text>
                  </View>
                  <View style={styles.themeToggle}>
                    <MaterialIcons name={isLight ? "dark-mode" : "light-mode"} size={24} color={colors.text} />
                  </View>
                </Pressable>
              </View>
              <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable onPress={() => navigation.navigate('accessBar')} style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>AccessBar</Text>
                    <Text style={[styles.settingDescription, { color: colors.textTertiary }]}>
                      Personalize your accessbar
                    </Text>
                  </View>
                  <View style={styles.themeToggle}>
                    <AntDesign name={'swap'} size={24} color={colors.text} />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
              <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable
                  style={[styles.actionRow, styles.actionRowBorder, { borderBottomColor: colors.border }]}
                  onPress={() => navigation.navigate("match")}
                >
                  <View style={styles.actionContent}>
                    <MaterialIcons name="history" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Game History</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={[styles.actionRow, styles.actionRowBorder, { borderBottomColor: colors.border }]}
                  onPress={() => navigation.navigate("issue")}
                >
                  <View style={styles.actionContent}>
                    <MaterialIcons name="report-problem" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Reported Issues</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
                <Pressable
                  style={styles.actionRow}
                  onPress={() => navigation.navigate("blockedUserList")}
                >
                  <View style={styles.actionContent}>
                    <FontAwesome5 name="users-slash" size={18} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Blocked Users</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>


            {/* Legal Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
              <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable
                  style={[styles.actionRow, styles.actionRowBorder, { borderBottomColor: colors.border }]}
                  onPress={handleOpenPrivacyPolicy}
                >
                  <View style={styles.actionContent}>
                    <MaterialIcons name="privacy-tip" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Privacy Policy</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={[styles.actionRow, styles.actionRowBorder, { borderBottomColor: colors.border }]}
                  onPress={handleOpenTermsOfService}
                >
                  <View style={styles.actionContent}>
                    <MaterialIcons name="gavel" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Terms of Service</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
                <Pressable
                  style={styles.actionRow}
                  onPress={() => navigation.navigate("credits")}
                >
                  <View style={styles.actionContent}>
                    <AntDesign name="copyright" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Credits & Attributions</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
              <View style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}>
                <Pressable
                  style={[styles.actionRow, styles.actionRowBorder, { borderBottomColor: colors.border }]}
                  onPress={() => navigation.navigate("accountDeletion")
                  }
                >
                  <View style={styles.actionContent}>
                    <MaterialCommunityIcons name="delete-variant" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>Deletion</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
                <Pressable
                  style={styles.actionRow}
                  onPress={() =>
                    showConfirmSheet({
                      title: "Logout?",
                      message: "Are you sure you want to logout of your account?",
                      confirmText: "Logout",
                      cancelText: "Cancel",
                      isDestructive: true,
                      onConfirm: handleLogout,
                    })
                  }
                >
                  <View style={styles.actionContent}>
                    <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
                    <Text style={[styles.actionText, { color: colors.destructive }]}>Logout</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.versionFooter}>
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 4.3 (43)</Text>
          </View>

       
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
    marginBottom: 24,
  },
    profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  profileImageFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },

  // Main Content
  mainContent: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Game Profiles
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#00bf63",
    fontSize: 12,
    fontWeight: "600",
  },
  gameProfilesList: {
    gap: 8,
  },
  gameCard: {
    padding: 16,
    borderRadius: 12,
  },
  gameCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gameCardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  gameCardDetails: {
    fontSize: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: "center",
  },

  // Account Info
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Settings
  settingsCard: {
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  themeToggle: {
    padding: 4,
  },

  // Action Cards (New organized structure)
  actionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Version Footer
  versionFooter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
 
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
  },
})