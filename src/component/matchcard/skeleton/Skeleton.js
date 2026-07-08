import { fontSize, spacing } from '../../../theme/typography';
import { View, StyleSheet } from "react-native"


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
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderRadius: 25,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  cardContent: {
    padding: spacing.md,
  },

  // Game Info Header
  gameInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  gameInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
    borderWidth: 1,
    gap: 6,
  },
  pillIcon: {
    width: spacing["2xl"],
    height: spacing["2xl"],
    borderRadius: spacing.md,
  },
  pillText: {
    width: 48,
    height: fontSize.base,
    borderRadius: 4,
  },
  headerActions: {
    marginLeft: "auto",
  },
  cancelButton: {
    width: 70,
    height: spacing["3xl"],
    borderRadius: spacing["2xl"],
  },

  // Main Section
  mainSection: {
    flexDirection: "row",
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
  verticalDivider: {
    width: 1,
    marginHorizontal: spacing.sm,
  },

  // Left Section - Settings bar
  settingsBar: {
    height: 36,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
    marginBottom: 0,
  },

  // Left Section - InfoRows (flat, no nested skeleton)
  infoRow: {
    height: 28,
    marginBottom: 6,
  },

  // Right Section - Creator Header
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: fontSize.xs,
    borderTopRightRadius: spacing.md,
    borderTopLeftRadius: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: spacing.xl,
    marginRight: spacing.md,
  },
  creatorInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  creatorName: {
    height: fontSize.base,
    width: "60%",
    borderRadius: 3,
  },
  creatorLabel: {
    height: fontSize.xs,
    width: "35%",
    borderRadius: 3,
  },
  creatorUID: {
    height: fontSize.xs,
    width: "55%",
    borderRadius: 3,
  },

  // Right Section - Game Username box
  usernameBox: {
    borderWidth: spacing.xxs,
    paddingVertical: fontSize.xs,
    paddingHorizontal: fontSize.base,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  usernameText: {
    height: spacing.lg,
    width: "70%",
    borderRadius: 3,
  },

  // Right Section - Info rows
  rightInfoRow: {
    height: 28,
    marginBottom: spacing.xs,
  },

  // Right Section - Entry Fee row
  entryFeeRow: {
    height: 28,
    borderWidth: 2,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  // Right Section - Status Display
  statusBox: {
    height: 44,
    borderWidth: 1,
    marginTop: fontSize.xs,
  },

  // Right Section - Stamp ID
  stampContainer: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  stampBox: {
    width: "75%",
    height: spacing["3xl"],
    borderRadius: spacing.md,
    borderWidth: spacing.xxs,
    borderStyle: "dashed",
    transform: [{ rotate: "-8deg" }],
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing["2xl"],
    gap: spacing.sm,
    marginBottom: fontSize.xs,
  },
  timeIcon: {
    width: 28,
    height: 28,
    borderRadius: fontSize.base,
  },
  timeText: {
    width: 90,
    height: 13,
    borderRadius: 3,
  },

  // Divider line
  dividerLine: {
    height: 1,
    width: "100%",
    marginBottom: fontSize.xs,
  },

  // Waiting bar
  waitingBar: {
    height: 44,
    borderRadius: spacing.md,
    opacity: 0.15,
  },
})

export default MatchCardSkeleton
