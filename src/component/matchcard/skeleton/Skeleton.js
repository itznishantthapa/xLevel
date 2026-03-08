import { View, StyleSheet } from "react-native"
import { scaleHeight, scaleWidth } from "../../../utils/scaling"


/**
 * MatchCardSkeleton Component
 * Displays a placeholder loading state that matches the layout of MatchCard
 */
const MatchCardSkeleton = ({ isLight = true }) => {
  const skeletonColor = isLight ? "#d9d9d9" : "#333333"
  const cardBg = isLight ? "transparent" : "#000000"
  const borderColor = isLight ? "#333333" : "#ffffff"
  const dividerColor = isLight ? "#e0e0e0" : "#333333"
  const rowBg = isLight ? "#d9d9d980" : "#1a1a1a"

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.cardContent}>

        {/* Game Info Header - two pill badges + cancel button */}
        <View style={styles.gameInfoHeader}>
          <View style={[styles.gameInfoPill, { borderColor: isLight ? "#000000" : "#eaf4f4" }]}>
            <View style={[styles.pillIcon, { backgroundColor: skeletonColor }]} />
            <View style={[styles.pillText, { backgroundColor: skeletonColor }]} />
          </View>
          <View style={[styles.gameInfoPill, { borderColor: isLight ? "#000000" : "#eaf4f4" }]}>
            <View style={[styles.pillIcon, { backgroundColor: skeletonColor }]} />
            <View style={[styles.pillText, { backgroundColor: skeletonColor }]} />
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.cancelButton, { backgroundColor: skeletonColor }]} />
          </View>
        </View>

        {/* Main Section - Two Columns */}
        <View style={styles.mainSection}>

          {/* Left Section - Settings bar + InfoRows */}
          <View style={styles.leftSection}>
            {/* Settings bar */}
            <View style={[styles.settingsBar, { backgroundColor: isLight ? "#000000" : "#eaf4f4" }]} />

            {/* InfoRows - flat skeleton rows, no nested boxes */}
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[styles.infoRow, { backgroundColor: rowBg }]}
              />
            ))}
          </View>

          {/* Vertical Divider */}
          <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

          {/* Right Section */}
          <View style={styles.rightSection}>
            {/* Creator Header - avatar + name area */}
            <View style={[styles.creatorHeader, { backgroundColor: rowBg }]}>
              <View style={[styles.avatar, { backgroundColor: skeletonColor }]} />
              <View style={styles.creatorInfo}>
                <View style={[styles.creatorName, { backgroundColor: skeletonColor }]} />
                <View style={[styles.creatorLabel, { backgroundColor: skeletonColor }]} />
                <View style={[styles.creatorUID, { backgroundColor: skeletonColor }]} />
              </View>
            </View>

            {/* Game Username box */}
            <View style={[styles.usernameBox, { borderColor: isLight ? "#333333" : "#ffffff" }]}>
              <View style={[styles.usernameText, { backgroundColor: skeletonColor }]} />
            </View>

            {/* Right info rows */}
            {Array.from({ length: 3 }).map((_, index) => (
              <View
                key={index}
                style={[styles.rightInfoRow, { backgroundColor: rowBg }]}
              />
            ))}

            {/* Entry Fee row */}
            <View style={[styles.entryFeeRow, { borderColor: isLight ? "#333333" : "#ffffff", backgroundColor: rowBg }]} />

            {/* Status Display box */}
            <View style={[styles.statusBox, { borderColor: "#00bf6350", backgroundColor: "#0a0a0a" }]} />

            {/* Stamp ID */}
            <View style={styles.stampContainer}>
              <View style={[styles.stampBox, { borderColor: isLight ? "#333333" : "#eaf4f4", backgroundColor: isLight ? "#f5f5f5" : "#1a1a1a" }]} />
            </View>
          </View>
        </View>

        {/* Time row */}
        <View style={[styles.timeRow, { backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)" }]}>
          <View style={[styles.timeIcon, { backgroundColor: skeletonColor }]} />
          <View style={[styles.timeText, { backgroundColor: skeletonColor }]} />
        </View>

        {/* Divider line */}
        <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />

        {/* Waiting for opponent */}
        <View style={[styles.waitingBar, { backgroundColor: isLight ? "#000000" : "#ffffff" }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: scaleWidth(8),
    marginVertical: scaleHeight(8),
    borderRadius: scaleWidth(25),
    borderWidth: scaleWidth(1.5),
    overflow: "hidden",
  },
  cardContent: {
    padding: scaleWidth(12),
  },

  // Game Info Header
  gameInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleHeight(8),
    gap: scaleWidth(8),
  },
  gameInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(20),
    borderWidth: scaleWidth(1),
    gap: scaleWidth(6),
  },
  pillIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
  },
  pillText: {
    width: scaleWidth(48),
    height: scaleHeight(14),
    borderRadius: 4,
  },
  headerActions: {
    marginLeft: "auto",
  },
  cancelButton: {
    width: scaleWidth(70),
    height: scaleHeight(32),
    borderRadius: scaleWidth(24),
  },

  // Main Section
  mainSection: {
    flexDirection: "row",
    marginBottom: scaleHeight(10),
  },
  leftSection: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  rightSection: {
    flex: 1,
    paddingLeft: scaleWidth(12),
  },
  verticalDivider: {
    width: scaleWidth(1),
    marginHorizontal: scaleWidth(8),
  },

  // Left Section - Settings bar
  settingsBar: {
    height: scaleHeight(36),
    borderTopLeftRadius: scaleWidth(12),
    borderTopRightRadius: scaleWidth(12),
    marginBottom: scaleHeight(0),
  },

  // Left Section - InfoRows (flat, no nested skeleton)
  infoRow: {
    height: scaleHeight(28),
    marginBottom: scaleHeight(6),
  },

  // Right Section - Creator Header
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: scaleWidth(10),
    borderTopRightRadius: scaleWidth(12),
    borderTopLeftRadius: scaleWidth(12),
    marginBottom: scaleHeight(8),
  },
  avatar: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    borderRadius: scaleWidth(20),
    marginRight: scaleWidth(12),
  },
  creatorInfo: {
    flex: 1,
    gap: scaleHeight(4),
  },
  creatorName: {
    height: scaleHeight(14),
    width: "60%",
    borderRadius: 3,
  },
  creatorLabel: {
    height: scaleHeight(10),
    width: "35%",
    borderRadius: 3,
  },
  creatorUID: {
    height: scaleHeight(10),
    width: "55%",
    borderRadius: 3,
  },

  // Right Section - Game Username box
  usernameBox: {
    borderWidth: scaleWidth(2),
    paddingVertical: scaleWidth(10),
    paddingHorizontal: scaleWidth(14),
    marginBottom: scaleWidth(8),
    alignItems: "center",
  },
  usernameText: {
    height: scaleHeight(16),
    width: "70%",
    borderRadius: 3,
  },

  // Right Section - Info rows
  rightInfoRow: {
    height: scaleHeight(28),
    marginBottom: scaleHeight(4),
  },

  // Right Section - Entry Fee row
  entryFeeRow: {
    height: scaleHeight(28),
    borderWidth: 2,
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(8),
  },

  // Right Section - Status Display
  statusBox: {
    height: scaleHeight(44),
    borderWidth: scaleWidth(1),
    marginTop: scaleHeight(10),
  },

  // Right Section - Stamp ID
  stampContainer: {
    alignItems: "center",
    marginTop: scaleHeight(12),
  },
  stampBox: {
    width: "75%",
    height: scaleHeight(32),
    borderRadius: scaleWidth(12),
    borderWidth: scaleWidth(2),
    borderStyle: "dashed",
    transform: [{ rotate: "-8deg" }],
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(24),
    gap: scaleWidth(8),
    marginBottom: scaleHeight(10),
  },
  timeIcon: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: scaleWidth(14),
  },
  timeText: {
    width: scaleWidth(90),
    height: scaleHeight(13),
    borderRadius: 3,
  },

  // Divider line
  dividerLine: {
    height: 1,
    width: "100%",
    marginBottom: scaleHeight(10),
  },

  // Waiting bar
  waitingBar: {
    height: scaleHeight(44),
    borderRadius: scaleWidth(12),
    opacity: 0.15,
  },
})

export default MatchCardSkeleton
