import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: false,
});

/**
 * Check whether biometric authentication is available.
 */
export async function checkBiometricAvailability() {
  try {
    const result = await rnBiometrics.isSensorAvailable();

    return {
      available: result?.available === true,
      biometryType: result?.biometryType || null,
      error: result?.error || null,
    };
  } catch (error) {
    console.log('Biometric availability error:', error);

    return {
      available: false,
      biometryType: null,
      error: error?.message || 'Unable to check biometric availability.',
    };
  }
}

/**
 * Check whether Smaran has biometric keys stored.
 *
 * This does NOT show a biometric prompt.
 */
export async function isBiometricEnabled() {
  try {
    const availability = await checkBiometricAvailability();

    if (!availability.available) {
      return false;
    }

    const result = await rnBiometrics.biometricKeysExist();

    return result?.keysExist === true;
  } catch (error) {
    console.log('Biometric enabled check error:', error);
    return false;
  }
}

/**
 * Authenticate the user with the device biometric.
 */
export async function authenticateBiometric(
  promptMessage = 'Verify your identity to open Smaran',
) {
  try {
    const result = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    return {
      success: result?.success === true,
      error: result?.error || null,
    };
  } catch (error) {
    console.log('Biometric authentication error:', error);

    return {
      success: false,
      error: error?.message || 'Biometric authentication failed.',
    };
  }
}

/**
 * Enable biometric login.
 *
 * IMPORTANT:
 * createKeys() alone does not ask the user for their fingerprint.
 * We therefore:
 *
 * 1. Check availability
 * 2. Create biometric keys
 * 3. Ask the user to authenticate
 * 4. Keep biometric enabled only if authentication succeeds
 */
export async function enableBiometric() {
  try {
    const availability = await checkBiometricAvailability();

    if (!availability.available) {
      return {
        success: false,
        available: false,
        error:
          availability.error ||
          'Biometric authentication is not available on this device.',
      };
    }

    await rnBiometrics.createKeys();

    const authentication = await authenticateBiometric(
      'Confirm your biometric to enable Smaran login',
    );

    if (!authentication.success) {
      // User cancelled or biometric authentication failed.
      try {
        await rnBiometrics.deleteKeys();
      } catch (deleteError) {
        console.log('Biometric cleanup error:', deleteError);
      }

      return {
        success: false,
        available: true,
        biometryType: availability.biometryType,
        error:
          authentication.error ||
          'Biometric setup was cancelled.',
      };
    }

    return {
      success: true,
      available: true,
      biometryType: availability.biometryType,
      error: null,
    };
  } catch (error) {
    console.log('Enable biometric error:', error);

    return {
      success: false,
      available: false,
      error:
        error?.message ||
        'Unable to enable biometric authentication.',
    };
  }
}

/**
 * Disable biometric login.
 */
export async function disableBiometric() {
  try {
    const result = await rnBiometrics.deleteKeys();

    return {
      success: true,
      keysDeleted: result?.keysDeleted === true,
      error: null,
    };
  } catch (error) {
    console.log('Disable biometric error:', error);

    return {
      success: false,
      keysDeleted: false,
      error:
        error?.message ||
        'Unable to disable biometric authentication.',
    };
  }
}

/**
 * Used when the app needs to verify an already-enabled
 * biometric login.
 */
export async function verifyBiometricAccess() {
  try {
    const enabled = await isBiometricEnabled();

    if (!enabled) {
      return {
        success: false,
        available: false,
        error: 'Biometric login is not enabled.',
      };
    }

    const result = await authenticateBiometric(
      'Verify your identity to open Smaran',
    );

    return {
      success: result.success,
      available: true,
      error: result.error || null,
    };
  } catch (error) {
    console.log('Biometric verification error:', error);

    return {
      success: false,
      available: false,
      error:
        error?.message ||
        'Biometric verification failed.',
    };
  }
}

export default {
  checkBiometricAvailability,
  isBiometricEnabled,
  authenticateBiometric,
  enableBiometric,
  disableBiometric,
  verifyBiometricAccess,
};