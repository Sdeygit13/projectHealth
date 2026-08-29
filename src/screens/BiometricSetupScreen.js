import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {enableBiometric, checkBiometricAvailability} from '../services/biometric';
import {COLORS, SHADOW} from '../theme';

export default function BiometricSetupScreen({onEnabled}) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState('biometric');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    checkBiometricAvailability().then(result => {
      if (!mounted) return;
      setAvailable(result.available);
      setBiometryType(result.biometryType || 'biometric');
      setChecking(false);
      if (!result.available) {
        setError('A fingerprint, face or other device biometric must be enrolled to finish creating your Smaran account.');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleEnable = async () => {
    if (busy || !available) return;
    setError('');
    setBusy(true);
    try {
      const result = await enableBiometric();
      if (result.success) {
        onEnabled();
        return;
      }
      setError(result.error || 'Biometric verification was not completed. Please try again.');
    } catch (e) {
      setError('Biometric verification could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const biometricLabel = biometryType === 'FaceID' || biometryType === 'Face' ? 'face or fingerprint' : 'fingerprint or device biometric';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.badge}><Text style={styles.badgeIcon}>⌁</Text></View>
          <Text style={styles.eyebrow}>REQUIRED SECURITY STEP</Text>
          <Text style={styles.title}>Secure your Smaran account</Text>
          <Text style={styles.subtitle}>
            Before your account can be used, confirm your identity with your device {biometricLabel}.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Biometric setup is required</Text>
            <Text style={styles.infoText}>
              This protects caregiver access and lets Smaran verify the person trying to enter Guardian Mode.
            </Text>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Pressable
            onPress={handleEnable}
            disabled={busy || checking || !available}
            style={({pressed}) => [styles.primaryButton, pressed && !busy && styles.pressed, (busy || checking || !available) && styles.disabledButton]}>
            {busy || checking ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Verify & Secure Account</Text>}
          </Pressable>

          <Text style={styles.footerText}>A successful biometric check is required before your new Smaran account can continue.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: COLORS.background},
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22},
  card: {width: '100%', maxWidth: 420, backgroundColor: COLORS.white, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 30, alignItems: 'center', ...SHADOW},
  badge: {width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18},
  badgeIcon: {fontSize: 42, color: COLORS.primaryDark, fontWeight: '900'},
  eyebrow: {fontSize: 10, letterSpacing: 1.5, color: COLORS.primaryDark, fontWeight: '900'},
  title: {fontSize: 25, lineHeight: 31, color: COLORS.text, fontWeight: '900', textAlign: 'center', marginTop: 7},
  subtitle: {marginTop: 12, fontSize: 14.5, lineHeight: 21, color: COLORS.muted, textAlign: 'center'},
  infoBox: {width: '100%', marginTop: 22, padding: 16, borderRadius: 16, backgroundColor: COLORS.mint},
  infoTitle: {fontSize: 14, color: COLORS.text, fontWeight: '900', textAlign: 'center'},
  infoText: {marginTop: 6, fontSize: 12.5, lineHeight: 19, color: COLORS.muted, textAlign: 'center'},
  errorBox: {width: '100%', marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#FFF0EE'},
  errorText: {fontSize: 12, lineHeight: 18, color: COLORS.danger, textAlign: 'center'},
  primaryButton: {width: '100%', height: 54, marginTop: 22, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center'},
  primaryButtonText: {fontSize: 15, color: COLORS.white, fontWeight: '900'},
  disabledButton: {opacity: 0.55},
  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
  footerText: {marginTop: 14, fontSize: 10.5, lineHeight: 16, color: COLORS.muted, textAlign: 'center'},
});
