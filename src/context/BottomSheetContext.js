"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  BackHandler,
  Dimensions,
  Image,
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
import { AppIcon, PointsIcon } from "../components/common/AppIcon"
import { UserIcon, InformationCircleIcon, Notification01Icon } from "@hugeicons/core-free-icons"
import { NavigationService } from "../service/navigationService"
import { useQueryClient } from "@tanstack/react-query"
import OpponentSheetContent from "./component/OpponentSheetContent"
import { ShakeText } from "../component/customer/animation"
import { fontSize, spacing, iconSize } from '../theme/typography';

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
        () => {
          // Always run cleanup, even if the animation was interrupted
          // (finished === false). Otherwise the sheet's onConfirm callback
          // is silently dropped and the sheet can get stuck.
          runOnJS(cleanupAfterClose)()
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

  const showPurchaseSheet = useCallback(({ product, onConfirm }) => {
    setSheetType("purchase")
    setPayload({ product })
    onConfirmRef.current = onConfirm || null
    setVisible(true)
  }, [])

  const showGameCreationNotificationSheet = useCallback(
    ({
      alertTitle,
      message,
      confirmText = "Turn On",
      cancelText = "Cancel",
      isDestructive = false,
      showAlertIcon = true,
      alertTag = "ALERT",
      onConfirm,
    }) => {
      setSheetType("gameCreationNotification")
      setPayload({
        alertTitle,
        message,
        confirmText,
        cancelText,
        isDestructive,
        showAlertIcon,
        alertTag,
      })
      onConfirmRef.current = onConfirm || null
      setVisible(true)
    },
    []
  )

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

    // Run the topic subscribe/unsubscribe immediately so its loading state
    // is visible while the sheet closes and it can't be lost if the close
    // animation gets interrupted.
    if (sheetType === "gameCreationNotification") {
      if (typeof cb === "function") cb()
      closeSheet()
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
      showPurchaseSheet,
      showGameCreationNotificationSheet,
      closeSheet,
      checkAndReopenSheet,
    }),
    [showJoinSheet, showConfirmSheet, showOpponentSheet, showPurchaseSheet, showGameCreationNotificationSheet, closeSheet, checkAndReopenSheet]
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
                  sheetType === "purchase" && styles.purchaseSheetContainer,
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

                {sheetType === "purchase" && payload?.product ? (
                  <PurchaseSheetContent
                    payload={payload}
                    isDark={isDark}
                    insets={insets}
                    handleCancel={handleCancel}
                    handleConfirm={handleConfirm}
                  />
                ) : null}

                {sheetType === "gameCreationNotification" ? (
                  <GameCreationNotificationSheetContent
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
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.gameRow}>
            <View style={[styles.gameItem, { backgroundColor: isDark ? "#2a2a2a" : "#e5e5e5", borderColor: isDark ? "#3a3a3a" : "#d0d0d0" }]}>
              <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>GAME</Text>
              <Text style={[styles.value, { color: isDark ? "#ffffff" : "#000000" }]}>{game.game?.name}</Text>
            </View>
            <View style={[styles.gameItem, { backgroundColor: isDark ? "#2a2a2a" : "#e5e5e5", borderColor: isDark ? "#3a3a3a" : "#d0d0d0" }]}>
              <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>MODE</Text>
              <Text style={[styles.value, { color: isDark ? "#ffffff" : "#000000" }]}>{game.game?.game_mode}</Text>
            </View>
          </View>
          {game?.created_by?.role === "customer" && (
            <>
              {/* For chess, show only Creator name in a single full-width card */}
              {game.game?.name?.toLowerCase() === "chess" ? (
                <View style={[styles.infoRowCompact, { backgroundColor: isDark ? "#2a2a2a" : "#e5e5e5", borderColor: isDark ? "#3a3a3a" : "#d0d0d0" }]}>
                  <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>CREATOR</Text>
                  <Text style={[styles.value, { color: isDark ? "#ffffff" : "#000000" }]} numberOfLines={1}>
                    {game.created_by?.full_name}
                  </Text>
                </View>
              ) : (
                // For other games, show Creator and UID side by side
                <View style={styles.gameRow}>
                  <View style={[styles.gameItem, { backgroundColor: isDark ? "#2a2a2a" : "#e5e5e5", borderColor: isDark ? "#3a3a3a" : "#d0d0d0" }]}>
                    <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>CREATOR</Text>
                    <Text style={[styles.value, { color: isDark ? "#ffffff" : "#000000" }]} numberOfLines={1}>
                      {game.created_by?.full_name}
                    </Text>
                  </View>
                  <View style={[styles.gameItem, { backgroundColor: isDark ? "#2a2a2a" : "#e5e5e5", borderColor: isDark ? "#3a3a3a" : "#d0d0d0" }]}>
                    <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>UID</Text>
                    <Text style={[styles.value, { color: isDark ? "#ffffff" : "#000000" }]} numberOfLines={1}>
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
            <View style={styles.entryPointsCard}>
              <View style={[styles.entryGlowBorder, { borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }]}>
                <View style={styles.entryInner}>
                  <View style={[styles.entryCorner, styles.entryCornerTL, { borderColor: isDark ? "#ffffff" : "#000000" }]} />
                  <View style={[styles.entryCorner, styles.entryCornerTR, { borderColor: isDark ? "#ffffff" : "#000000" }]} />
                  <View style={[styles.entryCorner, styles.entryCornerBL, { borderColor: isDark ? "#ffffff" : "#000000" }]} />
                  <View style={[styles.entryCorner, styles.entryCornerBR, { borderColor: isDark ? "#ffffff" : "#000000" }]} />
                  <PointsIcon size={iconSize.sm} color={isDark ? "#00bf63" : "#00bf63"} />
                  <Text style={[styles.entryAmount, { color: isDark ? "#ffffff" : "#000000" }]}>{game.entry_fee}</Text>
                </View>
              </View>
              <View style={styles.entryTagLine}>
                <View style={[styles.entryDash, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }]} />
                <Text style={[styles.entryTagText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>ENTRY POINTS</Text>
                <View style={[styles.entryDash, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }]} />
              </View>
            </View>
          ) : !game.is_free && (
            <View style={[styles.infoRowCompact, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }]}>
              <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>ACCESS CODE</Text>
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
                <Text style={[styles.toggleLinkText, { color: isDark ? "#ffffff" : "#000000" }]}>
                  {payload.hasAccessCode ? "// USE POINTS" : "// USE ACCESS CODE"}
                </Text>
              </Pressable>
            )
          }


          <View style={[styles.rulesContainer, styles.checkboxContainer]}>
            {/* Make checkbox + terms text both toggleable */}
            <Pressable
              onPress={() => setPayload((prev) => ({ ...prev, rulesConfirmed: !prev.rulesConfirmed }))}
              hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
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
                    fontSize: fontSize.base,
                  }}
                >
                  I’ve accepted the game rules & terms.
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
              <Text style={[styles.rulesLinkText, { color: "#00bf63" }]}>[ GO TO RULES ]</Text>
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
        bounces={false}
      >
        <Text style={{ color: isDark ? "#cccccc" : "#666666", lineHeight: 18 }}>{payload.message}</Text>
      </ScrollView>
    ) : null}

    <View style={[styles.actionsRow, { paddingBottom: Math.max(8, insets.bottom || 0) }]}>
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

const GameCreationNotificationSheetContent = React.memo(({ payload, isDark, insets, handleCancel, handleConfirm }) => (
  <View style={[styles.content, gameCreationStyles.content]}>
    <View style={styles.entryPointsCard}>
      <View style={[styles.entryGlowBorder, gameCreationStyles.alertBox, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]}>
        <View style={[styles.entryInner, gameCreationStyles.alertInner]}>
          <View style={[styles.entryCorner, styles.entryCornerTL, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
          <View style={[styles.entryCorner, styles.entryCornerTR, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
          <View style={[styles.entryCorner, styles.entryCornerBL, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
          <View style={[styles.entryCorner, styles.entryCornerBR, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
          {payload?.showAlertIcon !== false ? (
            <AppIcon icon={Notification01Icon} size={iconSize.lg} color="#00bf63" />
          ) : null}
          <Text
            style={[styles.entryAmount, gameCreationStyles.alertTitle, { color: isDark ? '#ffffff' : '#000000' }]}
            numberOfLines={2}
          >
            {payload?.alertTitle || 'Game Alert'}
          </Text>
        </View>
      </View>
      <View style={styles.entryTagLine}>
        <View style={[styles.entryDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
        <Text style={[styles.entryTagText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
          {payload?.alertTag || 'ALERT'}
        </Text>
        <View style={[styles.entryDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
      </View>
    </View>

    <View style={[purchaseStyles.noticeContainer, gameCreationStyles.noticeContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
      <AppIcon icon={InformationCircleIcon} size={iconSize.md} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'} />
      <Text style={[purchaseStyles.noticeText, gameCreationStyles.noticeText, { color: isDark ? '#ffffff' : '#000000' }]}>
        {payload?.message}
      </Text>
    </View>

    <View style={[styles.actionsRow, gameCreationStyles.actionsRow, { paddingBottom: Math.max(12, insets.bottom || 0) }]}>
      <Pressable
        style={[styles.btn, styles.cancelBtn, gameCreationStyles.btn, { borderColor: isDark ? '#eaf4f4' : '#333333' }]}
        onPress={handleCancel}
      >
        <Text style={[styles.btnText, gameCreationStyles.btnText, { color: isDark ? '#ffffff' : '#333333' }]}>
          {payload?.cancelText || 'Cancel'}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.btn,
          styles.joinBtn,
          gameCreationStyles.btn,
          {
            backgroundColor: payload?.isDestructive
              ? (isDark ? '#ffffff' : '#000000')
              : (isDark ? '#eaf4f4' : '#000000'),
          },
        ]}
        onPress={handleConfirm}
      >
        <Text style={[styles.btnText, gameCreationStyles.btnText, { color: isDark ? '#000000' : '#ffffff' }]}>
          {payload?.confirmText || 'Turn On'}
        </Text>
      </Pressable>
    </View>
  </View>
))

const PURCHASE_STEPS = [
  'Chat with seller on WhatsApp and agree on the price.',
  "Purchase the account on app.",
  'After purchase, contact admin to validate the account.',
  'After successful account validation, you will receive login details on WhatsApp.',
  'Admin will release the point to the seller account.',
]

const IS_COMPACT_SCREEN = SCREEN_HEIGHT < 700

const PurchaseSheetContent = React.memo(({ payload, isDark, insets, handleCancel, handleConfirm }) => {
  const product = payload?.product
  if (!product) return null

  return (
    <View style={purchaseStyles.sheetContent}>
      <View style={purchaseStyles.contentBody}>
        {/* Seller Info */}
        <View style={purchaseStyles.sellerRow}>
          <View style={[
            purchaseStyles.sellerAvatar,
            { borderColor: isDark ? '#404040' : '#e0e0e0', backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
          ]}>
            {product.seller?.profile_picture && product.seller.profile_picture !== 'null' ? (
              <Image source={{ uri: product.seller.profile_picture }} style={purchaseStyles.sellerImage} />
            ) : (
              <AppIcon icon={UserIcon} size={iconSize.sm} color={isDark ? '#999999' : '#666666'} />
            )}
          </View>
          <View style={purchaseStyles.sellerInfo}>
            <Text style={[purchaseStyles.sellerName, { color: isDark ? '#ffffff' : '#1a1a1a' }]}>
              {product.seller?.full_name || 'Seller'}
            </Text>
            <Text style={[purchaseStyles.sellerLabel, { color: isDark ? '#888888' : '#666666' }]}>
              Seller
            </Text>
          </View>
        </View>

        {/* Purchase Guide */}
        <View
          style={[
            purchaseStyles.guideCard,
            IS_COMPACT_SCREEN && purchaseStyles.guideCardCompact,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            },
          ]}
        >
          <View style={purchaseStyles.guideTagLine}>
            <View style={[purchaseStyles.guideDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)' }]} />
            <Text style={[purchaseStyles.guideTag, { color: isDark ? '#ffffff' : '#000000' }]}>SAFE PURCHASE</Text>
            <View style={[purchaseStyles.guideDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)' }]} />
          </View>

          <Text
            style={[
              purchaseStyles.guideSubtitle,
              IS_COMPACT_SCREEN && purchaseStyles.compactText,
              { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)' },
            ]}
          >
            Follow these steps:
          </Text>

          {PURCHASE_STEPS.map((step, index) => (
            <View key={index} style={purchaseStyles.stepRow}>
              <View
                style={[
                  purchaseStyles.stepBadge,
                  { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                ]}
              >
                <Text style={[purchaseStyles.stepBadgeText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              <Text
                style={[
                  purchaseStyles.stepText,
                  IS_COMPACT_SCREEN && purchaseStyles.compactText,
                  { color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}

          <View
            style={[
              purchaseStyles.warningBlock,
              IS_COMPACT_SCREEN && purchaseStyles.warningBlockCompact,
              {
                borderColor: '#FF4444',
                backgroundColor: isDark ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 68, 68, 0.06)',
              },
            ]}
          >
            <View style={purchaseStyles.guideDividerRow}>
              <View style={[purchaseStyles.guideDividerLine, { backgroundColor: isDark ? 'rgba(255,68,68,0.45)' : 'rgba(255,68,68,0.35)' }]} />
              <View style={[purchaseStyles.guideWarningChip, { borderColor: '#FF4444', backgroundColor: isDark ? 'rgba(255,68,68,0.12)' : 'rgba(255,68,68,0.08)' }]}>
                <Text style={purchaseStyles.guideWarningChipText}>WARNING</Text>
              </View>
              <View style={[purchaseStyles.guideDividerLine, { backgroundColor: isDark ? 'rgba(255,68,68,0.45)' : 'rgba(255,68,68,0.35)' }]} />
            </View>

            <Text style={[purchaseStyles.warningText, IS_COMPACT_SCREEN && purchaseStyles.compactWarningText]}>
            Don't buy directly from sellers on WhatsApp. Verify with an admin first to avoid scams. ✓
            </Text>
          </View>
        </View>

        {/* Price Display */}
        <View style={[styles.entryPointsCard, purchaseStyles.priceCard]}>
          <View style={[styles.entryGlowBorder, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]}>
            <View style={styles.entryInner}>
              <View style={[styles.entryCorner, styles.entryCornerTL, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
              <View style={[styles.entryCorner, styles.entryCornerTR, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
              <View style={[styles.entryCorner, styles.entryCornerBL, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
              <View style={[styles.entryCorner, styles.entryCornerBR, { borderColor: isDark ? '#ffffff' : '#000000' }]} />
              <PointsIcon size={iconSize.sm} color="#00bf63" />
              <Text style={[styles.entryAmount, { color: isDark ? '#ffffff' : '#000000' }]}>{product.points?.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.entryTagLine}>
            <View style={[styles.entryDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
            <Text style={[styles.entryTagText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>PRICE</Text>
            <View style={[styles.entryDash, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
          </View>
        </View>
      </View>

      <View style={[styles.actionsRow, purchaseStyles.actionsRow, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
        <Pressable
          style={[styles.btn, styles.cancelBtn, { borderColor: isDark ? '#eaf4f4' : '#333333' }]}
          onPress={handleCancel}
        >
          <Text style={[styles.btnText, { color: isDark ? '#ffffff' : '#333333' }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.joinBtn, { backgroundColor: isDark ? '#eaf4f4' : '#000000' }]}
          onPress={handleConfirm}
        >
          <Text style={[styles.btnText, { color: isDark ? '#000000' : '#ffffff' }]}>Purchase</Text>
        </Pressable>
      </View>
    </View>
  )
})

const gameCreationStyles = StyleSheet.create({
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  alertBox: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    minWidth: '88%',
  },
  alertInner: {
    gap: 12,
  },
  alertTitle: {
    fontSize: fontSize['2xl'],
    letterSpacing: 1,
    textAlign: 'center',
    flexShrink: 1,
  },
  noticeContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  noticeText: {
    fontSize: fontSize.base,
    lineHeight: fontSize.lg + 4,
  },
  actionsRow: {
    marginTop: spacing.sm,
  },
  btn: {
    paddingVertical: 14,
  },
  btnText: {
    fontSize: fontSize.md,
  },
})

const purchaseStyles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 4,
  },
  contentBody: {
    gap: IS_COMPACT_SCREEN ? 6 : 10,
  },
  priceCard: {
    paddingVertical: IS_COMPACT_SCREEN ? 6 : 10,
  },
  actionsRow: {
    flexShrink: 0,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.25)',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IS_COMPACT_SCREEN ? 6 : 10,
    paddingBottom: IS_COMPACT_SCREEN ? 4 : 6,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sellerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  noticeContainer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  guideCard: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: IS_COMPACT_SCREEN ? 10 : 12,
    paddingHorizontal: IS_COMPACT_SCREEN ? 10 : 12,
    borderWidth: 1,
    borderRadius: 0,
    width: '100%',
    gap: IS_COMPACT_SCREEN ? 5 : 8,
  },
  guideCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  guideTagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  guideDash: {
    flex: 1,
    height: 1,
  },
  guideTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  guideSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  guideDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  guideDividerLine: {
    flex: 1,
    height: 1,
  },
  guideWarningChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 0,
  },
  guideWarningChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FF4444',
  },
  warningBlock: {
    flexShrink: 0,
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 0,
    gap: 8,
    width: '100%',
  },
  warningBlockCompact: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'left',
    color: '#FF4444',
    flexShrink: 0,
    width: '100%',
    letterSpacing: 0.1,
  },
  compactWarningText: {
    fontSize: 11,
    lineHeight: 17,
  },
  compactText: {
    fontSize: 11,
    lineHeight: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  stepBadge: {
    minWidth: 28,
    height: 22,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  stepText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    paddingTop: 1,
  },
})


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
    maxHeight: Math.round(SCREEN_HEIGHT * 0.75), // Increased from 0.5 to 0.75
    elevation: 10, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  purchaseSheetContainer: {
    maxHeight: Math.round(SCREEN_HEIGHT * 0.88),
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
    paddingTop: 0, // Reduced since we have drag handle
    maxHeight: Math.round(SCREEN_HEIGHT * 0.75) - 20, // Account for drag handle
  },
  scrollArea: {
    flexGrow: 1,
    flexShrink: 1,
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 2,
    borderWidth: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  infoRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 2,
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
  entryPointsCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  entryGlowBorder: {
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 32,
    position: "relative",
  },
  entryInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  entryCorner: {
    position: "absolute",
    width: 8,
    height: 8,
  },
  entryCornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  entryCornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  entryCornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  entryCornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  entryHeading: {
    fontSize: 13,
    fontWeight: "700",
  },
  entryAmount: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  entryUnit: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  entryTagLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryDash: {
    width: 20,
    height: 1,
  },
  entryTagText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
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
    gap: fontSize.xs,
    flexWrap: 'wrap',
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: fontSize.xs,
  },
  pressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fontSize.xs,
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: spacing.xl,
    height: spacing.xl,
    borderWidth: 1,
    borderRadius: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: spacing.xl,
    height: spacing.xl,
    borderWidth: spacing.xxs,
    borderRadius: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: spacing.md,
    fontWeight: '700',
    lineHeight: spacing.md,
    marginTop: -1,
  },
  rulesLink: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  rulesLinkText: {
    fontSize: spacing.md,
    fontWeight: "700",
    letterSpacing: 1,
  },
  toggleTextButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  toggleLinkText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
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