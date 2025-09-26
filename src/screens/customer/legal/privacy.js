import { StyleSheet, Text, View, ScrollView, StatusBar } from 'react-native'
import React from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const Privacy = () => {
    const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top , paddingBottom: insets.bottom }]}>
              <StatusBar translucent backgroundColor="transparent" barStyle = "dark-content"  />
        
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>xKick Privacy Policy</Text>
            <Text style={styles.dateText}>Effective Date: September 20, 2025</Text>
            <Text style={styles.dateText}>Last Updated: September 12, 2025</Text>
            <View style={styles.headerUnderline} />
          </View>
          
          {/* Introduction */}
          <Text style={styles.paragraph}>
            This Privacy Policy is intended to explain in clear and descriptive detail how xKick ("we," "our," or "us") collects, uses, protects, and shares information when you use our application and related services. We are committed to ensuring the privacy and safety of every user, and we want you to clearly understand how your data is handled when you engage with our platform.
          </Text>
          
          <Text style={styles.paragraph}>
            xKick is designed as an esports hub that connects players so that they can engage in fair competition, grow their gaming skills, and participate in official tournaments hosted on our platform. This policy applies to all users accessing our mobile application.
          </Text>
          
          <Text style={styles.paragraph}>
            xKick is not a gambling or betting application. We do not operate on chance, luck, or monetary betting. Every match and tournament hosted through our platform is based solely on skill. Our service is only available to players aged 18 and above, ensuring that participants have the maturity and logical decision-making capability required to use the platform responsibly. By using xKick, you agree to the terms of this Privacy Policy and consent to the processing of your data as outlined here.
          </Text>

          {/* Information We Collect */}
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            When you register with xKick, you provide us with certain details necessary for the functioning of our platform. These include your full name, email address, and an optional profile image. We also ask for your in-game details such as your game username, game UID, game level, and other relevant information you choose to include in your profile.
          </Text>
          
          <Text style={styles.paragraph}>
            This is essential for transparency and fairness because opponents need to know who they are competing against and to build confidence in joining matches hosted by other players. Without these details, a user cannot create or participate in matches.
          </Text>
          
          <Text style={styles.paragraph}>
            In addition, our application requires permission to generate and store a notification token through Firebase Cloud Messaging (FCM). This is exclusively used to notify you about match updates, challenges, and other important updates. Apart from this, we do not collect device identifiers, browsing activity, cookies, or location data.
          </Text>
          
          <Text style={styles.paragraph}>
            When you sign in using third-party services such as Google Sign-In, we only collect the necessary details provided by that service, such as your email and profile basics, to simplify registration. We do not access or collect unrelated data from these services.
          </Text>

          {/* How We Use Your Information */}
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            The data we collect is used strictly for purposes that enhance the experience of our platform. This includes creating and maintaining your account, displaying your game profile so opponents can verify it, sending you notifications regarding matches and tournaments, and managing official competitions.
          </Text>
          
          <Text style={styles.paragraph}>
            We also use collected information to improve performance, ensure fair play, and maintain the integrity of matches hosted through xKick. At no point do we sell or trade your information to third parties for advertising or marketing purposes.
          </Text>

          {/* Data Retention and Deletion */}
          <Text style={styles.sectionTitle}>Data Retention and Deletion</Text>
          <Text style={styles.paragraph}>
            We store your information only as long as it is necessary for the operation of our services. If you choose to delete your account, we will permanently erase your personal data from our systems. Any cached information may remain temporarily but will eventually be cleared.
          </Text>
          
          <Text style={styles.paragraph}>
            If you wish to withdraw your data, you may contact us directly at <Text style={styles.link}>xkickgames@gmail.com</Text>, providing the necessary details for account verification and the reason for your request. Upon confirmation, your information will be removed in compliance with privacy standards.
          </Text>

          {/* Security of Your Information */}
          <Text style={styles.sectionTitle}>Security of Your Information</Text>
          <Text style={styles.paragraph}>
            Protecting your information is one of our highest priorities. We employ encryption methods to secure data during transmission and storage. Access to user information is strictly restricted to authorized personnel within xKick.
          </Text>
          
          <Text style={styles.paragraph}>
            While we strive to use commercially acceptable means to protect your personal data, no system can be guaranteed 100% secure. We encourage you to use strong passwords and keep your login information private to further safeguard your account.
          </Text>

          {/* Your Rights and Control Over Information */}
          <Text style={styles.sectionTitle}>Your Rights and Control Over Information</Text>
          <Text style={styles.paragraph}>
            Users always retain control over their personal information. You can access, edit, or update your details directly through the app. If you wish to delete your account, restrict the processing of your information, or withdraw consent, you can reach out to us by email.
          </Text>
          
          <Text style={styles.paragraph}>
            We believe in transparency and will ensure that your rights are respected in accordance with applicable laws such as GDPR, CCPA, or other relevant data protection regulations. These laws may grant you rights to request access to your data, correction of errors, or objection to processing in specific circumstances.
          </Text>

          {/* Services Offered by Third Parties */}
          <Text style={styles.sectionTitle}>Services Offered by Third Parties</Text>
          <Text style={styles.paragraph}>
            xKick integrates with trusted third-party services to provide a smooth and functional user experience. For example, we use Firebase to enable real-time notifications and enhance performance through caching mechanisms. We also use Google Sign-In to simplify the registration process for users.
          </Text>
          
          <Text style={styles.paragraph}>
            These third-party services may collect and process limited data as part of their operations, but this is strictly to support our application's essential functions. We recommend reviewing the privacy policies of these services for more details on how they handle information.
          </Text>
          
          <Text style={styles.paragraph}>
            We assure our users that we do not allow third-party services to exploit your information for commercial or advertising purposes. Their role is limited to providing technical support to ensure xKick runs reliably and securely.
          </Text>

          {/* International Data Transfers */}
          <Text style={styles.sectionTitle}>International Data Transfers</Text>
          <Text style={styles.paragraph}>
            As part of our reliance on third-party services such as Firebase and Google, your data may be stored or processed on servers located in different countries. While these locations may have varying data protection laws, we take measures to ensure your information remains secure regardless of where it is processed.
          </Text>
          
          <Text style={styles.paragraph}>
            By using xKick, you consent to the transfer of your information across borders, with the understanding that such transfers are essential for the global operation of our platform.
          </Text>

          {/* Data Protection Commitment */}
          <Text style={styles.sectionTitle}>Data Protection Commitment</Text>
          <Text style={styles.paragraph}>
            Although xKick does not yet have an appointed Data Protection Officer, we are committed to safeguarding your privacy with the highest standards. All user data is handled with integrity, confidentiality, and care.
          </Text>
          
          <Text style={styles.paragraph}>
            If you have questions or concerns about your information, you can always reach us directly at <Text style={styles.link}>xkickgames@gmail.com</Text>. We will respond promptly to ensure your concerns are addressed.
          </Text>

          {/* Updates to This Privacy Policy */}
          <Text style={styles.sectionTitle}>Updates to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may revise this Privacy Policy from time to time to reflect updates in our practices, technology, or legal obligations. If changes are significant, we will notify users by email or through in-app notifications.
          </Text>
          
          <Text style={styles.paragraph}>
            We encourage you to periodically review this policy so you are aware of how we continue to protect your information. Your continued use of the platform after changes have been communicated will indicate your acceptance of the revised policy.
          </Text>

          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions, complaints, or requests related to your data, please do not hesitate to reach out to us. Transparency and trust are fundamental to how we operate.
          </Text>
          
          <Text style={styles.paragraph}>
            Email: <Text style={styles.link}>xkickgames@gmail.com</Text>
          </Text>
          <Text style={styles.paragraph}>
            Website: <Text style={styles.link}>www.xkick.games</Text>
          </Text>
          
        </View>
      </ScrollView>
    </View>
  )
}

export default Privacy

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 15,
    // paddingVertical: 24,
    // paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 16,
    lineHeight: 36,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: 8,
  },
  headerUnderline: {
    height: 3,
    backgroundColor: '#000000',
    width: '100%',
    marginTop: 16,
    borderRadius: 1.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 32,
    marginBottom: 16,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 10,
    textAlign:'justify',
   
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
})