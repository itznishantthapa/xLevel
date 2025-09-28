import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Keyboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import { useEffect, useState } from 'react'
import { Ionicons, Octicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../store/themeStore'
import Loader from '../../component/Loader'
import AppHeader from './header/AppHeader'
import { scaleWidth } from '../../utils/scaling'
// Removed gameStore; not used here


import * as yup from 'yup';
import { EnhancerAPI } from '../../api/enhancerApi'

const editProfileSchema = yup.object().shape({
  full_name: yup
    .string()
    .matches(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Full name is required'),
});


const EditProfile = () => {
  const navigation = useNavigation()
  const { user, update_user, get_user } = useAuthStore()
  const [imageResult, setImageResult] = useState(null)
  const { isLight } = useThemeStore()


  //============State for Profile Data============
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    profile_picture: user?.profile_picture || null,
  })

  //============State for Tag Selection============
  const [selectedTag, setSelectedTag] = useState(() => {
    if (user?.enhancer?.active_hacker_tag) return 'hacker'
    if (user?.enhancer?.active_pro_tag) return 'pro'
    return 'off'
  })

  //============State for Exposure Status============
  const [exposureStatus, setExposureStatus] = useState(() => {
    // Use active_exposer field to determine current exposure status
    return user?.enhancer?.active_exposer ? 'on' : 'off'
  })



  //============Change Detection Functions============
  const hasProfileChanges = () => {
    const nameChanged = profileData.full_name !== user?.full_name
    const imageChanged = imageResult !== null
    return nameChanged || imageChanged
  }

  const hasTagChanges = () => {
    const currentTag = user?.enhancer?.active_hacker_tag ? 'hacker' :
      user?.enhancer?.active_pro_tag ? 'pro' : 'off'
    const currentExposure = user?.enhancer?.active_exposer ? 'on' : 'off'
    return selectedTag !== currentTag || exposureStatus !== currentExposure
  }

  const hasAnyChanges = () => {
    return hasProfileChanges() || hasTagChanges()
  }

  //============Image Picker Function============
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setImageResult(result.assets[0])
        setProfileData(prev => ({
          ...prev,
          profile_picture: result.assets[0].uri
        }))
      }
    } catch (error) {
      Toast.show('Unable to pick image', Toast.SHORT)
    }
  }

  //============Form Data Preparation For Backend============
  const prepareFormData = () => {
    const formData = new FormData()
    formData.append('full_name', profileData.full_name)

    if (imageResult) {
      formData.append('profile_picture', {
        uri: profileData.profile_picture,
        name: 'profile.jpg',
        type: imageResult.mimeType || 'image/jpeg'
      })
    }
    return formData
  }

  //============Form Data Send to the Backend============
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateUser = async () => {
    const formData = prepareFormData()
    try {
      await update_user(formData)
    } catch (error) {
      throw error 
    }
  }

  //============Tag Update Function============
  const handleTagUpdate = async () => {
    const tagPayload = {
      tag_type: selectedTag, // 'off', 'pro', or 'hacker'
      action: selectedTag === 'off' ? 'disable' : 'enable',
      exposure_status: exposureStatus // 'on' or 'off'
    }
    const response = await EnhancerAPI.updateTagStatus(tagPayload);
    if (response.status === 200) {
      await get_user() // Refresh user data to reflect tag changes
    }
  }

  //============Save Button Function============
  const handleSave = async () => {



    const profileChanged = hasProfileChanges()
    const tagChanged = hasTagChanges()
    
    // If no changes at all, just go back
    if (!profileChanged && !tagChanged) {
      navigation.goBack()
      return
    }

    try {
      setIsLoading(true)
      
      // Only validate and update profile if profile data changed
      if (profileChanged) {
        await editProfileSchema.validate({ full_name: profileData.full_name })
        Keyboard.dismiss()
        await handleUpdateUser()
      }

      // Only update tag if tag selection changed
      if (tagChanged) {
        await handleTagUpdate()
      }

      navigation.goBack()
    } catch (err) {
      Toast.show(err.message, Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }


  const renderTagControls = () => {
    // Only show tag controls if user owns any tags (have_* indicates ownership)
    const hasAnyTag = user?.enhancer?.have_pro_tag || user?.enhancer?.have_hacker_tag
    if (!hasAnyTag) return null

    const tagOptions = [
      { id: 'off', label: 'Tag Off' },
      { id: 'pro', label: 'Pro Tag', available: user?.enhancer?.have_pro_tag },
      { id: 'hacker', label: 'Hcker Tag', available: user?.enhancer?.have_hacker_tag },
    ].filter(option => option.id === 'off' || option.available)

    // Only show exposure controls if user owns exposer enhancer
    const hasExposer = user?.enhancer?.have_exposer

    return (
      <View style={styles.tagControlContainer}>
        <Text style={[styles.tagControlLabel, { color: isLight ? "#333" : "#ccc" }]}>
          Enhancers
        </Text>
        <View style={styles.tagButtonsContainer}>
          {tagOptions.map((option) => {
            const isSelected = selectedTag === option.id
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.tagButton,
                  {
                    backgroundColor: isSelected
                      ? (isLight ? '#000000' : '#ffffff')
                      : (isLight ? '#f0f0f0' : '#2a2a2a'),
                    borderColor: isLight ? '#000000' : '#ffffff',
                  }
                ]}
                onPress={() => setSelectedTag(option.id)}
              >
                <Text style={[
                  styles.tagButtonText,
                  {
                    color: isSelected
                      ? (isLight ? '#ffffff' : '#000000')
                      : (isLight ? '#333333' : '#cccccc')
                  }
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
        
        {/* Exposure Controls - Only show if user owns exposer */}
        {hasExposer && (
          <View style={styles.exposureContainer}>
            <Text style={[styles.exposureLabel, { color: isLight ? "#333" : "#ccc" }]}>
              Exposure
            </Text>
            <View style={styles.exposureButtonsContainer}>
              {['off', 'on'].map((status) => {
                const isSelected = exposureStatus === status
                return (
                  <Pressable
                    key={status}
                    style={[
                      styles.exposureButton,
                      {
                        backgroundColor: isSelected
                          ? (isLight ? '#000000' : '#ffffff')
                          : (isLight ? '#f0f0f0' : '#2a2a2a'),
                        borderColor: isLight ? '#000000' : '#ffffff',
                      }
                    ]}
                    onPress={() => setExposureStatus(status)}
                  >
                    <Text style={[
                      styles.exposureButtonText,
                      {
                        color: isSelected
                          ? (isLight ? '#ffffff' : '#000000')
                          : (isLight ? '#333333' : '#cccccc')
                      }
                    ]}>
                      Exposure {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <>
      <Loader visible={isLoading} message="Updating profile..." size={50} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? "dark-content" : "light-content"}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000' }]}>


        <AppHeader
          backButton={true}
          title={'Edit Profile'}
        />





        {/* Profile Section - Vertical Layout */}
        <View style={styles.profileSection}>
          {/* Profile Picture */}
          <View style={styles.imageSection}>
            <Pressable style={styles.imageContainer} onPress={pickImage}>
              {profileData.profile_picture ? (
                <Image source={{ uri: profileData.profile_picture }} style={styles.profileImage} />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a' }]}>
                  <Octicons name="feed-person" size={40} color={isLight ? "#000000" : "#ffffff"} />
                </View>
              )}

              {/* Pro/Hcker Tag */}
              {selectedTag !== 'off' && (
                <View style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: [{ translateX: -20 }], // Adjusted for larger profile image
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
                    {selectedTag === 'hacker' ? 'Hcker' : 'Pro'}
                  </Text>
                </View>
              )}
            </Pressable>
            <Text style={[styles.tapToChangeText, { color: isLight ? "#666" : "#999" }]}>
              Tap to change profile picture
            </Text>
          </View>

          {/* Name Input and Email Display */}
          <View style={styles.nameContainer}>
            <TextInput
              style={[styles.input, {
                borderColor: isLight ? '#000000' : '#ffffff',
                color: isLight ? "#000" : "#fff"
              }]}
              value={profileData.full_name}
              onChangeText={(text) => setProfileData({ ...profileData, full_name: text })}
              placeholder="Your Name ..."
              placeholderTextColor={isLight ? "#999" : "#666"}
            />

            <TextInput
              style={[styles.input, {
                borderColor: isLight ? '#000000' : '#ffffff',
                color: isLight ? "#666" : "#999",
                backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a',
              }]}
              value={user?.email}
              editable={false}
              placeholder="Email"
              placeholderTextColor={isLight ? "#999" : "#666"}
            />

            {/* Tag Controls */}
            {renderTagControls()}

            <Pressable
              style={[styles.saveButton, {
                borderColor: isLight ? '#000000' : '#ffffff',
                backgroundColor: isLight ? '#000000' : '#ffffff'
              }]}
              onPress={handleSave}
              disabled={!hasAnyChanges()}
            >
              <Text style={[styles.saveButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>
                Update
              </Text>
            </Pressable>
          </View>
        </View>


      </SafeAreaView>
    </>
  )
}

export default EditProfile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    marginHorizontal: 20,
    marginTop: 20
  },
  imageSection: {
    alignItems: 'center',
    gap: 8
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToChangeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  nameContainer: {
    width: '100%',
    gap: 16
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 8,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0000000'
  },
  saveButtonText: {
    fontSize: 16,
  },

  // Tag Control Styles
  tagControlContainer: {
    gap: 8,
  },
  tagControlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagButtonsContainer: {
    flexDirection: 'row',
    gap: 0,
  },
  tagButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Exposure Control Styles
  exposureContainer: {
    gap: 8,
    marginTop: 8,
  },
  exposureLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  exposureButtonsContainer: {
    flexDirection: 'row',
    gap: 0,
  },
  exposureButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exposureButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
})
