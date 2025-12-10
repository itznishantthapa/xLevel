"use client"

import {
  StyleSheet,
  TextInput,
  Image,
  Text,
  View,
  Keyboard,
  Platform,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useThemeStore } from "../../store/themeStore"
import { useEffect, useState, useRef } from "react"
import Toast from "react-native-simple-toast"
import { useEditGameProfile } from "../../queries/useMutation/useEditGameProfile"
import { CreateGameLayout, SectionTitle } from "../../component/customer/createGame"
import * as yup from 'yup'
import { vulgarWords } from "../../utils/censored"

// Create a comprehensive list of vulgar words for validation
const getAllVulgarWords = () => {
  const words = []
  vulgarWords.vulgar_words.forEach(item => {
    if (item.nepali) words.push(item.nepali.toLowerCase())
    if (item.english) words.push(item.english.toLowerCase())
  })
  return words
}

// Function to check if text contains vulgar words
const containsVulgarWord = (text) => {
  if (!text) return false
  const lowerText = text.toLowerCase()
  const vulgarList = getAllVulgarWords()
  
  // Check if any vulgar word is included in the text
  return vulgarList.some(vulgarWord => {
    if (vulgarWord && vulgarWord.trim()) {
      return lowerText.includes(vulgarWord.toLowerCase())
    }
    return false
  })
}

// Define validation schemas for different game types
const baseValidationSchema = yup.object().shape({
  game_username: yup
    .string()
    .matches(/^[\x00-\x7F]*$/, 'No emojis allowed in username')
    .matches(/^[a-zA-Z0-9_\-\s]+$/, 'Only letters, numbers, spaces, underscores and hyphens allowed')
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .test('vulgar-check', 'Inappropriate game name.', function(value) {
      return !containsVulgarWord(value)
    })
    .required('Game username is required'),
})

// Relaxed validation for games that allow emojis and special characters
const relaxedUsernameValidationSchema = yup.object().shape({
  game_username: yup
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .test('vulgar-check', 'Inappropriate game name.', function(value) {
      return !containsVulgarWord(value)
    })
    .required('Game username is required'),
})

const chessValidationSchema = baseValidationSchema.shape({
  total_games_played: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) >= 0 : false)
    .required('Total games played is required'),
  rapid_rating: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) >= 0 : false)
    .test('max-value', 'Rapid rating cannot exceed 3600', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) <= 3600 : false)
    .required('Rapid rating is required'),
  blitz_rating: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) >= 0 : false)
    .test('max-value', 'Blitz rating cannot exceed 3600', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) <= 3600 : false)
    .required('Blitz rating is required'),
  bullet_rating: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) >= 0 : false)
    .test('max-value', 'Bullet rating cannot exceed 3600', v => (v !== undefined && v !== null && v !== '') ? parseInt(v) <= 3600 : false)
    .required('Bullet rating is required'),
})

// Base schema for Free Fire / PUBG before length specialization
const freeFirePubgValidationSchema = relaxedUsernameValidationSchema.shape({
  uid: yup
    .string()
    .matches(/^[0-9]+$/, 'UID must contain only digits')
    .required('Game UID is required'),
  level: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', (value) => {
      return value ? parseInt(value) >= 0 : false
    })
    .required('Level is required'),
})

const efootballValidationSchema = relaxedUsernameValidationSchema.shape({
  uid: yup
    .string()
    .transform(v => (v ? v.replace(/-/g, '').toUpperCase() : v))
    .matches(/^[A-Z0-9]{13}$/,'eFootball ID must be exactly 13 characters (A-Z, 0-9)')
    .required('Game UID is required'),
  current_division: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('division-range', 'Division must be between 0-10', (value) => {
      if (!value) return false
      const division = parseInt(value)
      return division >= 0 && division <= 10
    })
    .required('Current division is required'),
  highest_division: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('division-range', 'Division must be between 0-10', (value) => {
      if (!value) return false
      const division = parseInt(value)
      return division >= 0 && division <= 10
    })
    .required('Highest division is required'),
  courtesy_rating: yup
    .string()
    .matches(/^[A-Za-z]$/, 'Must be a single letter')
    .required('Courtesy rating is required'),
})

const defaultGameValidationSchema = baseValidationSchema.shape({
  game_uid: yup
    .string()
    .matches(/^[A-Za-z0-9]+$/, 'Only letters and numbers allowed')
    .min(1, 'UID is required')
    .max(20, 'UID cannot exceed 20 characters')
    .required('Game UID is required'),
  game_level: yup
    .string()
    .matches(/^[0-9]+$/, 'Must be a valid number')
    .test('min-value', 'Must be 0 or greater', (value) => {
      return value ? parseInt(value) >= 0 : false
    })
    .required('Game level is required'),
})

/**
 * EditGameInfo Component
 * Handles both creation and editing of game profiles with game-specific fields
 */
const EditGameInfo = () => {
  // Hooks
  const navigation = useNavigation()
  const route = useRoute()
  const { isLight } = useThemeStore()
  const { mutateAsync: saveProfile, isLoading: isSaving } = useEditGameProfile()
  const scrollViewRef = useRef(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)



  // Get game data and check if editing mode
  const { game, profile } = route.params
  const isEditing = !!profile
  const gameName = (profile?.game_name || game?.game_name || "").toLowerCase()

  // Initialize game profile form state based on game type
  const getInitialProfileState = () => {
    const baseState = {
      game_id: profile?.game_id || game?.game_id,
      game_name: profile?.game_name || game?.game_name,
      game_username: profile?.game_username || "",
      game_logo_url: profile?.game_logo_url || game?.game_logo_url,
    }

    switch (gameName) {
      case "chess":
        return {
          ...baseState,
          total_games_played: profile?.total_games_played?.toString() || "",
          rapid_rating: profile?.rapid_rating?.toString() || "",
          blitz_rating: profile?.blitz_rating?.toString() || "",
          bullet_rating: profile?.bullet_rating?.toString() || "",
        }

      case "free fire":
        return {
          ...baseState,
          uid: profile?.uid || profile?.game_uid || "",
          level: profile?.level?.toString() || profile?.game_level?.toString() || "",
        }
      case "pubg":
        return {
          ...baseState,
          uid: profile?.uid || profile?.game_uid || "",
          level: profile?.level?.toString() || profile?.game_level?.toString() || "",
        }

      case "efootball":
        return {
          ...baseState,
          uid: profile?.uid || profile?.game_uid || "",
          current_division: profile?.current_division?.toString() || profile?.game_level?.toString() || "",
          highest_division: profile?.highest_division?.toString() || "",
          courtesy_rating: profile?.courtesy_rating || "",
        }

      default:
        return {
          ...baseState,
          game_uid: profile?.game_uid || "",
          game_level: profile?.game_level?.toString() || "0",
        }
    }
  }

  const [gameProfile, setGameProfile] = useState(getInitialProfileState())
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardVisible(true)
        scrollViewRef.current?.scrollTo({
          y: Platform.OS === "ios" ? 20 : 50,
          animated: true,
        })
      },
    )

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false)
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        })
      },
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [])

  // Update profile field helper with real-time validation
  const updateProfile = (field, value) => {
    let transformed = value
    if (field === 'uid' || field === 'game_uid') {
      switch (gameName) {
        case 'efootball':
          transformed = value.replace(/-/g, '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,13)
          break
        case 'free fire':
          transformed = value.replace(/[^0-9]/g,'').slice(0,12)
          break
        case 'pubg':
          transformed = value.replace(/[^0-9]/g,'').slice(0,15)
          break
        default:
          transformed = value.replace(/[^A-Za-z0-9]/g,'')
      }
    }
    setGameProfile((prev) => ({ ...prev, [field]: transformed }))
    // Clear error when user starts typing and validate field
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    validateField(field, transformed)
  }

  // Get the appropriate validation schema based on game type
  const getValidationSchema = () => {
    switch (gameName) {
      case 'chess':
        return chessValidationSchema
      case 'free fire':
        return freeFirePubgValidationSchema.shape({
          uid: freeFirePubgValidationSchema.fields.uid.clone().test('ff-length','Free Fire UID must be 9-12 digits', v => !!v && /^[0-9]{9,12}$/.test(v))
        })
      case 'pubg':
        return freeFirePubgValidationSchema.shape({
          uid: freeFirePubgValidationSchema.fields.uid.clone().test('pubg-length','PUBG UID must be 8-15 digits', v => !!v && /^[0-9]{8,15}$/.test(v))
        })
      case 'efootball':
        return efootballValidationSchema
      default:
        return defaultGameValidationSchema
    }
  }

  // Validate single field on change
  const validateField = async (field, value) => {
    try {
      const schema = getValidationSchema()
      // Get the validation for just this field from the schema
      await yup.reach(schema, field).validate(value)
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, [field]: '' }))
    } catch (error) {
      // Set error message
      setErrors(prev => ({ ...prev, [field]: error.message }))
    }
  }

  // Validation based on game type using Yup
  const validateProfile = async () => {
    try {
      // Reset errors
      setErrors({})
      
      const schema = getValidationSchema()
      await schema.validate(gameProfile, { abortEarly: false })
      
      return true
    } catch (error) {
      // Handle validation errors
      const newErrors = {}
      
      if (error.inner) {
        error.inner.forEach((err) => {
          newErrors[err.path] = err.message
        })
      } else {
        // Single error
        newErrors[error.path] = error.message
      }
      
      setErrors(newErrors)
      return false
    }
  }

  // Handle save with proper data formatting
  const handleSave = async () => {
    // Validate all fields before saving
    const isValid = await validateProfile()
    if (!isValid) {
      return
    }

    try {
      setIsLoading(true)
      const apiData = { ...gameProfile }

      // Convert string fields to numbers for API
      switch (gameName) {
        case "chess":
          apiData.total_games_played = Number.parseInt(gameProfile.total_games_played)
          apiData.rapid_rating = Number.parseInt(gameProfile.rapid_rating)
          apiData.blitz_rating = Number.parseInt(gameProfile.blitz_rating)
          apiData.bullet_rating = Number.parseInt(gameProfile.bullet_rating)
          break
        
        case "free fire":
        case "pubg":
          apiData.level = Number.parseInt(gameProfile.level)
          break
        
        case "efootball":
          apiData.current_division = Number.parseInt(gameProfile.current_division)
          apiData.highest_division = Number.parseInt(gameProfile.highest_division)
          break
        
        default:
          if (gameProfile.game_level) {
            apiData.game_level = Number.parseInt(gameProfile.game_level)
          }
          break
      }

        Keyboard.dismiss()
      await saveProfile(apiData)
      navigation.goBack()
    } catch (error) {
      Toast.show(error?.message , Toast.SHORT)
       if (__DEV__) {
        console.log("Error saving profile:", error)
       }
    } finally {
      setIsLoading(false)
    }
  }

  // Render form fields based on game type
  const renderGameSpecificFields = () => {
    const inputStyle = [
      styles.input,
      {
        backgroundColor: isLight ? "transparent" : "#1a1a1a",
        borderColor: isLight ? "#cccccc" : "#333333",
        color: isLight ? "#333333" : "#ffffff",
      },
    ]

    switch (gameName) {
      case "chess":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Total Games Played *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.total_games_played && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.total_games_played}
                onChangeText={(text) => updateProfile("total_games_played", text)}
                placeholder="Must played 1000+"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
              />
              {errors.total_games_played ? (
                <Text style={styles.errorText}>{errors.total_games_played}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Rapid Rating *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.rapid_rating && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.rapid_rating}
                onChangeText={(text) => updateProfile("rapid_rating", text)}
                placeholder="Enter your rapid rating (Approx.)"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
              />
              {errors.rapid_rating ? (
                <Text style={styles.errorText}>{errors.rapid_rating}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Blitz Rating *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.blitz_rating && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.blitz_rating}
                onChangeText={(text) => updateProfile("blitz_rating", text)}
                placeholder="Enter your blitz rating (Approx.)"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
              />
              {errors.blitz_rating ? (
                <Text style={styles.errorText}>{errors.blitz_rating}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Bullet Rating *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.bullet_rating && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.bullet_rating}
                onChangeText={(text) => updateProfile("bullet_rating", text)}
                placeholder="Enter your bullet rating (Approx.)"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
              />
              {errors.bullet_rating ? (
                <Text style={styles.errorText}>{errors.bullet_rating}</Text>
              ) : null}
            </View>
          </>
        )

      case "free fire":
      case "pubg":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game UID *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.uid && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.uid}
                onChangeText={(text) => updateProfile("uid", text)}
                placeholder="Paste Your Game UID Accurately."
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                maxLength={20}
              />
              {errors.uid ? (
                <Text style={styles.errorText}>{errors.uid}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Level *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.level && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.level}
                onChangeText={(text) => updateProfile("level", text)}
                placeholder="Enter Your Game Level Accurately."
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.level ? (
                <Text style={styles.errorText}>{errors.level}</Text>
              ) : null}
            </View>
          </>
        )

      case "efootball":
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game UID *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.uid && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.uid}
                onChangeText={(text) => updateProfile("uid", text)}
                placeholder="Ex. ABCD001002003"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                maxLength={20}
              />
              {errors.uid ? (
                <Text style={styles.errorText}>{errors.uid}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Current Division (0-10) *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.current_division && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.current_division}
                onChangeText={(text) => updateProfile("current_division", text)}
                placeholder="Ex. 3"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
                maxLength={2}
              />
              {errors.current_division ? (
                <Text style={styles.errorText}>{errors.current_division}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Highest Division *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.highest_division && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.highest_division}
                onChangeText={(text) => updateProfile("highest_division", text)}
                placeholder="Ex. 1"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
                maxLength={2}
              />
              {errors.highest_division ? (
                <Text style={styles.errorText}>{errors.highest_division}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Courtesy Rating *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.courtesy_rating && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.courtesy_rating}
                onChangeText={(text) => updateProfile("courtesy_rating", text.toUpperCase())}
                placeholder="Ex. A"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                maxLength={1}
              />
              {errors.courtesy_rating ? (
                <Text style={styles.errorText}>{errors.courtesy_rating}</Text>
              ) : null}
            </View>
          </>
        )

      default:
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game UID *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.game_uid && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.game_uid || ""}
                onChangeText={(text) => updateProfile("game_uid", text)}
                placeholder="Ex. 123456789"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                maxLength={20}
              />
              {errors.game_uid ? (
                <Text style={styles.errorText}>{errors.game_uid}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game Level *</Text>
              <TextInput
                style={[
                  inputStyle,
                  errors.game_level && {
                    borderColor: "#FF4444",
                  }
                ]}
                value={gameProfile.game_level || ""}
                onChangeText={(text) => updateProfile("game_level", text)}
                placeholder="Ex. 65"
                placeholderTextColor={isLight ? "#666666" : "#999999"}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.game_level ? (
                <Text style={styles.errorText}>{errors.game_level}</Text>
              ) : null}
            </View>
          </>
        )
    }
  }

  return (
    <CreateGameLayout
      title={isEditing ? "Edit Game Profile" : "Setup Game Profile"}
      isLight={isLight}
      isLoading={isLoading}
      onSubmit={handleSave}
      scrollViewRef={scrollViewRef}
      keyboardVisible={keyboardVisible}
      buttonTitle={isEditing ? "Update Profile" : "Save Profile"}
      loaderMessage={isEditing ? "Updating..." : "Saving..."}
    >
      {/* Game Info Header */}
      <View style={[styles.gameHeader, { backgroundColor: isLight ? "#rgba(0, 0, 0, 0.05)" : "#1a1a1a" }]}>
        <Image source={{ uri: gameProfile.game_logo_url }} style={styles.gameLogo} />
        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, { color: isLight ? "#333333" : "#ffffff" }]}>{gameProfile.game_name === 'Chess' ? "Chess.com" : gameProfile.game_name}</Text>
          <Text style={[styles.gameModes, { color: isLight ? "#666666" : "#999999" }]}>
            {(isEditing ? profile?.game_mode : game?.game_modes?.join(", "))?.split(", ").join(" • ") ||
              "No game modes"}
          </Text>
        </View>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        {/* Info Text */}
        <View style={[styles.infoContainer, { backgroundColor: "transparent", borderColor: isLight ? "#000000" : "#ffffff" }]}>
          <Text style={[styles.infoText, { color: isLight ? "#000000" : "#ffffff" }]}>
            Please fill your game details accurately and correctly. Ensure all information matches your in-game profile exactly.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Game Username Input - Common for all games */}
          <View style={styles.inputGroup}>
            {
              gameName === 'chess' ? (
                <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game Username *</Text>

              ) : (
                <Text style={[styles.fieldLabel, { color: isLight ? "#333333" : "#ffffff" }]}>Game Name *</Text>

              )
            }
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isLight ? "transparent" : "#1a1a1a",
                  borderColor: isLight ? "#cccccc" : "#333333",
                  color: isLight ? "#333333" : "#ffffff",
                },
                errors.game_username && {
                  borderColor: "#FF4444",
                }
              ]}
              value={gameProfile.game_username}
              onChangeText={(text) => updateProfile("game_username", text)}
              placeholder={"Copy & Paste In-Game Name."}
              placeholderTextColor={isLight ? "#666666" : "#999999"}
              maxLength={30}
            />
            {errors.game_username ? (
              <Text style={styles.errorText}>{errors.game_username}</Text>
            ) : null}
          </View>

          {/* Game-specific fields */}
          {renderGameSpecificFields()}
        </View>
        
        {/* Game Profile Update Restriction Notice */}
        <View style={styles.noticeContainer}>
          <Text style={[styles.noticeText, { color: isLight ? "#000000" : "#ffffff" }]}>
            "You can update your {gameProfile.game_name} profile once every 7 days"
          </Text>
        </View>
      </View>
    </CreateGameLayout>
  )
}

export default EditGameInfo

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  gameHeader: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 0,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderRadius: 12,
  },
  gameLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  gameModes: {
    fontSize: 13,
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4444',
    marginTop: 4,
  },
  noticeContainer: {
    padding: 12,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
})
