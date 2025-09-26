import { View, Text, Pressable, StyleSheet, Alert } from "react-native"
import { __DEV__ } from "react-native"
import { useThemeStore } from "../../../store/themeStore"
import { Fontisto, Entypo, Ionicons, FontAwesome5 } from "@expo/vector-icons"
import { useMemo } from "react"
import { handleMessenger, handleInstagram, handleWhatsapp } from "../../../service/homeHandler"
import RNRestart from 'react-native-restart'

// Default social media contacts in case we can't fetch them
const DEFAULT_SOCIALS = [
    {
        name: 'Whatsapp',
        url: 'https://wa.me/your-number',
        web_url: 'https://web.whatsapp.com',
        icon: 'logo-whatsapp',
        IconComponent: Ionicons,
        handler: (social) => handleWhatsapp(social?.url, social?.web_url)
    },
    {
        name: 'Messenger',
        url: 'https://m.me/your-username',
        web_url: 'https://messenger.com',
        icon: 'messenger',
        IconComponent: Fontisto,
        handler: (social) => handleMessenger(social?.url, social?.web_url)
    }
];

const AppErrorFallback = ({ error, resetErrorBoundary }) => {
    const { isLight } = useThemeStore()
    
    // Function to handle app reset/restart
    const handleRefresh = () => {
        try {
            // Use RNRestart to completely restart the app
            // This will reload the JavaScript bundle and restart the app from scratch
            RNRestart?.restart();
        } catch (e) {
          
          if(__DEV__) {
            console.log('Failed to restart app:', e);
          }

            // If RNRestart fails, fall back to resetErrorBoundary
            resetErrorBoundary();
        }
    };
    
    const { themeStyles } = useMemo(() => {
      const computedThemeStyles = {
        textColor: isLight ? "#333333" : "#EAEAEA",
        iconColor: isLight ? "#333333" : "#EAEAEA",
        buttonBackground: isLight ? "#fafafa" : "rgba(255, 255, 255, 0.1)",
        profileBackground: isLight ? "#dadada" : "#444444",
      }
      
      return {
        themeStyles: computedThemeStyles,
      }
    }, [isLight])

  return (
    <View style={[styles.container, { backgroundColor: isLight ? "#ffffff" : "#000000" }]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={[styles.iconContainer, { 
          backgroundColor: isLight ? "#f8f9fa" : "#333333",
          borderColor: isLight ? "#e9ecef" : "#555555" 
        }]}>
          {/* <Text style={styles.iconText}>⚠️</Text> */}
          <FontAwesome5 name='sad-cry' size={40} color={isLight ? "#333333" : "#EAEAEA"} />
        </View>

        {/* Main Error Message */}
        <Text style={[styles.title, { color: themeStyles.textColor }]}>Oops!</Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: isLight ? "#6c757d" : "#adadad" }]}>
          You have encountered an unexpected error. Don't worry, this happens sometimes.
        </Text>

        {/* Error Details (Optional - can be hidden in production) */}
        {__DEV__ && (
          <View style={[styles.errorDetails, {
            backgroundColor: isLight ? "#f8f9fa" : "#333333",
            borderLeftColor: "#dc3545"
          }]}>
            <Text style={[styles.errorText, { color: themeStyles.textColor }]}>
              {error?.message || "Unknown error occurred"}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.primaryButton} 
            onPress={handleRefresh} 
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Restart App"
          >
            <View style={styles.buttonContent}>
              <Ionicons name="refresh" size={20} color={isLight ? "#ffffff" : "#000000"} style={styles.buttonIcon} />
              <Text style={[styles.primaryButtonText, { color: isLight ? "#ffffff" : "#000000" }]}>Restart App</Text>
            </View>
          </Pressable>
          
          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <Text style={[styles.socialTitle, { color: themeStyles.textColor }]}>
              Tell us how you got this screen !
            </Text>
            
            <View style={styles.socialContainer}>
                {DEFAULT_SOCIALS.map((social) => {
                  const { IconComponent, icon, handler, name } = social
                  return (
                    <Pressable
                      key={name}
                      style={[styles.socialButton, { backgroundColor: themeStyles.buttonBackground }]}
                      onPress={() => handler(social)}
                      accessibilityRole="button"
                      accessibilityLabel={`Contact us via ${name}`}
                    >
                      <IconComponent name={icon} size={20} color={themeStyles.iconColor} />
                    </Pressable>
                  )
                })}
              </View>
          </View>
        </View>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: "100%",
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#495057",
    fontFamily: "monospace",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  socialSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#00bf63",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    shadowColor: "#00bf63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  socialButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  secondaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default AppErrorFallback