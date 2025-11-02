"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
} from "react-native"
import Clipboard from '@react-native-clipboard/clipboard'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { runOnJS } from "react-native-worklets"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { useThemeStore } from "../store/themeStore"
// Removed unused icon imports
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NavigationService } from "../service/navigationService"
import { useQueryClient } from "@tanstack/react-query"
import OpponentSheetContent from "./component/OpponentSheetContent"
import { ShakeText } from "../component/customer/animation"
import { scaleWidth } from "../utils/scaling"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

const BottomSheetContext = createContext()

export const BottomSheetProvider = ({ children }) => {
  const insets = useSafeAreaInsets()
  const { isLight } = useThemeStore()
  const isDark = !isLight
  const queryClient = useQueryClient()

  const [visible, setVisible] = useState(false)
  const [sheetType, setSheetType] = useState(null)
  const [payload, setPayload] = useState(null)

  const onConfirmRef = useRef(null)
  const savedCallbackRef = useRef(null)
  const shakeTextRef = useRef(null)

  // Reanimated shared values
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const backdropOpacity = useSharedValue(0)

  const openSheet = useCallback(() => {
    'worklet'
    backdropOpacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    })
    translateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
  }, [backdropOpacity, translateY])

  const closeSheet = useCallback(
    (afterClose, preserveCallback = false) => {
      'worklet'

      // Create a separate named function for runOnJS to use correctly
      const cleanupAfterClose = () => {
        setVisible(false)
        setSheetType(null)
        setPayload(null)

        if (!preserveCallback) {
          onConfirmRef.current = null
        }

        if (typeof afterClose === "function") afterClose()
      }

      backdropOpacity.value = withTiming(0, {
        duration: 120,
        easing: Easing.in(Easing.quad),
      })

      translateY.value = withTiming(
        SCREEN_HEIGHT,
        {
          duration: 150,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            // Correctly use runOnJS with the named function
            runOnJS(cleanupAfterClose)()
          }
        }
      )
    },
    [backdropOpacity, translateY]
  )

  // Function for gesture-based closing that can be safely used with runOnJS
  const handleGestureClose = useCallback(() => {
    // This is a regular JS function that can be safely called from worklets
    closeSheet();
  }, [closeSheet]);

  // Gesture for swipe to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet'
      if (event.translationY > 0) {
        translateY.value = event.translationY
        backdropOpacity.value = Math.max(0, 1 - event.translationY / (SCREEN_HEIGHT * 0.3))
      }
    })
    .onEnd((event) => {
      'worklet'
      const shouldClose = event.translationY > 100 || event.velocityY > 500

      if (shouldClose) {
        // Faster + linear dismiss
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 120, // was 200
          easing: Easing.linear, // no curve, straight motion
        }, () => {
          runOnJS(handleGestureClose)()
        })
        backdropOpacity.value = withTiming(0, { duration: 120 })
      } else {
        // Snap back faster
        translateY.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.linear) })
        backdropOpacity.value = withTiming(1, { duration: 150 })
      }
    })


  const showJoinSheet = useCallback(({ game, onConfirm }) => {
    setSheetType("join")
    setPayload({
      game,
      rulesConfirmed: false,
      hasAccessCode: false,
      accessCode: ""
    })
    onConfirmRef.current = onConfirm || null
    setVisible(true)
  }, [])

  const showConfirmSheet = useCallback(
    ({ title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false, onConfirm }) => {
      setSheetType("confirm")
      setPayload({ title, message, confirmText, cancelText, isDestructive })
      onConfirmRef.current = onConfirm || null
      setVisible(true)
    },
    []
  )

  const showOpponentSheet = useCallback(({ opponent, onConfirm, isConfirmed, gameStatus }) => {
    setSheetType("opponent")
    setPayload({ opponent, isConfirmed, gameStatus })
    onConfirmRef.current = onConfirm || null
    setVisible(true)
  }, [])

  useEffect(() => {
    if (visible) {
      // Reset values before opening
      translateY.value = SCREEN_HEIGHT
      backdropOpacity.value = 0
      openSheet()
    }
  }, [visible, openSheet, translateY, backdropOpacity])

  // Back press handler
  useEffect(() => {
    const onBack = () => {
      if (visible) {
        closeSheet()
        return true
      }
      return false
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack)
    return () => sub.remove()
  }, [visible, closeSheet])

  const handleCancel = useCallback(() => closeSheet(), [closeSheet])

  const handleConfirm = useCallback(() => {
    const cb = onConfirmRef.current

    if (sheetType === "join" && !payload?.rulesConfirmed) {
      shakeTextRef.current?.shake()
      return
    }

    // Validate access code if "I have access code" is selected
    if (sheetType === "join" && payload?.hasAccessCode && !payload?.accessCode?.trim()) {
      // You might want to show an error toast here
      return
    }

    closeSheet(() => {
      if (typeof cb === "function") {
        if (sheetType === "opponent") {
          cb(payload?.opponent)
        } else if (sheetType === "join") {
          // Pass both challenge ID and access code (if provided)
          const joinData = {
            challenge_id: payload?.game?.id,
            access_code: payload?.hasAccessCode ? payload?.accessCode : undefined
          }
          cb(joinData)
        } else {
          cb(payload?.game?.id)
        }
      }
    })
  }, [closeSheet, payload, sheetType])

  const navigateToRules = useCallback(
    (gameToFind) => {
      const allRules = queryClient.getQueryData(["gameRules"])

      if (allRules && Array.isArray(allRules)) {
        const gameRule = allRules.find(
          (rule) => rule.game_name?.toLowerCase() === gameToFind?.game?.name?.toLowerCase()
        )

        if (gameRule) {
          NavigationService.navigate("rulesList", {
            game: gameRule,
            returnToJoinSheet: true,
            gameData: gameToFind,
          })
        } else {
          NavigationService.navigate("gameRules")
        }
      } else {
        NavigationService.navigate("gameRules")
      }
    },
    [queryClient]
  )

  const checkAndReopenSheet = useCallback(
    (params) => {
      if (params?.returnToJoinSheet && params?.gameData) {
        const savedCallback = savedCallbackRef.current
        showJoinSheet({
          game: params.gameData,
          onConfirm: savedCallback,
        })
        return true
      }
      return false
    },
    [showJoinSheet]
  )

  const value = useMemo(
    () => ({
      showJoinSheet,
      showConfirmSheet,
      showOpponentSheet,
      closeSheet,
      checkAndReopenSheet,
    }),
    [showJoinSheet, showConfirmSheet, showOpponentSheet, closeSheet, checkAndReopenSheet]
  )

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const game = payload?.game

  return (
    <BottomSheetContext.Provider value={value} style={{ flex: 1, paddingBottom: insets.bottom }}>
      {children}
      <View style={[styles.overlayRoot]} pointerEvents="box-none">
        {visible ? (
          <>
            <Animated.View
              style={[styles.backdrop, backdropAnimatedStyle]}
              pointerEvents="auto"
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
            </Animated.View>
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.sheetContainer,
                  sheetAnimatedStyle,
                  {
                    backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                    borderColor: isDark ? "#ffffff" : "#333333",
                  },
                ]}
                pointerEvents="auto"
              >
                {/* Drag handle */}
                <View style={styles.dragHandle}>
                  <View style={[styles.dragIndicator, { backgroundColor: isDark ? "#666666" : "#cccccc" }]} />
                </View>

                {sheetType === "join" && game ? (
                  <JoinSheetContent
                    game={game}
                    payload={payload}
                    setPayload={setPayload}
                    isDark={isDark}
                    insets={insets}
                    handleCancel={handleCancel}
                    handleConfirm={handleConfirm}
                    shakeTextRef={shakeTextRef}
                    onConfirmRef={onConfirmRef}
                    savedCallbackRef={savedCallbackRef}
                    closeSheet={closeSheet}
                    navigateToRules={navigateToRules}
                  />
                ) : null}

                {sheetType === "confirm" ? (
                  <ConfirmSheetContent
                    payload={payload}
                    isDark={isDark}
                    insets={insets}
                    handleCancel={handleCancel}
                    handleConfirm={handleConfirm}
                  />
                ) : null}

                {sheetType === "opponent" && payload?.opponent ? (
                  <OpponentSheetContent
                    payload={payload}
                    isDark={isDark}
                    insets={insets}
                    handleCancel={handleCancel}
                    handleConfirm={handleConfirm}
                  />
                ) : null}
              </Animated.View>
            </GestureDetector>
          </>
        ) : null}
      </View>
    </BottomSheetContext.Provider>
  )
}

const JoinSheetContent = React.memo(
  ({
    game,
    payload,
    setPayload,
    isDark,
    insets,
    handleCancel,
    handleConfirm,
    shakeTextRef,
    onConfirmRef,
    savedCallbackRef,
    closeSheet,
    navigateToRules,
  }) => {
    return (
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: isDark ? "#ffffff" : "#333333" }]}>Join Match</Text>
 
        </View>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gameRow}>
            <View style={[styles.gameItem, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
              <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Game</Text>
              <Text style={[styles.value, { color: isDark ? "#ffffff" : "#333333" }]}>{game.game?.name}</Text>
            </View>
            <View style={[styles.gameItem, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
              <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Mode</Text>
              <Text style={[styles.value, { color: isDark ? "#ffffff" : "#333333" }]}>{game.game?.game_mode}</Text>
            </View>
          </View>
          {game.created_by.role === "customer" && (
            <>
              {/* For chess, show only Creator name in a single full-width card */}
              {game.game?.name?.toLowerCase() === "chess" ? (
                <View style={[styles.infoRowCompact, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
                  <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Creator</Text>
                  <Text style={[styles.value, { color: isDark ? "#ffffff" : "#333333" }]} numberOfLines={1}>
                    {game.created_by?.full_name}
                  </Text>
                </View>
              ) : (
                // For other games, show Creator and UID side by side
                <View style={styles.gameRow}>
                  <View style={[styles.gameItem, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
                    <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Creator</Text>
                    <Text style={[styles.value, { color: isDark ? "#ffffff" : "#333333" }]} numberOfLines={1}>
                      {game.created_by?.full_name}
                    </Text>
                  </View>
                  <View style={[styles.gameItem, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
                    <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>UID</Text>
                    <Text style={[styles.value, { color: isDark ? "#ffffff" : "#333333" }]} numberOfLines={1}>
                      {game.created_by?.game_uid}
                    </Text>
                  </View>
                </View>
              )}

              {/* <View style={[styles.infoRowCompact, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
                <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Fight Type</Text>
                <View style={[styles.fightTypePill, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
                  <Text style={[styles.fightTypeText, { color: isDark ? "#ffffff" : "#333333" }]} numberOfLines={1}>
                    {game.fight_type}
                  </Text>
                </View>
              </View> */}
            </>

          )}



          {/* Entry Fee or Access Code Section */}

          
          
          {!payload.hasAccessCode && !game.is_free ? (
            <View style={[styles.infoRowCompact, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
              <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Entry Points</Text>
              <View style={styles.feeBox}>
                <Text style={styles.feeText}>{game.entry_fee} (Points)</Text>
              </View>
            </View>
          ) : !game.is_free && (
            <View style={[styles.infoRowCompact, { borderColor: isDark ? "#ffffff" : "#333333" }]}>
              <Text style={[styles.label, { color: isDark ? "#cccccc" : "#666666" }]}>Access Code</Text>
              <Pressable
                style={[
                  styles.accessCodeInput,
                  {
                    borderColor: isDark ? "#ffffff" : "#333333",
                    backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5",
                    justifyContent: "center",
                  }
                ]}
                onPress={async () => {
                  try {
                    const clipboardContent = await Clipboard.getString();
                    if (clipboardContent) {
                      setPayload((prev) => ({ ...prev, accessCode: clipboardContent.trim() }));
                    }
                  } catch (error) {
                    console.log('Failed to read clipboard:', error);
                  }
                }}
              >
                <Text
                  style={[
                    {
                      fontSize: 14,
                      color: payload.accessCode
                        ? (isDark ? "#ffffff" : "#333333")
                        : (isDark ? "#666666" : "#999999")
                    }
                  ]}
                  numberOfLines={1}
                >
                  {payload.accessCode || "Paste your access code"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Single Toggle Text */}
          {
            game?.access_based && (
              <Pressable
                style={styles.toggleTextButton}
                onPress={() => setPayload((prev) => ({
                  ...prev,
                  hasAccessCode: !prev.hasAccessCode,
                  accessCode: prev.hasAccessCode ? "" : prev.accessCode
                }))}
              >
                <Text style={[styles.toggleLinkText, { color: "#00C851" }]}>
                  {payload.hasAccessCode ? "I don't have access code" : "I have access code"}
                </Text>
              </Pressable>
            )
          }


          <View style={[styles.rulesContainer, styles.checkboxContainer]}>
            {/* Make checkbox + terms text both toggleable */}
            <Pressable
              onPress={() => setPayload((prev) => ({ ...prev, rulesConfirmed: !prev.rulesConfirmed }))}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.pressableArea}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!payload.rulesConfirmed }}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: isDark ? '#ffffff' : '#000000',
                    backgroundColor: payload.rulesConfirmed
                      ? (isDark ? '#ffffff' : '#000000')
                      : 'transparent',
                  },
                ]}
              >
                {payload.rulesConfirmed ? (
                  <Text style={[styles.checkMark, { color: isDark ? '#000000' : '#ffffff' }]}>✓</Text>
                ) : null}
              </View>
              <ShakeText ref={shakeTextRef}>
                <Text
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                    fontSize: scaleWidth(14),
                  }}
                >
                  I have read the game rules and regulations.
                </Text>
              </ShakeText>
            </Pressable>
            <Pressable
              style={styles.rulesLink}
              onPress={() => {
                const gameToFind = { ...game }
                savedCallbackRef.current = onConfirmRef.current
                closeSheet(() => {
                  navigateToRules(gameToFind)
                }, true)
              }}
            >
              <Text style={styles.rulesLinkText}>Read rules</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.actionsRow, { paddingBottom: Math.max(8, insets.bottom || 0) }]}>
          <Pressable
            style={[styles.btn, styles.cancelBtn, { borderColor: isDark ? "#eaf4f4" : "#333333" }]}
            onPress={handleCancel}
          >
            <Text style={[styles.btnText, { color: isDark ? "#ffffff" : "#333333" }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.joinBtn, { backgroundColor: isDark ? "#eaf4f4" : "#000000" }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.btnText, { color: isDark ? "#000000" : "#ffffff" }]}>Join</Text>
          </Pressable>
        </View>
      </View>
    )
  }
)

const ConfirmSheetContent = React.memo(({ payload, isDark, insets, handleCancel, handleConfirm }) => (
  <View style={styles.content}>
    <View style={styles.headerRow}>
      <Text style={[styles.title, { color: isDark ? "#ffffff" : "#333333" }]}>{payload?.title || "Are you sure?"}</Text>
    </View>

    {payload?.message ? (
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: isDark ? "#cccccc" : "#666666", lineHeight: 18 }}>{payload.message}</Text>
      </ScrollView>
    ) : null}

    <View style={[styles.actionsRow, { paddingBottom: insets.bottom }]}>
      <Pressable
        style={[styles.btn, styles.cancelBtn, { borderColor: isDark ? "#ffffff" : "#333333" }]}
        onPress={handleCancel}
      >
        <Text style={[styles.btnText, { color: isDark ? "#ffffff" : "#333333" }]}>
          {payload?.cancelText || "Cancel"}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.btn,
          styles.joinBtn,
          {
            backgroundColor: payload?.isDestructive ? (isDark ? "#ffffff" : "#000000") : isDark ? "#00C851" : "#000000",
          },
        ]}
        onPress={handleConfirm}
      >
        <Text style={[styles.btnText, isDark ? { color: "#000000" } : { color: "#ffffff" }]}>
          {payload?.confirmText || "Confirm"}
        </Text>
      </Pressable>
    </View>
  </View>
))




export const useBottomSheet = () => useContext(BottomSheetContext)

const styles = StyleSheet.create({
  overlayRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    maxHeight: Math.round(SCREEN_HEIGHT * 0.5),
    elevation: 10, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dragHandle: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingTop: 0, // Reduced since we have drag handle
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gameRow: {
    flexDirection: "row",
    gap: 12,
  },
  gameItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  feeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feeText: {
    color: "#00bf63",
    fontWeight: "700",
  },
  fightTypePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fightTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 0,
 
  },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  joinBtn: {},
  btnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmedStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: "100%",
  },
  confirmedStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profilePictureContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    alignSelf: "center",
    top: "35%",
    zIndex: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rulesContainer: {
    marginVertical: 6,
    paddingHorizontal: 5,
    flexDirection: "row",
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: -1,
  },
  rulesLink: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  rulesLinkText: {
    color: "#00C851",
    fontSize: scaleWidth(14),
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  toggleTextButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toggleLinkText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  accessCodeInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    marginLeft: 10,
    minWidth: 120,
  },
})