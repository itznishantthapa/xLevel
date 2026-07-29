import React from "react"
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import Toast from "react-native-simple-toast"
import { AppIcon } from "../../components/common/AppIcon"
import { UserIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { InfoRow, sharedStyles } from "../../component/matchcard/sharedStyleAndInfo"
import { getParticipantGameData, getGameDisplayLabel } from "../../component/matchcard/participantGameData"
import { fontSize, spacing, iconSize } from "../../theme/typography"

const GameUsernameBadge = ({ username, isDark }) => {
  const accent = isDark ? "#ffffff" : "#333333"

  return (
    <View style={styles.usernameBadge}>
      <View style={[styles.corner, styles.cornerTL, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerTLV, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerTR, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerTRV, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerBL, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerBLV, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerBR, { backgroundColor: accent }]} />
      <View style={[styles.corner, styles.cornerBRV, { backgroundColor: accent }]} />
      <Text
        style={[styles.usernameText, { color: isDark ? "#ffffff" : "#1a1a1a" }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {username}
      </Text>
    </View>
  )
}

const OpponentSheetContent = React.memo(({ payload, isDark, insets, handleConfirm }) => {
  const opponent = payload.opponent
  const theGame = opponent?.theGame || ""
  const gameData = getParticipantGameData(opponent, theGame)
  const isConfirmed = payload.isConfirmed
  const gameLabel = getGameDisplayLabel(theGame)

  const statRows = gameData.stats.filter((stat) => stat.value != null && stat.value !== "")

  const copyToClipboard = (text) => {
    if (text) {
      Clipboard.setString(text)
      Toast.show("Copied!", Toast.SHORT)
    }
  }

  return (
    <View style={styles.content}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: isConfirmed ? "#00bf63" : isDark ? "#ffffff" : "#333333",
              },
            ]}
          >
            {opponent.profile_picture ? (
              <Image source={{ uri: opponent.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: isDark ? "#2a2a2a" : "#e8e8e8" }]}>
                <AppIcon icon={UserIcon} size={iconSize.lg} color={isDark ? "#ffffff" : "#333333"} />
              </View>
            )}
            {isConfirmed ? (
              <View style={[styles.avatarBadge, { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" }]}>
                <AppIcon icon={CheckmarkCircle01Icon} size={16} color="#00bf63" />
              </View>
            ) : null}
          </View>

          <Text style={[styles.playerName, { color: isDark ? "#ffffff" : "#1a1a1a" }]} numberOfLines={1}>
            {opponent.full_name || "Player"}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.gameLabel, { color: isDark ? "#aaaaaa" : "#666666" }]}>{gameLabel}</Text>
            <View
              style={[
                styles.statusPill,
                isConfirmed
                  ? { borderColor: "#00bf63", backgroundColor: "rgba(0, 191, 99, 0.12)" }
                  : { borderColor: isDark ? "#ffffff" : "#333333" },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  { color: isConfirmed ? "#00bf63" : isDark ? "#ffffff" : "#333333" },
                ]}
              >
                {isConfirmed ? "Confirmed" : "Pending"}
              </Text>
            </View>
          </View>

          {gameData.showUID && gameData.uid ? (
            <Pressable onPress={() => copyToClipboard(gameData.uid)}>
              <Text style={[styles.uidText, { color: isDark ? "#cccccc" : "#666666" }]}>
                {gameData.uid}
              </Text>
            </Pressable>
          ) : null}

          {gameData.gameUsername ? (
            <GameUsernameBadge username={gameData.gameUsername} isDark={isDark} />
          ) : null}
        </View>

        {statRows.length > 0 ? (
          <View style={styles.detailsSection}>
            <View style={sharedStyles.rightInfoContainer}>
              {statRows.map((stat) => (
                <InfoRow
                  key={stat.key || stat.label}
                  label={stat.label}
                  value={stat.value?.toString() || "0"}
                  isDark={isDark}
                  needMoreWidth={stat.needMoreWidth || false}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actionSection, { paddingBottom: Math.max(12, insets.bottom + 10 || 0) }]}>
        {isConfirmed ? (
          <View style={[styles.statusContainer, styles.confirmedContainer]}>
            <AppIcon icon={CheckmarkCircle01Icon} size={iconSize.sm} color="#00bf63" />
            <Text style={[styles.statusText, { color: "#00bf63" }]}>Opponent Confirmed</Text>
          </View>
        ) : payload.gameStatus === "completed" || payload.gameStatus === "cancelled" ? (
          <View style={[styles.statusContainer, { borderColor: isDark ? "#ffffff" : "#000000" }]}>
            <Text style={[styles.statusText, { color: isDark ? "#ffffff" : "#000000" }]}>
              {payload.gameStatus === "completed" ? "Match Completed" : "Match Cancelled"}
            </Text>
          </View>
        ) : payload.gameStatus === "expired" ? (
          <View style={[styles.statusContainer, { borderColor: isDark ? "#ffffff" : "#000000" }]}>
            <Text style={[styles.statusText, { color: isDark ? "#ffffff" : "#000000" }]}>Match Expired</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.confirmButton, { backgroundColor: isDark ? "#ffffff" : "#1a1a1a" }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.confirmButtonText, { color: isDark ? "#1a1a1a" : "#ffffff" }]}>
              Confirm Opponent
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 12,
    padding: 2,
  },
  playerName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  gameLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.lg,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  uidText: {
    fontSize: fontSize.xs,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  usernameBadge: {
    position: "relative",
    paddingVertical: fontSize.xs,
    paddingHorizontal: fontSize.base,
    marginTop: spacing.xxs,
    minWidth: 140,
    alignItems: "center",
  },
  usernameText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  corner: {
    position: "absolute",
  },
  cornerTL: { top: 0, left: 0, width: fontSize.base, height: spacing.xxs },
  cornerTLV: { top: 0, left: 0, width: spacing.xxs, height: fontSize.base },
  cornerTR: { top: 0, right: 0, width: fontSize.base, height: spacing.xxs },
  cornerTRV: { top: 0, right: 0, width: spacing.xxs, height: fontSize.base },
  cornerBL: { bottom: 0, left: 0, width: fontSize.base, height: spacing.xxs },
  cornerBLV: { bottom: 0, left: 0, width: spacing.xxs, height: fontSize.base },
  cornerBR: { bottom: 0, right: 0, width: fontSize.base, height: spacing.xxs },
  cornerBRV: { bottom: 0, right: 0, width: spacing.xxs, height: fontSize.base },
  detailsSection: {
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionSection: {
    paddingHorizontal: spacing.md,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    borderWidth: 1,
  },
  confirmedContainer: {
    borderColor: "#00bf63",
    backgroundColor: "rgba(0, 191, 99, 0.08)",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
  },
  confirmButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
})

export default OpponentSheetContent
