import { View, StyleSheet } from "react-native"
import { scaleHeight, scaleWidth } from "../../../utils/scaling"


/**
 * MatchCardSkeleton Component
 * Displays a placeholder loading state that matches the exact layout of OpponentMatchCard
 */
const MatchCardSkeleton = ({ isLight = true }) => {
  const skeletonColor = isLight ? "#d9d9d9" : "#333333"
  const cardBg = isLight ? "transparent" : "#121212"
  const borderColor = isLight ? "#000000" : "#ffffff"
  const dividerColor = isLight ? "#e0e0e0" : "#333333"

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.cardContent}>
        {/* Game Info Header Skeleton */}
        <View style={styles.gameInfoHeader}>
          <View style={[styles.skeletonBox, styles.gameInfoItem, { backgroundColor: skeletonColor }]} />
          <View style={[styles.skeletonBox, styles.gameInfoItem, { backgroundColor: skeletonColor }]} />
          <View style={styles.headerActions}>
            <View style={[styles.skeletonBox, styles.pulseIndicator, { backgroundColor: skeletonColor }]} />
            <View style={[styles.skeletonBox, styles.deleteButton, { backgroundColor: skeletonColor }]} />
          </View>
        </View>

        {/* Main Section - Two Columns */}
        <View style={styles.mainSection}>
          {/* Left Section - Game Details */}
          <View style={styles.leftSection}>
            <View style={styles.gameDetails}>
              {/* 8 InfoRow skeletons to match the game details */}
              {Array.from({ length: 8 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.infoRow,
                    { backgroundColor: isLight ? '#d9d9d980' : '#1a1a1a' },
                    index === 0 && styles.firstRow,
                    index === 7 && styles.lastRow
                  ]}
                >
                  <View style={[styles.skeletonBox, styles.infoLabel, { backgroundColor: skeletonColor }]} />
                  <View style={[styles.skeletonBox, styles.infoValue, { backgroundColor: skeletonColor }]} />
                </View>
              ))}
            </View>
          </View>

          {/* Vertical Divider */}
          <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

          {/* Right Section */}
          <View style={styles.rightSection}>
            {/* Creator Header */}
            <View style={[
              styles.creatorHeader,
              { backgroundColor: isLight ? '#d9d9d980' : '#1a1a1a' }
            ]}>
              <View style={styles.avatarContainer}>
                <View style={[styles.skeletonBox, styles.avatar, { backgroundColor: skeletonColor }]} />
              </View>
              <View style={styles.creatorInfo}>
                <View style={[styles.skeletonBox, styles.creatorName, { backgroundColor: skeletonColor }]} />
                <View style={[styles.skeletonBox, styles.creatorLabel, { backgroundColor: skeletonColor }]} />
                <View style={[styles.skeletonBox, styles.gameUID, { backgroundColor: skeletonColor }]} />
              </View>
            </View>

            {/* Right Info Container */}
            <View style={styles.rightInfoContainer}>
              {/* 4 InfoRow skeletons for right side info */}
              {Array.from({ length: 4 }).map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.rightInfoRow, 
                    { backgroundColor: isLight ? '#d9d9d980' : '#1a1a1a' }
                  ]}
                >
                  <View style={[styles.skeletonBox, styles.rightInfoLabel, { backgroundColor: skeletonColor }]} />
                  <View style={[styles.skeletonBox, styles.rightInfoValue, { backgroundColor: skeletonColor }]} />
                </View>
              ))}
            </View>

            {/* Status Container */}
            <View style={styles.statusSection}>
              <View style={[styles.skeletonBox, styles.statusContainer, { backgroundColor: skeletonColor }]} />
            </View>
          </View>
        </View>

        {/* Credentials Section */}
        <View style={styles.credentialsSection}>
          <View style={[styles.skeletonBox, styles.credentialsGuide, { backgroundColor: skeletonColor }]} />
          <View style={styles.credentialsRow}>
            <View style={[styles.skeletonBox, styles.credentialItem, { backgroundColor: skeletonColor }]} />
            <View style={[styles.skeletonBox, styles.credentialItem, { backgroundColor: skeletonColor }]} />
          </View>
        </View>

        {/* Upload Result Button */}
        <View style={[styles.skeletonBox, styles.uploadButton, { backgroundColor: skeletonColor }]} />

        {/* Bottom Line */}
        <View style={[styles.buttonLine, { backgroundColor: dividerColor }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: scaleWidth(8),
    marginVertical: scaleHeight(8),
    borderRadius: scaleWidth(25),
    borderWidth: 1,
    overflow: "hidden",
  },
  cardContent: {
    padding: 15,
  },
  skeletonBox: {
    borderRadius: 4,
  },

  // Game Info Header
  gameInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleHeight(12),
    gap: scaleWidth(12),
  },
  gameInfoItem: {
    height: scaleHeight(24),
    width: scaleWidth(80),
    borderRadius: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleWidth(20),
    marginLeft: "auto",
  },
  pulseIndicator: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
  },
  deleteButton: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderRadius: 2,
  },

  // Main Section
  mainSection: {
    flexDirection: "row",
    marginBottom: scaleHeight(16),
  },
  leftSection: {
    flex: 1,
    paddingRight: scaleWidth(8),
  },
  rightSection: {
    flex: 1,
    paddingLeft: scaleWidth(8),
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: scaleWidth(8),
  },

  // Game Details (Left Section)
  gameDetails: {
    backgroundColor: "transparent",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(8),
    borderRadius: 0,
    marginBottom: scaleHeight(6),
  },
  firstRow: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastRow: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  infoLabel: {
    height: scaleHeight(12),
    width: "45%",
  },
  infoValue: {
    height: scaleHeight(12),
    width: "35%",
  },

  // Creator Header (Right Section)
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: scaleWidth(12),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: scaleHeight(12),
  },
  avatarContainer: {
    position: "relative",
    marginRight: scaleWidth(12),
  },
  avatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
  },

  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    height: scaleHeight(16),
    width: "60%",
    marginBottom: scaleHeight(4),
  },
  creatorLabel: {
    height: scaleHeight(12),
    width: "40%",
    marginBottom: scaleHeight(4),
  },
  gameUID: {
    height: scaleHeight(12),
    width: "70%",
  },

  // Right Info Container
  rightInfoContainer: {
    marginBottom: scaleHeight(12),
    gap: scaleHeight(8),
  },
  rightInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(8),
    borderRadius: 0,
  },
  rightInfoLabel: {
    height: scaleHeight(12),
    width: "45%",
  },
  rightInfoValue: {
    height: scaleHeight(12),
    width: "35%",
  },

  // Status Section
  statusSection: {
    marginTop: scaleHeight(4),
  },
  statusContainer: {
    height: scaleHeight(40),
    width: "100%",
    borderRadius: 12,
  },

  // Credentials Section
  credentialsSection: {
    marginBottom: scaleHeight(16),
  },
  credentialsGuide: {
    height: scaleHeight(16),
    width: "70%",
    marginBottom: scaleHeight(8),
  },
  credentialsRow: {
    flexDirection: "row",
    gap: scaleWidth(8),
  },
  credentialItem: {
    flex: 1,
    height: scaleHeight(48),
    borderRadius: 8,
  },

  // Upload Button
  uploadButton: {
    height: scaleHeight(48),
    width: "100%",
    borderRadius: 12,
    marginBottom: scaleHeight(12),
  },

  // Bottom Line
  buttonLine: {
    height: 1,
    width: "100%",
  },
})

export default MatchCardSkeleton
