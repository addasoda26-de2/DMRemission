import { SugarStatus, SugarStatusInfo } from '../types';

export const evaluateBloodSugar = (val: number | string): SugarStatusInfo => {
  const sugar = Number(val);
  if (isNaN(sugar) || sugar <= 0) {
    return {
      status: 'normal',
      label: 'ยังไม่ได้ระบุ',
      shortLabel: '-',
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      advice: 'กรุณาระบุค่าน้ำตาลที่วัดได้',
      iconName: 'HelpCircle',
    };
  }

  if (sugar < 70) {
    return {
      status: 'hypo',
      label: 'น้ำตาลต่ำผิดปกติ (Hypoglycemia)',
      shortLabel: 'ต่ำเกินไป ⚠️',
      colorClass: 'text-purple-700',
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-300',
      badgeBg: 'bg-purple-100 text-purple-900 border border-purple-300',
      badgeText: 'text-purple-800',
      advice: 'ระวังอาการวูบ ใจสั่น เหงื่อแตก รีบให้ดื่มน้ำหวานหรืออมลูกอมทันที และติดตามอาการใกล้ชิด',
      iconName: 'AlertTriangle',
    };
  }

  if (sugar <= 99) {
    return {
      status: 'normal',
      label: 'ปกติ ดีเยี่ยม (DM Remission)',
      shortLabel: 'ระดับปกติ ดีเยี่ยม 🌟',
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-300',
      badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      badgeText: 'text-emerald-800',
      advice: 'ระดับน้ำตาลอยู่ในเกณฑ์คนปกติ ดีเยี่ยม คุมอาหารและออกกำลังกายต่อเนื่องได้ดีมาก',
      iconName: 'CheckCircle2',
    };
  }

  if (sugar <= 125) {
    return {
      status: 'controlled',
      label: 'อยู่ในเกณฑ์ควบคุมได้ (เกณฑ์ Remission)',
      shortLabel: 'เกณฑ์ควบคุมได้ดี 👍',
      colorClass: 'text-teal-700',
      bgClass: 'bg-teal-50',
      borderClass: 'border-teal-300',
      badgeBg: 'bg-teal-100 text-teal-900 border border-teal-300',
      badgeText: 'text-teal-800',
      advice: 'อยู่ในเกณฑ์ควบคุมได้ดี แนะนำลดของหวาน มัน เค็ม และออกกำลังกายสม่ำเสมอ',
      iconName: 'Check',
    };
  }

  if (sugar <= 154) {
    return {
      status: 'warning',
      label: 'เริ่มสูงเล็กน้อย (เฝ้าระวัง)',
      shortLabel: 'เริ่มสูง เฝ้าระวัง ⚠️',
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-300',
      badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      badgeText: 'text-amber-800',
      advice: 'ระดับน้ำตาลเริ่มสูงขึ้น ควรทบทวนการรับประทานอาหารกลุ่มแป้ง ผลไม้รสหวาน และดื่มน้ำเปล่าให้เพียงพอ',
      iconName: 'AlertCircle',
    };
  }

  if (sugar <= 199) {
    return {
      status: 'high',
      label: 'น้ำตาลสูง (เสี่ยงหลุดเกณฑ์ Remission)',
      shortLabel: 'น้ำตาลสูง ⚠️',
      colorClass: 'text-orange-700',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-300',
      badgeBg: 'bg-orange-100 text-orange-900 border border-orange-300',
      badgeText: 'text-orange-800',
      advice: 'น้ำตาลสูง ควรเน้นย้ำเรื่องการคุมอาหารอย่างเข้มงวด และแนะนำพบเจ้าหน้าที่ รพ.สต. เพื่อประเมินซ้ำ',
      iconName: 'AlertTriangle',
    };
  }

  return {
    status: 'crisis',
    label: 'น้ำตาลสูงมากผิดปกติ (อันตราย)',
    shortLabel: 'สูงอันตราย! 🚨',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-400',
    badgeBg: 'bg-rose-100 text-rose-900 border border-rose-400',
    badgeText: 'text-rose-800',
    advice: 'ระดับน้ำตาลสูงมากอันตราย! หากมีอาการคลื่นไส้ อาเจียน หายใจหอบ หรือซึม ให้รีบส่ง รพ.สต. หรือ รพ.โซ่พิสัย ทันที',
    iconName: 'Siren',
  };
};

export const calculateBmi = (weightKg: number | string, heightCm: number | string): { bmi: number | null; label: string } => {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || w <= 0 || h <= 0) {
    return { bmi: null, label: '-' };
  }
  const hM = h / 100;
  const bmiVal = Number((w / (hM * hM)).toFixed(1));
  let label = 'สมส่วน';
  if (bmiVal < 18.5) label = 'น้ำหนักน้อย';
  else if (bmiVal < 23) label = 'สมส่วนปกติ';
  else if (bmiVal < 25) label = 'น้ำหนักเกิน (ท้วม)';
  else if (bmiVal < 30) label = 'อ้วนระดับ 1';
  else label = 'อ้วนระดับ 2 (อันตราย)';

  return { bmi: bmiVal, label };
};
