import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
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

const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.com$/i;

const PHONE_RE = /^\d{10}$/;

function classifyIdentifier(value) {
  const v = value.trim();

  if (!v) {
    return 'empty';
  }

  return /^\d/.test(v) ? 'phone' : 'email';
}

function validateIdentifier(value) {
  const v = value.trim();

  if (!v) {
    return 'Enter your email or phone number.';
  }

  if (/^\d/.test(v)) {
    if (!/^\d+$/.test(v)) {
      return 'Mobile number must contain digits only.';
    }

    if (!PHONE_RE.test(v)) {
      return 'Mobile number must be exactly 10 digits.';
    }

    return '';
  }

  if (!EMAIL_RE.test(v)) {
    return 'Enter a valid email ending with .com.';
  }

  return '';
}

export default function LoginScreen({onLogin, onSignup, onForgot}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const [focused, setFocused] = useState('');
  const [loading, setLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  /*
   * These refs are used ONLY for explicit keyboard navigation.
   *
   * Email field:
   *      Press NEXT → Password field
   *
   * Password field:
   *      Press DONE → Submit
   */
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  /*
   * Login lock timer.
   */
  useEffect(() => {
    if (!lockedUntil) {
      return undefined;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lockedUntil - Date.now()) / 1000),
      );

      setSecondsLeft(remaining);

      if (remaining === 0) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setServerError('');
      }
    }, 250);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  /*
   * Validate the complete login form.
   */
  const validate = () => {
    const next = {};

    const identifierError = validateIdentifier(identifier);

    if (identifierError) {
      next.identifier = identifierError;
    }

    if (!password) {
      next.password = 'Enter your password.';
    } else if (password.length < 8) {
      next.password = 'Password must contain at least 8 characters.';
    }

    setErrors(next);
    setServerError('');

    return Object.keys(next).length === 0;
  };

  /*
   * IMPORTANT:
   *
   * This function is called ONLY by the Email/Phone
   * TextInput's onSubmitEditing.
   *
   * Tapping the Email field will NOT call this function.
   *
   * No Keyboard.dismiss().
   * No requestAnimationFrame().
   * No onKeyPress().
   */
  const focusPasswordFromKeyboard = () => {
    passwordRef.current?.focus();
  };

  /*
   * Submit login.
   */
  const submit = async () => {
    if (lockedUntil > Date.now() || loading) {
      return;
    }

    if (!validate()) {
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setServerError('');

    try {
      await onLogin({identifier: identifier.trim(), password});
      setFailedAttempts(0);
      setErrors({});
      setServerError('');
      setLoading(false);
    } catch (error) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setLoading(false);
      setServerError(error?.message || 'Invalid username or password.');

      if (attempts >= 5) {
        const until = Date.now() + 30000;
        setLockedUntil(until);
        setSecondsLeft(30);
        setServerError(
          'Too many unsuccessful attempts. Please try again in 30 seconds.',
        );
      }
    }
  };

  /*
   * Clear an individual field error.
   */
  const clearError = name => {
    setErrors(previous => {
      const next = {...previous};

      delete next[name];

      return next;
    });

    setServerError('');
  };

  /*
   * Email / Phone input change.
   */
  const handleIdentifierChange = value => {
    setIdentifier(value);
    clearError('identifier');
  };

  /*
   * Password input change.
   */
  const handlePasswordChange = value => {
    setPassword(value);
    clearError('password');
  };

  const identifierType = classifyIdentifier(identifier);

  const identifierHint =
    identifierType === 'phone'
      ? `${identifier.length}/10 digits`
      : identifier
        ? 'Use name@domain.com'
        : '';

  const fieldStyle = name => [
    styles.inputWrap,
    focused === name && styles.focused,
    errors[name] && styles.inputError,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.heroIcon}>
            <Logo size={68} showText={false} />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>

          <Text style={styles.tagline}>
            Sign in to continue caring for the moments that matter.
          </Text>

          <View style={styles.form}>
            {/* =====================================================
                EMAIL / PHONE NUMBER
            ====================================================== */}

            <Text style={styles.label}>Email or Phone Number</Text>

            <View style={fieldStyle('identifier')}>
              <TextInput
                ref={emailRef}
                value={identifier}
                onChangeText={handleIdentifierChange}
                placeholder="Enter email or phone number"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
                returnKeyType="next"
                blurOnSubmit={false}
                /*
                 * ONLY pressing the keyboard Next button
                 * moves focus to Password.
                 */
                onSubmitEditing={focusPasswordFromKeyboard}
                onFocus={() => setFocused('identifier')}
                onBlur={() => setFocused('')}
                accessibilityLabel="Email or Phone Number"
                importantForAutofill="no"
                autoComplete="off"
              />
            </View>

            {identifierHint ? (
              <Text style={styles.hint}>{identifierHint}</Text>
            ) : null}

            {errors.identifier ? (
              <Text style={styles.fieldError}>
                {errors.identifier}
              </Text>
            ) : null}

            {/* =====================================================
                PASSWORD LABEL
            ====================================================== */}

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>

              <Pressable
                onPress={onForgot}
                accessibilityRole="link"
                hitSlop={8}>
                <Text style={styles.forgotText}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* =====================================================
                PASSWORD
            ====================================================== */}

            <View style={fieldStyle('password')}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={submit}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                accessibilityLabel="Password"
                importantForAutofill="no"
                autoComplete="off"
              />

              {/* Password visibility */}
              <Pressable
                onPress={() =>
                  setShowPassword(value => !value)
                }
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                hitSlop={8}>
                <Text style={styles.eyeText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            {errors.password ? (
              <Text style={styles.fieldError}>
                {errors.password}
              </Text>
            ) : null}

            {/* =====================================================
                SERVER / LOGIN ERROR
            ====================================================== */}

            {serverError ? (
              <View style={styles.alert}>
                <Text style={styles.alertIcon}>!</Text>

                <Text style={styles.alertText}>
                  {serverError}
                </Text>
              </View>
            ) : null}

            {/* =====================================================
                LOGIN BUTTON
            ====================================================== */}

            <Pressable
              onPress={submit}
              disabled={
                loading || lockedUntil > Date.now()
              }
              style={({pressed}) => [
                styles.loginButton,
                pressed &&
                  !loading &&
                  styles.pressed,
                (loading ||
                  lockedUntil > Date.now()) &&
                  styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Log In">
              {loading ? (
                <ActivityIndicator
                  color={COLORS.white}
                />
              ) : (
                <>
                  <Text style={styles.loginText}>
                    {lockedUntil > Date.now()
                      ? `Try again in ${secondsLeft}s`
                      : 'Log In'}
                  </Text>

                  {lockedUntil <= Date.now() ? (
                    <Text style={styles.loginArrow}>
                      →
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>

            {/* =====================================================
                SECURITY NOTE
            ====================================================== */}

            <View style={styles.securityNote}>
              <Text style={styles.securityIcon}>✓</Text>

              <Text style={styles.securityText}>
                Secure sign-in. Your connection should use HTTPS.
              </Text>
            </View>
          </View>

          {/* =====================================================
              SIGN UP SECTION
          ====================================================== */}

          <View style={styles.divider}>
            <View style={styles.line} />

            <Text style={styles.or}>OR</Text>

            <View style={styles.line} />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>
              New to Smaran?
            </Text>

            <Pressable
              onPress={onSignup}
              accessibilityRole="link"
              hitSlop={8}>
              <Text style={styles.link}>
                {' '}
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  card: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    ...SHADOW,
  },

  heroIcon: {
    alignSelf: 'center',
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 13,
  },

  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 8,
  },

  form: {
    marginTop: 21,
  },

  label: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: 7,
  },

  passwordLabelRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  forgotText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '900',
    marginBottom: 7,
  },

  inputWrap: {
    height: 56,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  focused: {
    borderColor: COLORS.primary,
    borderWidth: 1.8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 2,
  },

  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.white,
  },

  input: {
    flex: 1,
    paddingHorizontal: 0,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 54,
  },

  eye: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  eyeText: {
    fontSize: 11.5,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  hint: {
    fontSize: 10.5,
    color: COLORS.primaryDark,
    marginTop: 5,
    marginLeft: 3,
    fontWeight: '700',
  },

  fieldError: {
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.danger,
    marginTop: 5,
    marginLeft: 3,
  },

  alert: {
    marginTop: 12,
    borderRadius: 14,
    padding: 11,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
  },

  alertIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '900',
    marginRight: 9,
  },

  alertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.danger,
    fontWeight: '700',
  },

  loginButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    ...SHADOW,
  },

  pressed: {
    opacity: 0.86,
    transform: [{scale: 0.99}],
  },

  disabled: {
    opacity: 0.62,
  },

  loginText: {
    fontSize: 17.5,
    color: COLORS.white,
    fontWeight: '900',
  },

  loginArrow: {
    fontSize: 21,
    color: COLORS.white,
    marginLeft: 10,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 3,
  },

  securityIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primaryDark,
    textAlign: 'center',
    lineHeight: 19,
    fontSize: 11,
    fontWeight: '900',
    marginRight: 7,
  },

  securityText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 15,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  or: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '800',
    marginHorizontal: 10,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 13,
  },

  signupText: {
    fontSize: 13.5,
    color: COLORS.muted,
  },

  link: {
    fontSize: 13.5,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
});