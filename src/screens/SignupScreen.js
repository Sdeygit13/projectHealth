import React, {useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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

/* =====================================================
   OPTIONS
===================================================== */

const relationshipOptions = [
  'Spouse',
  'Adult Child',
  'Professional Nurse',
  'Relative',
];

const genderOptions = ['Male', 'Female', 'Others'];

const severityOptions = ['Mild', 'Moderate', 'Severe'];

const countryCodes = [
  {name: 'India', code: '+91'},
  {name: 'United States', code: '+1'},
  {name: 'United Kingdom', code: '+44'},
  {name: 'Canada', code: '+1'},
  {name: 'Australia', code: '+61'},
  {name: 'Bangladesh', code: '+880'},
  {name: 'Nepal', code: '+977'},
  {name: 'Bhutan', code: '+975'},
  {name: 'Singapore', code: '+65'},
  {name: 'United Arab Emirates', code: '+971'},
];

/* =====================================================
   VALIDATION
===================================================== */

const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/i;

const PHONE_RE = /^\d{10}$/;

/*
 * Accepts:
 * Asha Sharma
 * Asha Priya Sharma
 * Dr. Test Physician
 * Dr Amit Sharma
 * A. Sharma
 *
 * Requires 2–4 words.
 */
const NAME_RE =
  /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3}$/;

/* =====================================================
   HELPERS
===================================================== */

const emptyEmergency = () => ({
  name: '',
  countryCode: '+91',
  phone: '',
});

function pad(number) {
  return String(number).padStart(2, '0');
}

function formatDate(date) {
  return `${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
}

function parseDate(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [dd, mm, yyyy] = value.split('/').map(Number);

  const date = new Date(yyyy, mm - 1, dd);

  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }

  return date;
}

function dobError(value) {
  const v = value.trim();

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    return 'Select a date of birth.';
  }

  const date = parseDate(v);

  if (!date) {
    return 'Enter a valid date.';
  }

  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (date > today) {
    return 'Date of birth cannot be in the future.';
  }

  if (date.getFullYear() < 1900) {
    return 'Enter a valid date.';
  }

  return '';
}

function identifierError(value) {
  const v = value.trim();

  if (!v) {
    return 'Enter an email address or 10-digit mobile number.';
  }

  /*
   * If the first character is a digit,
   * treat the identifier as a mobile number.
   */
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
    return 'Enter a valid email address.';
  }

  return '';
}

function nameError(value, label = 'Full name') {
  const v = value.trim();

  if (!v) {
    return `${label} is required.`;
  }

  if (!NAME_RE.test(v)) {
    return 'Enter a valid name using 2–4 words.';
  }

  return '';
}

function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

function calculateAgeFromDob(value) {
  const date = parseDate(value);

  if (!date) {
    return '';
  }

  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const birthdayNotReached =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() &&
      today.getDate() < date.getDate());

  if (birthdayNotReached) {
    age -= 1;
  }

  return String(age);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDate(a, b) {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthTitle(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/* =====================================================
   MAIN SIGNUP SCREEN
===================================================== */

export default function SignupScreen({onBack, onComplete}) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    confirm: '',

    caregiverName: '',
    name: '',
    dob: '',
    address: '',
    relationship: '',

    patientName: '',
    patientDob: '',
    gender: '',
    patientAddress: '',
    diagnosis: '',
    severity: '',
    symptoms: '',

    doctorName: '',
    doctorPhone: '',
    doctorCountryCode: '+91',
  });

  const [emergencyContacts, setEmergencyContacts] = useState([
    emptyEmergency(),
  ]);

  const [errors, setErrors] = useState({});

  const [countryPicker, setCountryPicker] = useState(null);

  /*
   * Calendar:
   *
   * type = caregiver / patient
   */
  const [calendar, setCalendar] = useState(null);

  const [calendarView, setCalendarView] =
    useState('days');

  const refs = useRef({});

  /* =====================================================
     FORM UPDATE
  ===================================================== */

  const update = (key, value) => {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }));

    setErrors(previous => ({
      ...previous,
      [key]: undefined,
    }));
  };

  const focus = key => {
    requestAnimationFrame(() => {
      refs.current[key]?.focus?.();
    });
  };

  /* =====================================================
     EMERGENCY CONTACT UPDATE
  ===================================================== */

  const updateEmergency = (
    index,
    key,
    value,
  ) => {
    setEmergencyContacts(previous =>
      previous.map((contact, i) =>
        i === index
          ? {
              ...contact,
              [key]: value,
            }
          : contact,
      ),
    );

    setErrors(previous => ({
      ...previous,
      [`emergency_${index}`]: undefined,
    }));
  };

  const addEmergency = () => {
    setEmergencyContacts(previous => [
      ...previous,
      emptyEmergency(),
    ]);
  };

  const removeEmergency = index => {
    if (emergencyContacts.length === 1) {
      return;
    }

    setEmergencyContacts(previous =>
      previous.filter((_, i) => i !== index),
    );

    /*
     * Remove the corresponding validation error
     * so stale errors don't remain in state.
     */
    setErrors(previous => {
      const next = {...previous};

      delete next[`emergency_${index}`];

      return next;
    });
  };

  /* =====================================================
     STEP 1 VALIDATION
  ===================================================== */

  const validateStep1 = () => {
    const e = {};

    const idErr = identifierError(
      form.identifier,
    );

    if (idErr) {
      e.identifier = idErr;
    }

    if (!form.password) {
      e.password = 'Create a password.';
    } else if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/[0-9\W]/.test(form.password)
    ) {
      e.password =
        'Use 8+ characters with letters and numbers/symbols.';
    }

    if (!form.confirm) {
      e.confirm = 'Confirm your password.';
    } else if (
      form.password !== form.confirm
    ) {
      e.confirm = 'Passwords do not match.';
    }

    return e;
  };

  /* =====================================================
     STEP 2 VALIDATION
  ===================================================== */

  const validateStep2 = () => {
    const e = {};

    const nErr = nameError(
      form.name,
      'Caregiver name',
    );

    if (nErr) {
      e.name = nErr;
    }

    const dErr = dobError(form.dob);

    if (dErr) {
      e.dob = dErr;
    }

    if (!form.address.trim()) {
      e.address =
        'Contact address is required.';
    }

    if (!relationshipOptions.includes(
      form.relationship,
    )) {
      e.relationship =
        'Select a relationship.';
    }

    return e;
  };

  /* =====================================================
     STEP 3 VALIDATION
  ===================================================== */

  const validateStep3 = () => {
    const e = {};

    /* Patient name */

    const patientNameErr = nameError(
      form.patientName,
      'Patient name',
    );

    if (patientNameErr) {
      e.patientName = patientNameErr;
    }

    /* Patient DOB */

    const patientDobErr = dobError(
      form.patientDob,
    );

    if (patientDobErr) {
      e.patientDob = patientDobErr;
    }

    /* Age */

    const calculatedAge =
      calculateAgeFromDob(
        form.patientDob,
      );

    if (!calculatedAge) {
      e.age =
        'Age is calculated automatically from date of birth.';
    }

    /* Gender */

    if (
      !genderOptions.includes(
        form.gender,
      )
    ) {
      e.gender =
        'Select Male, Female or Others.';
    }

    /* Address */

    if (!form.patientAddress.trim()) {
      e.patientAddress =
        'Current address is required.';
    }

    /* Diagnosis */

    if (!form.diagnosis.trim()) {
      e.diagnosis =
        'Diagnosis is required.';
    }

    /* Severity */

    if (
      !severityOptions.includes(
        form.severity,
      )
    ) {
      e.severity =
        'Choose Mild, Moderate or Severe.';
    }

    /* Symptoms */

    if (!form.symptoms.trim()) {
      e.symptoms =
        'Enter the main symptoms or behaviours.';
    }

    /* Physician */

    const physicianNameErr =
      nameError(
        form.doctorName,
        'Attending physician name',
      );

    if (physicianNameErr) {
      e.doctorName =
        'Enter a valid physician name.';
    }

    if (
      !PHONE_RE.test(
        form.doctorPhone,
      )
    ) {
      e.doctorPhone =
        'Enter a valid 10-digit phone number.';
    }

    /* Emergency contacts */

    emergencyContacts.forEach(
      (contact, index) => {
        const contactNameErr =
          nameError(
            contact.name,
            'Contact name',
          );

        const phoneValid =
          PHONE_RE.test(
            contact.phone,
          );

        if (
          contactNameErr ||
          !phoneValid
        ) {
          e[`emergency_${index}`] =
            'Enter a valid contact name and 10-digit phone number.';
        }
      },
    );

    return e;
  };

  /* =====================================================
     NEXT
  ===================================================== */

  const next = () => {
    let e = {};

    if (step === 1) {
      e = validateStep1();
    } else if (step === 2) {
      e = validateStep2();
    } else if (step === 3) {
      e = validateStep3();
    }

    setErrors(e);

    if (
      Object.keys(e).length > 0
    ) {
      return;
    }

    /*
     * Continue to next step.
     */

    if (step < 3) {
      setStep(previous => previous + 1);
      return;
    }

    /*
     * Final submission.
     *
     * Age is calculated here instead of being
     * stored separately in form state.
     */

    const finalAge =
      calculateAgeFromDob(
        form.patientDob,
      );

    onComplete({
      ...form,

      caregiverName:
        form.name.trim() ||
        'Caregiver',

      patientName:
        form.patientName.trim() ||
        'Patient',

      patientDob:
        form.patientDob || '',

      age: finalAge,

      emergencyContacts:
        emergencyContacts.map(
          contact => ({
            name: contact.name.trim(),
            countryCode:
              contact.countryCode,
            phone: contact.phone,
          }),
        ),
    });
  };

  /* =====================================================
     BACK
  ===================================================== */

  const back = () => {
    if (calendar) {
      closeCalendar();
      return;
    }

    if (countryPicker) {
      setCountryPicker(null);
      return;
    }

    if (step > 1) {
      setStep(
        previous => previous - 1,
      );
      return;
    }

    onBack();
  };

  /* =====================================================
     CALENDAR
  ===================================================== */

  const openCalendar = type => {
    const currentValue =
      type === 'patient'
        ? form.patientDob
        : form.dob;

    const parsed =
      parseDate(currentValue);

    const initialDate =
      parsed || new Date();

    setCalendar({
      type,
      month:
        initialDate.getMonth(),
      year:
        initialDate.getFullYear(),
    });

    setCalendarView('days');

    setErrors(previous => ({
      ...previous,
      [type === 'patient'
        ? 'patientDob'
        : 'dob']: undefined,
    }));
  };

  const closeCalendar = () => {
    setCalendar(null);
    setCalendarView('days');
  };

  const changeMonth = direction => {
    setCalendar(previous => {
      if (!previous) {
        return previous;
      }

      let month =
        previous.month + direction;

      let year =
        previous.year;

      if (month < 0) {
        month = 11;
        year -= 1;
      }

      if (month > 11) {
        month = 0;
        year += 1;
      }

      const today = new Date();

      /*
       * Prevent future months.
       */

      if (
        year > today.getFullYear() ||
        (year ===
          today.getFullYear() &&
          month >
            today.getMonth())
      ) {
        return previous;
      }

      /*
       * Prevent dates before 1900.
       */

      if (year < 1900) {
        return previous;
      }

      return {
        ...previous,
        month,
        year,
      };
    });
  };

  const selectCalendarYear =
    year => {
      const today = new Date();

      const safeYear = Math.max(
        1900,
        Math.min(
          year,
          today.getFullYear(),
        ),
      );

      setCalendar(previous =>
        previous
          ? {
              ...previous,
              year: safeYear,
            }
          : previous,
      );

      setCalendarView('months');
    };

  const selectCalendarMonth =
    month => {
      setCalendar(previous =>
        previous
          ? {
              ...previous,
              month,
            }
          : previous,
      );

      setCalendarView('days');
    };

  /* =====================================================
     CALENDAR YEARS
  ===================================================== */

  const calendarYears = useMemo(() => {
    if (!calendar) {
      return [];
    }

    const currentYear =
      new Date().getFullYear();

    const years = [];

    for (
      let year = currentYear;
      year >= 1900;
      year -= 1
    ) {
      years.push(year);
    }

    return years;
  }, [calendar]);

  /* =====================================================
     CALENDAR MONTHS
  ===================================================== */

  const calendarMonths = useMemo(
    () =>
      Array.from(
        {length: 12},
        (_, month) =>
          new Date(
            2000,
            month,
            1,
          ).toLocaleDateString(
            'en-US',
            {
              month: 'short',
            },
          ),
      ),
    [],
  );

  /* =====================================================
     SELECT DATE
  ===================================================== */

  const selectDate = day => {
    if (!calendar) {
      return;
    }

    const selected =
      new Date(
        calendar.year,
        calendar.month,
        day,
      );

    const today = new Date();

    today.setHours(
      23,
      59,
      59,
      999,
    );

    if (selected > today) {
      return;
    }

    if (
      selected.getFullYear() < 1900
    ) {
      return;
    }

    const formatted =
      formatDate(selected);

    if (
      calendar.type ===
      'patient'
    ) {
      update(
        'patientDob',
        formatted,
      );
    } else {
      update(
        'dob',
        formatted,
      );
    }

    closeCalendar();
  };

  /* =====================================================
     CALENDAR DAYS
  ===================================================== */

  const calendarDays = useMemo(() => {
    if (!calendar) {
      return [];
    }

    const totalDays =
      getDaysInMonth(
        calendar.year,
        calendar.month,
      );

    const firstDay =
      getFirstDayOfMonth(
        calendar.year,
        calendar.month,
      );

    const cells = [];

    /*
     * Empty cells before first day.
     */

    for (
      let i = 0;
      i < firstDay;
      i += 1
    ) {
      cells.push(null);
    }

    /*
     * Actual days.
     */

    for (
      let day = 1;
      day <= totalDays;
      day += 1
    ) {
      cells.push(day);
    }

    return cells;
  }, [calendar]);

  /* =====================================================
     SELECTED CALENDAR DATE
  ===================================================== */

  const calendarSelectedDate =
    useMemo(() => {
      if (!calendar) {
        return null;
      }

      const value =
        calendar.type ===
        'patient'
          ? form.patientDob
          : form.dob;

      return parseDate(value);
    }, [
      calendar,
      form.patientDob,
      form.dob,
    ]);

  /* =====================================================
     COUNTRY PICKER TITLE
  ===================================================== */

  const countryListTitle =
    countryPicker === 'doctor'
      ? 'Physician country code'
      : 'Emergency contact country code';

  /* =====================================================
     AGE
  ===================================================== */

  const age = useMemo(
    () =>
      calculateAgeFromDob(
        form.patientDob,
      ),
    [form.patientDob],
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
        automaticallyAdjustKeyboardInsets
      >
        {/* =================================================
            TOP
        ================================================== */}

        <View style={styles.top}>
          <Pressable
            onPress={back}
            hitSlop={10}
            style={
              styles.backButton
            }
          >
            <Text style={styles.back}>
              ‹ Back
            </Text>
          </Pressable>

          <Logo size={40} />

          <Text style={styles.step}>
            {step}/3
          </Text>
        </View>

        {/* =================================================
            HEADER
        ================================================== */}

        <Text style={styles.eyebrow}>
          {step === 1
            ? 'CAREGIVER AUTHENTICATION'
            : step === 2
              ? 'CAREGIVER PROFILE'
              : 'PATIENT PROFILE'}
        </Text>

        <Text style={styles.title}>
          {step === 1
            ? 'Create your Smaran account'
            : step === 2
              ? 'Tell us about the caregiver'
              : 'Set up the patient profile'}
        </Text>

        <Text style={styles.subtitle}>
          {step === 1
            ? 'Secure access for the person responsible for care.'
            : step === 2
              ? 'These details help personalize the care experience.'
              : 'Keep the care team informed with the right context.'}
        </Text>

        {/* =================================================
            STEP 1
        ================================================== */}

        {step === 1 && (
          <>
            <Field
              refKey="identifier"
              refs={refs}
              label="Mobile or email"
              value={
                form.identifier
              }
              onChange={v =>
                update(
                  'identifier',
                  v,
                )
              }
              placeholder="name@domain.com or 10-digit mobile"
              error={
                errors.identifier
              }
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() =>
                focus('password')
              }
              hint={
                form.identifier &&
                /^\d/.test(
                  form.identifier,
                )
                  ? `${form.identifier.length}/10 digits`
                  : form.identifier
                    ? 'Email format: name@domain.com'
                    : ''
              }
            />

            <Field
              refKey="password"
              refs={refs}
              label="Create password"
              value={form.password}
              onChange={v =>
                update(
                  'password',
                  v,
                )
              }
              placeholder="Minimum 8 characters"
              error={
                errors.password
              }
              password
              returnKeyType="next"
              onSubmitEditing={() =>
                focus('confirm')
              }
            />

            <Field
              refKey="confirm"
              refs={refs}
              label="Confirm password"
              value={form.confirm}
              onChange={v =>
                update(
                  'confirm',
                  v,
                )
              }
              placeholder="Re-enter password"
              error={
                errors.confirm
              }
              password
              returnKeyType="done"
              onSubmitEditing={next}
            />

            <View style={styles.rule}>
              <Text
                style={
                  styles.ruleTitle
                }
              >
                Password requirements
              </Text>

              <Text
                style={
                  styles.ruleText
                }
              >
                At least 8 characters • letters •
                numbers or symbols
              </Text>
            </View>
          </>
        )}

        {/* =================================================
            STEP 2
        ================================================== */}

        {step === 2 && (
          <>
            <Field
              refKey="name"
              refs={refs}
              label="Full name"
              value={form.name}
              onChange={v =>
                update('name', v)
              }
              placeholder="First Middle Last"
              error={errors.name}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() =>
                openCalendar(
                  'caregiver',
                )
              }
              hint={
                form.name
                  ? 'Use 2–4 words for the full name.'
                  : ''
              }
            />

            <DateField
              label="Date of birth"
              value={form.dob}
              placeholder="DD/MM/YYYY"
              onPress={() =>
                openCalendar(
                  'caregiver',
                )
              }
              error={errors.dob}
              hint="Tap to choose date • Format: DD/MM/YYYY"
            />

            <Field
              refKey="address"
              refs={refs}
              label="Contact address"
              value={
                form.address
              }
              onChange={v =>
                update(
                  'address',
                  v,
                )
              }
              placeholder="Address"
              error={
                errors.address
              }
              multiline
              returnKeyType="done"
            />

            <Text style={styles.label}>
              Relationship to patient <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.chips}>
              {relationshipOptions.map(
                option => {
                  const active =
                    form.relationship ===
                    option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() =>
                        update(
                          'relationship',
                          option,
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {errors.relationship ? (
              <Text
                style={styles.error}
              >
                {
                  errors.relationship
                }
              </Text>
            ) : null}
          </>
        )}

        {/* =================================================
            STEP 3
        ================================================== */}

        {step === 3 && (
          <>
            <Field
              refKey="patientName"
              refs={refs}
              label="Patient full name"
              value={
                form.patientName
              }
              onChange={v =>
                update(
                  'patientName',
                  v,
                )
              }
              placeholder="First Middle Last"
              error={
                errors.patientName
              }
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() =>
                openCalendar(
                  'patient',
                )
              }
              hint={
                form.patientName
                  ? 'Use 2–4 words for the full name.'
                  : ''
              }
            />

            <DateField
              label="Date of birth"
              value={
                form.patientDob
              }
              placeholder="DD/MM/YYYY"
              onPress={() =>
                openCalendar(
                  'patient',
                )
              }
              error={
                errors.patientDob
              }
              hint="Tap to choose date • Age is calculated automatically"
            />

            {/* AGE */}

            <View style={styles.field}>
              <Text style={styles.label}>
                Age <Text style={styles.required}>*</Text>
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  styles.readOnly,
                  errors.age &&
                    styles.inputError,
                ]}
              >
                <Text
                  style={[
                    styles.input,
                    age
                      ? styles.readOnlyText
                      : styles.placeholderText,
                  ]}
                >
                  {age ||
                    'Calculated from date of birth'}
                </Text>
              </View>

              {errors.age ? (
                <Text
                  style={styles.error}
                >
                  {errors.age}
                </Text>
              ) : null}
            </View>

            {/* GENDER */}

            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.chips}>
              {genderOptions.map(
                option => {
                  const active =
                    form.gender ===
                    option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() =>
                        update(
                          'gender',
                          option,
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {errors.gender ? (
              <Text
                style={styles.error}
              >
                {errors.gender}
              </Text>
            ) : null}

            <Field
              refKey="patientAddress"
              refs={refs}
              label="Current address"
              value={
                form.patientAddress
              }
              onChange={v =>
                update(
                  'patientAddress',
                  v,
                )
              }
              placeholder="Patient address"
              error={
                errors.patientAddress
              }
              multiline
              returnKeyType="next"
              onSubmitEditing={() =>
                focus('diagnosis')
              }
            />

            <Field
              refKey="diagnosis"
              refs={refs}
              label="Dementia diagnosis"
              value={
                form.diagnosis
              }
              onChange={v =>
                update(
                  'diagnosis',
                  v,
                )
              }
              placeholder="e.g. Alzheimer's, Vascular"
              error={
                errors.diagnosis
              }
              returnKeyType="next"
              onSubmitEditing={() =>
                focus('symptoms')
              }
            />

            {/* SEVERITY */}

            <Text style={styles.label}>
              Current stage / severity <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.chips}>
              {severityOptions.map(
                option => {
                  const active =
                    form.severity ===
                    option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() =>
                        update(
                          'severity',
                          option,
                        )
                      }
                      style={[
                        styles.chip,
                        active &&
                          styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active &&
                            styles.chipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {errors.severity ? (
              <Text
                style={styles.error}
              >
                {errors.severity}
              </Text>
            ) : null}

            <Field
              refKey="symptoms"
              refs={refs}
              label="Primary symptoms & behaviours"
              value={
                form.symptoms
              }
              onChange={v =>
                update(
                  'symptoms',
                  v,
                )
              }
              placeholder="Memory loss, wandering risk..."
              error={
                errors.symptoms
              }
              multiline
              returnKeyType="next"
              onSubmitEditing={() =>
                focus('doctorName')
              }
            />

            {/* =================================================
                PHYSICIAN
            ================================================== */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Attending physician
            </Text>

            <Field
              refKey="doctorName"
              refs={refs}
              label="Physician name"
              value={
                form.doctorName
              }
              onChange={v =>
                update(
                  'doctorName',
                  v,
                )
              }
              placeholder="Dr. First Last"
              error={
                errors.doctorName
              }
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() =>
                focus(
                  'doctorPhone',
                )
              }
              hint={
                form.doctorName
                  ? 'Example: Dr. Test Physician'
                  : ''
              }
            />

            <PhoneField
              label="Physician mobile number"
              countryCode={
                form.doctorCountryCode
              }
              onCountryPress={() =>
                setCountryPicker(
                  'doctor',
                )
              }
              value={
                form.doctorPhone
              }
              onChange={v =>
                update(
                  'doctorPhone',
                  digitsOnly(
                    v,
                  ).slice(0, 10),
                )
              }
              error={
                errors.doctorPhone
              }
              refKey="doctorPhone"
              refs={refs}
              onSubmitEditing={() =>
                focus(
                  'emergency_0_name',
                )
              }
            />

            {/* =================================================
                EMERGENCY CONTACTS
            ================================================== */}

            <View
              style={
                styles.contactHeader
              }
            >
              <Text
                style={
                  styles.sectionTitleSmall
                }
              >
                Emergency / alternative contacts
              </Text>

              <Text
                style={
                  styles.contactCount
                }
              >
                {
                  emergencyContacts.length
                }
              </Text>
            </View>

            {emergencyContacts.map(
              (contact, index) => (
                <View
                  key={`emergency-${index}`}
                  style={
                    styles.contactCard
                  }
                >
                  <View
                    style={
                      styles.contactTitleRow
                    }
                  >
                    <Text
                      style={
                        styles.contactTitle
                      }
                    >
                      Contact {index + 1}
                    </Text>

                    {emergencyContacts.length >
                    1 ? (
                      <Pressable
                        onPress={() =>
                          removeEmergency(
                            index,
                          )
                        }
                        hitSlop={8}
                      >
                        <Text
                          style={
                            styles.removeText
                          }
                        >
                          Remove
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Field
                    refKey={`emergency_${index}_name`}
                    refs={refs}
                    label="Contact name"
                    value={
                      contact.name
                    }
                    onChange={v =>
                      updateEmergency(
                        index,
                        'name',
                        v,
                      )
                    }
                    placeholder="First Last"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      focus(
                        `emergency_${index}_phone`,
                      )
                    }
                  />

                  <PhoneField
                    label="Mobile number"
                    countryCode={
                      contact.countryCode
                    }
                    onCountryPress={() =>
                      setCountryPicker(
                        {
                          type:
                            'emergency',
                          index,
                        },
                      )
                    }
                    value={
                      contact.phone
                    }
                    onChange={v =>
                      updateEmergency(
                        index,
                        'phone',
                        digitsOnly(
                          v,
                        ).slice(0, 10),
                      )
                    }
                    refKey={`emergency_${index}_phone`}
                    refs={refs}
                    error={
                      errors[
                        `emergency_${index}`
                      ]
                    }
                    onSubmitEditing={
                      next
                    }
                  />
                </View>
              ),
            )}

            <Pressable
              onPress={
                addEmergency
              }
              style={
                styles.addContactButton
              }
            >
              <Text
                style={styles.plus}
              >
                ＋
              </Text>

              <Text
                style={
                  styles.addContactText
                }
              >
                Add another emergency contact
              </Text>
            </Pressable>
          </>
        )}

        {/* =================================================
            MAIN BUTTON
        ================================================== */}

        <Pressable
          onPress={next}
          style={({pressed}) => [
            styles.button,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            {step === 3
              ? 'Create Account'
              : 'Continue'}
          </Text>

          <Text
            style={styles.arrow}
          >
            →
          </Text>
        </Pressable>
      </ScrollView>

      {/* =================================================
          COUNTRY CODE MODAL
      ================================================== */}

      <Modal
        visible={!!countryPicker}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setCountryPicker(null)
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                {countryListTitle}
              </Text>

              <Pressable
                onPress={() =>
                  setCountryPicker(
                    null,
                  )
                }
                hitSlop={8}
              >
                <Text
                  style={
                    styles.modalClose
                  }
                >
                  Close
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {countryCodes.map(
                country => (
                  <Pressable
                    key={`${country.name}-${country.code}`}
                    style={
                      styles.countryRow
                    }
                    onPress={() => {
                      if (
                        countryPicker ===
                        'doctor'
                      ) {
                        update(
                          'doctorCountryCode',
                          country.code,
                        );
                      } else if (
                        countryPicker &&
                        countryPicker.type ===
                          'emergency'
                      ) {
                        updateEmergency(
                          countryPicker.index,
                          'countryCode',
                          country.code,
                        );
                      }

                      setCountryPicker(
                        null,
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.countryName
                      }
                    >
                      {
                        country.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.countryCode
                      }
                    >
                      {
                        country.code
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================
          DOB CALENDAR MODAL
      ================================================== */}

      <Modal
        visible={!!calendar}
        transparent
        animationType="slide"
        onRequestClose={
          closeCalendar
        }
      >
        <View
          style={
            styles.calendarBackdrop
          }
        >
          <View
            style={
              styles.calendarCard
            }
          >
            {/* CALENDAR HEADER */}

            <View
              style={
                styles.calendarHeaderTop
              }
            >
              <View>
                <Text
                  style={
                    styles.calendarEyebrow
                  }
                >
                  DATE OF BIRTH
                </Text>

                <Text
                  style={
                    styles.calendarSelectedText
                  }
                >
                  {calendarSelectedDate
                    ? formatDate(
                        calendarSelectedDate,
                      )
                    : 'Select a date'}
                </Text>
              </View>

              <Pressable
                onPress={
                  closeCalendar
                }
                style={
                  styles.calendarClose
                }
                hitSlop={8}
              >
                <Text
                  style={
                    styles.calendarCloseText
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {calendar ? (
              <>
                {/* MONTH / YEAR SELECTORS */}

                <View
                  style={
                    styles.calendarSelectorRow
                  }
                >
                  <Pressable
                    onPress={() =>
                      setCalendarView(
                        'months',
                      )
                    }
                    style={[
                      styles.calendarSelector,
                      calendarView ===
                        'months' &&
                        styles.calendarSelectorActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarSelectorText,
                        calendarView ===
                          'months' &&
                          styles.calendarSelectorTextActive,
                      ]}
                    >
                      {new Date(
                        calendar.year,
                        calendar.month,
                        1,
                      ).toLocaleDateString(
                        'en-US',
                        {
                          month:
                            'long',
                        },
                      )}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setCalendarView(
                        'years',
                      )
                    }
                    style={[
                      styles.calendarSelector,
                      calendarView ===
                        'years' &&
                        styles.calendarSelectorActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarSelectorText,
                        calendarView ===
                          'years' &&
                          styles.calendarSelectorTextActive,
                      ]}
                    >
                      {
                        calendar.year
                      }
                    </Text>
                  </Pressable>
                </View>

                {/* =================================================
                    YEAR VIEW
                ================================================== */}

                {calendarView ===
                'years' ? (
                  <ScrollView
                    style={
                      styles.yearPicker
                    }
                    showsVerticalScrollIndicator={
                      false
                    }
                  >
                    <View
                      style={
                        styles.yearGrid
                      }
                    >
                      {calendarYears.map(
                        year => {
                          const active =
                            year ===
                            calendar.year;

                          return (
                            <Pressable
                              key={year}
                              onPress={() =>
                                selectCalendarYear(
                                  year,
                                )
                              }
                              style={[
                                styles.yearCell,
                                active &&
                                  styles.yearCellActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.yearText,
                                  active &&
                                    styles.yearTextActive,
                                ]}
                              >
                                {
                                  year
                                }
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  </ScrollView>
                ) : calendarView ===
                  'months' ? (
                  /* =================================================
                     MONTH VIEW
                  ================================================== */

                  <View
                    style={
                      styles.monthGrid
                    }
                  >
                    {calendarMonths.map(
                      (
                        month,
                        index,
                      ) => {
                        const active =
                          index ===
                          calendar.month;

                        const today =
                          new Date();

                        const future =
                          calendar.year ===
                            today.getFullYear() &&
                          index >
                            today.getMonth();

                        return (
                          <Pressable
                            key={month}
                            disabled={
                              future
                            }
                            onPress={() =>
                              selectCalendarMonth(
                                index,
                              )
                            }
                            style={[
                              styles.monthCell,
                              active &&
                                styles.monthCellActive,
                              future &&
                                styles.monthCellDisabled,
                            ]}
                          >
                            <Text
                              style={[
                                styles.monthText,
                                active &&
                                  styles.monthTextActive,
                              ]}
                            >
                              {
                                month
                              }
                            </Text>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                ) : (
                  /* =================================================
                     DAY VIEW
                  ================================================== */

                  <>
                    <View
                      style={
                        styles.calendarMonthRow
                      }
                    >
                      <Pressable
                        onPress={() =>
                          changeMonth(
                            -1,
                          )
                        }
                        style={
                          styles.monthArrow
                        }
                        hitSlop={5}
                      >
                        <Text
                          style={
                            styles.monthArrowText
                          }
                        >
                          ‹
                        </Text>
                      </Pressable>

                      <Text
                        style={
                          styles.monthTitle
                        }
                      >
                        {monthTitle(
                          new Date(
                            calendar.year,
                            calendar.month,
                            1,
                          ),
                        )}
                      </Text>

                      <Pressable
                        onPress={() =>
                          changeMonth(
                            1,
                          )
                        }
                        style={
                          styles.monthArrow
                        }
                        hitSlop={5}
                      >
                        <Text
                          style={
                            styles.monthArrowText
                          }
                        >
                          ›
                        </Text>
                      </Pressable>
                    </View>

                    {/* WEEK DAYS */}

                    <View
                      style={
                        styles.weekRow
                      }
                    >
                      {[
                        'Sun',
                        'Mon',
                        'Tue',
                        'Wed',
                        'Thu',
                        'Fri',
                        'Sat',
                      ].map(
                        day => (
                          <Text
                            key={day}
                            style={
                              styles.weekDay
                            }
                          >
                            {day}
                          </Text>
                        ),
                      )}
                    </View>

                    {/* DAYS */}

                    <View
                      style={
                        styles.calendarGrid
                      }
                    >
                      {calendarDays.map(
                        (
                          day,
                          index,
                        ) => {
                          if (
                            day ===
                            null
                          ) {
                            return (
                              <View
                                key={`empty-${index}`}
                                style={
                                  styles.dayCell
                                }
                              />
                            );
                          }

                          const date =
                            new Date(
                              calendar.year,
                              calendar.month,
                              day,
                            );

                          const today =
                            new Date();

                          const isFuture =
                            date >
                            today;

                          const isSelected =
                            isSameDate(
                              date,
                              calendarSelectedDate,
                            );

                          const isToday =
                            isSameDate(
                              date,
                              today,
                            );

                          return (
                            <Pressable
                              key={day}
                              disabled={
                                isFuture
                              }
                              onPress={() =>
                                selectDate(
                                  day,
                                )
                              }
                              style={[
                                styles.dayCell,
                                isSelected &&
                                  styles.dayCellSelected,
                                isToday &&
                                  !isSelected &&
                                  styles.dayCellToday,
                                isFuture &&
                                  styles.dayCellDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  isSelected &&
                                    styles.dayTextSelected,
                                  isFuture &&
                                    styles.dayTextDisabled,
                                ]}
                              >
                                {
                                  day
                                }
                              </Text>
                            </Pressable>
                          );
                        },
                      )}
                    </View>

                    <Text
                      style={
                        styles.calendarHint
                      }
                    >
                      Select the actual date of birth. You can
                      switch between year, month and day for
                      faster selection.
                    </Text>
                  </>
                )}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* =====================================================
   DATE FIELD
===================================================== */

function DateField({
  label,
  value,
  placeholder,
  onPress,
  error,
  hint,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>

      <Pressable
        onPress={onPress}
        style={[
          styles.inputWrap,
          error &&
            styles.inputError,
        ]}
      >
        <Text
          style={[
            styles.dateInputText,
            value
              ? styles.readOnlyText
              : styles.placeholderText,
          ]}
        >
          {value || placeholder}
        </Text>

        <View
          style={
            styles.calendarIconCircle
          }
        >
          <Text
            style={
              styles.calendarIcon
            }
          >
            ▣
          </Text>
        </View>
      </Pressable>

      {hint ? (
        <Text style={styles.hint}>
          {hint}
        </Text>
      ) : null}

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* =====================================================
   PHONE FIELD
===================================================== */

const PhoneField = React.forwardRef(
  function PhoneField(
    {
      label,
      countryCode,
      onCountryPress,
      value,
      onChange,
      error,
      refKey,
      refs,
      onSubmitEditing,
    },
    ref,
  ) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {label} <Text style={styles.required}>*</Text>
        </Text>

        <View
          style={[
            styles.inputWrap,
            error &&
              styles.inputError,
          ]}
        >
          <Pressable
            onPress={
              onCountryPress
            }
            style={
              styles.countryButton
            }
          >
            <Text
              style={
                styles.countryCodeText
              }
            >
              {countryCode}
            </Text>

            <Text
              style={
                styles.chevron
              }
            >
              ⌄
            </Text>
          </Pressable>

          <TextInput
            ref={node => {
              refs.current[refKey] =
                node;

              if (
                typeof ref ===
                'function'
              ) {
                ref(node);
              }
            }}
            value={value}
            onChangeText={
              onChange
            }
            placeholder="10-digit mobile number"
            placeholderTextColor={
              COLORS.muted
            }
            style={
              styles.input
            }
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={
              onSubmitEditing
            }
          />
        </View>

        <Text style={styles.hint}>
          {value.length}/10 digits •
          Country code can be changed
        </Text>

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

/* =====================================================
   NORMAL FIELD
===================================================== */

const Field = React.forwardRef(
  function Field(
    {
      refKey,
      refs,
      label,
      value,
      onChange,
      placeholder,
      error,
      password,
      multiline,
      keyboardType,
      autoCapitalize = 'none',
      returnKeyType = 'next',
      onSubmitEditing,
      maxLength,
      hint,
    },
    ref,
  ) {
    const [show, setShow] =
      useState(false);

    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {label} <Text style={styles.required}>*</Text>
        </Text>

        <View
          style={[
            styles.inputWrap,
            multiline &&
              styles.multilineWrap,
            error &&
              styles.inputError,
          ]}
        >
          <TextInput
            ref={node => {
              refs.current[refKey] =
                node;

              if (
                typeof ref ===
                'function'
              ) {
                ref(node);
              }
            }}
            value={value}
            onChangeText={
              onChange
            }
            placeholder={
              placeholder
            }
            placeholderTextColor={
              COLORS.muted
            }
            style={[
              styles.input,
              multiline &&
                styles.multiline,
            ]}
            secureTextEntry={
              password && !show
            }
            autoCapitalize={
              autoCapitalize
            }
            autoCorrect={false}
            spellCheck={false}
            keyboardType={
              keyboardType
            }
            multiline={
              multiline
            }
            maxLength={
              maxLength
            }
            returnKeyType={
              returnKeyType
            }
            submitBehavior={
              multiline
                ? 'newline'
                : 'submit'
            }
            onSubmitEditing={
              onSubmitEditing
            }
          />

          {password ? (
            <Pressable
              onPress={() =>
                setShow(
                  previous =>
                    !previous,
                )
              }
              hitSlop={8}
            >
              <Text
                style={
                  styles.show
                }
              >
                {show
                  ? 'Hide'
                  : 'Show'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {hint ? (
          <Text style={styles.hint}>
            {hint}
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 55,
  },

  /* =================================================
     TOP
  ================================================== */

  top: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  backButton: {
    minWidth: 75,
    height: 44,
    justifyContent:
      'center',
  },

  back: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  step: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '900',
  },

  /* =================================================
     HEADER
  ================================================== */

  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: COLORS.primaryDark,
    fontWeight: '900',
    marginTop: 20,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 6,
  },

  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.muted,
    marginTop: 7,
  },

  /* =================================================
     FIELDS
  ================================================== */

  field: {
    marginTop: 17,
  },

  label: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: 7,
  },

  required: {
    color: COLORS.danger,
    fontWeight: '900',
  },

  inputWrap: {
    minHeight: 56,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  multilineWrap: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 2,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 0,
    paddingVertical: 0,
  },

  multiline: {
    height: 92,
    textAlignVertical: 'top',
    paddingTop: 13,
    paddingBottom: 10,
  },

  dateInputText: {
    flex: 1,
    fontSize: 15,
  },

  calendarIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      COLORS.primarySoft,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  calendarIcon: {
    fontSize: 17,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  readOnly: {
    backgroundColor:
      COLORS.mint,
    borderColor:
      COLORS.primarySoft,
  },

  readOnlyText: {
    color: COLORS.text,
    fontWeight: '900',
  },

  placeholderText: {
    color: COLORS.muted,
  },

  show: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '900',
    paddingLeft: 10,
  },

  hint: {
    fontSize: 10.5,
    color: COLORS.primaryDark,
    marginTop: 5,
    marginLeft: 3,
    fontWeight: '700',
  },

  error: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 5,
    lineHeight: 16,
  },

  /* =================================================
     PASSWORD RULE
  ================================================== */

  rule: {
    marginTop: 18,
    borderRadius: 15,
    backgroundColor:
      COLORS.mint,
    padding: 13,
  },

  ruleTitle: {
    fontSize: 12,
    color: COLORS.primaryDeep,
    fontWeight: '900',
  },

  ruleText: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 5,
  },

  /* =================================================
     CHIPS
  ================================================== */

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },

  chipActive: {
    backgroundColor:
      COLORS.primarySoft,
    borderColor:
      COLORS.primary,
  },

  chipText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '800',
  },

  chipTextActive: {
    color: COLORS.primaryDark,
  },

  /* =================================================
     SECTION TITLES
  ================================================== */

  sectionTitle: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 28,
    marginBottom: 3,
  },

  sectionTitleSmall: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  /* =================================================
     EMERGENCY CONTACTS
  ================================================== */

  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: 26,
    marginBottom: 4,
  },

  contactCount: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '900',
    backgroundColor:
      COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  contactCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 15,
    borderRadius: 18,
    backgroundColor:
      COLORS.mint,
    borderWidth: 1,
    borderColor:
      COLORS.primarySoft,
  },

  contactTitleRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  contactTitle: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '900',
  },

  removeText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '900',
  },

  /* =================================================
     PHONE
  ================================================== */

  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    marginRight: 4,
    borderRightWidth: 1,
    borderRightColor:
      COLORS.border,
  },

  countryCodeText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  chevron: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 4,
  },

  /* =================================================
     ADD CONTACT
  ================================================== */

  addContactButton: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor:
      COLORS.primary,
    marginTop: 14,
    alignItems: 'center',
    justifyContent:
      'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },

  plus: {
    fontSize: 23,
    color: COLORS.primaryDark,
    fontWeight: '900',
    marginRight: 6,
  },

  addContactText: {
    fontSize: 12.5,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  /* =================================================
     MAIN BUTTON
  ================================================== */

  button: {
    height: 57,
    borderRadius: 17,
    backgroundColor:
      COLORS.primary,
    marginTop: 28,
    alignItems: 'center',
    justifyContent:
      'center',
    flexDirection: 'row',
    ...SHADOW,
  },

  pressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

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

  /* =================================================
     COUNTRY MODAL
  ================================================== */

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.38)',
    justifyContent:
      'flex-end',
  },

  modalCard: {
    backgroundColor:
      COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '70%',
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
  },

  modalClose: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  countryRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  countryName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },

  countryCode: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  /* =================================================
     CALENDAR
  ================================================== */

  calendarBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.42)',
    justifyContent:
      'flex-end',
  },

  calendarCard: {
    backgroundColor:
      COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },

  calendarHeaderTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  calendarEyebrow: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  calendarSelectedText: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 3,
  },

  calendarClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      COLORS.primarySoft,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  calendarCloseText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  calendarSelectorRow: {
    flexDirection: 'row',
    marginTop: 22,
    marginBottom: 8,
  },

  calendarSelector: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor:
      COLORS.mint,
    alignItems: 'center',
    justifyContent:
      'center',
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },

  calendarSelectorActive: {
    backgroundColor:
      COLORS.primarySoft,
    borderWidth: 1,
    borderColor:
      COLORS.primary,
  },

  calendarSelectorText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  calendarSelectorTextActive: {
    color: COLORS.primaryDark,
  },

  /* =================================================
     YEAR PICKER
  ================================================== */

  yearPicker: {
    maxHeight: 310,
    marginTop: 8,
  },

  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
  },

  yearCell: {
    width: '31%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 8,
    backgroundColor:
      COLORS.mint,
  },

  yearCellActive: {
    backgroundColor:
      COLORS.primary,
  },

  yearText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },

  yearTextActive: {
    color: COLORS.white,
    fontWeight: '900',
  },

  /* =================================================
     MONTH PICKER
  ================================================== */

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginTop: 8,
  },

  monthCell: {
    width: '31%',
    height: 52,
    borderRadius: 14,
    backgroundColor:
      COLORS.mint,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 9,
  },

  monthCellActive: {
    backgroundColor:
      COLORS.primary,
  },

  monthCellDisabled: {
    opacity: 0.28,
  },

  monthText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },

  monthTextActive: {
    color: COLORS.white,
    fontWeight: '900',
  },

  /* =================================================
     CALENDAR DAY VIEW
  ================================================== */

  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: 22,
    marginBottom: 14,
  },

  monthArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.primarySoft,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  monthArrowText: {
    fontSize: 27,
    lineHeight: 30,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  monthTitle: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  weekDay: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '900',
    paddingVertical: 7,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.2857%',
    height: 43,
    alignItems: 'center',
    justifyContent:
      'center',
    marginVertical: 2,
  },

  dayCellSelected: {
    backgroundColor:
      COLORS.primary,
    borderRadius: 22,
  },

  dayCellToday: {
    borderWidth: 1.5,
    borderColor:
      COLORS.primary,
    borderRadius: 22,
  },

  dayCellDisabled: {
    opacity: 0.25,
  },

  dayText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },

  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '900',
  },

  dayTextDisabled: {
    color: COLORS.muted,
  },

  calendarHint: {
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 13,
  },
});