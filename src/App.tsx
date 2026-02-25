import { useMemo, useState } from 'react';

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
    title: '排班',
    lang: '切換語言',
    month: '月份',
    weekdayRequired: '平日需要幾人',
    weekendRequired: '假日需要幾人',
    autoFill: '自動排班',
    exportCsv: '匯出表格',
    assigned: '已排',
    available: '可排',
    weekend: '週末',
    holiday: '國定假日',
    over: '超編',
    holidayAsWork: '國定假日視為工作日',
    weekendRestOne: '每人至少在周末休一天',
    underBy: '人力不足',
    overBy: '人力超編',
    weekendRestWarn: '週末兩天都有上班'
  },
  en: {
    title: 'Scheduling',
    lang: '中文 / English',
    month: 'Month',
    weekdayRequired: 'Weekday required',
    weekendRequired: 'Weekend required',
    autoFill: 'Auto Fill',
    exportCsv: 'Export CSV',
    assigned: 'Assigned',
    available: 'Available',
    weekend: 'Weekend',
    holiday: 'Holiday',
    over: 'Over',
    holidayAsWork: 'consider holidays as working days',
    weekendRestOne: 'Each person must rest one weekend day',
    underBy: 'Understaffed',
    overBy: 'Overstaffed',
    weekendRestWarn: 'Works both weekend days'
  }
} as const;

const I18N_EXT = {
  zh: {
    employees: '員工',
    employeeName: '員工姓名',
    addEmployee: '新增員工',
    deleteEmployee: '刪除',
    weekdayWorked: '本月平日上班天數',
    holidayWorked: '本月假日上班天數',
    minEmployees: '最低人數估算',
    restDaysPerWeek: '每週每人可休幾天',
    restDaysUnit: '天',
    estimateNote: '估算值（以本月需求計算）',
    restDaysHint: '請設定休息天數'
  },
  en: {
    employees: 'Employees',
    employeeName: 'Employee name',
    addEmployee: 'Add Employee',
    deleteEmployee: 'Delete',
    weekdayWorked: 'Weekday worked days',
    holidayWorked: 'Holiday worked days',
    minEmployees: 'Minimum employees estimate',
    restDaysPerWeek: 'Rest days per week',
    restDaysUnit: 'days',
    estimateNote: 'Estimate (based on this month)',
    restDaysHint: 'Please set rest days'
  }
} as const;

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
const csvEscape = (v: string | number | boolean) => `"${String(v).split('"').join('""')}"`;
const addMonths = (ym: string, offset: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

function generateMonthDays(month: string, weekdayRequired: number | null, weekendRequired: number | null, holidayAsWeekday: boolean): Day[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const out: Day[] = [];
  for (let t = first.getTime(); t <= last.getTime(); t += dayMs) {
    const date = fmt(new Date(t));
    const dow = new Date(t).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holidayDesc = date.endsWith('-02-28') ? '和平紀念日' : (TW_HOLIDAYS[date] || '');
    const isNationalHoliday = Boolean(holidayDesc);
    const isHolidayWeekday = isNationalHoliday && !isWeekend;
    const required = isHolidayWeekday ? (holidayAsWeekday ? weekdayRequired : weekendRequired) : (isWeekend ? weekendRequired : weekdayRequired);
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

function autoFillRange(days: Day[], employees: Employee[], rules: CompanyRules, t: (k: keyof typeof I18N.zh) => string, startMonth: string, monthsCount: number, weekdayRequired: number | null, weekendRequired: number | null, holidayAsWeekday: boolean): Day[] {
  const months = Array.from({ length: monthsCount }, (_, i) => addMonths(startMonth, i));
  const monthSet = new Set(months);
  let out = [...days];
  for (const m of months) {
    if (!out.some((d) => d.date.startsWith(m))) out = [...out, ...generateMonthDays(m, weekdayRequired, weekendRequired, holidayAsWeekday)];
  }
  out = out.map((d) => (monthSet.has(monthKey(d.date)) ? { ...d, assigned: [] } : d)).sort((a, b) => a.date.localeCompare(b.date));

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

  const totalCount = new Map<string, number>();
  const holidayBalance = new Map<string, number>();
  for (const e of employees) {
    totalCount.set(e.id, 0);
    holidayBalance.set(e.id, 0);
  }

  const isHolidayForStats = (d: Day) => Boolean(d.isWeekend) || Boolean(d.isNationalHoliday);

  for (const m of months) {
    const monthHolidayCount = new Map<string, number>();
    for (const e of employees) monthHolidayCount.set(e.id, 0);
    const monthDays = out.filter((d) => d.date.startsWith(m));
    for (const day of monthDays) {
      if (day.required == null) continue;
      while (day.assigned.length < day.required) {
        const candidates = employees.filter((e) => canAssign(e.id, day, out));
        if (!candidates.length) break;
        candidates.sort((a, b) => {
          if (isHolidayForStats(day)) {
            const ah = monthHolidayCount.get(a.id) ?? 0;
            const bh = monthHolidayCount.get(b.id) ?? 0;
            if (ah !== bh) return ah - bh;
            const aBal = holidayBalance.get(a.id) ?? 0;
            const bBal = holidayBalance.get(b.id) ?? 0;
            if (aBal !== bBal) return aBal - bBal;
          }
          const at = totalCount.get(a.id) ?? 0;
          const bt = totalCount.get(b.id) ?? 0;
          if (at !== bt) return at - bt;
          return a.id.localeCompare(b.id);
        });
        const picked = candidates[0].id;
        day.assigned.push(picked);
        totalCount.set(picked, (totalCount.get(picked) ?? 0) + 1);
        if (isHolidayForStats(day)) {
          monthHolidayCount.set(picked, (monthHolidayCount.get(picked) ?? 0) + 1);
          holidayBalance.set(picked, (holidayBalance.get(picked) ?? 0) + 1);
        }
      }
    }
  }
  return out;
}

export default function App() {
  const initialMonth = fmt(new Date()).slice(0, 7);
  const [lang, setLang] = useState<Lang>('zh');
  const t = (k: keyof typeof I18N.zh | keyof typeof I18N_EXT.zh) => (I18N[lang] as Record<string, string>)[k] ?? (I18N_EXT[lang] as Record<string, string>)[k] ?? String(k);
  const [month, setMonth] = useState(initialMonth);
  const [weekdayRequired, setWeekdayRequired] = useState<number | null>(null);
  const [weekendRequired, setWeekendRequired] = useState<number | null>(null);
  const [holidayAsWeekday, setHolidayAsWeekday] = useState(false);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(1);
  const [rules, setRules] = useState<CompanyRules>({
    weekStartsOn: 'mon',
    enforceWeekendRestOneDay: false
  });
  const [days, setDays] = useState<Day[]>(() => generateMonthDays(initialMonth, null, null, false));
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const validation = useMemo(() => validateSchedule(days, employees, rules, t as (k: keyof typeof I18N.zh) => string), [days, rules, lang, employees]);

  const ensureMonth = (targetMonth: string) => {
    setDays((prev) => prev.some((d) => d.date.startsWith(targetMonth)) ? prev : [...prev, ...generateMonthDays(targetMonth, weekdayRequired, weekendRequired, holidayAsWeekday)]);
  };

  const monthDays = useMemo(() => [...days].filter((d) => d.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date)), [days, month]);

  const setDay = (date: string, fn: (d: Day) => Day) => setDays((prev) => prev.map((d) => (d.date === date ? fn(d) : d)));

  const applyGlobalRequired = (isWeekend: boolean, value: number | null) => {
    setDays((prev) => prev.map((d) => (!d.date.startsWith(month) || Boolean(d.isWeekend) !== isWeekend ? d : { ...d, required: value })));
  };

  const applyHolidayWeekdayRequired = (useWeekday: boolean) => {
    setDays((prev) => prev.map((d) => {
      if (!d.date.startsWith(month) || !d.isNationalHoliday || d.isWeekend) return d;
      const nextRequired = useWeekday ? weekdayRequired : weekendRequired;
      return d.required === nextRequired ? d : { ...d, required: nextRequired };
    }));
  };

  const onDrop = (date: string, zone: 'assigned' | 'available', eid: string) => {
    setDay(date, (d) => {
      const assigned = d.assigned.filter((x) => x !== eid);
      return zone === 'assigned' ? { ...d, assigned: [...assigned, eid].sort() } : { ...d, assigned };
    });
  };

  const exportCsv = () => {
    const rows = [
      [lang === 'zh' ? '日期' : 'Date', lang === 'zh' ? '是否國定假日' : 'National holiday', lang === 'zh' ? '是否週末' : 'Weekend', lang === 'zh' ? '假日名稱' : 'Holiday name', lang === 'zh' ? '需求人數' : 'Required', lang === 'zh' ? '上班(依員工姓名)' : 'Assigned'],
      ...[...days].sort((a, b) => a.date.localeCompare(b.date)).map((d) => [
        d.date,
        d.isNationalHoliday ? (lang === 'zh' ? '是' : 'Yes') : (lang === 'zh' ? '否' : 'No'),
        d.isWeekend ? (lang === 'zh' ? '是' : 'Yes') : (lang === 'zh' ? '否' : 'No'),
        d.holidayDesc ?? '',
        d.required ?? '',
        d.assigned.map((id) => employeesById[id]?.name ?? id).join('、')
      ])
    ];
    const months = [...new Set(days.map((d) => monthKey(d.date)))].sort();
    rows.push([]);
    rows.push([lang === 'zh' ? '月份' : 'Month', lang === 'zh' ? '員工' : 'Employee', lang === 'zh' ? '平日上班天數' : 'Weekday', lang === 'zh' ? '假日上班天數' : 'Holiday', lang === 'zh' ? '總上班天數' : 'Total']);
    for (const m of months) {
      for (const e of employees) {
        let weekday = 0;
        let holiday = 0;
        for (const d of days) {
          if (!d.date.startsWith(m)) continue;
          if (!d.assigned.includes(e.id)) continue;
          const isHoliday = Boolean(d.isWeekend) || Boolean(d.isNationalHoliday);
          if (isHoliday) holiday += 1;
          else weekday += 1;
        }
        rows.push([m, e.name, String(weekday), String(holiday), String(weekday + holiday)]);
      }
    }
    const content = '\ufeff' + rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const firstWeekday = monthDays[0] ? toDate(monthDays[0].date).getDay() : 0;
  const baseCells: Array<Day | null> = [...Array(firstWeekday).fill(null), ...monthDays];
  const trailing = (7 - (baseCells.length % 7)) % 7;
  const cells: Array<Day | null> = [...baseCells, ...Array(trailing).fill(null)];

  const monthEmployeeStats = useMemo(() => {
    const stats = new Map<string, { weekday: number; holiday: number }>();
    for (const e of employees) stats.set(e.id, { weekday: 0, holiday: 0 });
    for (const d of monthDays) {
      const isHoliday = Boolean(d.isWeekend) || Boolean(d.isNationalHoliday);
      for (const eid of d.assigned) {
        const s = stats.get(eid);
        if (!s) continue;
        if (isHoliday) s.holiday += 1;
        else s.weekday += 1;
      }
    }
    return stats;
  }, [employees, monthDays]);

  const totalRequired = monthDays.reduce((sum, d) => sum + (d.required ?? 0), 0);
  const weeksInMonthEstimate = Math.ceil((monthDays.length + firstWeekday) / 7);
  const maxWorkDaysPerWeek = Math.max(0, Math.min(7, 7 - restDaysPerWeek));
  const maxShiftsPerEmployeePerMonthEstimate = maxWorkDaysPerWeek * weeksInMonthEstimate;
  const minEmployeesEstimate = maxShiftsPerEmployeePerMonthEstimate > 0
    ? Math.ceil(totalRequired / maxShiftsPerEmployeePerMonthEstimate)
    : null;

  const addEmployee = () => {
    const name = newEmployeeName.trim();
    if (!name) return;
    setEmployees((prev) => [...prev, { id: `e${Date.now()}`, name }]);
    setNewEmployeeName('');
  };

  const issueLabel = (code: string) => {
    if (code === 'UNDERSTAFFED') return t('underBy');
    if (code === 'OVERSTAFFED') return t('overBy');
    if (code === 'WEEKEND_REST_ONE') return t('weekendRestWarn');
    return lang === 'zh' ? '提醒' : code;
  };
  const renameEmployee = (id: string, name: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, name } : e)));
  };
  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDays((prev) => prev.map((d) => ({ ...d, assigned: d.assigned.filter((x) => x !== id) })));
  };

  return (
    <div className="page">
      <div className="card toolbar">
        <div className="toolbar-top">
          <h1>{t('title')}</h1>
          <button onClick={() => setLang((v) => (v === 'zh' ? 'en' : 'zh'))}>{t('lang')}</button>
        </div>
        <div className="row">
          <label>{t('month')} <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); ensureMonth(e.target.value); }} /></label>
          <label>{t('weekdayRequired')} <input type="text" value={weekdayRequired == null ? '' : String(weekdayRequired)} onChange={(e) => { const v = e.target.value; if (v === '') { setWeekdayRequired(null); applyGlobalRequired(false, null); if (holidayAsWeekday) applyHolidayWeekdayRequired(true); } else if (/^\d+$/.test(v)) { const n = Number(v); setWeekdayRequired(n); applyGlobalRequired(false, n); if (holidayAsWeekday) applyHolidayWeekdayRequired(true); } }} /></label>
          <label>{t('weekendRequired')} <input type="text" value={weekendRequired == null ? '' : String(weekendRequired)} onChange={(e) => { const v = e.target.value; if (v === '') { setWeekendRequired(null); applyGlobalRequired(true, null); if (!holidayAsWeekday) applyHolidayWeekdayRequired(false); } else if (/^\d+$/.test(v)) { const n = Number(v); setWeekendRequired(n); applyGlobalRequired(true, n); if (!holidayAsWeekday) applyHolidayWeekdayRequired(false); } }} /></label>
          <button onClick={() => {
            const snapshotWeekday = weekdayRequired;
            const snapshotWeekend = weekendRequired;
            const snapshotHolidayAsWeekday = holidayAsWeekday;
            const snapshotRules = { ...rules };
            setDays((d) => autoFillRange(d, employees, snapshotRules, t as (k: keyof typeof I18N.zh) => string, month, 6, snapshotWeekday, snapshotWeekend, snapshotHolidayAsWeekday));
          }}>{t('autoFill')}</button>
          <button onClick={exportCsv}>{t('exportCsv')}</button>
        </div>
        <div className="row toggles">
          <label><input type="checkbox" checked={rules.enforceWeekendRestOneDay} onChange={(e) => setRules((r) => ({ ...r, enforceWeekendRestOneDay: e.target.checked }))} /> {t('weekendRestOne')}</label>
          <label>
            <input type="checkbox" checked={holidayAsWeekday} onChange={(e) => { const v = e.target.checked; setHolidayAsWeekday(v); applyHolidayWeekdayRequired(v); }} /> {t('holidayAsWork')}
            <span>（與平日相同需求 但計算工作天數以假日計算）</span>
          </label>
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
                <button className="employee-del" onClick={() => deleteEmployee(e.id)}>{t('deleteEmployee')}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card content">
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
            const holidayName = d.holidayDesc || '';
            return (
              <div key={d.date} className={`day-cell ${over ? 'over' : ''}`}>
                <div className="day-head">
                  <span className="day-date">{Number(d.date.slice(-2))}</span>
                  <div className="day-top-right">
                    {holidayName ? <span className="day-holiday">{holidayName}</span> : null}
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
  );
}
