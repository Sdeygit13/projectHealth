/**
 * @format
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => null),
  },
}));

jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(async () => ({available: false})),
    biometricKeysExist: jest.fn(async () => ({keysExist: false})),
    simplePrompt: jest.fn(async () => ({success: false, error: 'mock'})),
    createKeys: jest.fn(async () => ({})),
    deleteKeys: jest.fn(async () => ({keysDeleted: true})),
  })),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => undefined),
    requestPermission: jest.fn(async () => ({authorizationStatus: 1})),
    getNotificationSettings: jest.fn(async () => ({authorizationStatus: 1, android: {alarm: 'ENABLED'}})),
    cancelNotification: jest.fn(async () => undefined),
    createTriggerNotification: jest.fn(async () => undefined),
    getTriggerNotificationIds: jest.fn(async () => []),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
  },
  AndroidImportance: {HIGH: 3},
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
  TriggerType: {TIMESTAMP: 0},
  RepeatFrequency: {DAILY: 0},
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });
}, 15000);
