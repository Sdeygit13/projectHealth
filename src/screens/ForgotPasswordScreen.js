import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Logo from '../components/Logo';
import {COLORS, SHADOW} from '../theme';
import {forgotPasswordRequest} from '../services/api';

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.com$/i;
const PHONE_RE = /^\d{10}$/;

function validate(value) {
  const v = value.trim();
  if (!v) return 'Enter your email or phone number.';
  if (/^\d/.test(v)) {
    if (!/^\d+$/.test(v)) return 'Mobile number must contain digits only.';
    if (!PHONE_RE.test(v)) return 'Mobile number must be exactly 10 digits.';
    return '';
  }
  if (!EMAIL_RE.test(v)) return 'Enter a valid email ending with .com.';
  return '';
}

export default function ForgotPasswordScreen({onBack}) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const submit = async () => {
    const next = validate(identifier);
    setError(next);
    setMessage('');
    if (next) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordRequest({identifier});
      setMessage(
        'If the account exists, recovery instructions will be sent to the registered contact.',
      );
    } catch (apiError) {
      setMessage(apiError?.message || 'Unable to start password recovery right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.top}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={styles.back}>‹ Back to login</Text>
          </Pressable>
          <Logo size={40} />
          <View style={{width: 85}} />
        </View>

        <View style={styles.icon}>
          <Text style={styles.question}>?</Text>
        </View>

        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter the email or phone linked to your Smaran account and we'll start
          the recovery process.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email or phone</Text>

          <View style={[styles.inputWrap, error && styles.inputError]}>
            <TextInput
              ref={inputRef}
              value={identifier}
              onChangeText={value => {
                setIdentifier(value);
                setError('');
                setMessage('');
              }}
              placeholder="Enter email or phone"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={submit}
              importantForAutofill="no"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={loading}
            style={({pressed}) => [styles.button, pressed && !loading && styles.pressed, loading && styles.disabled]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Text style={styles.arrow}>→</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.security}>
            For security, the app will not reveal whether an account exists.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  top: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 110,
    height: 44,
    justifyContent: 'center',
  },
  back: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
  icon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  question: {
    fontSize: 38,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
  title: {
    fontSize: 29,
    lineHeight: 35,
    color: COLORS.text,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 25,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  form: {marginTop: 35},
  label: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: 8,
  },
  inputWrap: {
    height: 58,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inputError: {borderColor: COLORS.danger},
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  error: {
    fontSize: 11.5,
    color: COLORS.danger,
    marginTop: 6,
  },
  message: {
    fontSize: 11.5,
    lineHeight: 17,
    color: COLORS.primaryDark,
    marginTop: 8,
  },
  button: {
    height: 58,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  pressed: {opacity: 0.82},
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  arrow: {
    color: COLORS.white,
    fontSize: 21,
    marginLeft: 10,
  },
  security: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 25,
    paddingHorizontal: 25,
  },
});
