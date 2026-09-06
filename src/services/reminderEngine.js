// Smaran offline reminder engine.
// Pure/deterministic: no network, no AI API, no server dependency.

const LANGUAGE_ALIASES = {
  English: 'en',
  Bengali: 'bn',
  Hindi: 'hi',
  Assamese: 'as',
  en: 'en',
  bn: 'bn',
  hi: 'hi',
  as: 'as',
};

const normalize = value => String(value || '').trim().toLowerCase();

const getReminderTime = reminder =>
  reminder?.time ||
  reminder?.startTime ||
  reminder?.scheduledTime ||
  reminder?.dateTime ||
  reminder?.scheduledAt ||
  '';

const getReminderTitle = reminder =>
  reminder?.title || reminder?.name || reminder?.task || reminder?.label || 'Reminder';

const getReminderDetail = reminder =>
  reminder?.detail || reminder?.description || reminder?.notes || '';

const isDone = reminder => Boolean(reminder?.done || reminder?.completed);

const toMinutes = value => {
  const text = String(value || '').trim().toUpperCase();
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3];

  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (hour > 23 || minute > 59) return Number.MAX_SAFE_INTEGER;

  return hour * 60 + minute;
};

const sortReminders = reminders =>
  [...(Array.isArray(reminders) ? reminders : [])].sort((a, b) => {
    const aDate = Date.parse(String(a?.dateTime || a?.scheduledAt || ''));
    const bDate = Date.parse(String(b?.dateTime || b?.scheduledAt || ''));

    if (Number.isFinite(aDate) && Number.isFinite(bDate)) return aDate - bDate;
    return toMinutes(getReminderTime(a)) - toMinutes(getReminderTime(b));
  });

const getNextReminder = reminders => {
  const pending = (Array.isArray(reminders) ? reminders : []).filter(item => !isDone(item));
  if (!pending.length) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const timedToday = pending
    .map(item => ({item, minutes: toMinutes(getReminderTime(item))}))
    .filter(item => Number.isFinite(item.minutes) && item.minutes >= nowMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  return timedToday[0]?.item || sortReminders(pending)[0] || null;
};

const answerReminderQuestion = (question, reminders, requestedLanguage = 'English') => {
  const languageKey = LANGUAGE_ALIASES[requestedLanguage] || 'en';
  const text = normalize(question);
  const safe = Array.isArray(reminders) ? reminders : [];
  const pending = safe.filter(item => !isDone(item));
  const completed = safe.filter(item => isDone(item));
  const next = getNextReminder(safe);

  const title = next ? getReminderTitle(next) : '';
  const time = next ? getReminderTime(next) : '';

  if (!text) {
    return {
      text: {
        en: 'Please tell me what you would like to know about your reminders.',
        bn: 'আপনি আপনার রিমাইন্ডার সম্পর্কে কী জানতে চান, আমাকে বলুন।',
        hi: 'कृपया बताइए कि आप अपने रिमाइंडर के बारे में क्या जानना चाहते हैं।',
        as: 'আপোনাৰ ৰিমাইণ্ডাৰৰ বিষয়ে কি জানিব বিচাৰে মোক কওক।',
      }[languageKey],
      intent: 'unknown',
    };
  }

  const asksNext =
    /\b(next|upcoming|following)\b/.test(text) ||
    text.includes('পরের') || text.includes('পরবর্তী') || text.includes('আগন্তুক') ||
    text.includes('अगला') || text.includes('अगली') || text.includes('आने वाला');

  if (asksNext) {
    return {
      text: next
        ? {
            en: `Your next reminder is ${title}${time ? ` at ${time}` : ''}.`,
            bn: `আপনার পরবর্তী রিমাইন্ডার হলো ${title}${time ? `, সময় ${time}` : ''}।`,
            hi: `आपका अगला रिमाइंडर ${title} है${time ? `, समय ${time}` : ''}।`,
            as: `আপোনাৰ পৰৱৰ্তী ৰিমাইণ্ডাৰ হৈছে ${title}${time ? `, সময় ${time}` : ''}।`,
          }[languageKey]
        : {
            en: 'You have no pending reminders right now.',
            bn: 'এই মুহূর্তে আপনার কোনও বাকি রিমাইন্ডার নেই।',
            hi: 'अभी आपका कोई लंबित रिमाइंडर नहीं है।',
            as: 'এই মুহূৰ্তত আপোনাৰ কোনো বাকী ৰিমাইণ্ডাৰ নাই।',
          }[languageKey],
      intent: 'next',
      reminder: next,
    };
  }

  const asksMedicine =
    ['medicine', 'medication', 'tablet', 'pill', 'doctor', 'ওষুধ', 'ঔষধ', 'মেডিসিন', 'दवा', 'दवाई', 'औषध']
      .some(word => text.includes(word));

  if (asksMedicine) {
    const medicine = safe.find(item => {
      const combined = normalize(`${getReminderTitle(item)} ${getReminderDetail(item)}`);
      return ['medicine', 'medication', 'tablet', 'pill', 'doctor', 'ওষুধ', 'ঔষধ', 'মেডিসিন', 'दवा', 'दवाई', 'औषध']
        .some(word => combined.includes(word));
    });

    return {
      text: medicine
        ? {
            en: `Your medicine reminder is ${getReminderTitle(medicine)}${getReminderTime(medicine) ? ` at ${getReminderTime(medicine)}` : ''}.`,
            bn: `আপনার ওষুধের রিমাইন্ডার হলো ${getReminderTitle(medicine)}${getReminderTime(medicine) ? `, সময় ${getReminderTime(medicine)}` : ''}।`,
            hi: `आपकी दवा का रिमाइंडर ${getReminderTitle(medicine)} है${getReminderTime(medicine) ? `, समय ${getReminderTime(medicine)}` : ''}।`,
            as: `আপোনাৰ ঔষধৰ ৰিমাইণ্ডাৰ হৈছে ${getReminderTitle(medicine)}${getReminderTime(medicine) ? `, সময় ${getReminderTime(medicine)}` : ''}।`,
          }[languageKey]
        : {
            en: 'I could not find a medicine reminder in your current schedule.',
            bn: 'আপনার বর্তমান সময়সূচিতে কোনও ওষুধের রিমাইন্ডার খুঁজে পেলাম না।',
            hi: 'मुझे आपके वर्तमान शेड्यूल में दवा का कोई रिमाइंडर नहीं मिला।',
            as: 'আপোনাৰ বৰ্তমান সূচীত কোনো ঔষধৰ ৰিমাইণ্ডাৰ বিচাৰি নাপালোঁ।',
          }[languageKey],
      intent: 'medicine',
    };
  }

  const asksCompleted = ['completed', 'done', 'finished', 'complete', 'সম্পন্ন', 'হয়ে গেছে', 'हो गया', 'पूरा']
    .some(word => text.includes(word));

  if (asksCompleted) {
    return {
      text: {
        en: `You have completed ${completed.length} reminder${completed.length === 1 ? '' : 's'} so far.`,
        bn: `আপনি এখন পর্যন্ত ${completed.length}টি রিমাইন্ডার সম্পন্ন করেছেন।`,
        hi: `आपने अभी तक ${completed.length} रिमाइंडर पूरे किए हैं।`,
        as: `আপুনি এতিয়ালৈকে ${completed.length}টা ৰিমাইণ্ডাৰ সম্পূৰ্ণ কৰিছে।`,
      }[languageKey],
      intent: 'completed',
    };
  }

  const asksCount = ['how many', 'কত', 'কয়টা', 'কিমান', 'कितने', 'कितनी'].some(word => text.includes(word));

  if (asksCount) {
    return {
      text: {
        en: `You have ${pending.length} pending reminder${pending.length === 1 ? '' : 's'}.`,
        bn: `আপনার ${pending.length}টি বাকি রিমাইন্ডার আছে।`,
        hi: `आपके ${pending.length} लंबित रिमाइंडर हैं।`,
        as: `আপোনাৰ ${pending.length}টা বাকী ৰিমাইণ্ডাৰ আছে।`,
      }[languageKey],
      intent: 'count',
    };
  }

  const asksToday = ['today', 'schedule', 'reminder', 'reminders', 'plan', 'আজ', 'আজকে', 'আজিৰ', 'आज', 'आज का', 'आजकी']
    .some(word => text.includes(word));

  if (asksToday) {
    if (!safe.length) {
      return {
        text: {
          en: 'You do not have any reminders scheduled right now.',
          bn: 'এই মুহূর্তে আপনার কোনও রিমাইন্ডার নির্ধারিত নেই।',
          hi: 'अभी आपके लिए कोई रिमाइंडर निर्धारित नहीं है।',
          as: 'এই মুহূৰ্তত আপোনাৰ কোনো ৰিমাইণ্ডাৰ নিৰ্ধাৰিত নাই।',
        }[languageKey],
        intent: 'schedule',
      };
    }

    const names = sortReminders(safe).map(item => {
      const itemTime = getReminderTime(item);
      return itemTime ? `${itemTime} — ${getReminderTitle(item)}` : getReminderTitle(item);
    }).join(', ');

    return {
      text: {
        en: `You have ${safe.length} reminder${safe.length === 1 ? '' : 's'} scheduled. ${names}.`,
        bn: `আপনার ${safe.length}টি রিমাইন্ডার নির্ধারিত আছে। ${names}।`,
        hi: `आपके लिए ${safe.length} रिमाइंडर निर्धारित हैं। ${names}।`,
        as: `আপোনাৰ ${safe.length}টা ৰিমাইণ্ডাৰ নিৰ্ধাৰিত আছে। ${names}।`,
      }[languageKey],
      intent: 'schedule',
    };
  }

  return {
    text: {
      en: "I can help you with today's schedule, your next reminder, medicine reminders, and completed tasks.",
      bn: 'আমি আপনার আজকের সময়সূচি, পরবর্তী রিমাইন্ডার, ওষুধের রিমাইন্ডার এবং সম্পন্ন কাজ সম্পর্কে সাহায্য করতে পারি।',
      hi: 'मैं आपके आज के शेड्यूल, अगले रिमाइंडर, दवा के रिमाइंडर और पूरे किए गए कार्यों में मदद कर सकता हूँ।',
      as: 'মই আপোনাৰ আজিৰ সূচী, পৰৱৰ্তী ৰিমাইণ্ডাৰ, ঔষধৰ ৰিমাইণ্ডাৰ আৰু সম্পূৰ্ণ কৰা কামৰ বিষয়ে সহায় কৰিব পাৰোঁ।',
    }[languageKey],
    intent: 'unknown',
  };
};

module.exports = {
  answerReminderQuestion,
  getNextReminder,
  getReminderTime,
  getReminderTitle,
  getReminderDetail,
  isDone,
};
