import { PropsWithChildren, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

export function Screen({
  children,
  title,
  subtitle,
  rightHeader
}: PropsWithChildren<{ title: string; subtitle: string; rightHeader?: React.ReactNode }>) {
  return (
    <LinearGradient colors={colors.backgroundGradient} style={styles.background}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <LinearGradient colors={colors.heroGradient} style={styles.intro}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoIconImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brand}>
                Find<Text style={{ color: colors.red }}>Me</Text>
              </Text>
              <Text style={styles.brandTagline}>Don't Just Report. Get Found.</Text>
            </View>
          </View>

          <View style={styles.headerRightArea}>
            {rightHeader || null}
          </View>
        </View>

        {/* Hero Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        </LinearGradient>

        {children}

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerBrand}>FindMe Safety System</Text>
          <Text style={styles.footerText}>
            Don't Just Report. Get Found. · Family safety & emergency connection
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

export function Card({
  children,
  tone,
  onPress,
  style
}: PropsWithChildren<{
  tone?: 'default' | 'danger' | 'safe' | 'info' | 'accent' | 'dark';
  onPress?: () => void;
  style?: any;
}>) {
  const cardStyle = [
    styles.card,
    tone === 'danger' && styles.cardDanger,
    tone === 'safe' && styles.cardSafe,
    tone === 'info' && styles.cardInfo,
    tone === 'accent' && styles.cardAccent,
    tone === 'dark' && styles.cardDark,
    style
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function Heading({
  children,
  size = 'md',
  color
}: PropsWithChildren<{ size?: 'sm' | 'md' | 'lg'; color?: string }>) {
  return (
    <Text
      style={[
        styles.heading,
        size === 'sm' && styles.headingSm,
        size === 'lg' && styles.headingLg,
        color ? { color } : undefined
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  color,
  style
}: PropsWithChildren<{ color?: string; style?: any }>) {
  return (
    <Text style={[styles.body, color ? { color } : undefined, style]}>
      {children}
    </Text>
  );
}

export function Badge({
  label,
  tone = 'neutral',
  icon
}: {
  label: string;
  tone?: 'safe' | 'danger' | 'info' | 'warning' | 'line' | 'neutral' | 'dark';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bgMap = {
    safe: colors.greenSoft,
    danger: colors.redSoft,
    info: colors.blueSoft,
    warning: colors.amberSoft,
    line: colors.lineSoft,
    neutral: colors.surfaceSubtle,
    dark: colors.surfaceDark
  };
  const colorMap = {
    safe: colors.green,
    danger: colors.red,
    info: colors.blue,
    warning: colors.amber,
    line: colors.lineDark,
    neutral: colors.muted,
    dark: colors.white
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[tone] }]}>
      {icon ? <Ionicons name={icon} size={12} color={colorMap[tone]} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.badgeText, { color: colorMap[tone] }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  tone = 'primary',
  icon,
  size = 'md'
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'line' | 'danger' | 'secondary' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
}) {
  const gradient = tone === 'danger'
    ? colors.dangerGradient
    : tone === 'line'
    ? colors.lineGradient
    : tone === 'primary'
    ? colors.primaryGradient
    : null;

  const content = (
    <View style={styles.buttonContent}>
      {icon ? (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : 19}
          color={tone === 'outline' || tone === 'ghost' || tone === 'secondary' ? colors.ink : colors.white}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, (tone === 'outline' || tone === 'ghost' || tone === 'secondary') && { color: colors.ink }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        size === 'lg' && styles.buttonLg,
        tone === 'line' && styles.lineButton,
        tone === 'danger' && styles.dangerButton,
        tone === 'secondary' && styles.secondaryButton,
        tone === 'outline' && styles.outlineButton,
        tone === 'ghost' && styles.ghostButton,
        gradient && styles.gradientButton,
        { opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }
      ]}
    >
      {gradient ? (
        <LinearGradient colors={gradient} style={[styles.buttonGradient, size === 'sm' && styles.buttonGradientSm, size === 'lg' && styles.buttonGradientLg]}>
          {content}
        </LinearGradient>
      ) : content}
    </Pressable>
  );
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  numeric,
  multiline,
  icon
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          multiline && { minHeight: 90, alignItems: 'flex-start', paddingTop: 12 }
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.blue : colors.mutedLight}
            style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}
          />
        ) : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          keyboardType={numeric ? 'number-pad' : 'default'}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.textInput,
            multiline && { height: 75, textAlignVertical: 'top' }
          ]}
        />
      </View>
    </View>
  );
}

export function EmergencyHotlinesWidget() {
  const hotlines = [
    { number: '1669', name: 'Emergency Medical (EMS)', label: 'EMS / Ambulance', icon: 'medical' as const, bg: '#FEF2F2', color: '#DC2626' },
    { number: '199', name: 'Fire & Rescue', label: 'Fire Rescue', icon: 'flame' as const, bg: '#FFF7ED', color: '#EA580C' },
    { number: '191', name: 'Police Patrol', label: 'Police', icon: 'shield' as const, bg: '#F0F9FF', color: '#0284C7' },
    { number: '1784', name: 'Disaster Prevention', label: 'Disaster Dept', icon: 'water' as const, bg: '#ECFDF5', color: '#059669' },
  ];

  const callNumber = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {
      // Fallback
    });
  };

  return (
    <Card tone="default">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="call" size={18} color={colors.red} />
          <Heading size="sm">Emergency Hotlines</Heading>
        </View>
        <Badge label="Tap to Call" tone="neutral" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {hotlines.map(h => (
          <Pressable
            key={h.number}
            onPress={() => callNumber(h.number)}
            style={({ pressed }) => [
              styles.hotlineButton,
              { backgroundColor: h.bg, borderColor: h.color + '30', opacity: pressed ? 0.75 : 1 }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={h.icon} size={16} color={h.color} />
              <Text style={[styles.hotlineNumber, { color: h.color }]}>{h.number}</Text>
            </View>
            <Text style={styles.hotlineName} numberOfLines={1}>{h.name}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={22} color={colors.red} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text accessibilityRole="alert" style={styles.errorText}>
          {message}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={{ marginTop: 4 }}>
            <Text style={{ color: colors.redDark, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Loading({ label = 'Loading data…' }: { label?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.red} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  page: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingBottom: 48
  },
  intro: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: -4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoIconImage: {
    width: 38,
    height: 38,
    borderRadius: 10
  },
  logoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.red,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  brand: {
    fontSize: 24,
    letterSpacing: -0.6,
    fontWeight: '900',
    color: colors.white
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: -2
  },
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleSection: {
    gap: 4,
    marginTop: 8,
    marginBottom: 8
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    fontWeight: '900',
    color: colors.white
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#DCEBFF'
  },
  card: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  cardDanger: {
    backgroundColor: colors.redSoft,
    borderColor: colors.redBorder
  },
  cardSafe: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.greenBorder
  },
  cardInfo: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blueBorder
  },
  cardAccent: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF'
  },
  cardDark: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.inkSecondary
  },
  heading: {
    fontSize: 17,
    letterSpacing: -0.3,
    fontWeight: '800',
    color: colors.ink
  },
  headingSm: {
    fontSize: 15
  },
  headingLg: {
    fontSize: 20
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSecondary
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowMedium,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  gradientButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: 0,
    paddingHorizontal: 0
  },
  buttonGradient: {
    width: '100%',
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonGradientSm: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  buttonGradientLg: {
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 22
  },
  buttonSm: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  buttonLg: {
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lineButton: {
    backgroundColor: colors.line
  },
  dangerButton: {
    backgroundColor: colors.red
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.cardBorder
  },
  ghostButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15
  },
  buttonTextSm: {
    fontSize: 13
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSecondary
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48
  },
  inputFocused: {
    borderColor: colors.blue,
    backgroundColor: colors.white
  },
  textInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 10
  },
  hotlineButton: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2
  },
  hotlineNumber: {
    fontSize: 16,
    fontWeight: '900'
  },
  hotlineName: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600'
  },
  errorContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.redSoft,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.redBorder,
    padding: 14,
    alignItems: 'flex-start'
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.red
  },
  errorText: {
    color: colors.redDark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500'
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600'
  },
  footerContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 18,
    paddingVertical: 12
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted
  },
  footerText: {
    textAlign: 'center',
    color: colors.mutedLight,
    fontSize: 11
  }
});
