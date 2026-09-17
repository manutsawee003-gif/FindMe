import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ImageBackground,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ErrorNotice, Loading } from './ui';
import { useSession } from '../services/session';
import { colors } from '../constants/theme';

export function SignIn() {
  const { enter, ready, error } = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const handleEnter = async () => {
    setBusy(true);
    setMessage('');
    try {
      await enter(name);
    } catch (e: any) {
      console.error('Login error:', e);
      setMessage(e.message || 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Loading label="Initializing FindMe..." />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../assets/images/landing-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Bar with Language Selector */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              <View style={styles.langPill}>
                <Ionicons name="globe-outline" size={14} color={colors.ink} />
                <Text style={styles.langText}>EN</Text>
                <Ionicons name="chevron-down" size={12} color={colors.muted} />
              </View>
            </View>

            {/* Flexible Spacer for Background Artwork Visibility */}
            <View style={styles.artSpacer} />

            {/* Bottom Overlay Card & Actions */}
            <View style={styles.bottomSection}>
              {/* 3-Column Features Floating Card */}
              <View style={styles.featuresCard}>
                <View style={styles.featureCol}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={styles.sosIconText}>SOS</Text>
                  </View>
                  <Text style={styles.featureColTitle}>Send SOS</Text>
                  <Text style={styles.featureColDesc}>Get help fast</Text>
                </View>

                <View style={styles.featureDivider} />

                <View style={styles.featureCol}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="location" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.featureColTitle}>Share Location</Text>
                  <Text style={styles.featureColDesc}>Keep family close</Text>
                </View>

                <View style={styles.featureDivider} />

                <View style={styles.featureCol}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="people" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.featureColTitle}>Family Safety</Text>
                  <Text style={styles.featureColDesc}>Stronger together</Text>
                </View>
              </View>

              {/* Simple name entry */}
              <View style={styles.authActionArea}>
                <TextInput
                  accessibilityLabel="Your name"
                  autoCapitalize="words"
                  onChangeText={value => { setName(value); setMessage(''); }}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={name}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enter FindMe"
                  disabled={busy}
                  onPress={handleEnter}
                  style={({ pressed }) => [
                    styles.emailButton,
                    { opacity: busy ? 0.7 : pressed ? 0.9 : 1 }
                  ]}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.white} />
                  <Text style={styles.emailButtonLabel}>
                    {busy ? 'Please wait...' : 'Enter FindMe'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.white} />
                </Pressable>
                {/* Error Notice */}
                <ErrorNotice message={message || error} onRetry={handleEnter} />

                {/* Legal Terms & Privacy Disclaimer */}
                <Text style={styles.termsText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {'\n'}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    minHeight: '100%'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  safeArea: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  langText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink
  },
  artSpacer: {
    flex: 1,
    minHeight: 320
  },
  bottomSection: {
    gap: 14
  },
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  featureCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4
  },
  featureDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#E2E8F0'
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  sosIconText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626'
  },
  featureColTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center'
  },
  featureColDesc: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center'
  },
  authActionArea: {
    gap: 10,
    paddingTop: 4
  },
  input: {
    backgroundColor: colors.white,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  emailButton: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  emailButtonLabel: {
    color: colors.white,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  googleButtonLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  textAction: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  lineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#06C755',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 54,
    shadowColor: '#06C755',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  lineIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  lineButtonLabel: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
    flex: 1
  },
  termsText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 4
  },
  termsLink: {
    color: '#0284C7',
    fontWeight: '700'
  }
});
