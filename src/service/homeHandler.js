import { Linking } from 'react-native';

/**
 * Generic function to handle opening social media links
 * @param {string} appUrl - The app URL to open
 * @param {string} webUrl - The fallback web URL
 * @param {string} socialType - Type of social media for toast messages
 */
const handleSocialLink = async (appUrl, webUrl, socialType) => {
  if (!appUrl || !webUrl) {
    return;
  }

  try {
    const supported = await Linking.canOpenURL(appUrl);
    if (supported) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
     if (__DEV__) console.log(error)
  }
};

export const handleMessenger = async (appUrl, webUrl) => {
  await handleSocialLink(appUrl, webUrl, 'Messenger');
};

export const handleInstagram = async (appUrl, webUrl) => {
  await handleSocialLink(appUrl, webUrl, 'Instagram');
};

export const handleWhatsapp = async (appUrl, webUrl) => {
  console.log("WhatsApp URLs:", { appUrl, webUrl });
  await handleSocialLink(appUrl, webUrl, 'WhatsApp');
};