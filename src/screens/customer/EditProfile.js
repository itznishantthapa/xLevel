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
import { useState } from 'react'
import { Octicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-simple-toast'
import { useThemeStore } from '../../store/themeStore'
import Loader from '../../component/Loader'
import AppHeader from './header/AppHeader'

import * as yup from 'yup'

const editProfileSchema = yup.object().shape({
  full_name: yup
    .string()
    .trim()
    .matches(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed')
    .test('has-letters', 'Name must contain at least one letter', value => value && /[a-zA-Z]/.test(value))
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Full name is required'),
})

const EditProfile = () => {
  const navigation = useNavigation()
  const { user, update_user } = useAuthStore()
  const [imageResult, setImageResult] = useState(null)
  const { isLight } = useThemeStore()


  //============State for Profile Data============
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    profile_picture: user?.profile_picture || null,
  })



  //============Change Detection Functions============
  const hasProfileChanges = () => {
    const nameChanged = profileData.full_name.trim() !== (user?.full_name || '').trim()
    const imageChanged = imageResult !== null
    return nameChanged || imageChanged
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
      if (__DEV__) {
        Toast.show('Unable to pick image', Toast.SHORT)
      }
    }
  }

  //============Form Data Preparation For Backend============
  const prepareFormData = () => {
    const formData = new FormData()
    formData.append('full_name', profileData.full_name.trim())

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

  //============Save Button Function============
  const handleSave = async () => {
    const profileChanged = hasProfileChanges()

    // If no changes at all, just go back
    if (!profileChanged) {
      navigation.goBack()
      return
    }

    try {
      setIsLoading(true)

      await editProfileSchema.validate({ full_name: profileData.full_name.trim() })
      Keyboard.dismiss()
      await handleUpdateUser()

      navigation.goBack()
    } catch (err) {
      Toast.show(err.message, Toast.SHORT)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Loader visible={isLoading} message="Updating profile..." size={50} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isLight ? 'dark-content' : 'light-content'}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: isLight ? '#ffffff' : '#000000' }]}>
        <AppHeader backButton={true} title={'Edit Profile'} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileSection}>
            {/* Profile Picture */}
            <View style={styles.imageSection}>
              <Pressable style={styles.imageContainer} onPress={pickImage}>
                {profileData.profile_picture ? (
                  <Image source={{ uri: profileData.profile_picture }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a' }]}>
                    <Octicons name="feed-person" size={40} color={isLight ? '#000000' : '#ffffff'} />
                  </View>
                )}
              </Pressable>
              <Text style={[styles.tapToChangeText, { color: isLight ? '#666' : '#999' }]}>
                Tap to change profile picture
              </Text>
            </View>

            {/* Name Input and Email Display */}
            <View style={styles.nameContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: isLight ? '#000000' : '#ffffff',
                    color: isLight ? '#000' : '#fff',
                    backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a',
                  }
                ]}
                value={profileData.full_name}
                onChangeText={(text) => setProfileData({ ...profileData, full_name: text })}
                placeholder="Your Name"
                placeholderTextColor={isLight ? '#999' : '#666'}
              />

              <Pressable onPress={() => Toast.show('Email cannot be changed ❌', Toast.LONG)}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isLight ? '#000000' : '#ffffff',
                      color: isLight ? '#666' : '#999',
                      backgroundColor: isLight ? '#f8f9fa' : '#1a1a1a',
                    }
                  ]}
                  value={user?.email}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor={isLight ? '#999' : '#666'}
                  pointerEvents="none"
                />
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  {
                    borderColor: isLight ? '#000000' : '#ffffff',
                    backgroundColor: isLight ? '#000000' : '#ffffff'
                  }
                ]}
                onPress={handleSave}
                disabled={!hasProfileChanges()}
              >
                <Text style={[styles.saveButtonText, { color: isLight ? '#ffffff' : '#000000' }]}>
                  Update
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default EditProfile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    borderRadius: 8,
  },
  saveButton: {
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
