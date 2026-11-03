// ../../Legal Dashboards/src/lib/types.ts
var STAGE_META = {
  nov: {
    label: "NOV issued",
    short: "NOV",
    order: 0,
    color: "#64748b",
    text: "text-slate-600",
    bg: "bg-white/50"
  },
  pabNov: {
    label: "PAB NOV issued",
    short: "PAB NOV",
    order: 1,
    color: "#c47a12",
    text: "text-amber-800",
    bg: "bg-amber-100/70"
  },
  order: {
    label: "Order / Resolution",
    short: "Order",
    order: 2,
    color: "#0e7490",
    text: "text-sky-800",
    bg: "bg-sky-100/70"
  },
  pabOrder: {
    label: "PAB Order / Resolution",
    short: "PAB Order",
    order: 3,
    color: "#4d7c0f",
    text: "text-lime-900",
    bg: "bg-lime-100/70"
  },
  payment: {
    label: "Payment recorded",
    short: "Paid",
    order: 4,
    color: "#15803d",
    text: "text-emerald-800",
    bg: "bg-emerald-100/70"
  }
};

// ../../Legal Dashboards/node_modules/date-fns/constants.js
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var millisecondsInMinute = 6e4;
var millisecondsInHour = 36e5;
var millisecondsInSecond = 1e3;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = Symbol.for("constructDateFrom");

// ../../Legal Dashboards/node_modules/date-fns/constructFrom.js
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}

// ../../Legal Dashboards/node_modules/date-fns/toDate.js
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}

// ../../Legal Dashboards/node_modules/date-fns/addDays.js
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// ../../Legal Dashboards/node_modules/date-fns/startOfWeek.js
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../../Legal Dashboards/node_modules/date-fns/startOfISOWeek.js
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

// ../../Legal Dashboards/node_modules/date-fns/getISOWeekYear.js
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/normalizeDates.js
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date) => typeof date === "object")
  );
  return dates.map(normalize);
}

// ../../Legal Dashboards/node_modules/date-fns/startOfDay.js
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../../Legal Dashboards/node_modules/date-fns/differenceInCalendarDays.js
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

// ../../Legal Dashboards/node_modules/date-fns/startOfISOWeekYear.js
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(options?.in || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// ../../Legal Dashboards/node_modules/date-fns/isDate.js
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// ../../Legal Dashboards/node_modules/date-fns/isValid.js
function isValid(date) {
  return !(!isDate(date) && typeof date !== "number" || isNaN(+toDate(date)));
}

// ../../Legal Dashboards/node_modules/date-fns/startOfYear.js
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// ../../Legal Dashboards/node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US/_lib/formatLong.js
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// ../../Legal Dashboards/node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// ../../Legal Dashboards/node_modules/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // [TODO] -- I challenge you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// ../../Legal Dashboards/node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// ../../Legal Dashboards/node_modules/date-fns/locale/en-US.js
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// ../../Legal Dashboards/node_modules/date-fns/getDayOfYear.js
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// ../../Legal Dashboards/node_modules/date-fns/getISOWeek.js
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../../Legal Dashboards/node_modules/date-fns/getWeekYear.js
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}

// ../../Legal Dashboards/node_modules/date-fns/startOfWeekYear.js
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// ../../Legal Dashboards/node_modules/date-fns/getWeek.js
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// ../../Legal Dashboards/node_modules/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(+date / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// ../../Legal Dashboards/node_modules/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// ../../Legal Dashboards/node_modules/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// ../../Legal Dashboards/node_modules/date-fns/format.js
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// ../../Legal Dashboards/node_modules/date-fns/getDefaultOptions.js
function getDefaultOptions2() {
  return Object.assign({}, getDefaultOptions());
}

// ../../Legal Dashboards/node_modules/date-fns/getISODay.js
function getISODay(date, options) {
  const day = toDate(date, options?.in).getDay();
  return day === 0 ? 7 : day;
}

// ../../Legal Dashboards/node_modules/date-fns/transpose.js
function transpose(date, constructor) {
  const date_ = isConstructor(constructor) ? new constructor(0) : constructFrom(constructor, 0);
  date_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  date_.setHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
  return date_;
}
function isConstructor(constructor) {
  return typeof constructor === "function" && constructor.prototype?.constructor === constructor;
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/Setter.js
var TIMEZONE_UNIT_PRIORITY = 10;
var Setter = class {
  subPriority = 0;
  validate(_utcDate, _options) {
    return true;
  }
};
var ValueSetter = class extends Setter {
  constructor(value, validateValue, setValue, priority, subPriority) {
    super();
    this.value = value;
    this.validateValue = validateValue;
    this.setValue = setValue;
    this.priority = priority;
    if (subPriority) {
      this.subPriority = subPriority;
    }
  }
  validate(date, options) {
    return this.validateValue(date, this.value, options);
  }
  set(date, flags, options) {
    return this.setValue(date, flags, this.value, options);
  }
};
var DateTimezoneSetter = class extends Setter {
  priority = TIMEZONE_UNIT_PRIORITY;
  subPriority = -1;
  constructor(context, reference) {
    super();
    this.context = context || ((date) => constructFrom(reference, date));
  }
  set(date, flags) {
    if (flags.timestampIsSet) return date;
    return constructFrom(date, transpose(date, this.context));
  }
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/Parser.js
var Parser = class {
  run(dateString, token, match2, options) {
    const result = this.parse(dateString, token, match2, options);
    if (!result) {
      return null;
    }
    return {
      setter: new ValueSetter(
        result.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority
      ),
      rest: result.rest
    };
  }
  validate(_utcDate, _value, _options) {
    return true;
  }
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/EraParser.js
var EraParser = class extends Parser {
  priority = 140;
  parse(dateString, token, match2) {
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
      // A, B
      case "GGGGG":
        return match2.era(dateString, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return match2.era(dateString, { width: "wide" }) || match2.era(dateString, { width: "abbreviated" }) || match2.era(dateString, { width: "narrow" });
    }
  }
  set(date, flags, value) {
    flags.era = value;
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["R", "u", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/constants.js
var numericPatterns = {
  month: /^(1[0-2]|0?\d)/,
  // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/,
  // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/,
  // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/,
  // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/,
  // 0 to 12
  minute: /^[0-5]?\d/,
  // 0 to 59
  second: /^[0-5]?\d/,
  // 0 to 59
  singleDigit: /^\d/,
  // 0 to 9
  twoDigits: /^\d{1,2}/,
  // 0 to 99
  threeDigits: /^\d{1,3}/,
  // 0 to 999
  fourDigits: /^\d{1,4}/,
  // 0 to 9999
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/,
  // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/,
  // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/
  // 0 to 9999, -0 to -9999
};
var timezonePatterns = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/utils.js
function mapValue(parseFnResult, mapFn) {
  if (!parseFnResult) {
    return parseFnResult;
  }
  return {
    value: mapFn(parseFnResult.value),
    rest: parseFnResult.rest
  };
}
function parseNumericPattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  return {
    value: parseInt(matchResult[0], 10),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseTimezonePattern(pattern, dateString) {
  const matchResult = dateString.match(pattern);
  if (!matchResult) {
    return null;
  }
  if (matchResult[0] === "Z") {
    return {
      value: 0,
      rest: dateString.slice(1)
    };
  }
  const sign = matchResult[1] === "+" ? 1 : -1;
  const hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
  const minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
  const seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
  return {
    value: sign * (hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * millisecondsInSecond),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseAnyDigitsSigned(dateString) {
  return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
}
function parseNDigits(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigit, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigits, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigits, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigits, dateString);
    default:
      return parseNumericPattern(new RegExp("^\\d{1," + n + "}"), dateString);
  }
}
function parseNDigitsSigned(n, dateString) {
  switch (n) {
    case 1:
      return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
    case 2:
      return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
    case 3:
      return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
    case 4:
      return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
    default:
      return parseNumericPattern(new RegExp("^-?\\d{1," + n + "}"), dateString);
  }
}
function dayPeriodEnumToHours(dayPeriod) {
  switch (dayPeriod) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}
function normalizeTwoDigitYear(twoDigitYear, currentYear) {
  const isCommonEra = currentYear > 0;
  const absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
  let result;
  if (absCurrentYear <= 50) {
    result = twoDigitYear || 100;
  } else {
    const rangeEnd = absCurrentYear + 50;
    const rangeEndCentury = Math.trunc(rangeEnd / 100) * 100;
    const isPreviousCentury = twoDigitYear >= rangeEnd % 100;
    result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
  }
  return isCommonEra ? result : 1 - result;
}
function isLeapYearIndex(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/YearParser.js
var YearParser = class extends Parser {
  priority = 130;
  incompatibleTokens = ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"];
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "yy"
    });
    switch (token) {
      case "y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value) {
    const currentYear = date.getFullYear();
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(normalizedTwoDigitYear, 0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/LocalWeekYearParser.js
var LocalWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token, match2) {
    const valueCallback = (year) => ({
      year,
      isTwoDigitYear: token === "YY"
    });
    switch (token) {
      case "Y":
        return mapValue(parseNDigits(4, dateString), valueCallback);
      case "Yo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "year"
          }),
          valueCallback
        );
      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }
  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }
  set(date, flags, value, options) {
    const currentYear = getWeekYear(date, options);
    if (value.isTwoDigitYear) {
      const normalizedTwoDigitYear = normalizeTwoDigitYear(
        value.year,
        currentYear
      );
      date.setFullYear(
        normalizedTwoDigitYear,
        0,
        options.firstWeekContainsDate
      );
      date.setHours(0, 0, 0, 0);
      return startOfWeek(date, options);
    }
    const year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setFullYear(year, 0, options.firstWeekContainsDate);
    date.setHours(0, 0, 0, 0);
    return startOfWeek(date, options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ISOWeekYearParser.js
var ISOWeekYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "R") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    const firstWeekOfYear = constructFrom(date, 0);
    firstWeekOfYear.setFullYear(value, 0, 4);
    firstWeekOfYear.setHours(0, 0, 0, 0);
    return startOfISOWeek(firstWeekOfYear);
  }
  incompatibleTokens = [
    "G",
    "y",
    "Y",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ExtendedYearParser.js
var ExtendedYearParser = class extends Parser {
  priority = 130;
  parse(dateString, token) {
    if (token === "u") {
      return parseNDigitsSigned(4, dateString);
    }
    return parseNDigitsSigned(token.length, dateString);
  }
  set(date, _flags, value) {
    date.setFullYear(value, 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/QuarterParser.js
var QuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
      case "QQ":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/StandAloneQuarterParser.js
var StandAloneQuarterParser = class extends Parser {
  priority = 120;
  parse(dateString, token, match2) {
    switch (token) {
      // 1, 2, 3, 4
      case "q":
      case "qq":
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return match2.ordinalNumber(dateString, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return match2.quarter(dateString, {
          width: "wide",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.quarter(dateString, {
          width: "narrow",
          context: "standalone"
        });
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 4;
  }
  set(date, _flags, value) {
    date.setMonth((value - 1) * 3, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/MonthParser.js
var MonthParser = class extends Parser {
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "L",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "M":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "MM":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "MMM":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
      // J, F, ..., D
      case "MMMMM":
        return match2.month(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return match2.month(dateString, { width: "wide", context: "formatting" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.month(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/StandAloneMonthParser.js
var StandAloneMonthParser = class extends Parser {
  priority = 110;
  parse(dateString, token, match2) {
    const valueCallback = (value) => value - 1;
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return mapValue(
          parseNumericPattern(numericPatterns.month, dateString),
          valueCallback
        );
      // 01, 02, ..., 12
      case "LL":
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "month"
          }),
          valueCallback
        );
      // Jan, Feb, ..., Dec
      case "LLL":
        return match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
      // J, F, ..., D
      case "LLLLL":
        return match2.month(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return match2.month(dateString, { width: "wide", context: "standalone" }) || match2.month(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.month(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    date.setMonth(value, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/setWeek.js
function setWeek(date, week, options) {
  const date_ = toDate(date, options?.in);
  const diff = getWeek(date_, options) - week;
  date_.setDate(date_.getDate() - diff * 7);
  return toDate(date_, options?.in);
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/LocalWeekParser.js
var LocalWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "w":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "wo":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value, options) {
    return startOfWeek(setWeek(date, value, options), options);
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/setISOWeek.js
function setISOWeek(date, week, options) {
  const _date = toDate(date, options?.in);
  const diff = getISOWeek(_date, options) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ISOWeekParser.js
var ISOWeekParser = class extends Parser {
  priority = 100;
  parse(dateString, token, match2) {
    switch (token) {
      case "I":
        return parseNumericPattern(numericPatterns.week, dateString);
      case "Io":
        return match2.ordinalNumber(dateString, { unit: "week" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 53;
  }
  set(date, _flags, value) {
    return startOfISOWeek(setISOWeek(date, value));
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/DateParser.js
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
var DateParser = class extends Parser {
  priority = 90;
  subPriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "d":
        return parseNumericPattern(numericPatterns.date, dateString);
      case "do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    const month = date.getMonth();
    if (isLeapYear) {
      return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
    } else {
      return value >= 1 && value <= DAYS_IN_MONTH[month];
    }
  }
  set(date, _flags, value) {
    date.setDate(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/DayOfYearParser.js
var DayOfYearParser = class extends Parser {
  priority = 90;
  subpriority = 1;
  parse(dateString, token, match2) {
    switch (token) {
      case "D":
      case "DD":
        return parseNumericPattern(numericPatterns.dayOfYear, dateString);
      case "Do":
        return match2.ordinalNumber(dateString, { unit: "date" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(date, value) {
    const year = date.getFullYear();
    const isLeapYear = isLeapYearIndex(year);
    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }
  set(date, _flags, value) {
    date.setMonth(0, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "E",
    "i",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/setDay.js
function setDay(date, day, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const date_ = toDate(date, options?.in);
  const currentDay = date_.getDay();
  const remainder = day % 7;
  const dayIndex = (remainder + 7) % 7;
  const delta = 7 - weekStartsOn;
  const diff = day < 0 || day > 6 ? day - (currentDay + delta) % 7 : (dayIndex + delta) % 7 - (currentDay + delta) % 7;
  return addDays(date_, diff, options);
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/DayParser.js
var DayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "EEEEE":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "EEEE":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["D", "i", "e", "c", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/LocalDayParser.js
var LocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "e":
      case "ee":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "eo":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "eee":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // T
      case "eeeee":
        return match2.day(dateString, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
      // Tuesday
      case "eeee":
      default:
        return match2.day(dateString, { width: "wide", context: "formatting" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.day(dateString, { width: "short", context: "formatting" }) || match2.day(dateString, { width: "narrow", context: "formatting" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/StandAloneLocalDayParser.js
var StandAloneLocalDayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2, options) {
    const valueCallback = (value) => {
      const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };
    switch (token) {
      // 3
      case "c":
      case "cc":
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      // 3rd
      case "co":
        return mapValue(
          match2.ordinalNumber(dateString, {
            unit: "day"
          }),
          valueCallback
        );
      // Tue
      case "ccc":
        return match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // T
      case "ccccc":
        return match2.day(dateString, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
      // Tuesday
      case "cccc":
      default:
        return match2.day(dateString, { width: "wide", context: "standalone" }) || match2.day(dateString, {
          width: "abbreviated",
          context: "standalone"
        }) || match2.day(dateString, { width: "short", context: "standalone" }) || match2.day(dateString, { width: "narrow", context: "standalone" });
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 6;
  }
  set(date, _flags, value, options) {
    date = setDay(date, value, options);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "e",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/setISODay.js
function setISODay(date, day, options) {
  const date_ = toDate(date, options?.in);
  const currentDay = getISODay(date_, options);
  const diff = day - currentDay;
  return addDays(date_, diff, options);
}

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ISODayParser.js
var ISODayParser = class extends Parser {
  priority = 90;
  parse(dateString, token, match2) {
    const valueCallback = (value) => {
      if (value === 0) {
        return 7;
      }
      return value;
    };
    switch (token) {
      // 2
      case "i":
      case "ii":
        return parseNDigits(token.length, dateString);
      // 2nd
      case "io":
        return match2.ordinalNumber(dateString, { unit: "day" });
      // Tue
      case "iii":
        return mapValue(
          match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // T
      case "iiiii":
        return mapValue(
          match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tu
      case "iiiiii":
        return mapValue(
          match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
      // Tuesday
      case "iiii":
      default:
        return mapValue(
          match2.day(dateString, {
            width: "wide",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "short",
            context: "formatting"
          }) || match2.day(dateString, {
            width: "narrow",
            context: "formatting"
          }),
          valueCallback
        );
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 7;
  }
  set(date, _flags, value) {
    date = setISODay(date, value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  incompatibleTokens = [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "E",
    "e",
    "c",
    "t",
    "T"
  ];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/AMPMParser.js
var AMPMParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "a":
      case "aa":
      case "aaa":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaaa":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["b", "B", "H", "k", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/AMPMMidnightParser.js
var AMPMMidnightParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "b":
      case "bb":
      case "bbb":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbbb":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "B", "H", "k", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/DayPeriodParser.js
var DayPeriodParser = class extends Parser {
  priority = 80;
  parse(dateString, token, match2) {
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBBB":
        return match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return match2.dayPeriod(dateString, {
          width: "wide",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "abbreviated",
          context: "formatting"
        }) || match2.dayPeriod(dateString, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(date, _flags, value) {
    date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/Hour1to12Parser.js
var Hour1to12Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "h":
        return parseNumericPattern(numericPatterns.hour12h, dateString);
      case "ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 12;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else if (!isPM && value === 12) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["H", "K", "k", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/Hour0to23Parser.js
var Hour0to23Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "H":
        return parseNumericPattern(numericPatterns.hour23h, dateString);
      case "Ho":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 23;
  }
  set(date, _flags, value) {
    date.setHours(value, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "K", "k", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/Hour0To11Parser.js
var Hour0To11Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "K":
        return parseNumericPattern(numericPatterns.hour11h, dateString);
      case "Ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 11;
  }
  set(date, _flags, value) {
    const isPM = date.getHours() >= 12;
    if (isPM && value < 12) {
      date.setHours(value + 12, 0, 0, 0);
    } else {
      date.setHours(value, 0, 0, 0);
    }
    return date;
  }
  incompatibleTokens = ["h", "H", "k", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/Hour1To24Parser.js
var Hour1To24Parser = class extends Parser {
  priority = 70;
  parse(dateString, token, match2) {
    switch (token) {
      case "k":
        return parseNumericPattern(numericPatterns.hour24h, dateString);
      case "ko":
        return match2.ordinalNumber(dateString, { unit: "hour" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 1 && value <= 24;
  }
  set(date, _flags, value) {
    const hours = value <= 24 ? value % 24 : value;
    date.setHours(hours, 0, 0, 0);
    return date;
  }
  incompatibleTokens = ["a", "b", "h", "H", "K", "t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/MinuteParser.js
var MinuteParser = class extends Parser {
  priority = 60;
  parse(dateString, token, match2) {
    switch (token) {
      case "m":
        return parseNumericPattern(numericPatterns.minute, dateString);
      case "mo":
        return match2.ordinalNumber(dateString, { unit: "minute" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setMinutes(value, 0, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/SecondParser.js
var SecondParser = class extends Parser {
  priority = 50;
  parse(dateString, token, match2) {
    switch (token) {
      case "s":
        return parseNumericPattern(numericPatterns.second, dateString);
      case "so":
        return match2.ordinalNumber(dateString, { unit: "second" });
      default:
        return parseNDigits(token.length, dateString);
    }
  }
  validate(_date, value) {
    return value >= 0 && value <= 59;
  }
  set(date, _flags, value) {
    date.setSeconds(value, 0);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/FractionOfSecondParser.js
var FractionOfSecondParser = class extends Parser {
  priority = 30;
  parse(dateString, token) {
    const valueCallback = (value) => Math.trunc(value * Math.pow(10, -token.length + 3));
    return mapValue(parseNDigits(token.length, dateString), valueCallback);
  }
  set(date, _flags, value) {
    date.setMilliseconds(value);
    return date;
  }
  incompatibleTokens = ["t", "T"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ISOTimezoneWithZParser.js
var ISOTimezoneWithZParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "X":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "XX":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "XXXX":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "XXXXX":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "XXX":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "x"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/ISOTimezoneParser.js
var ISOTimezoneParser = class extends Parser {
  priority = 10;
  parse(dateString, token) {
    switch (token) {
      case "x":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalMinutes,
          dateString
        );
      case "xx":
        return parseTimezonePattern(timezonePatterns.basic, dateString);
      case "xxxx":
        return parseTimezonePattern(
          timezonePatterns.basicOptionalSeconds,
          dateString
        );
      case "xxxxx":
        return parseTimezonePattern(
          timezonePatterns.extendedOptionalSeconds,
          dateString
        );
      case "xxx":
      default:
        return parseTimezonePattern(timezonePatterns.extended, dateString);
    }
  }
  set(date, flags, value) {
    if (flags.timestampIsSet) return date;
    return constructFrom(
      date,
      date.getTime() - getTimezoneOffsetInMilliseconds(date) - value
    );
  }
  incompatibleTokens = ["t", "T", "X"];
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/TimestampSecondsParser.js
var TimestampSecondsParser = class extends Parser {
  priority = 40;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value * 1e3), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers/TimestampMillisecondsParser.js
var TimestampMillisecondsParser = class extends Parser {
  priority = 20;
  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }
  set(date, _flags, value) {
    return [constructFrom(date, value), { timestampIsSet: true }];
  }
  incompatibleTokens = "*";
};

// ../../Legal Dashboards/node_modules/date-fns/parse/_lib/parsers.js
var parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser()
};

// ../../Legal Dashboards/node_modules/date-fns/parse.js
var formattingTokensRegExp2 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp2 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp2 = /^'([^]*?)'?$/;
var doubleQuoteRegExp2 = /''/g;
var notWhitespaceRegExp = /\S/;
var unescapedLatinCharacterRegExp2 = /[a-zA-Z]/;
function parse(dateStr, formatStr, referenceDate, options) {
  const invalidDate = () => constructFrom(options?.in || referenceDate, NaN);
  const defaultOptions2 = getDefaultOptions2();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  if (!formatStr)
    return dateStr ? invalidDate() : toDate(referenceDate, options?.in);
  const subFnOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  const setters = [new DateTimezoneSetter(options?.in, referenceDate)];
  const tokens = formatStr.match(longFormattingTokensRegExp2).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter in longFormatters) {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp2);
  const usedTokens = [];
  for (let token of tokens) {
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    if (!options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, dateStr);
    }
    const firstCharacter = token[0];
    const parser = parsers[firstCharacter];
    if (parser) {
      const { incompatibleTokens } = parser;
      if (Array.isArray(incompatibleTokens)) {
        const incompatibleToken = usedTokens.find(
          (usedToken) => incompatibleTokens.includes(usedToken.token) || usedToken.token === firstCharacter
        );
        if (incompatibleToken) {
          throw new RangeError(
            `The format string mustn't contain \`${incompatibleToken.fullToken}\` and \`${token}\` at the same time`
          );
        }
      } else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) {
        throw new RangeError(
          `The format string mustn't contain \`${token}\` and any other token at the same time`
        );
      }
      usedTokens.push({ token: firstCharacter, fullToken: token });
      const parseResult = parser.run(
        dateStr,
        token,
        locale.match,
        subFnOptions
      );
      if (!parseResult) {
        return invalidDate();
      }
      setters.push(parseResult.setter);
      dateStr = parseResult.rest;
    } else {
      if (firstCharacter.match(unescapedLatinCharacterRegExp2)) {
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
        );
      }
      if (token === "''") {
        token = "'";
      } else if (firstCharacter === "'") {
        token = cleanEscapedString2(token);
      }
      if (dateStr.indexOf(token) === 0) {
        dateStr = dateStr.slice(token.length);
      } else {
        return invalidDate();
      }
    }
  }
  if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) {
    return invalidDate();
  }
  const uniquePrioritySetters = setters.map((setter) => setter.priority).sort((a, b) => b - a).filter((priority, index, array) => array.indexOf(priority) === index).map(
    (priority) => setters.filter((setter) => setter.priority === priority).sort((a, b) => b.subPriority - a.subPriority)
  ).map((setterArray) => setterArray[0]);
  let date = toDate(referenceDate, options?.in);
  if (isNaN(+date)) return invalidDate();
  const flags = {};
  for (const setter of uniquePrioritySetters) {
    if (!setter.validate(date, subFnOptions)) {
      return invalidDate();
    }
    const result = setter.set(date, flags, subFnOptions);
    if (Array.isArray(result)) {
      date = result[0];
      Object.assign(flags, result[1]);
    } else {
      date = result;
    }
  }
  return date;
}
function cleanEscapedString2(input) {
  return input.match(escapedStringRegExp2)[1].replace(doubleQuoteRegExp2, "'");
}

// ../../Legal Dashboards/node_modules/date-fns/parseISO.js
function parseISO(argument, options) {
  const invalidDate = () => constructFrom(options?.in, NaN);
  const additionalDigits = options?.additionalDigits ?? 2;
  const dateStrings = splitDateString(argument);
  let date;
  if (dateStrings.date) {
    const parseYearResult = parseYear(dateStrings.date, additionalDigits);
    date = parseDate(parseYearResult.restDateString, parseYearResult.year);
  }
  if (!date || isNaN(+date)) return invalidDate();
  const timestamp = +date;
  let time = 0;
  let offset;
  if (dateStrings.time) {
    time = parseTime(dateStrings.time);
    if (isNaN(time)) return invalidDate();
  }
  if (dateStrings.timezone) {
    offset = parseTimezone(dateStrings.timezone);
    if (isNaN(offset)) return invalidDate();
  } else {
    const tmpDate = new Date(timestamp + time);
    const result = toDate(0, options?.in);
    result.setFullYear(
      tmpDate.getUTCFullYear(),
      tmpDate.getUTCMonth(),
      tmpDate.getUTCDate()
    );
    result.setHours(
      tmpDate.getUTCHours(),
      tmpDate.getUTCMinutes(),
      tmpDate.getUTCSeconds(),
      tmpDate.getUTCMilliseconds()
    );
    return result;
  }
  return toDate(timestamp + time + offset, options?.in);
}
var patterns = {
  dateTimeDelimiter: /[T ]/,
  timeZoneDelimiter: /[Z ]/i,
  timezone: /([Z+-].*)$/
};
var dateRegex = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
var timeRegex = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
var timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function splitDateString(dateString) {
  const dateStrings = {};
  const array = dateString.split(patterns.dateTimeDelimiter);
  let timeString;
  if (array.length > 2) {
    return dateStrings;
  }
  if (/:/.test(array[0])) {
    timeString = array[0];
  } else {
    dateStrings.date = array[0];
    timeString = array[1];
    if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
      dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
      timeString = dateString.substr(
        dateStrings.date.length,
        dateString.length
      );
    }
  }
  if (timeString) {
    const token = patterns.timezone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timezone = token[1];
    } else {
      dateStrings.time = timeString;
    }
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  const regex = new RegExp(
    "^(?:(\\d{4}|[+-]\\d{" + (4 + additionalDigits) + "})|(\\d{2}|[+-]\\d{" + (2 + additionalDigits) + "})$)"
  );
  const captures = dateString.match(regex);
  if (!captures) return { year: NaN, restDateString: "" };
  const year = captures[1] ? parseInt(captures[1]) : null;
  const century = captures[2] ? parseInt(captures[2]) : null;
  return {
    year: century === null ? year : century * 100,
    restDateString: dateString.slice((captures[1] || captures[2]).length)
  };
}
function parseDate(dateString, year) {
  if (year === null) return /* @__PURE__ */ new Date(NaN);
  const captures = dateString.match(dateRegex);
  if (!captures) return /* @__PURE__ */ new Date(NaN);
  const isWeekDate = !!captures[4];
  const dayOfYear = parseDateUnit(captures[1]);
  const month = parseDateUnit(captures[2]) - 1;
  const day = parseDateUnit(captures[3]);
  const week = parseDateUnit(captures[4]);
  const dayOfWeek = parseDateUnit(captures[5]) - 1;
  if (isWeekDate) {
    if (!validateWeekDate(year, week, dayOfWeek)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    return dayOfISOWeekYear(year, week, dayOfWeek);
  } else {
    const date = /* @__PURE__ */ new Date(0);
    if (!validateDate(year, month, day) || !validateDayOfYearDate(year, dayOfYear)) {
      return /* @__PURE__ */ new Date(NaN);
    }
    date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
    return date;
  }
}
function parseDateUnit(value) {
  return value ? parseInt(value) : 1;
}
function parseTime(timeString) {
  const captures = timeString.match(timeRegex);
  if (!captures) return NaN;
  const hours = parseTimeUnit(captures[1]);
  const minutes = parseTimeUnit(captures[2]);
  const seconds = parseTimeUnit(captures[3]);
  if (!validateTime(hours, minutes, seconds)) {
    return NaN;
  }
  return hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3;
}
function parseTimeUnit(value) {
  return value && parseFloat(value.replace(",", ".")) || 0;
}
function parseTimezone(timezoneString) {
  if (timezoneString === "Z") return 0;
  const captures = timezoneString.match(timezoneRegex);
  if (!captures) return 0;
  const sign = captures[1] === "+" ? -1 : 1;
  const hours = parseInt(captures[2]);
  const minutes = captures[3] && parseInt(captures[3]) || 0;
  if (!validateTimezone(hours, minutes)) {
    return NaN;
  }
  return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  const fourthOfJanuaryDay = date.getUTCDay() || 7;
  const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
var daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYearIndex2(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
function validateDate(year, month, date) {
  return month >= 0 && month <= 11 && date >= 1 && date <= (daysInMonths[month] || (isLeapYearIndex2(year) ? 29 : 28));
}
function validateDayOfYearDate(year, dayOfYear) {
  return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex2(year) ? 366 : 365);
}
function validateWeekDate(_year, week, day) {
  return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}
function validateTime(hours, minutes, seconds) {
  if (hours === 24) {
    return minutes === 0 && seconds === 0;
  }
  return seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 60 && hours >= 0 && hours < 25;
}
function validateTimezone(_hours, minutes) {
  return minutes >= 0 && minutes <= 59;
}

// ../../Legal Dashboards/src/lib/utils.ts
var SOURCE_NOT_RECORDED = "Not recorded in source";
function cleanText(value) {
  if (value === null || value === void 0) return "";
  return String(value).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeIis(value) {
  return cleanText(value).toUpperCase().replace(/\s+/g, "");
}
function normalizeCaseNo(value) {
  const raw = cleanText(value).toUpperCase();
  if (!raw) return "";
  const match2 = raw.match(/(20\d{2})\D*?(\d{3,5})\s*$/);
  if (match2) return `${match2[1]}-${match2[2].padStart(4, "0")}`;
  return raw.replace(/\s+/g, "");
}
function normalizePab(value) {
  return cleanText(value).toUpperCase().replace(/\s+/g, "").replace(/^PABCASE/, "").replace(/-(A\/W|AW|A|W)$/, "");
}
function parseAw(pabCaseNo) {
  const match2 = cleanText(pabCaseNo).toUpperCase().match(/-\s*([AW](?:\s*\/\s*[AW])?)\s*$/);
  return match2 ? match2[1].replace(/\s+/g, "") : "";
}
var PROVINCES = [
  { name: "Negros Oriental", pattern: /\bNEGROS(?:\s+ORIENTAL)?\b/ },
  { name: "Siquijor", pattern: /\bSIQUIJOR\b/ },
  { name: "Bohol", pattern: /\bBOHOL\b/ },
  { name: "Cebu", pattern: /\bCEBU\b/ }
];
function deriveProvince(address) {
  const value = cleanText(address).toUpperCase();
  if (!value) return "";
  return PROVINCES.find((item) => item.pattern.test(value))?.name ?? "";
}
function isExcludedProvince(value) {
  const raw = cleanText(value).toUpperCase();
  if (!raw) return false;
  return /\bNEGROS\b/.test(raw) || /\bSIQUIJOR\b/.test(raw);
}
var NEGROS_ORIENTAL_TOWNS = [
  "AMLAN",
  "AYUNGON",
  "BACONG",
  "BAIS",
  "BASAY",
  "BAYAWAN",
  "BINDOY",
  "CANLAON",
  "DAUIN",
  "DUMAGUETE",
  "GUIHULNGAN",
  "JIMALALUD",
  "MABINAY",
  "MANJUYOD",
  "SIATON",
  "SIBULAN",
  "TANJAY",
  "TAYASAN",
  "ZAMBOANGUITA"
];
var SIQUIJOR_TOWNS = ["ENRIQUE VILLANUEVA", "LARENA", "LAZI"];
function matchesTown(value, town) {
  return new RegExp(`\\b${town.replace(/\s+/g, "\\s+")}\\b`).test(value);
}
function isExcludedLocation(province, address, city, municipality, extraText) {
  const rawProvince = cleanText(province).toUpperCase();
  if (rawProvince) {
    if (isExcludedProvince(rawProvince)) return true;
    if (/\bCEBU\b/.test(rawProvince) || /\bBOHOL\b/.test(rawProvince)) return false;
  }
  const text = cleanText(
    [address, city, municipality, extraText].filter(Boolean).join(" ")
  ).toUpperCase();
  if (!text) return false;
  if (/\bNEGROS\b/.test(text) || /\bSIQUIJOR\b/.test(text)) return true;
  if (NEGROS_ORIENTAL_TOWNS.some((town) => matchesTown(text, town))) return true;
  if (SIQUIJOR_TOWNS.some((town) => matchesTown(text, town))) return true;
  return false;
}
function hasIdentifiableLocation(province, address, city, municipality) {
  const rawProvince = cleanText(province).toUpperCase();
  if (/\b(CEBU|BOHOL|NEGROS|SIQUIJOR)\b/.test(rawProvince)) return true;
  const text = cleanText([address, city, municipality].filter(Boolean).join(" "));
  return Boolean(deriveProvince(text));
}
function displayLocation(value) {
  return cleanText(value) || SOURCE_NOT_RECORDED;
}
function normalizeName(value) {
  return cleanText(value).toUpperCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
}
var DATE_FORMATS = [
  "M/d/yyyy",
  "M/d/yy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
  "MMMM d, yyyy",
  "MMM d, yyyy",
  "MMMM d yyyy",
  "MMM d yyyy",
  "d MMMM yyyy",
  "d MMM yyyy",
  "M-d-yyyy",
  "M.d.yyyy"
];
function parseDate2(value) {
  const raw = cleanText(value);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const iso = parseISO(raw);
    if (isValid(iso) && iso.getFullYear() >= 1900 && iso.getFullYear() <= 2100) {
      return format(iso, "yyyy-MM-dd");
    }
  }
  if (/^\d{5}(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial >= 2e4 && serial <= 8e4) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 864e5);
      if (isValid(date)) return format(date, "yyyy-MM-dd");
    }
  }
  const normalized = raw.replace(/\u00A0/g, " ").replace(/\s+/g, " ").replace(/\b([A-Za-z]{3,9})\b/g, (word) => {
    const lower = word.toLowerCase();
    return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  });
  for (const candidate of [raw, normalized, normalized.replace(/\./g, "")]) {
    for (const pattern of DATE_FORMATS) {
      const parsed = parse(candidate, pattern, /* @__PURE__ */ new Date());
      if (isValid(parsed) && parsed.getFullYear() >= 1900 && parsed.getFullYear() <= 2100) {
        return format(parsed, "yyyy-MM-dd");
      }
    }
  }
  return null;
}
function dayDiff(fromIso, toIso) {
  if (!fromIso) return null;
  const from = /* @__PURE__ */ new Date(`${fromIso}T12:00:00`);
  const to = /* @__PURE__ */ new Date(`${toIso}T12:00:00`);
  if (!isValid(from) || !isValid(to)) return null;
  return differenceInCalendarDays(to, from);
}
function parseMoney(value) {
  const raw = cleanText(value);
  if (!raw) return 0;
  const match2 = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match2 ? Number(match2[0]) : 0;
}
function isPaid(status) {
  return cleanText(status).toUpperCase() === "PAID";
}
function isPending(status) {
  return cleanText(status).toUpperCase().includes("PENDING");
}
function uniqueBy(items, key) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ../../Legal Dashboards/src/lib/buildData.ts
var SOURCE_NOT_STATED = "Not stated in source";
var VIOLATION_COLUMNS_2026 = [
  { index: 13, law: "PD 1586", stage: "Monitoring" },
  { index: 14, law: "PD 1586", stage: "Permitting" },
  { index: 15, law: "PD 1586", stage: "Monitoring", label: "Non-submission of CMR" },
  { index: 16, law: "RA 6969", stage: "Monitoring" },
  { index: 17, law: "RA 6969", stage: "Permitting" },
  { index: 18, law: "RA 9275", stage: "Monitoring" },
  { index: 19, law: "RA 9275", stage: "Permitting" },
  { index: 20, law: "RA 8749", stage: "Monitoring" },
  { index: 21, law: "RA 8749", stage: "Permitting" }
];
var VIOLATION_COLUMNS_2025 = [
  { index: 6, law: "PD 1586" },
  { index: 7, law: "RA 6969", stage: "Monitoring" },
  { index: 8, law: "RA 8749" },
  { index: 9, law: "RA 9275" },
  { index: 10, law: "RA 8749", stage: "Monitoring" },
  { index: 11, law: "PD 1586", stage: "Monitoring", label: "Non-submission of CMR" },
  { index: 12, law: "RA 9275", stage: "Monitoring", label: "No SMR submission" },
  { index: 13, law: "PD 1586", stage: "Monitoring", label: "Cease and desist order" },
  { index: 14, law: "PD 1586", stage: "Monitoring", label: "Stoppage order" }
];
var VIOLATION_COLUMNS_2023 = [
  { index: 8, law: "PD 1586", stage: "Monitoring" },
  { index: 9, law: "RA 9275", stage: "Monitoring" },
  { index: 10, law: "RA 8749", stage: "Monitoring" },
  { index: 11, law: "RA 6969", stage: "Monitoring" },
  { index: 15, law: "PD 1586", stage: "Permitting" },
  { index: 16, law: "RA 9275", stage: "Permitting" },
  { index: 17, law: "RA 8749", stage: "Permitting" },
  { index: 18, law: "RA 6969", stage: "Permitting" }
];
var VIOLATION_COLUMNS_2024 = [
  { index: 7, law: "PD 1586", stage: "Monitoring" },
  { index: 8, law: "RA 9275", stage: "Monitoring" },
  { index: 9, law: "RA 8749", stage: "Monitoring" },
  { index: 10, law: "RA 6969", stage: "Monitoring" },
  { index: 14, law: "PD 1586", stage: "Permitting" },
  { index: 15, law: "RA 9275", stage: "Permitting" },
  { index: 16, law: "RA 8749", stage: "Permitting" },
  { index: 17, law: "RA 6969", stage: "Permitting" }
];
function isBlankStatus(value) {
  const status = cleanText(value).toUpperCase();
  return !status || status === "FALSE" || status === "N/A" || status === "-";
}
function titleCase(value) {
  return value.toLowerCase().replace(/(^|[\s/(])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}
function violationFlag(item) {
  const value = item.value.toUpperCase();
  if (value.includes("CMR")) return "CMR non-submission";
  if (value.includes("WITHOUT ECC")) return "Without ECC";
  if (value.includes("ECC CONDITION")) return "ECC conditions";
  if (value.includes("WITHOUT HWID")) return "Without HWID";
  if (value.includes("WITHOUT DP")) return "Without DP";
  if (value.includes("WITHOUT PO")) return "Without PO";
  if (value.includes("EXCEEDANCE")) return "Exceedance";
  if (value.includes("SECTION 27")) return "Section 27 (RA 9275)";
  if (value.includes("NO PCO")) return "No PCO accreditation";
  if (value.includes("NO SMR")) return "No SMR submission";
  if (value.includes("CEASE AND DESIST")) return "Cease and desist";
  if (value.includes("STOPPAGE")) return "Stoppage order";
  return titleCase(item.value);
}
function noteFlags(notes) {
  const upper = notes.toUpperCase();
  const flags = [];
  if (upper.includes("NON-PERFORMANCE") || upper.includes("NON PERFORMANCE")) {
    flags.push("Non-performance");
  }
  if (upper.includes("COMPLAINT")) flags.push("Complaint noted");
  if (upper.includes("PCO")) flags.push("PCO concern");
  return flags;
}
function addViolation(items, raw, law, stage, label) {
  const value = cleanText(raw);
  if (!value || value.toUpperCase() === "FALSE" || value.toUpperCase() === "N/A") return;
  const display = label && value.toUpperCase() === "TRUE" ? label : label ? `${label} (${value})` : value;
  items.push({
    law,
    stage,
    value: display,
    key: `${law}|${stage}|${display}`
  });
}
function makeMasterViolations2026(row) {
  const items = [];
  for (const column of VIOLATION_COLUMNS_2026) {
    addViolation(items, row[column.index], column.law, column.stage, column.label);
  }
  return uniqueBy(items, (item) => item.key);
}
function stageFromValue(value) {
  return cleanText(value).toUpperCase().includes("(PER)") ? "Permitting" : "Monitoring";
}
function makeMasterViolations2025(row) {
  const items = [];
  for (const column of VIOLATION_COLUMNS_2025) {
    const raw = cleanText(row[column.index]);
    if (!raw || raw.toUpperCase() === "FALSE" || raw.toUpperCase() === "N/A") continue;
    const stage = column.stage ?? stageFromValue(raw);
    addViolation(items, raw, column.law, stage, column.label);
  }
  return uniqueBy(items, (item) => item.key);
}
function makeMasterViolations2021(row) {
  const items = [];
  addViolation(items, row[10], "PD 1586", "Monitoring");
  addViolation(items, row[11], "RA 9275", "Monitoring");
  addViolation(items, row[12], "RA 8749", "Monitoring");
  addViolation(items, row[13], "RA 6969", "Monitoring");
  if (cleanText(row[14]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "No PCO accreditation", key: "PD 1586|Monitoring|No PCO accreditation" });
  if (cleanText(row[15]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "Non-performance", key: "PD 1586|Monitoring|Non-performance" });
  return uniqueBy(items, (item) => item.key);
}
function makeMasterViolations2022(row) {
  const items = [];
  addViolation(items, row[8], "PD 1586", "Monitoring");
  addViolation(items, row[9], "RA 9275", "Monitoring");
  addViolation(items, row[10], "RA 8749", "Monitoring");
  addViolation(items, row[11], "RA 6969", "Monitoring");
  if (cleanText(row[12]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "Non-submission of CMR", key: "PD 1586 Monitoring Non-submission of CMR" });
  if (cleanText(row[13]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "No PCO accreditation", key: "PD 1586 Monitoring No PCO accreditation" });
  if (cleanText(row[14]).toUpperCase() === "TRUE") items.push({ law: "RA 9275", stage: "Monitoring", value: "No SMR submission", key: "RA 9275 Monitoring No SMR submission" });
  addViolation(items, row[15], "PD 1586", "Permitting");
  addViolation(items, row[16], "RA 9275", "Permitting");
  addViolation(items, row[17], "RA 8749", "Permitting");
  addViolation(items, row[18], "RA 6969", "Permitting");
  if (cleanText(row[19]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "Cease and desist order", key: "PD 1586 Monitoring Cease and desist order" });
  if (cleanText(row[20]).toUpperCase() === "TRUE") items.push({ law: "PD 1586", stage: "Monitoring", value: "Stoppage order", key: "PD 1586 Monitoring Stoppage order" });
  return uniqueBy(items, (item) => item.key);
}
function makeMasterViolations2023(row) {
  const items = [];
  for (const column of VIOLATION_COLUMNS_2023) {
    addViolation(items, row[column.index], column.law, column.stage);
  }
  return uniqueBy(items, (item) => item.key);
}
function makeMasterViolations2024(row) {
  const items = [];
  for (const column of VIOLATION_COLUMNS_2024) {
    addViolation(items, row[column.index], column.law, column.stage);
  }
  return uniqueBy(items, (item) => item.key);
}
function makePabViolations2026(row) {
  const values = [];
  const add = (value, label) => {
    const raw = cleanText(value);
    if (!raw || raw.toUpperCase() === "FALSE" || raw.toUpperCase() === "N/A") return;
    values.push(label ? label : raw);
  };
  add(row[14], `RA 9275 \xB7 Monitoring: ${cleanText(row[14])}`);
  add(row[15], `RA 9275 \xB7 Permitting: ${cleanText(row[15])}`);
  if (cleanText(row[16]).toUpperCase() === "TRUE") values.push("No PCO accreditation");
  add(row[17], `RA 8749 \xB7 Monitoring: ${cleanText(row[17])}`);
  add(row[18], `RA 8749 \xB7 Permitting: ${cleanText(row[18])}`);
  if (cleanText(row[19]).toUpperCase() === "TRUE") values.push("No SMR submission");
  return [...new Set(values)];
}
function makePabViolations2025(row) {
  const values = [];
  const add = (value, label) => {
    const raw = cleanText(value);
    if (!raw || raw.toUpperCase() === "FALSE" || raw.toUpperCase() === "N/A") return;
    values.push(`${label}: ${raw}`);
  };
  add(row[6], "RA 8749");
  add(row[7], "RA 9275");
  add(row[8], "PCO accreditation");
  if (cleanText(row[9]).toUpperCase() === "TRUE") {
    values.push("No SMR submission");
  } else {
    add(row[9], "No SMR submission");
  }
  return [...new Set(values)];
}
function makePabViolationsHistorical(row, columns) {
  const values = [];
  for (const column of columns) {
    const raw = cleanText(row[column.index]);
    if (!raw || raw.toUpperCase() === "FALSE" || raw.toUpperCase() === "N/A") continue;
    values.push(`${column.law} \xB7 ${column.stage}: ${raw}`);
  }
  return [...new Set(values)];
}
function statusHas(status, needle) {
  return cleanText(status).toUpperCase().includes(needle);
}
function pushMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) ?? [];
  list.push(value);
  map.set(key, list);
}
function buildCasesForSource(source) {
  const master = source.tabs.master;
  if (!master) return [];
  const cases = [];
  const is2021 = source.year === "2021";
  const is2022 = source.year === "2022";
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const is2025 = source.year === "2025";
  const isHistorical = is2021 || is2022 || is2023 || is2024;
  master.rows.forEach((row, index) => {
    const rawCaseNo = cleanText(is2021 ? row[0] : is2022 || is2023 ? row[1] : row[0]);
    if (rawCaseNo.toUpperCase() === "CASE NO." || rawCaseNo.toUpperCase() === "CASE NUMBER") {
      return;
    }
    const iisRef = cleanText(is2021 ? row[1] : is2022 || is2023 ? row[2] : row[1]);
    const establishment = cleanText(is2021 ? row[5] : is2022 || is2023 ? row[4] : row[3]);
    const dateDocketed = cleanText(is2021 ? row[2] : is2022 || is2023 ? row[3] : row[2]);
    const normalizedCaseNo = normalizeCaseNo(rawCaseNo);
    const isNumbered = /^20\d{2}-\d{4}$/.test(normalizedCaseNo);
    if (source.year === "2022" && index < 3) globalThis.__dbg2022 = { index, rawCaseNo, normalizedCaseNo, isNumbered, iisRef, establishment };
    if (!isNumbered && !(iisRef && establishment)) return;
    if (isHistorical && isNumbered && !establishment) return;
    const dateIso = parseDate2(dateDocketed);
    let address = "";
    let province = "";
    let city = "";
    let municipality = "";
    let barangay = "";
    let handler = "";
    let documentType = SOURCE_NOT_RECORDED;
    let notes = "";
    let proponent = "";
    let violations = [];
    if (is2021) {
      address = cleanText(row[6]);
      province = deriveProvince(address);
      proponent = cleanText(row[7]);
      handler = cleanText(row[16]);
      documentType = cleanText(row[4]);
      notes = cleanText([row[18], row[19], row[20]].filter(Boolean).join(" | "));
      violations = makeMasterViolations2021(row);
    } else if (is2022) {
      address = cleanText(row[5]);
      province = deriveProvince(address);
      proponent = cleanText(row[6]);
      handler = cleanText(row[21]);
      notes = cleanText([row[23], row[24]].filter(Boolean).join(" | "));
      violations = makeMasterViolations2022(row);
    } else if (is2023) {
      address = cleanText(row[5]);
      province = deriveProvince(address);
      proponent = cleanText(row[6]);
      handler = cleanText(row[21]);
      violations = makeMasterViolations2023(row);
    } else if (is2024) {
      address = cleanText(row[4]);
      province = deriveProvince(address);
      proponent = cleanText(row[5]);
      handler = cleanText(row[20]);
      notes = cleanText(row[21]);
      violations = makeMasterViolations2024(row);
    } else if (is2025) {
      address = cleanText(row[4]);
      province = deriveProvince(address);
      proponent = cleanText(row[5]);
      handler = cleanText(row[15]);
      violations = makeMasterViolations2025(row);
    } else {
      address = cleanText(row[11]);
      province = cleanText(row[7]);
      city = cleanText(row[8]);
      municipality = cleanText(row[9]);
      barangay = cleanText(row[10]);
      proponent = cleanText(row[4]);
      handler = cleanText(row[22]);
      documentType = cleanText(row[12]);
      notes = cleanText(row[23]);
      violations = makeMasterViolations2026(row);
    }
    const dataIssues = [];
    if (!isNumbered) dataIssues.push("Missing case number");
    if (!dateIso) {
      dataIssues.push(dateDocketed ? `Invalid docket date: ${dateDocketed}` : "Missing docket date");
    }
    if (!handler) dataIssues.push("Missing case handler");
    if (source.year === "2026") {
      if (!province) dataIssues.push("Missing province");
      if (!city && !municipality) dataIssues.push("Missing city / municipality");
      if (!documentType) dataIssues.push("Missing document type");
    }
    const caseRecord = {
      id: `case-${source.year}-${index + 1}`,
      caseNo: isNumbered ? normalizedCaseNo : "UNNUMBERED",
      displayCaseNo: isNumbered ? normalizedCaseNo : "UNNUMBERED",
      rawCaseNo,
      isUnnumbered: !isNumbered,
      iisRef,
      dateDocketed,
      dateIso,
      establishment,
      proponent,
      email: source.year === "2026" ? cleanText(row[5]) : "",
      contact: source.year === "2026" ? cleanText(row[6]) : "",
      province,
      provinceDerived: (isHistorical || is2025) && Boolean(province),
      city,
      municipality,
      barangay,
      address,
      location: isHistorical && !province ? cleanText(address) || SOURCE_NOT_RECORDED : is2025 || isHistorical ? displayLocation(province) : city || municipality || SOURCE_NOT_RECORDED,
      documentType,
      handler,
      notes,
      violations,
      pabNov: [],
      orders: [],
      pabOrders: [],
      erf: [],
      pabPenalties: [],
      ra6969: [],
      complaints: [],
      lbc: [],
      dpwh: [],
      stage: "nov",
      stageLabel: STAGE_META.nov.label,
      flags: [],
      pendingPayment: false,
      paidAmount: 0,
      assessedAmount: 0,
      lastActionDate: dateIso,
      ageDays: dayDiff(dateIso, source.dataDate),
      linkCount: 0,
      matchBasis: [],
      dataIssues,
      sourceYear: source.year,
      docketYear: source.year
    };
    cases.push(caseRecord);
  });
  return cases;
}
function buildPabNovForSource(source) {
  const tab = source.tabs.pabNov;
  if (!tab) return [];
  const records = [];
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const is2025 = source.year === "2025";
  tab.rows.forEach((row, index) => {
    const pabCaseNo = cleanText(is2023 ? row[1] : row[0]);
    if (!/^07-/i.test(pabCaseNo)) return;
    let address = "";
    let province = "";
    let city = "";
    let municipality = "";
    let barangay = "";
    let documentType = "";
    let establishment = "";
    let proponent = "";
    let dateDocketed = "";
    let iisRef = "";
    let aw = "";
    if (is2023 || is2024) {
      const offset = is2023 ? 2 : 1;
      iisRef = cleanText(row[offset]);
      dateDocketed = cleanText(row[offset + 1]);
      establishment = cleanText(row[offset + 2]);
      address = cleanText(row[offset + 3]);
      proponent = cleanText(row[offset + 4]);
      province = deriveProvince(address);
      documentType = SOURCE_NOT_RECORDED;
      aw = parseAw(pabCaseNo);
    } else if (is2025) {
      iisRef = cleanText(row[1]);
      dateDocketed = cleanText(row[2]);
      establishment = cleanText(row[3]);
      address = cleanText(row[4]);
      province = deriveProvince(address);
      proponent = cleanText(row[5]);
      documentType = SOURCE_NOT_RECORDED;
      aw = parseAw(pabCaseNo);
    } else {
      aw = cleanText(row[1]);
      iisRef = cleanText(row[2]);
      dateDocketed = cleanText(row[3]);
      establishment = cleanText(row[4]);
      proponent = cleanText(row[5]);
      province = cleanText(row[8]);
      city = cleanText(row[9]);
      municipality = cleanText(row[10]);
      barangay = cleanText(row[11]);
      address = cleanText(row[12]);
      documentType = cleanText(row[13]);
    }
    records.push({
      id: `pab-${source.year}-${index + 1}`,
      pabCaseNo,
      aw,
      iisRef,
      dateDocketed,
      dateIso: parseDate2(dateDocketed),
      establishment,
      proponent,
      province,
      city,
      municipality,
      barangay,
      address,
      documentType,
      violations: is2023 ? makePabViolationsHistorical(row, VIOLATION_COLUMNS_2023) : is2024 ? makePabViolationsHistorical(row, VIOLATION_COLUMNS_2024) : is2025 ? makePabViolations2025(row) : makePabViolations2026(row),
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildOrdersForSource(source) {
  const tab = source.tabs.orders;
  if (!tab) return [];
  const records = [];
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const isHistorical = is2023 || is2024;
  const is2025 = source.year === "2025";
  let last = null;
  let lastWasPab = false;
  tab.rows.forEach((row, index) => {
    let company = "";
    let caseNo = "";
    let iisRef = "";
    let dateIssued = "";
    let dateReleased = "";
    let documentType = "";
    let violation = "";
    let status = "";
    let amount = 0;
    let province = "";
    let city = "";
    let municipality = "";
    let barangay = "";
    let address = "";
    if (isHistorical) {
      const category = cleanText(row[5]).toUpperCase();
      if (category === "PAB") {
        lastWasPab = true;
        return;
      }
      if (category) lastWasPab = false;
      if (lastWasPab) return;
      company = cleanText(row[0]);
      caseNo = cleanText(row[1]);
      dateReleased = cleanText(row[2]);
      iisRef = cleanText(row[3]);
      address = cleanText(row[4]);
      status = cleanText(row[6]);
      amount = parseMoney(row[7]);
      documentType = cleanText(row[8]);
      violation = cleanText(row[9]);
      province = deriveProvince(address);
    } else if (is2025) {
      company = cleanText(row[0]);
      iisRef = cleanText(row[1]);
      caseNo = cleanText(row[2]);
      dateReleased = cleanText(row[3]);
      address = cleanText(row[4]);
      documentType = cleanText(row[5]);
      violation = cleanText(row[6]);
      status = cleanText(row[7]);
      amount = parseMoney(row[8]);
      province = deriveProvince(address);
    } else {
      company = cleanText(row[0]);
      caseNo = cleanText(row[1]);
      dateIssued = cleanText(row[2]);
      iisRef = cleanText(row[3]);
      province = cleanText(row[4]);
      city = cleanText(row[5]);
      municipality = cleanText(row[6]);
      barangay = cleanText(row[7]);
      address = cleanText(row[8]);
      dateReleased = cleanText(row[9]);
      documentType = cleanText(row[10]);
      violation = cleanText(row[11]);
      status = cleanText(row[12]);
      amount = parseMoney(row[13]);
    }
    const hasIdentity = Boolean(company || caseNo || iisRef);
    if (!hasIdentity && !violation && !status && !amount) return;
    if (!hasIdentity && last) {
      company = last.company;
      caseNo = last.caseNo;
      iisRef = last.iisRef;
      dateIssued = last.dateIssued;
      dateReleased = last.dateReleased;
      documentType = documentType || last.documentType;
      status = status || last.status;
      province = last.province;
      city = last.city;
      municipality = last.municipality;
      barangay = last.barangay;
      address = last.address;
    }
    const actionDate = dateReleased || dateIssued;
    const record = {
      id: `order-${source.year}-${index + 1}`,
      company,
      caseNo,
      iisRef,
      dateIssued,
      dateReleased,
      date: actionDate,
      dateIso: parseDate2(actionDate),
      documentType,
      violation,
      status,
      amount,
      province,
      city,
      municipality,
      barangay,
      address,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    };
    records.push(record);
    last = record;
  });
  return records;
}
function buildPabOrdersForSource(source) {
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const isHistorical = is2023 || is2024;
  const tab = isHistorical ? source.tabs.orders : source.tabs.pabOrders;
  if (!tab) return [];
  const records = [];
  const is2025 = source.year === "2025";
  let last = null;
  let lastWasPab = false;
  tab.rows.forEach((row, index) => {
    let company = "";
    let pabCaseNo = "";
    let iisRef = "";
    let dateIssued = "";
    let documentType = "";
    let violation = "";
    let status = "";
    let amount = 0;
    let province = "";
    let city = "";
    let municipality = "";
    let barangay = "";
    let address = "";
    if (isHistorical) {
      const category = cleanText(row[5]).toUpperCase();
      if (category === "PAB") {
        lastWasPab = true;
      } else if (category) {
        lastWasPab = false;
        return;
      }
      if (!lastWasPab) return;
      company = cleanText(row[0]);
      pabCaseNo = cleanText(row[1]);
      dateIssued = cleanText(row[2]);
      iisRef = cleanText(row[3]);
      address = cleanText(row[4]);
      status = cleanText(row[6]);
      amount = parseMoney(row[7]);
      documentType = cleanText(row[8]);
      violation = cleanText(row[9]);
      province = deriveProvince(address);
    } else if (is2025) {
      company = cleanText(row[0]);
      iisRef = cleanText(row[1]);
      pabCaseNo = cleanText(row[2]);
      dateIssued = cleanText(row[3]);
      address = cleanText(row[4]);
      documentType = cleanText(row[5]);
      violation = cleanText(row[6]);
      status = cleanText(row[7]);
      amount = parseMoney(row[8]);
      province = deriveProvince(address);
    } else {
      company = cleanText(row[0]);
      pabCaseNo = cleanText(row[1]);
      dateIssued = cleanText(row[2]);
      iisRef = cleanText(row[3]);
      province = cleanText(row[4]);
      city = cleanText(row[5]);
      municipality = cleanText(row[6]);
      barangay = cleanText(row[7]);
      address = cleanText(row[8]);
      documentType = cleanText(row[9]);
      violation = cleanText(row[10]);
      status = cleanText(row[11]);
      amount = parseMoney(row[12]);
    }
    const hasIdentity = Boolean(company || pabCaseNo || iisRef);
    if (!hasIdentity && !violation && !status && !amount) return;
    if (!hasIdentity && last) {
      company = last.company;
      pabCaseNo = last.pabCaseNo;
      iisRef = last.iisRef;
      dateIssued = last.dateIssued;
      documentType = documentType || last.documentType;
      status = status || last.status;
      province = last.province;
      city = last.city;
      municipality = last.municipality;
      barangay = last.barangay;
      address = last.address;
    }
    const record = {
      id: `pab-order-${source.year}-${index + 1}`,
      company,
      pabCaseNo,
      iisRef,
      dateIssued,
      dateIso: parseDate2(dateIssued),
      documentType,
      violation,
      status,
      amount,
      province,
      city,
      municipality,
      barangay,
      address,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    };
    records.push(record);
    last = record;
  });
  return records;
}
function buildErfForSource(source) {
  const tab = source.tabs.erf;
  if (!tab) return [];
  const records = [];
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const isHistorical = is2023 || is2024;
  const is2025 = source.year === "2025";
  tab.rows.forEach((row, index) => {
    let company = "";
    let caseNo = "";
    let amount = 0;
    let orNumber = "";
    let date = "";
    let status = "";
    let province = "";
    if (isHistorical) {
      company = cleanText(row[0]);
      caseNo = cleanText(row[1]);
      status = cleanText(row[5]);
      amount = parseMoney(row[6]);
      orNumber = cleanText(row[7]);
      date = cleanText(row[9]);
      province = cleanText(row[11]);
    } else if (is2025) {
      company = cleanText(row[0]);
      caseNo = cleanText(row[1]);
      amount = parseMoney(row[2]);
      orNumber = cleanText(row[3]);
      date = cleanText(row[4]);
      status = cleanText(row[5]);
    } else {
      company = cleanText(row[1]);
      caseNo = cleanText(row[2]);
      amount = parseMoney(row[3]);
      orNumber = cleanText(row[4]);
      date = cleanText(row[5]);
      status = cleanText(row[6]);
    }
    if (!company && !caseNo) return;
    records.push({
      id: `erf-${source.year}-${index + 1}`,
      company,
      caseNo,
      amount,
      orNumber,
      date,
      dateIso: parseDate2(date),
      status,
      province,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildPabPenaltiesForSource(source) {
  const is2023 = source.year === "2023";
  const is2024 = source.year === "2024";
  const is2025 = source.year === "2025";
  const tab = is2023 ? source.tabs.pabNov : source.tabs.pabPenalty;
  if (!tab) return [];
  const records = [];
  let lastCompany = "";
  let lastPabCase = "";
  tab.rows.forEach((row, index) => {
    let company = "";
    let pabCaseNo = "";
    let amount = 0;
    let orNumber = "";
    let date = "";
    let status = "";
    let subtype = "";
    if (is2023) {
      pabCaseNo = cleanText(row[1]);
      company = cleanText(row[4]);
      amount = parseMoney(row[22]);
      orNumber = cleanText(row[23]);
      date = cleanText(row[25]);
      status = orNumber ? "PAID" : amount > 0 ? "PENDING" : "";
      subtype = "PAB penalty";
      if (!/^07-/i.test(pabCaseNo)) return;
      if (!amount && !orNumber) return;
    } else if (is2024) {
      company = cleanText(row[0]);
      pabCaseNo = cleanText(row[1]);
      if (company) lastCompany = company;
      if (pabCaseNo) lastPabCase = pabCaseNo;
      if (!company && !pabCaseNo) {
        company = lastCompany;
        pabCaseNo = lastPabCase;
      }
      amount = parseMoney(row[6]);
      orNumber = cleanText(row[7]);
      date = cleanText(row[9]);
      status = cleanText(row[5]);
      subtype = [cleanText(row[3]), cleanText(row[4])].filter(Boolean).join(" \xB7 ");
      if (!company && !pabCaseNo) return;
      if (!amount && !orNumber && !status) return;
    } else if (is2025) {
      company = cleanText(row[0]);
      pabCaseNo = cleanText(row[1]);
      amount = parseMoney(row[2]);
      orNumber = cleanText(row[3]);
      date = cleanText(row[4]);
      status = cleanText(row[5]);
      subtype = cleanText(row[6]);
    } else {
      company = cleanText(row[1]);
      pabCaseNo = cleanText(row[2]);
      amount = parseMoney(row[3]);
      orNumber = cleanText(row[4]);
      date = cleanText(row[5]);
      status = cleanText(row[6]);
      subtype = cleanText(row[7]);
    }
    if (company.toUpperCase() === "COMPANY NAME" || pabCaseNo.toUpperCase() === "CASE NUMBER" || company.toUpperCase() === "PROPONENT NAME") {
      return;
    }
    if (!company && !pabCaseNo) return;
    records.push({
      id: `pab-penalty-${source.year}-${index + 1}`,
      company,
      pabCaseNo,
      amount,
      orNumber,
      date,
      dateIso: parseDate2(date),
      status,
      subtype,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildRa6969ForSource(source) {
  const tab = source.tabs.ra6969;
  if (!tab) return [];
  const records = [];
  const is2025 = source.year === "2025";
  tab.rows.forEach((row, index) => {
    const company = cleanText(is2025 ? row[0] : row[1]);
    const caseNo = cleanText(is2025 ? row[1] : row[2]);
    if (!company && !caseNo) return;
    const amount = parseMoney(is2025 ? row[2] : row[3]);
    const orNumber = cleanText(is2025 ? row[3] : row[4]);
    const date = cleanText(is2025 ? row[4] : row[5]);
    const status = cleanText(is2025 ? row[5] : row[6]);
    const subtype = cleanText(is2025 ? row[6] : row[7]);
    records.push({
      id: `ra6969-${source.year}-${index + 1}`,
      company,
      caseNo,
      amount,
      orNumber,
      date,
      dateIso: parseDate2(date),
      status,
      subtype,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildComplaintsForSource(source) {
  const tab = source.tabs.complaints;
  if (!tab) return [];
  const records = [];
  const is2023 = source.year === "2023";
  tab.rows.forEach((row, index) => {
    const date = cleanText(row[0]);
    const iisRef = cleanText(row[1]);
    const subject = cleanText(is2023 ? row[6] : row[3]);
    if (!date && !iisRef && !subject) return;
    let complainant = "";
    let complainantContact = "";
    let respondent = "";
    let address = "";
    let province = "";
    let status = "";
    let handler = "";
    let remarks = "";
    let actions = "";
    if (is2023) {
      complainant = cleanText(row[4]);
      complainantContact = cleanText(row[5]);
      respondent = cleanText(row[7]);
      address = cleanText(row[8]);
      province = deriveProvince(address);
      status = cleanText(row[9]);
      handler = cleanText(row[10]);
      remarks = cleanText(row[11]);
      actions = remarks;
    } else {
      complainant = cleanText(row[4]);
      respondent = cleanText(row[5]);
      actions = cleanText(row[6]);
    }
    records.push({
      id: `complaint-${source.year}-${index + 1}`,
      date,
      dateIso: parseDate2(date),
      iisRef,
      mode: cleanText(row[2]),
      subject,
      complainant,
      complainantContact,
      respondent,
      address,
      province,
      status,
      handler,
      remarks,
      actions,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildNoNovTcForSource(source) {
  const tab = source.tabs.noNovTc;
  if (!tab) return [];
  const records = [];
  tab.rows.forEach((row, index) => {
    const iisRef = cleanText(row[0]);
    const name = cleanText(row[1]);
    if (!iisRef && !name) return;
    records.push({
      id: `tc-${source.year}-${index + 1}`,
      iisRef,
      name,
      address: cleanText(row[2]),
      date: cleanText(row[3]),
      dateIso: parseDate2(row[3]),
      type: cleanText(row[4]),
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildLbcForSource(source) {
  const tab = source.tabs.lbc;
  if (!tab) return [];
  const records = [];
  tab.rows.forEach((row, index) => {
    const iisRef = cleanText(row[0]);
    const documentType = cleanText(row[1]);
    const caseNo = cleanText(row[2]);
    const respondent = cleanText(row[3]);
    if (!iisRef && !caseNo && !respondent) return;
    const dateOutbound = cleanText(row[4]);
    const dateReturned = cleanText(row[6]);
    const dateClosed = cleanText(row[8]);
    const replyDate = cleanText(row[11]);
    records.push({
      id: `lbc-${source.year}-${index + 1}`,
      iisRef,
      documentType,
      caseNo,
      respondent,
      dateOutbound,
      dateOutboundIso: parseDate2(dateOutbound),
      status: cleanText(row[5]),
      dateReturned,
      dateReturnedIso: parseDate2(dateReturned),
      trackingNo: cleanText(row[7]),
      dateClosed,
      dateClosedIso: parseDate2(dateClosed),
      statusAfterLbc: cleanText(row[9]),
      actionsIfReturned: cleanText(row[10]),
      replyDate,
      replyDateIso: parseDate2(replyDate),
      update: cleanText(row[12]),
      withResolution: cleanText(row[13]),
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function buildDpwhForSource(source) {
  const tab = source.tabs.dpwh;
  if (!tab) return [];
  const records = [];
  let project = "";
  tab.rows.forEach((row, index) => {
    const projectCell = cleanText(row[0]);
    if (projectCell) project = projectCell;
    const commitment = cleanText(row[1]);
    const dueDate = cleanText(row[2]);
    const status = cleanText(row[3]).replace(/^STATUS\s+/i, "");
    const remarks = cleanText(row[4]);
    if (!project && !commitment && !dueDate && !status && !remarks) return;
    const iisMatch = project.match(/R7-\d{4}-\d+/i);
    const iisRef = iisMatch?.[0]?.toUpperCase() ?? "";
    const projectName = project.replace(/^PROJECT\s+NAME\s*/i, "").replace(/\s*\(R7-[^)]*\)\s*/i, " ").trim();
    const cleanedCommitment = commitment.replace(/^COMMITMENTS?\/?AGREEMENTS?\s*/i, "").trim();
    const cleanedDueDate = dueDate.toUpperCase() === "DUE DATE" ? "" : dueDate;
    const cleanedRemarks = remarks.toUpperCase() === "REMARKS" ? "" : remarks;
    records.push({
      id: `dpwh-${source.year}-${index + 1}`,
      project: projectName || project,
      iisRef,
      commitment: cleanedCommitment,
      dueDate: cleanedDueDate,
      dueDateIso: parseDate2(cleanedDueDate),
      status,
      remarks: cleanedRemarks,
      linkedCaseNo: null,
      matchBasis: "",
      sourceYear: source.year,
      docketYear: source.year
    });
  });
  return records;
}
function computeDuplicateData(cases) {
  const iisGroups = /* @__PURE__ */ new Map();
  const caseGroups = /* @__PURE__ */ new Map();
  for (const caseRecord of cases) {
    const iisKey = normalizeIis(caseRecord.iisRef);
    if (iisKey) pushMap(iisGroups, `${caseRecord.sourceYear}|${iisKey}`, caseRecord);
    if (caseRecord.caseNo !== "UNNUMBERED") {
      pushMap(caseGroups, `${caseRecord.sourceYear}|${caseRecord.caseNo}`, caseRecord);
    }
  }
  const duplicateIisCaseIds = /* @__PURE__ */ new Set();
  const duplicateIis = [...iisGroups.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => {
    for (const caseRecord of group) duplicateIisCaseIds.add(caseRecord.id);
    return {
      iisRef: key.split("|").slice(1).join("|"),
      cases: group.map((caseRecord) => ({
        caseNo: caseRecord.displayCaseNo,
        establishment: caseRecord.establishment
      }))
    };
  });
  const duplicateCaseIds = /* @__PURE__ */ new Set();
  const duplicateCaseNumbers = [...caseGroups.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => {
    for (const caseRecord of group) duplicateCaseIds.add(caseRecord.id);
    return {
      caseNo: key.split("|").slice(1).join("|"),
      cases: group.map((caseRecord) => ({
        caseNo: caseRecord.displayCaseNo,
        establishment: caseRecord.establishment,
        year: caseRecord.sourceYear
      }))
    };
  });
  return { duplicateIis, duplicateCaseNumbers, duplicateIisCaseIds, duplicateCaseIds };
}
function buildDataIssues(cases, records, duplicateData) {
  const invalidDates = cases.filter((caseRecord) => !caseRecord.dateIso).map((caseRecord) => ({
    caseNo: caseRecord.displayCaseNo,
    establishment: caseRecord.establishment,
    rawDate: caseRecord.dateDocketed || "(blank)"
  }));
  const missingFields = cases.filter((caseRecord) => caseRecord.dataIssues.some((issue) => issue.startsWith("Missing"))).map((caseRecord) => ({
    caseNo: caseRecord.displayCaseNo,
    establishment: caseRecord.establishment,
    missing: caseRecord.dataIssues.filter((issue) => issue.startsWith("Missing"))
  }));
  return {
    invalidDates,
    unnumbered: cases.filter((caseRecord) => caseRecord.isUnnumbered),
    duplicateIis: duplicateData.duplicateIis,
    duplicateCaseNumbers: duplicateData.duplicateCaseNumbers,
    missingFields,
    unlinked: {
      pabNov: records.pabNov.filter((record) => !record.linkedCaseNo),
      orders: records.orders.filter((record) => !record.linkedCaseNo),
      pabOrders: records.pabOrders.filter((record) => !record.linkedCaseNo),
      erf: records.erf.filter((record) => !record.linkedCaseNo),
      pabPenalties: records.pabPenalties.filter((record) => !record.linkedCaseNo),
      ra6969: records.ra6969.filter((record) => !record.linkedCaseNo),
      complaints: records.complaints.filter((record) => !record.linkedCaseNo),
      lbc: records.lbc.filter((record) => !record.linkedCaseNo),
      dpwh: records.dpwh.filter((record) => !record.linkedCaseNo)
    }
  };
}
function latestDate(values, fallback) {
  const dates = values.filter((value) => Boolean(value)).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
  const latest = dates[dates.length - 1];
  if (!latest) return fallback;
  return latest > fallback ? latest : fallback;
}
function collectDates(cases, records) {
  return [
    ...cases.map((caseRecord) => caseRecord.dateIso),
    ...records.pabNov.map((record) => record.dateIso),
    ...records.orders.map((record) => record.dateIso),
    ...records.pabOrders.map((record) => record.dateIso),
    ...records.erf.map((record) => record.dateIso),
    ...records.pabPenalties.map((record) => record.dateIso),
    ...records.ra6969.map((record) => record.dateIso),
    ...records.complaints.map((record) => record.dateIso),
    ...records.lbc.map((record) => record.dateOutboundIso),
    ...records.lbc.map((record) => record.dateClosedIso),
    ...records.dpwh.map((record) => record.dueDateIso),
    ...records.noNovTc.map((record) => record.dateIso)
  ];
}
function sourceMeta(source) {
  const tabCounts = {};
  for (const [key, tab] of Object.entries(source.tabs)) tabCounts[key] = tab.rows.length;
  return {
    year: source.year,
    label: source.label,
    sheetId: source.sheetId,
    sourceUrl: source.sourceUrl,
    dataDate: source.dataDate,
    coverage: source.coverage ?? [],
    tabCounts
  };
}
function countPlaceholders(source) {
  if (source.year !== "2023" && source.year !== "2024") return 0;
  const master = source.tabs.master;
  if (!master) return 0;
  const caseIndex = source.year === "2023" ? 1 : 0;
  const establishmentIndex = source.year === "2023" ? 4 : 3;
  return master.rows.filter((row) => {
    const caseNo = normalizeCaseNo(row[caseIndex]);
    return /^20\d{2}-\d{4}$/.test(caseNo) && !cleanText(row[establishmentIndex]);
  }).length;
}
function buildDashboardData(snapshot) {
  if (!snapshot.sources?.length) {
    throw new Error("Snapshot v2 is required: expected a sources[] array.");
  }
  const cases = [];
  let pabNov = [];
  let orders = [];
  let pabOrders = [];
  let erf = [];
  let pabPenalties = [];
  let ra6969 = [];
  let complaints = [];
  let noNovTc = [];
  let lbc = [];
  let dpwh = [];
  for (const source of snapshot.sources) {
    cases.push(...buildCasesForSource(source));
    pabNov.push(...buildPabNovForSource(source));
    orders.push(...buildOrdersForSource(source));
    pabOrders.push(...buildPabOrdersForSource(source));
    erf.push(...buildErfForSource(source));
    pabPenalties.push(...buildPabPenaltiesForSource(source));
    ra6969.push(...buildRa6969ForSource(source));
    complaints.push(...buildComplaintsForSource(source));
    noNovTc.push(...buildNoNovTcForSource(source));
    lbc.push(...buildLbcForSource(source));
    dpwh.push(...buildDpwhForSource(source));
  }
  const masterByIis = /* @__PURE__ */ new Map();
  const masterByIisYear = /* @__PURE__ */ new Map();
  const masterByCase = /* @__PURE__ */ new Map();
  const nameEntries = [];
  for (const caseRecord of cases) {
    const iis = normalizeIis(caseRecord.iisRef);
    if (iis) {
      pushMap(masterByIis, iis, caseRecord);
      pushMap(masterByIisYear, `${caseRecord.sourceYear}|${iis}`, caseRecord);
    }
    if (caseRecord.caseNo !== "UNNUMBERED") {
      pushMap(masterByCase, caseRecord.caseNo, caseRecord);
    }
    for (const name of [caseRecord.establishment, caseRecord.proponent]) {
      const normalized = normalizeName(name);
      if (!normalized || normalized === "N/A" || normalized === "-") continue;
      nameEntries.push({ name: normalized, caseRecord });
    }
  }
  const pabByDocket = /* @__PURE__ */ new Map();
  for (const record of pabNov) {
    const docket = normalizePab(record.pabCaseNo);
    if (docket) pushMap(pabByDocket, docket, record);
  }
  const findIisMatches = (iisRef, sourceYear) => {
    const normalized = normalizeIis(iisRef);
    if (!normalized) return [];
    const sameYear = masterByIisYear.get(`${sourceYear}|${normalized}`) ?? [];
    if (sameYear.length) return sameYear;
    return masterByIis.get(normalized) ?? [];
  };
  const findCaseMatches = (caseNo) => {
    const normalized = normalizeCaseNo(caseNo);
    if (!normalized) return [];
    return masterByCase.get(normalized) ?? [];
  };
  const findPabRecord = (pabCaseNo, sourceYear) => {
    const normalized = normalizePab(pabCaseNo);
    if (!normalized) return void 0;
    const candidates = pabByDocket.get(normalized) ?? [];
    return candidates.find((candidate) => candidate.sourceYear === sourceYear) ?? candidates[0];
  };
  const attach = (record, matches, basis, addToCase) => {
    if (!matches.length) {
      record.docketYear = record.sourceYear;
      return false;
    }
    const sameYear = matches.filter((caseRecord) => caseRecord.docketYear === record.sourceYear);
    const chosen = sameYear.length ? sameYear : matches;
    record.linkedCaseNo = chosen[0].caseNo;
    record.matchBasis = basis;
    record.docketYear = chosen[0].docketYear ?? record.sourceYear;
    for (const caseRecord of chosen) addToCase(caseRecord, record);
    return true;
  };
  const linkByPab = (record, addToCase) => {
    const pabRecord = findPabRecord(record.pabCaseNo, record.sourceYear);
    if (!pabRecord) return false;
    const matches = findIisMatches(pabRecord.iisRef, pabRecord.sourceYear);
    return attach(record, matches, "PAB docket \u2192 IIS", addToCase);
  };
  for (const record of pabNov) {
    attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", (caseRecord, item) => {
      caseRecord.pabNov.push(item);
    });
  }
  for (const record of orders) {
    if (attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", (caseRecord, item) => {
      caseRecord.orders.push(item);
    })) {
      continue;
    }
    attach(record, findCaseMatches(record.caseNo), "Case number", (caseRecord, item) => {
      caseRecord.orders.push(item);
    });
  }
  for (const record of pabOrders) {
    if (linkByPab(record, (caseRecord, item) => {
      caseRecord.pabOrders.push(item);
    })) {
      continue;
    }
    attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", (caseRecord, item) => {
      caseRecord.pabOrders.push(item);
    });
  }
  for (const record of erf) {
    attach(record, findCaseMatches(record.caseNo), "Case number", (caseRecord, item) => {
      caseRecord.erf.push(item);
    });
  }
  for (const record of pabPenalties) {
    linkByPab(record, (caseRecord, item) => {
      caseRecord.pabPenalties.push(item);
    });
  }
  for (const record of ra6969) {
    attach(record, findCaseMatches(record.caseNo), "Case number", (caseRecord, item) => {
      caseRecord.ra6969.push(item);
    });
  }
  for (const record of complaints) {
    if (attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", (caseRecord, item) => {
      caseRecord.complaints.push(item);
    })) {
      continue;
    }
    const sameYearEntries = nameEntries.filter(
      (entry) => entry.caseRecord.sourceYear === record.sourceYear
    );
    const respondent = normalizeName(record.respondent);
    if (respondent) {
      const exact = sameYearEntries.find((entry) => entry.name === respondent);
      if (exact) {
        attach(record, [exact.caseRecord], "Respondent name", (caseRecord, item) => {
          caseRecord.complaints.push(item);
        });
        continue;
      }
      if (respondent.length >= 10) {
        const partial = sameYearEntries.filter(
          ({ name }) => name.length >= 10 && (name.includes(respondent) || respondent.includes(name))
        ).sort((a, b) => b.name.length - a.name.length)[0];
        if (partial) {
          attach(record, [partial.caseRecord], "Respondent name (partial)", (caseRecord, item) => {
            caseRecord.complaints.push(item);
          });
          continue;
        }
      }
    }
    const text = `${record.subject} ${record.actions}`.toUpperCase();
    if (text.length >= 12) {
      const textMatch = sameYearEntries.filter(({ name }) => name.length >= 12 && text.includes(name)).sort((a, b) => b.name.length - a.name.length)[0];
      if (textMatch) {
        attach(record, [textMatch.caseRecord], "Complaint text name match", (caseRecord, item) => {
          caseRecord.complaints.push(item);
        });
      }
    }
  }
  for (const record of noNovTc) {
    attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", () => {
    });
  }
  for (const record of lbc) {
    let matches = [];
    let basis = "";
    const normalizedCase = normalizeCaseNo(record.caseNo);
    if (/^20\d{2}-\d{4}$/.test(normalizedCase)) {
      matches = findCaseMatches(record.caseNo);
      basis = "Case number";
    }
    if (!matches.length && /^07-/i.test(record.caseNo)) {
      const pabRecord = findPabRecord(record.caseNo, record.sourceYear);
      if (pabRecord) {
        matches = findIisMatches(pabRecord.iisRef, pabRecord.sourceYear);
        basis = "PAB docket \u2192 IIS";
      }
    }
    if (!matches.length) {
      matches = findIisMatches(record.iisRef, record.sourceYear);
      basis = "IIS reference";
    }
    if (!matches.length) {
      const respondent = normalizeName(record.respondent);
      if (respondent) {
        const exact = nameEntries.find(
          (entry) => entry.caseRecord.sourceYear === record.sourceYear && entry.name === respondent
        );
        if (exact) {
          matches = [exact.caseRecord];
          basis = "Respondent name";
        }
      }
    }
    attach(record, matches, basis, (caseRecord, item) => {
      caseRecord.lbc.push(item);
    });
  }
  for (const record of dpwh) {
    attach(record, findIisMatches(record.iisRef, record.sourceYear), "IIS reference", (caseRecord, item) => {
      caseRecord.dpwh.push(item);
    });
  }
  const excludedCaseIdSet = new Set(
    cases.filter(
      (caseRecord) => isExcludedLocation(
        caseRecord.province,
        caseRecord.address,
        caseRecord.city,
        caseRecord.municipality,
        caseRecord.establishment
      )
    ).map((caseRecord) => caseRecord.id)
  );
  const keptCaseNoSet = new Set(
    cases.filter((caseRecord) => !excludedCaseIdSet.has(caseRecord.id)).map((caseRecord) => caseRecord.caseNo)
  );
  const excludedCaseNos = new Set(
    cases.filter((caseRecord) => excludedCaseIdSet.has(caseRecord.id)).map((caseRecord) => caseRecord.caseNo)
  );
  const recordOwnExcluded = {
    pabNov: (record) => isExcludedLocation(record.province, record.address),
    orders: (record) => isExcludedLocation(record.province, record.address),
    pabOrders: (record) => isExcludedLocation(record.province, record.address),
    erf: (record) => isExcludedProvince(record.province),
    complaints: (record) => isExcludedLocation(record.province, record.address),
    noNovTc: (record) => isExcludedLocation("", record.address)
  };
  const isLinkedExcluded = (record) => Boolean(record.linkedCaseNo && excludedCaseNos.has(record.linkedCaseNo) && !keptCaseNoSet.has(record.linkedCaseNo));
  const droppedIds = /* @__PURE__ */ new Set();
  const countBefore = {
    pabNov: pabNov.length,
    orders: orders.length,
    pabOrders: pabOrders.length,
    erf: erf.length,
    pabPenalties: pabPenalties.length,
    ra6969: ra6969.length,
    complaints: complaints.length,
    lbc: lbc.length,
    dpwh: dpwh.length,
    noNovTc: noNovTc.length
  };
  const dropRecord = (type, record) => {
    droppedIds.add(record.id);
  };
  const filterRecordList = (type, rows, ownExcluded) => {
    return rows.filter((row) => {
      if (isLinkedExcluded(row) || ownExcluded(row)) {
        droppedIds.add(row.id);
        return false;
      }
      return true;
    });
  };
  pabNov = filterRecordList("pabNov", pabNov, recordOwnExcluded.pabNov);
  orders = filterRecordList("orders", orders, recordOwnExcluded.orders);
  pabOrders = filterRecordList("pabOrders", pabOrders, recordOwnExcluded.pabOrders);
  erf = filterRecordList("erf", erf, recordOwnExcluded.erf);
  complaints = filterRecordList("complaints", complaints, recordOwnExcluded.complaints);
  noNovTc = filterRecordList("noNovTc", noNovTc, recordOwnExcluded.noNovTc);
  pabPenalties = pabPenalties.filter((row) => {
    if (isLinkedExcluded(row)) {
      droppedIds.add(row.id);
      return false;
    }
    return true;
  });
  ra6969 = ra6969.filter((row) => {
    if (isLinkedExcluded(row)) {
      droppedIds.add(row.id);
      return false;
    }
    return true;
  });
  lbc = lbc.filter((row) => {
    if (isLinkedExcluded(row)) {
      droppedIds.add(row.id);
      return false;
    }
    return true;
  });
  dpwh = dpwh.filter((row) => {
    if (isLinkedExcluded(row)) {
      droppedIds.add(row.id);
      return false;
    }
    return true;
  });
  const keptCases = cases.filter((caseRecord) => !excludedCaseIdSet.has(caseRecord.id));
  for (const caseRecord of keptCases) {
    caseRecord.pabNov = caseRecord.pabNov.filter((item) => !droppedIds.has(item.id));
    caseRecord.orders = caseRecord.orders.filter((item) => !droppedIds.has(item.id));
    caseRecord.pabOrders = caseRecord.pabOrders.filter((item) => !droppedIds.has(item.id));
    caseRecord.erf = caseRecord.erf.filter((item) => !droppedIds.has(item.id));
    caseRecord.pabPenalties = caseRecord.pabPenalties.filter((item) => !droppedIds.has(item.id));
    caseRecord.ra6969 = caseRecord.ra6969.filter((item) => !droppedIds.has(item.id));
    caseRecord.complaints = caseRecord.complaints.filter((item) => !droppedIds.has(item.id));
    caseRecord.lbc = caseRecord.lbc.filter((item) => !droppedIds.has(item.id));
    caseRecord.dpwh = caseRecord.dpwh.filter((item) => !droppedIds.has(item.id));
  }
  const excludedRecordsByType = {};
  for (const type of Object.keys(countBefore)) {
    const after = type === "pabNov" ? pabNov.length : type === "orders" ? orders.length : type === "pabOrders" ? pabOrders.length : type === "erf" ? erf.length : type === "pabPenalties" ? pabPenalties.length : type === "ra6969" ? ra6969.length : type === "complaints" ? complaints.length : type === "lbc" ? lbc.length : type === "dpwh" ? dpwh.length : noNovTc.length;
    excludedRecordsByType[type] = countBefore[type] - after;
  }
  const excludedCaseList = [...cases].filter(
    (caseRecord) => excludedCaseIdSet.has(caseRecord.id)
  );
  const excludedCasesByYear = {};
  const ambiguousByYear = {};
  for (const source of snapshot.sources) {
    excludedCasesByYear[source.year] = excludedCaseList.filter(
      (caseRecord) => caseRecord.sourceYear === source.year
    ).length;
    const keptForYear = cases.filter(
      (caseRecord) => caseRecord.sourceYear === source.year && !excludedCaseIdSet.has(caseRecord.id)
    );
    ambiguousByYear[source.year] = keptForYear.filter(
      (caseRecord) => !isExcludedLocation(
        caseRecord.province,
        caseRecord.address,
        caseRecord.city,
        caseRecord.municipality,
        caseRecord.establishment
      ) && !hasIdentifiableLocation(
        caseRecord.province,
        caseRecord.address,
        caseRecord.city,
        caseRecord.municipality
      )
    ).length;
  }
  const placeholdersByYear = {};
  for (const source of snapshot.sources) {
    placeholdersByYear[source.year] = countPlaceholders(source);
  }
  cases.length = 0;
  cases.push(...keptCases);
  const exclusions = {
    provinces: ["Negros Oriental", "Siquijor"],
    excludedCases: excludedCaseList.length,
    casesByYear: excludedCasesByYear,
    excludedRecords: Object.values(excludedRecordsByType).reduce((sum, value) => sum + value, 0),
    recordsByType: excludedRecordsByType,
    ambiguousCases: keptCases.filter(
      (caseRecord) => !isExcludedLocation(
        caseRecord.province,
        caseRecord.address,
        caseRecord.city,
        caseRecord.municipality,
        caseRecord.establishment
      ) && !hasIdentifiableLocation(
        caseRecord.province,
        caseRecord.address,
        caseRecord.city,
        caseRecord.municipality
      )
    ).length,
    ambiguousByYear,
    placeholdersSkipped: Object.values(placeholdersByYear).reduce((sum, value) => sum + value, 0),
    placeholdersByYear,
    retainedCases: keptCases.length
  };
  const duplicateData = computeDuplicateData(cases);
  for (const caseRecord of cases) {
    if (duplicateData.duplicateIisCaseIds.has(caseRecord.id)) {
      if (!caseRecord.dataIssues.includes("Duplicate IIS reference")) {
        caseRecord.dataIssues.push("Duplicate IIS reference");
      }
    }
    if (duplicateData.duplicateCaseIds.has(caseRecord.id)) {
      if (!caseRecord.dataIssues.includes("Duplicate case number")) {
        caseRecord.dataIssues.push("Duplicate case number");
      }
    }
    const flags = /* @__PURE__ */ new Set();
    for (const violation of caseRecord.violations) flags.add(violationFlag(violation));
    for (const flag of noteFlags(caseRecord.notes)) flags.add(flag);
    for (const issue of caseRecord.dataIssues) {
      if (issue.startsWith("Missing case number")) flags.add("Unnumbered case");
      if (issue.startsWith("Invalid docket") || issue.startsWith("Missing docket")) {
        flags.add("Invalid date");
      }
      if (issue === "Duplicate IIS reference") flags.add("Duplicate IIS");
      if (issue === "Duplicate case number") flags.add("Duplicate case no.");
    }
    caseRecord.pabNov = uniqueBy(caseRecord.pabNov, (item) => item.id);
    caseRecord.orders = uniqueBy(caseRecord.orders, (item) => item.id);
    caseRecord.pabOrders = uniqueBy(caseRecord.pabOrders, (item) => item.id);
    caseRecord.erf = uniqueBy(caseRecord.erf, (item) => item.id);
    caseRecord.pabPenalties = uniqueBy(caseRecord.pabPenalties, (item) => item.id);
    caseRecord.ra6969 = uniqueBy(caseRecord.ra6969, (item) => item.id);
    caseRecord.complaints = uniqueBy(caseRecord.complaints, (item) => item.id);
    caseRecord.lbc = uniqueBy(caseRecord.lbc, (item) => item.id);
    caseRecord.dpwh = uniqueBy(caseRecord.dpwh, (item) => item.id);
    const allPayments = [
      ...caseRecord.erf,
      ...caseRecord.pabPenalties,
      ...caseRecord.ra6969
    ];
    caseRecord.paidAmount = allPayments.filter((payment) => isPaid(payment.status)).reduce((sum, payment) => sum + payment.amount, 0);
    caseRecord.assessedAmount = caseRecord.orders.reduce((sum, order) => sum + order.amount, 0) + caseRecord.pabOrders.reduce((sum, order) => sum + order.amount, 0);
    caseRecord.pendingPayment = caseRecord.orders.some((order) => isPending(order.status)) || allPayments.some((payment) => isPending(payment.status));
    const hasPaidPayment = allPayments.some((payment) => isPaid(payment.status));
    if (hasPaidPayment) caseRecord.stage = "payment";
    else if (caseRecord.pabOrders.length) caseRecord.stage = "pabOrder";
    else if (caseRecord.orders.length) caseRecord.stage = "order";
    else if (caseRecord.pabNov.length) caseRecord.stage = "pabNov";
    else caseRecord.stage = "nov";
    caseRecord.stageLabel = STAGE_META[caseRecord.stage].label;
    if (caseRecord.pendingPayment) flags.add("Payment pending");
    if (caseRecord.orders.some((order) => statusHas(order.status, "SET ASIDE"))) {
      flags.add("Order set aside");
    }
    if (caseRecord.orders.some((order) => cleanText(order.status).toUpperCase() === "DENIED")) {
      flags.add("Order denied");
    }
    if (caseRecord.orders.some((order) => cleanText(order.status).toUpperCase() === "REDUCE")) {
      flags.add("Penalty reduced");
    }
    if (caseRecord.pabOrders.some((order) => cleanText(order.status).toUpperCase() === "WITH PENALTY") && !hasPaidPayment) {
      flags.add("PAB penalty unpaid");
    }
    if (!caseRecord.pabNov.length && (caseRecord.orders.length || caseRecord.pabOrders.length)) {
      flags.add("No PAB NOV link");
    }
    if (caseRecord.orders.length && !caseRecord.pabNov.length && !caseRecord.pabOrders.length) {
      flags.add("Order without PAB NOV");
    }
    if (caseRecord.lbc.some(
      (record) => statusHas(record.statusAfterLbc, "RETURNED") || statusHas(record.status, "RETURNED")
    )) {
      flags.add("LBC returned");
    }
    if (caseRecord.dpwh.some(
      (record) => !statusHas(record.status, "COMPLIED") && !statusHas(record.status, "CLOSED")
    )) {
      flags.add("DPWH commitment pending");
    }
    const dates = [
      caseRecord.dateIso,
      ...caseRecord.pabNov.map((item) => item.dateIso),
      ...caseRecord.orders.map((item) => item.dateIso),
      ...caseRecord.pabOrders.map((item) => item.dateIso),
      ...allPayments.map((item) => item.dateIso),
      ...caseRecord.complaints.map((item) => item.dateIso),
      ...caseRecord.lbc.map((item) => item.dateOutboundIso),
      ...caseRecord.lbc.map((item) => item.dateClosedIso)
    ].filter((value) => Boolean(value));
    caseRecord.lastActionDate = dates.length ? dates.sort()[dates.length - 1] ?? null : null;
    const basis = /* @__PURE__ */ new Set();
    for (const record of [
      ...caseRecord.pabNov,
      ...caseRecord.orders,
      ...caseRecord.pabOrders,
      ...caseRecord.erf,
      ...caseRecord.pabPenalties,
      ...caseRecord.ra6969,
      ...caseRecord.complaints,
      ...caseRecord.lbc,
      ...caseRecord.dpwh
    ]) {
      if (record.matchBasis) basis.add(record.matchBasis);
    }
    caseRecord.matchBasis = [...basis];
    caseRecord.flags = [...flags];
    caseRecord.linkCount = caseRecord.pabNov.length + caseRecord.orders.length + caseRecord.pabOrders.length + caseRecord.erf.length + caseRecord.pabPenalties.length + caseRecord.ra6969.length + caseRecord.complaints.length + caseRecord.lbc.length + caseRecord.dpwh.length;
  }
  const records = {
    pabNov,
    orders,
    pabOrders,
    erf,
    pabPenalties,
    ra6969,
    complaints,
    lbc,
    dpwh,
    noNovTc
  };
  const dataIssues = buildDataIssues(cases, records, duplicateData);
  const docketYears = [...new Set(cases.map((caseRecord) => caseRecord.docketYear))].filter((year) => Boolean(year)).sort();
  const dataDate = latestDate(collectDates(cases, records), snapshot.dataDate);
  const timelineStart = docketYears.length ? `${docketYears[0]}-01` : `${dataDate.slice(0, 4)}-01`;
  const sources = snapshot.sources.map(sourceMeta);
  return {
    fetchedAt: snapshot.fetchedAt,
    dataDate,
    sourceUrl: sources[0]?.sourceUrl ?? "",
    scope: "all",
    scopeLabel: "All years",
    timelineStart,
    docketYears,
    sources,
    cases: [...cases].sort(
      (a, b) => (a.docketYear ?? "").localeCompare(b.docketYear ?? "") || a.caseNo.localeCompare(b.caseNo) || a.id.localeCompare(b.id)
    ),
    pabNov,
    orders,
    pabOrders,
    erf,
    pabPenalties,
    ra6969,
    complaints,
    noNovTc,
    lbc,
    dpwh,
    dataIssues,
    exclusions
  };
}
function scopeDashboardData(data, scope) {
  if (scope === "all") {
    const projectKey = (record) => `${record.project.toUpperCase().replace(/\\s+/g, "")}|${record.iisRef.toUpperCase()}`;
    const projects2025 = new Set(
      data.dpwh.filter((record) => record.sourceYear === "2025").map(projectKey)
    );
    const keptDpwh = data.dpwh.filter(
      (record) => !(record.sourceYear === "2024" && projects2025.has(projectKey(record)))
    );
    const keptDpwhIds = new Set(keptDpwh.map((record) => record.id));
    const cases2 = data.cases.map((caseRecord) => {
      const dpwh2 = caseRecord.dpwh.filter((record) => keptDpwhIds.has(record.id));
      return {
        ...caseRecord,
        dpwh: dpwh2,
        linkCount: caseRecord.pabNov.length + caseRecord.orders.length + caseRecord.pabOrders.length + caseRecord.erf.length + caseRecord.pabPenalties.length + caseRecord.ra6969.length + caseRecord.complaints.length + caseRecord.lbc.length + dpwh2.length
      };
    });
    const records2 = {
      pabNov: data.pabNov,
      orders: data.orders,
      pabOrders: data.pabOrders,
      erf: data.erf,
      pabPenalties: data.pabPenalties,
      ra6969: data.ra6969,
      complaints: data.complaints,
      lbc: data.lbc,
      dpwh: keptDpwh,
      noNovTc: data.noNovTc
    };
    const duplicateData2 = computeDuplicateData(cases2);
    const dataIssues2 = buildDataIssues(cases2, records2, duplicateData2);
    return {
      ...data,
      scope: "all",
      scopeLabel: "All years",
      dpwh: keptDpwh,
      cases: cases2,
      dataIssues: dataIssues2,
      exclusions: data.exclusions
    };
  }
  const cases = data.cases.filter((caseRecord) => caseRecord.docketYear === scope);
  const filterRecords = (rows) => rows.filter((record) => record.docketYear === scope);
  const pabNov = filterRecords(data.pabNov);
  const orders = filterRecords(data.orders);
  const pabOrders = filterRecords(data.pabOrders);
  const erf = filterRecords(data.erf);
  const pabPenalties = filterRecords(data.pabPenalties);
  const ra6969 = filterRecords(data.ra6969);
  const complaints = filterRecords(data.complaints);
  const noNovTc = filterRecords(data.noNovTc);
  const lbc = filterRecords(data.lbc);
  const dpwh = filterRecords(data.dpwh);
  const records = {
    pabNov,
    orders,
    pabOrders,
    erf,
    pabPenalties,
    ra6969,
    complaints,
    lbc,
    dpwh,
    noNovTc
  };
  const source = data.sources.find((item) => item.year === scope);
  const scopedDates = collectDates(cases, records).filter(
    (value) => Boolean(value && value <= (source?.dataDate ?? data.dataDate))
  );
  const dataDate = latestDate(scopedDates, source?.dataDate ?? data.dataDate);
  const timelineStart = `${scope}-01`;
  const scopedCases = cases.map((caseRecord) => ({
    ...caseRecord,
    ageDays: dayDiff(caseRecord.dateIso, dataDate)
  }));
  const duplicateData = computeDuplicateData(scopedCases);
  const dataIssues = buildDataIssues(scopedCases, records, duplicateData);
  return {
    ...data,
    scope,
    scopeLabel: `${scope} docket`,
    timelineStart,
    dataDate,
    sourceUrl: source?.sourceUrl ?? data.sourceUrl,
    cases: scopedCases,
    pabNov,
    orders,
    pabOrders,
    erf,
    pabPenalties,
    ra6969,
    complaints,
    noNovTc,
    lbc,
    dpwh,
    dataIssues,
    exclusions: data.exclusions
  };
}
function statusLabel(status) {
  return isBlankStatus(status) ? "No status" : status;
}
var NOT_RECORDED = SOURCE_NOT_RECORDED;
var NOT_STATED = SOURCE_NOT_STATED;
export {
  NOT_RECORDED,
  NOT_STATED,
  buildDashboardData,
  scopeDashboardData,
  statusLabel,
  violationFlag
};
