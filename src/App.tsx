import { useEffect, useMemo, useState } from 'react';

type Lang = 'zh' | 'en';

type Employee = {
  id: string;
  name: string;
};

type Day = {
  date: string;
  required: number | null;
  assigned: string[];
  isWeekend?: boolean;
  isNationalHoliday?: boolean;
  holidayDesc?: string;
};

type CompanyRules = {
  weekStartsOn: 'mon';
  maxConsecutiveWorkDays?: number;
  enforceWeekendRestOneDay?: boolean;
};

type Issue = {
  code: string;
  severity: 'warn' | 'block';
  message: string;
  date?: string;
  employeeId?: string;
};

const I18N = {
  zh: {
    title: '排班表',
    lang: '中文 / 英文',
    month: '月份',
    weekdayRequired: '平日所需人數',
    weekendRequired: '假日所需人數',
    maxConsecutive: '最大連續天數',
    autoFill: '自動排班',
    exportCsv: '匯出表格',
    assigned: '已排',
    available: '可排',
    weekend: '週末',
    holiday: '假日',
    over: '超過',
    holidayAsWork: '假日視為工作日',
    weekendRestOne: '每人週末至少休一天',
    employees: '員工',
    employeeName: '員工姓名',
    addEmployee: '新增員工',
    weekdayWorked: '平日上班天數',
    holidayWorked: '假日上班天數',
    minEmployees: '最低人數估算',
    restDaysPerWeek: '每人每週休',
    restDaysUnit: '天',
    estimateNote: '估算值',
    restDaysHint: '請設定每週休息天數',
    underBy: '人力不足',
    overBy: '超出人數',
    consecutiveExceeded: '超過連續上班天數',
    weekendOff2: '連續兩個週末都休',
    weekendRestWarn: '週末兩天都上班'
  },
  en: {
    title: 'Scheduling',
    lang: 'Chinese / English',
    month: 'Month',
    weekdayRequired: 'Weekday required',
    weekendRequired: 'Weekend required',
    maxConsecutive: 'Max consecutive',
    autoFill: 'Auto Fill',
    exportCsv: 'Export CSV',
    assigned: 'Assigned',
    available: 'Available',
    weekend: 'Weekend',
    holiday: 'Holiday',
    over: 'Over',
    holidayAsWork: 'consider holidays as working days',
    weekendRestOne: 'Each person must rest one weekend day',
    employees: 'Employees',
    employeeName: 'Employee name',
    addEmployee: 'Add Employee',
    weekdayWorked: 'Weekday worked days',
    holidayWorked: 'Weekend/holiday worked days',
    minEmployees: 'Minimum employees estimate',
    restDaysPerWeek: 'Rest days per week',
    restDaysUnit: 'days',
    estimateNote: 'Estimate',
    restDaysHint: 'Please set rest days per week',
    underBy: 'Understaffed',
    overBy: 'Overstaffed',
    consecutiveExceeded: 'Max consecutive exceeded',
    weekendOff2: 'Two consecutive full weekends off',
    weekendRestWarn: 'Works both weekend days'
  }
} as const;

const HOLIDAYS: Record<string, string> = {};

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ava' },
  { id: 'e2', name: 'Ben' },
  { id: 'e3', name: 'Cody' },
  { id: 'e4', name: 'Dora' },
  { id: 'e5', name: 'Eli' },
  { id: 'e6', name: 'Faye' }
];

const dayMs = 24 * 60 * 60 * 1000;
const toDate = (s: string) => new Date(`${s}T00:00:00`);
const fmt = (d: Date) => d.toLocaleDateString('sv-SE');
const monthKey = (s: string) => s.slice(0, 7);
const addMonths = (ym: string, offset: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const csvEscape = (v: string | number | boolean) => `"${String(v).replaceAll('"', '""')}"`;
const LS_EMP_MONTH_STATS = 'employee_month_stats';
const HOLIDAY_DATA_URL = 'https://data.ntpc.gov.tw/api/datasets/308dcd75-6434-45bc-a95f-584da4fed251/csv/file';
const NAGER_URL = 'https://date.nager.at/api/v3/PublicHolidays/';
const HOLIDAY_CACHE_VERSION = 'v1';
const DISABLE_HOLIDAY_FETCH = true;
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '元旦',
  '02-28': '和平紀念日',
  '04-04': '兒童節',
  '05-01': '勞動節',
  '10-10': '國慶日',
  '12-25': '聖誕節'
};
export const TW_HOLIDAYS: Record<string, string> = {
  // ===== 2021 =====
  '2021-02-11': '除夕',
  '2021-02-12': '春節',
  '2021-02-13': '初二',
  '2021-02-14': '初三',
  '2021-02-15': '初四',
  '2021-02-16': '初五',
  '2021-02-26': '元宵節',
  '2021-04-04': '清明節',
  '2021-06-14': '端午節',
  '2021-08-14': '七夕',
  '2021-09-21': '中秋節',
  '2021-10-14': '重陽節',

  // ===== 2022 =====
  '2022-01-31': '除夕',
  '2022-02-01': '春節',
  '2022-02-02': '初二',
  '2022-02-03': '初三',
  '2022-02-04': '初四',
  '2022-02-05': '初五',
  '2022-02-15': '元宵節',
  '2022-04-05': '清明節',
  '2022-06-03': '端午節',
  '2022-08-04': '七夕',
  '2022-09-10': '中秋節',
  '2022-10-04': '重陽節',

  // ===== 2023 =====
  '2023-01-21': '除夕',
  '2023-01-22': '春節',
  '2023-01-23': '初二',
  '2023-01-24': '初三',
  '2023-01-25': '初四',
  '2023-01-26': '初五',
  '2023-02-05': '元宵節',
  '2023-04-05': '清明節',
  '2023-06-22': '端午節',
  '2023-08-22': '七夕',
  '2023-09-29': '中秋節',
  '2023-10-23': '重陽節',

  // ===== 2024 =====
  '2024-02-09': '除夕',
  '2024-02-10': '春節',
  '2024-02-11': '初二',
  '2024-02-12': '初三',
  '2024-02-13': '初四',
  '2024-02-14': '初五',
  '2024-02-24': '元宵節',
  '2024-04-04': '清明節',
  '2024-06-10': '端午節',
  '2024-08-10': '七夕',
  '2024-09-17': '中秋節',
  '2024-10-11': '重陽節',

  // ===== 2025 =====
  '2025-01-28': '除夕',
  '2025-01-29': '春節',
  '2025-01-30': '初二',
  '2025-01-31': '初三',
  '2025-02-01': '初四',
  '2025-02-02': '初五',
  '2025-02-12': '元宵節',
  '2025-04-04': '清明節',
  '2025-05-30': '端午節',
  '2025-08-29': '七夕',
  '2025-10-06': '中秋節',
  '2025-10-29': '重陽節',

  // ===== 2026 =====
  '2026-02-16': '除夕',
  '2026-02-17': '春節',
  '2026-02-18': '初二',
  '2026-02-19': '初三',
  '2026-02-20': '初四',
  '2026-02-21': '初五',
  '2026-03-05': '元宵節',
  '2026-04-05': '清明節',
  '2026-06-19': '端午節',
  '2026-08-19': '七夕',
  '2026-09-25': '中秋節',
  '2026-10-18': '重陽節',

  // ===== 2027 =====
  '2027-02-05': '除夕',
  '2027-02-06': '春節',
  '2027-02-07': '初二',
  '2027-02-08': '初三',
  '2027-02-09': '初四',
  '2027-02-10': '初五',
  '2027-02-20': '元宵節',
  '2027-04-05': '清明節',
  '2027-06-09': '端午節',
  '2027-08-08': '七夕',
  '2027-09-15': '中秋節',
  '2027-10-07': '重陽節',

  // ===== 2028 =====
  '2028-01-25': '除夕',
  '2028-01-26': '春節',
  '2028-01-27': '初二',
  '2028-01-28': '初三',
  '2028-01-29': '初四',
  '2028-01-30': '初五',
  '2028-02-09': '元宵節',
  '2028-04-04': '清明節',
  '2028-05-28': '端午節',
  '2028-08-26': '七夕',
  '2028-10-03': '中秋節',
  '2028-10-25': '重陽節',

  // ===== 2029 =====
  '2029-02-12': '除夕',
  '2029-02-13': '春節',
  '2029-02-14': '初二',
  '2029-02-15': '初三',
  '2029-02-16': '初四',
  '2029-02-17': '初五',
  '2029-02-28': '元宵節',
  '2029-04-04': '清明節',
  '2029-06-16': '端午節',
  '2029-08-16': '七夕',
  '2029-09-22': '中秋節',
  '2029-10-15': '重陽節',

  // ===== 2030 =====
  '2030-02-02': '除夕',
  '2030-02-03': '春節',
  '2030-02-04': '初二',
  '2030-02-05': '初三',
  '2030-02-06': '初四',
  '2030-02-07': '初五',
  '2030-02-17': '元宵節',
  '2030-04-05': '清明節',
  '2030-06-05': '端午節',
  '2030-08-05': '七夕',
  '2030-09-12': '中秋節',
  '2030-10-03': '重陽節',

  // ===== 2031 =====
  '2031-01-22': '除夕',
  '2031-01-23': '春節',
  '2031-01-24': '初二',
  '2031-01-25': '初三',
  '2031-01-26': '初四',
  '2031-01-27': '初五',
  '2031-02-06': '元宵節',
  '2031-04-05': '清明節',
  '2031-06-24': '端午節',
  '2031-08-23': '七夕',
  '2031-10-01': '中秋節',
  '2031-10-23': '重陽節',

  // ===== 2032 =====
  '2032-02-10': '除夕',
  '2032-02-11': '春節',
  '2032-02-12': '初二',
  '2032-02-13': '初三',
  '2032-02-14': '初四',
  '2032-02-15': '初五',
  '2032-02-24': '元宵節',
  '2032-04-04': '清明節',
  '2032-06-12': '端午節',
  '2032-08-11': '七夕',
  '2032-09-19': '中秋節',
  '2032-10-12': '重陽節',

  // ===== 2033 =====
  '2033-01-30': '除夕',
  '2033-01-31': '春節',
  '2033-02-01': '初二',
  '2033-02-02': '初三',
  '2033-02-03': '初四',
  '2033-02-04': '初五',
  '2033-02-14': '元宵節',
  '2033-04-04': '清明節',
  '2033-06-01': '端午節',
  '2033-07-31': '七夕',
  '2033-09-08': '中秋節',
  '2033-09-30': '重陽節',

  // ===== 2034 =====
  '2034-02-18': '除夕',
  '2034-02-19': '春節',
  '2034-02-20': '初二',
  '2034-02-21': '初三',
  '2034-02-22': '初四',
  '2034-02-23': '初五',
  '2034-03-05': '元宵節',
  '2034-04-05': '清明節',
  '2034-06-20': '端午節',
  '2034-08-19': '七夕',
  '2034-09-27': '中秋節',
  '2034-10-19': '重陽節',

  // ===== 2035 =====
  '2035-02-07': '除夕',
  '2035-02-08': '春節',
  '2035-02-09': '初二',
  '2035-02-10': '初三',
  '2035-02-11': '初四',
  '2035-02-12': '初五',
  '2035-02-21': '元宵節',
  '2035-04-05': '清明節',
  '2035-06-10': '端午節',
  '2035-08-09': '七夕',
  '2035-09-16': '中秋節',
  '2035-10-08': '重陽節',

  // ===== 2036 =====
  '2036-01-27': '除夕',
  '2036-01-28': '春節',
  '2036-01-29': '初二',
  '2036-01-30': '初三',
  '2036-01-31': '初四',
  '2036-02-01': '初五',
  '2036-02-15': '元宵節',
  '2036-04-04': '清明節',
  '2036-05-30': '端午節',
  '2036-07-29': '七夕',
  '2036-10-04': '中秋節',
  '2036-10-26': '重陽節'
};

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
};

const readYearHolidayCache = (year: number): Record<string, string> | null => {
  try {
    const raw = localStorage.getItem(`holidays:TW:${year}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== HOLIDAY_CACHE_VERSION || !parsed?.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeYearHolidayCache = (year: number, data: Record<string, string>) => {
  try {
    localStorage.setItem(`holidays:TW:${year}`, JSON.stringify({ v: HOLIDAY_CACHE_VERSION, data }));
  } catch {
    return;
  }
};


const getPrevMonthKey = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const prev = new Date(y, m - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
};

const readMonthStats = (month: string): Record<string, { total: number; holiday: number }> => {
  try {
    const raw = localStorage.getItem(LS_EMP_MONTH_STATS);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data?.[month] ?? {};
  } catch {
    return {};
  }
};

const writeMonthStats = (month: string, stats: Record<string, { total: number; holiday: number }>) => {
  try {
    const raw = localStorage.getItem(LS_EMP_MONTH_STATS);
    const data = raw ? JSON.parse(raw) : {};
    data[month] = stats;
    localStorage.setItem(LS_EMP_MONTH_STATS, JSON.stringify(data));
  } catch {
    localStorage.setItem(LS_EMP_MONTH_STATS, JSON.stringify({ [month]: stats }));
  }
};

function getISOWeekKey(dateStr: string): string {
  const d = toDate(dateStr);
  const day = (d.getDay() + 6) % 7;
  const thursday = new Date(d.getTime() + (3 - day) * dayMs);
  const weekYear = thursday.getFullYear();
  const jan4 = new Date(`${weekYear}-01-04T00:00:00`);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1Mon = new Date(jan4.getTime() - jan4Day * dayMs);
  const targetMon = new Date(d.getTime() - day * dayMs);
  const week = Math.floor((targetMon.getTime() - week1Mon.getTime()) / (7 * dayMs)) + 1;
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

function generateMonthDays(month: string, considerHolidayAsWork: boolean, weekdayRequired: number, weekendRequired: number): Day[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const out: Day[] = [];
  for (let t = first.getTime(); t <= last.getTime(); t += dayMs) {
    const date = fmt(new Date(t));
    const dow = new Date(t).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holidayDesc = HOLIDAYS[date];
    const isNationalHoliday = Boolean(holidayDesc);
    const required = isNationalHoliday && !considerHolidayAsWork ? 0 : isWeekend ? weekendRequired : weekdayRequired;
    out.push({ date, required, assigned: [], isWeekend, isNationalHoliday, holidayDesc });
  }
  return out;
}

function buildStats(days: Day[]) {
  const week = new Map<string, number>();
  const month = new Map<string, number>();
  const total = new Map<string, number>();
  const byEmployeeDates = new Map<string, string[]>();
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const eid of day.assigned) {
      const wk = `${eid}|${getISOWeekKey(day.date)}`;
      const mk = `${eid}|${monthKey(day.date)}`;
      week.set(wk, (week.get(wk) ?? 0) + 1);
      month.set(mk, (month.get(mk) ?? 0) + 1);
      total.set(eid, (total.get(eid) ?? 0) + 1);
      byEmployeeDates.set(eid, [...(byEmployeeDates.get(eid) ?? []), day.date]);
    }
  }
  return { week, month, total, byEmployeeDates };
}

function getWeekendAnchor(dateStr: string) {
  const d = toDate(dateStr);
  const day = d.getDay();
  const satOffset = day === 0 ? -1 : day === 6 ? 0 : 6 - day;
  return fmt(new Date(d.getTime() + satOffset * dayMs));
}

function validateSchedule(days: Day[], employees: Employee[], rules: CompanyRules, t: (k: keyof typeof I18N.zh) => string) {
  const issues: Issue[] = [];
  const issuesByDate: Record<string, Issue[]> = {};
  const add = (i: Issue) => {
    issues.push(i);
    if (i.date) issuesByDate[i.date] = [...(issuesByDate[i.date] ?? []), i];
  };
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  for (const d of sortedDays) {
    if (d.required == null) continue;
    if (d.assigned.length < d.required) add({ code: 'UNDERSTAFFED', severity: 'warn', date: d.date, message: `${t('underBy')} ${d.required - d.assigned.length}` });
    if (d.assigned.length > d.required) add({ code: 'OVERSTAFFED', severity: 'block', date: d.date, message: `${t('overBy')} ${d.assigned.length - d.required}` });
    for (const eid of d.assigned) {
      const e = empMap[eid];
      if (!e) add({ code: 'UNKNOWN_EMPLOYEE', severity: 'block', date: d.date, employeeId: eid, message: `${eid} not found` });
    }
  }

  const stats = buildStats(sortedDays);
  for (const e of employees) {
    if (rules.maxConsecutiveWorkDays != null) {
      const dates = [...(stats.byEmployeeDates.get(e.id) ?? [])].sort();
      let streak = 0;
      let prev = '';
      for (const d of dates) {
        streak = prev && toDate(d).getTime() - toDate(prev).getTime() === dayMs ? streak + 1 : 1;
        if (streak > rules.maxConsecutiveWorkDays) add({ code: 'MAX_CONSECUTIVE', severity: 'block', date: d, employeeId: e.id, message: t('consecutiveExceeded') });
        prev = d;
      }
    }
  }

  const weekendMap = new Map<string, { sat?: Day; sun?: Day }>();
  for (const d of sortedDays) {
    if (!d.isWeekend) continue;
    const key = getWeekendAnchor(d.date);
    const item = weekendMap.get(key) ?? {};
    if (toDate(d.date).getDay() === 6) item.sat = d;
    if (toDate(d.date).getDay() === 0) item.sun = d;
    weekendMap.set(key, item);
  }
  const weekendKeys = [...weekendMap.keys()].sort();
  const fullOff = (eid: string, w: { sat?: Day; sun?: Day }) => w.sat && w.sun ? !w.sat.assigned.includes(eid) && !w.sun.assigned.includes(eid) : null;

  for (const e of employees) {
    for (let i = 1; i < weekendKeys.length; i++) {
      const a = weekendMap.get(weekendKeys[i - 1])!;
      const b = weekendMap.get(weekendKeys[i])!;
      const offA = fullOff(e.id, a);
      const offB = fullOff(e.id, b);
      if (rules.enforceWeekendRestOneDay && b.sat && b.sun && b.sat.assigned.includes(e.id) && b.sun.assigned.includes(e.id)) add({ code: 'WEEKEND_REST_ONE', severity: 'warn', employeeId: e.id, date: b.sun.date, message: t('weekendRestWarn') });
    }
  }

  return { issues, issuesByDate };
}

function autoFillMonth(days: Day[], employees: Employee[], rules: CompanyRules, t: (k: keyof typeof I18N.zh) => string, month: string, holidayBalance: Map<string, number>): Day[] {
  const out = [...days].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, assigned: [...d.assigned] }));
  const isHolidayForStats = (d: Day) => Boolean(d.isWeekend) || (Boolean(d.isNationalHoliday) && !d.isWeekend);
  const monthDays = out.filter((d) => d.date.startsWith(month));
  const totalHolidayDemand = monthDays.reduce((sum, d) => (d.required == null || !isHolidayForStats(d) ? sum : sum + d.required), 0);
  const avgHolidayPerEmp = employees.length ? totalHolidayDemand / employees.length : 0;
  const targetHoliday = Math.round(avgHolidayPerEmp);
  const holidayCount = new Map<string, number>();
  const totalCount = new Map<string, number>();
  for (const e of employees) {
    holidayCount.set(e.id, 0);
    totalCount.set(e.id, 0);
  }

  const weekendBothWorked = (eid: string, date: string, current: Day[]) => {
    if (!rules.enforceWeekendRestOneDay) return false;
    const key = getWeekendAnchor(date);
    const sat = current.find((d) => d.date === key);
    const sun = current.find((d) => d.date === fmt(new Date(toDate(key).getTime() + dayMs)));
    const day = toDate(date).getDay();
    if (day === 6) return Boolean(sun?.assigned.includes(eid));
    if (day === 0) return Boolean(sat?.assigned.includes(eid));
    return false;
  };

  const canAssign = (eid: string, day: Day, current: Day[]) => {
    if (day.assigned.includes(eid) || day.required == null) return false;
    const e = employees.find((x) => x.id === eid);
    if (!e) return false;
    if (weekendBothWorked(eid, day.date, current)) return false;
    const simulated = current.map((d) => (d.date === day.date ? { ...d, assigned: [...d.assigned, eid] } : d));
    const v = validateSchedule(simulated, employees, rules, t);
    return !v.issues.some((i) => i.severity === 'block' && i.employeeId === eid);
  };

  for (const day of monthDays) {
    if (day.required == null) continue;
    while (day.assigned.length < day.required) {
      const candidates = employees.filter((e) => canAssign(e.id, day, out));
      let pool = candidates;
      if (!pool.length) {
        pool = employees.filter((e) => !day.assigned.includes(e.id));
      }
      if (!pool.length) {
        pool = employees;
      }
      if (!pool.length) break;
      pool.sort((a, b) => {
          if (isHolidayForStats(day)) {
            const aH = holidayCount.get(a.id) ?? 0;
            const bH = holidayCount.get(b.id) ?? 0;
            if (aH !== bH) return aH - bH;
            const aT = totalCount.get(a.id) ?? 0;
            const bT = totalCount.get(b.id) ?? 0;
            if (aT !== bT) return aT - bT;
            const aB = holidayBalance.get(a.id) ?? 0;
            const bB = holidayBalance.get(b.id) ?? 0;
            if (aB !== bB) return aB - bB;
            const aDev = Math.abs((aH + 1) - targetHoliday);
            const bDev = Math.abs((bH + 1) - targetHoliday);
            if (aDev !== bDev) return aDev - bDev;
          } else {
            const aT = totalCount.get(a.id) ?? 0;
            const bT = totalCount.get(b.id) ?? 0;
            if (aT !== bT) return aT - bT;
          }
          return a.id.localeCompare(b.id);
        });
      if (isHolidayForStats(day)) {
        const remainingHolidaySlots = day.required - day.assigned.length;
        const zeroHoliday = pool.filter((e) => (holidayCount.get(e.id) ?? 0) === 0);
        if (remainingHolidaySlots >= zeroHoliday.length && zeroHoliday.length > 0) {
          zeroHoliday.sort((a, b) => (totalCount.get(a.id) ?? 0) - (totalCount.get(b.id) ?? 0));
          pool = zeroHoliday;
        }
      }
      const picked = pool[0].id;
      day.assigned.push(picked);
      totalCount.set(picked, (totalCount.get(picked) ?? 0) + 1);
      if (isHolidayForStats(day)) {
        holidayCount.set(picked, (holidayCount.get(picked) ?? 0) + 1);
        holidayBalance.set(picked, (holidayBalance.get(picked) ?? 0) + 1);
      }
    }
  }
  if (totalHolidayDemand > 0 && employees.some((e) => (holidayCount.get(e.id) ?? 0) === 0)) {
    console.warn('holiday distribution infeasible for', month);
  }
  return out;
}

function autoFillRange(days: Day[], employees: Employee[], rules: CompanyRules, t: (k: keyof typeof I18N.zh) => string, startMonth: string, monthsCount: number, considerHolidayAsWork: boolean, weekdayRequired: number, weekendRequired: number) {
  const months = Array.from({ length: monthsCount }, (_, i) => addMonths(startMonth, i));
  const monthSet = new Set(months);
  let next = [...days];
  for (const m of months) {
    if (!next.some((d) => d.date.startsWith(m))) next = [...next, ...generateMonthDays(m, considerHolidayAsWork, weekdayRequired, weekendRequired)];
  }
  next = next.map((d) => (monthSet.has(monthKey(d.date)) ? { ...d, assigned: [] } : d));
  const holidayBalance = new Map<string, number>();
  for (const e of employees) holidayBalance.set(e.id, 0);
  for (const m of months) {
    next = autoFillMonth(next, employees, rules, t, m, holidayBalance);
    const stats: Record<string, { total: number; holiday: number }> = {};
    for (const e of employees) stats[e.id] = { total: 0, holiday: 0 };
    for (const d of next.filter((x) => x.date.startsWith(m))) {
      const isHoliday = Boolean(d.isWeekend) || (Boolean(d.isNationalHoliday) && !d.isWeekend);
      for (const eid of d.assigned) {
        stats[eid] = stats[eid] ?? { total: 0, holiday: 0 };
        stats[eid].total += 1;
        if (isHoliday) stats[eid].holiday += 1;
      }
    }
    writeMonthStats(m, stats);
  }
  return next;
}

export default function App() {
  const initialMonth = fmt(new Date()).slice(0, 7);
  const [lang, setLang] = useState<Lang>('zh');
  const t = (k: keyof typeof I18N.zh) => I18N[lang][k];
  const [month, setMonth] = useState(initialMonth);
  const [weekdayRequired, setWeekdayRequired] = useState(2);
  const [weekendRequired, setWeekendRequired] = useState(1);
  const [considerHolidayAsWork, setConsiderHolidayAsWork] = useState(true);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(1);
  const [rules, setRules] = useState<CompanyRules>({
    weekStartsOn: 'mon',
    maxConsecutiveWorkDays: 5,
    enforceWeekendRestOneDay: false
  });
  const [days, setDays] = useState<Day[]>(() => generateMonthDays(initialMonth, true, 2, 1));
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [holidayMap, setHolidayMap] = useState<Record<string, string>>(HOLIDAYS);

  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const validation = useMemo(() => validateSchedule(days, employees, rules, t), [days, rules, lang, employees]);

  useEffect(() => {
    if (DISABLE_HOLIDAY_FETCH) return;
    let active = true;
    fetch(HOLIDAY_DATA_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => {
        const rows = parseCsv(text);
        if (!rows.length) return;
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const idxDate = header.indexOf('date');
        const idxName = header.indexOf('name');
        const idxIsHoliday = header.indexOf('isholiday');
        if (idxDate === -1 || idxName === -1) return;
        const map: Record<string, string> = {};
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const date = r[idxDate];
          const name = r[idxName];
          const isHoliday = idxIsHoliday >= 0 ? r[idxIsHoliday] : '1';
          if (date && name && (isHoliday === '1' || isHoliday === 'true' || isHoliday === 'Y')) map[date] = name;
        }
        if (active && Object.keys(map).length) setHolidayMap(map);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setDays((prev) => prev.map((d) => {
      const name = TW_HOLIDAYS[d.date] || '';
      return d.holidayDesc === name && d.isNationalHoliday === Boolean(name)
        ? d
        : { ...d, holidayDesc: name, isNationalHoliday: Boolean(name) };
    }));
  }, [month]);

  useEffect(() => {
    if (DISABLE_HOLIDAY_FETCH) return;
    const year = Number(month.slice(0, 4));
    if (!Number.isFinite(year)) return;
    const cached = readYearHolidayCache(year);
    if (cached) {
      setHolidayMap((prev) => ({ ...prev, ...cached }));
      return;
    }
    let active = true;
    fetch(`${NAGER_URL}${year}/TW`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: Array<{ date: string; localName?: string; name?: string }>) => {
        const map: Record<string, string> = {};
        for (const item of list) {
          if (item?.date) map[item.date] = item.localName || item.name || '';
        }
        if (!Object.keys(map).length) return;
        if (active) {
          setHolidayMap((prev) => ({ ...prev, ...map }));
          writeYearHolidayCache(year, map);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [month]);

  const ensureMonth = (targetMonth: string) => {
    setDays((prev) => prev.some((d) => d.date.startsWith(targetMonth)) ? prev : [...prev, ...generateMonthDays(targetMonth, considerHolidayAsWork, weekdayRequired, weekendRequired)]);
  };

  const monthDays = useMemo(() => [...days].filter((d) => d.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date)), [days, month]);

  const totalRequired = monthDays.reduce((sum, d) => (d.required == null ? sum : sum + d.required), 0);
  const weeksInMonthEstimate = Math.ceil((monthDays.length + (monthDays[0] ? toDate(monthDays[0].date).getDay() : 0)) / 7);
  const maxWorkDaysPerWeek = Math.max(0, Math.min(7, 7 - restDaysPerWeek));
  const maxShiftsPerEmployeePerMonthEstimate = maxWorkDaysPerWeek * weeksInMonthEstimate;
  const minEmployeesEstimate = maxShiftsPerEmployeePerMonthEstimate > 0
    ? Math.ceil(totalRequired / maxShiftsPerEmployeePerMonthEstimate)
    : null;

  const monthEmployeeStats = useMemo(() => {
    const stats = new Map<string, { weekday: number; holiday: number }>();
    for (const e of employees) stats.set(e.id, { weekday: 0, holiday: 0 });
    for (const d of monthDays) {
      const isWeekdayHoliday = Boolean(d.isNationalHoliday) && !d.isWeekend;
      const isHolidayForStats = Boolean(d.isWeekend) || isWeekdayHoliday;
      for (const eid of d.assigned) {
        const s = stats.get(eid);
        if (!s) continue;
        if (isHolidayForStats) s.holiday += 1;
        else s.weekday += 1;
      }
    }
    return stats;
  }, [employees, monthDays]);

  const setDay = (date: string, fn: (d: Day) => Day) => setDays((prev) => prev.map((d) => (d.date === date ? fn(d) : d)));

  const applyGlobalRequired = (isWeekend: boolean, value: number) => {
    setDays((prev) => prev.map((d) => (!d.date.startsWith(month) || d.required == null || Boolean(d.isWeekend) !== isWeekend ? d : { ...d, required: value })));
  };

  const onDrop = (date: string, zone: 'assigned' | 'available', eid: string) => {
    setDay(date, (d) => {
      const assigned = d.assigned.filter((x) => x !== eid);
      return zone === 'assigned' ? { ...d, assigned: [...assigned, eid].sort() } : { ...d, assigned };
    });
  };

  const addEmployee = () => {
    const name = newEmployeeName.trim();
    if (!name) return;
    setEmployees((prev) => [...prev, { id: `e${Date.now()}`, name }]);
    setNewEmployeeName('');
  };
  const renameEmployee = (id: string, name: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, name } : e)));
  };
  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDays((prev) => prev.map((d) => ({ ...d, assigned: d.assigned.filter((x) => x !== id) })));
  };

  const exportCsv = () => {
    const rows = [
      [lang === 'zh' ? '日期' : 'Date', lang === 'zh' ? '是否國定假日' : 'National holiday', lang === 'zh' ? '是否週末' : 'Weekend', lang === 'zh' ? '假日名稱' : 'Holiday name', lang === 'zh' ? '所需人數' : 'Required', lang === 'zh' ? '已排人員' : 'Assigned'],
      ...[...days].sort((a, b) => a.date.localeCompare(b.date)).map((d) => [
        d.date,
        d.isNationalHoliday ? (lang === 'zh' ? '是' : 'Yes') : (lang === 'zh' ? '否' : 'No'),
        d.isWeekend ? (lang === 'zh' ? '是' : 'Yes') : (lang === 'zh' ? '否' : 'No'),
        d.holidayDesc ?? '',
        d.required ?? '',
        d.assigned.map((id) => employeesById[id]?.name ?? id).join(lang === 'zh' ? '、' : ', ')
      ])
    ];
    const content = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const issueLabel = (code: string) => {
    if (code === 'UNDERSTAFFED') return t('underBy');
    if (code === 'OVERSTAFFED') return t('overBy');
    if (code === 'MAX_CONSECUTIVE') return t('consecutiveExceeded');
    if (code === 'WEEKEND_REST_ONE') return t('weekendRestWarn');
    return lang === 'zh' ? '提醒' : code;
  };

  const firstWeekday = monthDays[0] ? toDate(monthDays[0].date).getDay() : 0;
  const baseCells: Array<Day | null> = [...Array(firstWeekday).fill(null), ...monthDays];
  const trailing = (7 - (baseCells.length % 7)) % 7;
  const cells: Array<Day | null> = [...baseCells, ...Array(trailing).fill(null)];

  return (
    <div className="page">
      <div className="card toolbar">
        <div className="toolbar-top">
          <h1>{t('title')}</h1>
          <button onClick={() => setLang((v) => (v === 'zh' ? 'en' : 'zh'))}>{t('lang')}</button>
        </div>
        <div className="row">
          <label>{t('month')} <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); ensureMonth(e.target.value); }} /></label>
          <label>{t('weekdayRequired')} <input type="number" min={0} value={weekdayRequired} onChange={(e) => { const v = Math.max(0, Number(e.target.value) || 0); setWeekdayRequired(v); applyGlobalRequired(false, v); }} /></label>
          <label>{t('weekendRequired')} <input type="number" min={0} value={weekendRequired} onChange={(e) => { const v = Math.max(0, Number(e.target.value) || 0); setWeekendRequired(v); applyGlobalRequired(true, v); }} /></label>
          <label>{t('maxConsecutive')} <input type="number" min={1} value={rules.maxConsecutiveWorkDays ?? ''} onChange={(e) => setRules((r) => ({ ...r, maxConsecutiveWorkDays: Number(e.target.value) || undefined }))} /></label>
          <button onClick={() => {
            const next = autoFillRange(days, employees, rules, t, month, 6, considerHolidayAsWork, weekdayRequired, weekendRequired);
            setDays(next);
          }}>{t('autoFill')}</button>
          <button onClick={exportCsv}>{t('exportCsv')}</button>
        </div>
        <div className="row toggles">
          <label><input type="checkbox" checked={considerHolidayAsWork} onChange={(e) => setConsiderHolidayAsWork(e.target.checked)} /> {t('holidayAsWork')}</label>
          <label><input type="checkbox" checked={rules.enforceWeekendRestOneDay} onChange={(e) => setRules((r) => ({ ...r, enforceWeekendRestOneDay: e.target.checked }))} /> {t('weekendRestOne')}</label>
        </div>
      </div>

      <div className="card panel">
        <div className="panel-header">
          <h2>{t('minEmployees')}</h2>
        </div>
        <div className="row">
          <label>{t('restDaysPerWeek')} <input type="number" min={0} max={6} value={restDaysPerWeek} onChange={(e) => setRestDaysPerWeek(Math.max(0, Math.min(6, Number(e.target.value) || 0)))} /> {t('restDaysUnit')}</label>
        </div>
        <div className="estimate">
          <div className="estimate-value">{minEmployeesEstimate == null ? t('restDaysHint') : minEmployeesEstimate}</div>
          <div className="estimate-note">{t('estimateNote')}</div>
        </div>
      </div>

      <div className="card panel">
        <div className="panel-header">
          <h2>{t('employees')}</h2>
        </div>
        <div className="row">
          <label>{t('employeeName')} <input type="text" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addEmployee(); }} /></label>
          <button onClick={addEmployee}>{t('addEmployee')}</button>
        </div>
        <div className="employee-list">
          {employees.map((e) => {
            const s = monthEmployeeStats.get(e.id) ?? { weekday: 0, holiday: 0 };
            return (
              <div key={e.id} className="employee-row">
                <input className="employee-name-input" value={e.name} onChange={(ev) => renameEmployee(e.id, ev.target.value)} />
                <span>{t('weekdayWorked')}: {s.weekday}</span>
                <span>{t('holidayWorked')}: {s.holiday}</span>
                <button className="employee-del" onClick={() => deleteEmployee(e.id)}>{lang === 'zh' ? '刪除' : 'Delete'}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card content">
        <div className="calendar-shell">
          <div className="calendar-scroll">
            <div className="week-header">
              {(lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {cells.map((d, idx) => {
                if (!d) return <div key={`blank-${idx}`} className="day-cell blank" />;
                const available = employees.filter((e) => !d.assigned.includes(e.id));
                const issues = validation.issuesByDate[d.date] ?? [];
                const over = d.required != null && d.assigned.length > d.required;
                const holidayName = d.holidayDesc || TW_HOLIDAYS[d.date] || '';
                return (
                  <div key={d.date} className={`day-cell ${over ? 'over' : ''}`}>
                    <div className="day-head">
                      <span className="day-date">{Number(d.date.slice(-2))}</span>
                      <div className="day-top-right">
                        {holidayName ? <span className="day-holiday">({holidayName})</span> : null}
                        {d.isWeekend && <span className="day-weekend">{t('weekend')}</span>}
                      </div>
                    </div>
                    <input
                      className="required-input"
                      type="text"
                      value={d.required == null ? '' : String(d.required)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d+$/.test(v)) setDay(d.date, (x) => ({ ...x, required: v === '' ? null : Number(v) }));
                      }}
                      onBlur={(e) => {
                        const v = e.target.value;
                        setDay(d.date, (x) => ({ ...x, required: v === '' ? null : Math.max(0, Number(v) || 0) }));
                      }}
                    />
                    <div className={`drop ${over ? 'redbox' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(d.date, 'assigned', e.dataTransfer.getData('text/plain'))}>
                      <div className="drop-title">{t('assigned')}</div>
                      {d.assigned.map((id) => <span key={id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', id)} className="chip">{employeesById[id]?.name ?? id}</span>)}
                    </div>
                    <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(d.date, 'available', e.dataTransfer.getData('text/plain'))}>
                      <div className="drop-title">{t('available')}</div>
                      {available.map((e) => <span key={e.id} draggable onDragStart={(ev) => ev.dataTransfer.setData('text/plain', e.id)} className="chip muted">{e.name}</span>)}
                    </div>
                    <div className="badges issues">
                      {issues.slice(0, 3).map((i, iIdx) => <span key={`${i.code}-${iIdx}`} className={`badge ${i.code === 'OVERSTAFFED' ? 'red' : ''}`}>{issueLabel(i.code)}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




