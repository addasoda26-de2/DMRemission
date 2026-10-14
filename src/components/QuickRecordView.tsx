import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Search,
  User,
  Heart,
  Scale,
  Ruler,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Share2,
  Calendar,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { Patient, BloodSugarLog } from '../types';
import { evaluateBloodSugar, calculateBmi } from '../utils/sugarEvaluation';
import { VILLAGES_LIST, getVillageLabel } from '../constants/villages';

interface QuickRecordViewProps {
  patients: Patient[];
  onSaveLog: (log: BloodSugarLog) => Promise<void>;
  onAddNewPatientClick: () => void;
  selectedPatientId?: string;
  onClearSelectedPatient?: () => void;
  villages?: import('../types').VillageInfo[];
}

const COMMON_SYMPTOMS = [
  'สบายดี ไม่มีอาการผิดปกติ',
  'ปัสสาวะบ่อย',
  'หิวน้ำบ่อย คอแห้ง',
  'อ่อนเพลีย เหนื่อยง่าย',
  'ชาปลายมือปลายเท้า',
  'ตาพร่ามัว',
  'วิงเวียนศีรษะ หน้ามืด',
  'แผลหายช้า',
];

export const QuickRecordView: React.FC<QuickRecordViewProps> = ({
  patients,
  onSaveLog,
  onAddNewPatientClick,
  selectedPatientId,
  onClearSelectedPatient,
  villages,
}) => {
  const activeVillages = villages && villages.length > 0 ? villages : VILLAGES_LIST;
  // State for active patient
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVillage, setFilterVillage] = useState<number | 'all'>('all');

  // Form states
  const [bloodSugar, setBloodSugar] = useState<number | string>(100);
  const [measureDate, setMeasureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [pulse, setPulse] = useState<string>('74');
  const [weight, setWeight] = useState<string>('65');
  const [height, setHeight] = useState<string>('162');
  const [waistline, setWaistline] = useState<string>('32');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'สบายดี ไม่มีอาการผิดปกติ',
  ]);
  const [healthVolunteer, setHealthVolunteer] = useState<string>(() => {
    return localStorage.getItem('dm_vhv_name') || 'สมใจ รักษาดี (อสม.)';
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedLog, setLastSavedLog] = useState<{
    log: BloodSugarLog;
    patient: Patient;
  } | null>(null);

  // Sync selected patient if provided via props
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find((item) => item.patientId === selectedPatientId);
      if (p) {
        setCurrentPatient(p);
      }
    }
  }, [selectedPatientId, patients]);

  // Persist VHV name
  useEffect(() => {
    if (healthVolunteer) {
      localStorage.setItem('dm_vhv_name', healthVolunteer);
    }
  }, [healthVolunteer]);

  const sugarEval = evaluateBloodSugar(bloodSugar);
  const bmiInfo = calculateBmi(weight, height);

  // Filter patients for selection (Name, IDCard digits, HN, Phone)
  const filteredPatients = patients.filter((p) => {
    const matchVillage =
      filterVillage === 'all' || p.villageNo === Number(filterVillage);

    if (!searchTerm.trim()) return matchVillage;

    const term = searchTerm.trim().toLowerCase();
    const cleanDigits = term.replace(/\D/g, '');

    const fullNameWithPrefix = `${p.prefix || ''}${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const fullNamePlain = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const fullNameNoSpace = `${p.firstName || ''}${p.lastName || ''}`.toLowerCase();

    const matchName =
      fullNameWithPrefix.includes(term) ||
      fullNamePlain.includes(term) ||
      fullNameNoSpace.includes(term) ||
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term);

    // Support matching full 13-digit ID card or partial digits (e.g. 4-6 digits)
    const pIdDigits = p.idCard ? p.idCard.replace(/\D/g, '') : '';
    const matchIdCard =
      (cleanDigits.length > 0 && pIdDigits.includes(cleanDigits)) ||
      (p.idCard && p.idCard.toLowerCase().includes(term));

    const matchPatientId = p.patientId.toLowerCase().includes(term);
    const matchPhone = p.phone ? p.phone.replace(/\D/g, '').includes(cleanDigits || term) : false;

    return matchVillage && (matchName || matchIdCard || matchPatientId || matchPhone);
  });

  const toggleSymptom = (sym: string) => {
    if (sym === 'สบายดี ไม่มีอาการผิดปกติ') {
      setSelectedSymptoms(['สบายดี ไม่มีอาการผิดปกติ']);
      return;
    }

    const withoutNormal = selectedSymptoms.filter(
      (s) => s !== 'สบายดี ไม่มีอาการผิดปกติ'
    );
    if (selectedSymptoms.includes(sym)) {
      const remaining = withoutNormal.filter((s) => s !== sym);
      setSelectedSymptoms(
        remaining.length === 0 ? ['สบายดี ไม่มีอาการผิดปกติ'] : remaining
      );
    } else {
      setSelectedSymptoms([...withoutNormal, sym]);
    }
  };

  const handleAdjustSugar = (delta: number) => {
    const current = Number(bloodSugar) || 100;
    const next = Math.max(30, Math.min(600, current + delta));
    setBloodSugar(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      alert('กรุณาเลือกผู้ป่วยก่อนบันทึกข้อมูล');
      return;
    }

    const sugarNum = Number(bloodSugar);
    if (isNaN(sugarNum) || sugarNum <= 0) {
      alert('กรุณากรอกระดับน้ำตาลให้ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const timestamp = `${measureDate} ${timeStr}`;
      const bp =
        systolic && diastolic ? `${systolic}/${diastolic}` : '';

      const logId = `LOG-${Date.now().toString().slice(-6)}`;
      const newLog: BloodSugarLog = {
        logId,
        idCard: currentPatient.idCard,
        fullName: `${currentPatient.prefix}${currentPatient.firstName} ${currentPatient.lastName}`,
        measureDate,
        measureType: 'DTX',
        bloodSugarLevel: sugarNum,
        levelHealth: sugarEval.label,
        healthVolunteer: healthVolunteer.trim() || 'อสม. ตำบลโซ่',
        timestamp,
        weight: weight ? Number(weight) : '',
        height: height ? Number(height) : '',
        waistline: waistline ? Number(waistline) : '',
        bloodPressure: bp,
        symptoms: selectedSymptoms.join(', '),
        village: `หมู่ ${currentPatient.villageNo} ${getVillageLabel(
          currentPatient.villageNo,
          activeVillages
        )}`,
        pulse: pulse ? Number(pulse) : '',
        prefix: currentPatient.prefix,
        firstName: currentPatient.firstName,
        lastName: currentPatient.lastName,
      };

      await onSaveLog(newLog);

      setLastSavedLog({
        log: newLog,
        patient: currentPatient,
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNextPatient = () => {
    setLastSavedLog(null);
    setCurrentPatient(null);
    if (onClearSelectedPatient) onClearSelectedPatient();
    setBloodSugar(100);
    setSelectedSymptoms(['สบายดี ไม่มีอาการผิดปกติ']);
  };

  // If a log was just saved, show the celebration / patient summary card
  if (lastSavedLog) {
    const evalResult = evaluateBloodSugar(lastSavedLog.log.bloodSugarLevel);

    return (
      <div className="max-w-xl mx-auto p-4 pb-24">
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-200 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold mb-1">
            บันทึกสำเร็จเรียบร้อย
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            บัตรสรุปผลการตรวจเยี่ยมบ้าน
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            แสดงผลให้ผู้ป่วยและญาติดูเพื่อสร้างกำลังใจในการคุมเบาหวาน
          </p>

          {/* Patient Header */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-left border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  {lastSavedLog.log.fullName}
                </h3>
                <p className="text-slate-600 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {lastSavedLog.log.village}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {lastSavedLog.log.measureDate}
                </p>
                <p>อสม. {lastSavedLog.log.healthVolunteer}</p>
              </div>
            </div>
          </div>

          {/* Giant Blood Sugar Status Result */}
          <div
            className={`rounded-3xl p-6 mb-5 border-2 ${evalResult.bgClass} ${evalResult.borderClass}`}
          >
            <p className="text-sm font-semibold text-slate-600 mb-1">
              ระดับน้ำตาลที่วัดได้ (DTX)
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className={`text-6xl font-black ${evalResult.colorClass}`}>
                {lastSavedLog.log.bloodSugarLevel}
              </span>
              <span className="text-lg font-bold text-slate-600">mg/dL</span>
            </div>
            <div className="mt-3">
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-base font-bold shadow-xs ${evalResult.badgeBg}`}
              >
                {evalResult.label}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700 bg-white/80 p-3 rounded-2xl border border-slate-200/60 leading-relaxed">
              💡 <strong>คำแนะนำ:</strong> {evalResult.advice}
            </p>
          </div>

          {/* Additional measurements grid */}
          <div className="grid grid-cols-3 gap-2 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">ความดันโลหิต</p>
              <p className="font-bold text-slate-800 text-base">
                {lastSavedLog.log.bloodPressure || '-'}
              </p>
              <p className="text-[10px] text-slate-400">mmHg</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">ชีพจร</p>
              <p className="font-bold text-slate-800 text-base">
                {lastSavedLog.log.pulse || '-'}
              </p>
              <p className="text-[10px] text-slate-400">ครั้ง/นาที</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">น้ำหนัก / เอว</p>
              <p className="font-bold text-slate-800 text-base">
                {lastSavedLog.log.weight || '-'} / {lastSavedLog.log.waistline || '-'}
              </p>
              <p className="text-[10px] text-slate-400">กก. / นิ้ว</p>
            </div>
          </div>

          {/* Next Action Button */}
          <button
            type="button"
            onClick={handleResetForNextPatient}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>ตรวจคนไข้คนถัดไป</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-28">
      {/* VHV Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>แบบบันทึกตรวจเยี่ยมบ้าน อสม. ต.โซ่</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            บันทึกระดับน้ำตาล (DM Remission)
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            ระบบตรวจคัดกรองและประเมินผลระดับน้ำตาลทันที ใช้งานง่าย เหมาะกับมือถือ
          </p>

          {/* Health Volunteer Name Quick Field */}
          <div className="mt-3 pt-3 border-t border-emerald-600/60 flex items-center justify-between text-xs">
            <span className="text-emerald-200">ชื่อ อสม. ผู้บันทึก:</span>
            <input
              type="text"
              value={healthVolunteer}
              onChange={(e) => setHealthVolunteer(e.target.value)}
              placeholder="ระบุชื่อ อสม."
              className="bg-emerald-900/60 text-white border border-emerald-500/50 rounded-xl px-2.5 py-1 text-xs focus:ring-2 focus:ring-emerald-300 outline-none max-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {!currentPatient ? (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                เลือกคนไข้ที่จะตรวจวัด
              </h3>
            </div>
            <button
              type="button"
              onClick={onAddNewPatientClick}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคนไข้ (พยาบาล)</span>
            </button>
          </div>

          {/* Village Filter Buttons */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              เลือกตามหมู่บ้าน (ต.โซ่ มี 18 หมู่บ้าน):
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterVillage('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  filterVillage === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({activeVillages.length} ม.)
              </button>
              {activeVillages.map((v) => (
                <button
                  key={v.villageNo}
                  type="button"
                  onClick={() => setFilterVillage(v.villageNo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    filterVillage === v.villageNo
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ม.{v.villageNo} {v.name.replace('บ้าน', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Notice: No Google login needed for VHV */}
          <div className="mb-3 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>สำหรับ อสม.:</strong> ค้นหาคนไข้และบันทึกผลน้ำตาลได้ทันที <strong>ไม่ต้องเข้าระบบ Google</strong>
              </span>
            </div>
            <span className="text-[11px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full shrink-0">
              พร้อมใช้
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, นามสกุล หรือ เลขบัตร ปชช. (13 หลัก)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base outline-none bg-white shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter results count */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span>
              {searchTerm ? `ผลการค้นหา "${searchTerm}"` : `รายชื่อคนไข้`}
            </span>
            <span className="font-bold text-slate-700">
              พบ {filteredPatients.length} คน
            </span>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-base font-medium">ไม่พบรายชื่อคนไข้ที่ค้นหา</p>
                <p className="text-xs text-slate-400 mt-1">
                  ตรวจสอบการสะกดชื่อ หรือเลขบัตรประชาชนอีกครั้ง
                </p>
                <button
                  type="button"
                  onClick={onAddNewPatientClick}
                  className="mt-3 text-sm font-bold text-indigo-700 underline"
                >
                  แตะเพื่อแจ้งพยาบาลเพิ่มคนไข้ใหม่
                </button>
              </div>
            ) : (
              filteredPatients.map((p) => (
                <div
                  key={p.patientId}
                  onClick={() => setCurrentPatient(p)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer active:scale-98 transition-all flex items-center justify-between gap-3 bg-white shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                      {p.prefix === 'นาย' ? '👨' : '👩'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">
                          {p.prefix}
                          {p.firstName} {p.lastName}
                        </h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                          อายุ {p.age} ปี
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                          🪪 ปชช: {p.idCard}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {getVillageLabel(p.villageNo, activeVillages)}
                          {p.address ? ` (บ้านเลขที่ ${p.address})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    เลือก
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Selected Patient Active Card */
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 mb-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-2xl">
                {currentPatient.prefix === 'นาย' ? '👨' : '👩'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                  กำลังตรวจวัดคนไข้
                </span>
                <h3 className="font-bold text-slate-900 text-lg leading-tight mt-0.5">
                  {currentPatient.prefix}
                  {currentPatient.firstName} {currentPatient.lastName}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  อายุ {currentPatient.age} ปี • {getVillageLabel(currentPatient.villageNo)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentPatient(null);
                if (onClearSelectedPatient) onClearSelectedPatient();
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-white active:scale-95 transition-all"
            >
              เปลี่ยนคนไข้
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Form */}
      {currentPatient && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          {/* Giant Blood Sugar Dial / Keypad Input */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  <Droplets className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  ระดับน้ำตาลในเลือด (DTX)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">หน่วย: mg/dL</span>
            </div>

            {/* Giant display */}
            <div
              className={`rounded-3xl p-5 border-2 text-center transition-all ${sugarEval.bgClass} ${sugarEval.borderClass}`}
            >
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAdjustSugar(-5)}
                  className="w-12 h-12 rounded-2xl bg-white/90 shadow-md text-slate-700 font-extrabold text-xl hover:bg-white active:scale-90 transition-all flex items-center justify-center border border-slate-200"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSugar(-1)}
                  className="w-10 h-10 rounded-xl bg-white/90 shadow-sm text-slate-700 font-extrabold text-base hover:bg-white active:scale-90 transition-all flex items-center justify-center border border-slate-200"
                >
                  -1
                </button>

                {/* Big input field */}
                <input
                  type="number"
                  inputMode="numeric"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className={`w-36 text-center text-5xl font-black bg-transparent outline-none tracking-tight ${sugarEval.colorClass}`}
                />

                <button
                  type="button"
                  onClick={() => handleAdjustSugar(1)}
                  className="w-10 h-10 rounded-xl bg-white/90 shadow-sm text-slate-700 font-extrabold text-base hover:bg-white active:scale-90 transition-all flex items-center justify-center border border-slate-200"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustSugar(5)}
                  className="w-12 h-12 rounded-2xl bg-white/90 shadow-md text-slate-700 font-extrabold text-xl hover:bg-white active:scale-90 transition-all flex items-center justify-center border border-slate-200"
                >
                  +5
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-3 flex items-center justify-center">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-xs ${sugarEval.badgeBg}`}
                >
                  {sugarEval.shortLabel}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                {[80, 95, 110, 125, 140, 160, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBloodSugar(val)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                      Number(bloodSugar) === val
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Advice */}
              <p className="mt-3 text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/50">
                {sugarEval.advice}
              </p>
            </div>
          </div>

          {/* Step 3: Vital Signs (Blood Pressure, Pulse, BMI) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                <Heart className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                สัญญาณชีพและร่างกาย
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Blood Pressure */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ความดันโลหิต (ตัวบน/ตัวล่าง)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="120"
                    className="w-full text-center py-2 bg-white rounded-xl border border-slate-200 font-bold text-lg text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-full text-center py-2 bg-white rounded-xl border border-slate-200 font-bold text-lg text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                  mmHg
                </span>
              </div>

              {/* Pulse */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ชีพจร (หัวใจเต้น)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="74"
                  className="w-full text-center py-2 bg-white rounded-xl border border-slate-200 font-bold text-lg text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                  ครั้ง/นาที
                </span>
              </div>
            </div>

            {/* Weight, Height, Waistline */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  น้ำหนัก (กก.)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="65"
                  className="w-full text-center py-1.5 bg-white rounded-xl border border-slate-200 font-bold text-base text-slate-800 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  ส่วนสูง (ซม.)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="165"
                  className="w-full text-center py-1.5 bg-white rounded-xl border border-slate-200 font-bold text-base text-slate-800 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-center">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  รอบเอว (นิ้ว)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={waistline}
                  onChange={(e) => setWaistline(e.target.value)}
                  placeholder="32"
                  className="w-full text-center py-1.5 bg-white rounded-xl border border-slate-200 font-bold text-base text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Live BMI badge */}
            {bmiInfo.bmi && (
              <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                <span className="text-teal-800 font-semibold">
                  ดัชนีมวลกาย (BMI): <strong>{bmiInfo.bmi}</strong>
                </span>
                <span className="bg-teal-200 text-teal-900 px-2 py-0.5 rounded-md font-bold">
                  {bmiInfo.label}
                </span>
              </div>
            )}
          </div>

          {/* Step 4: Symptoms */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                <Activity className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                อาการสำคัญวันนี้
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all border ${
                      isSelected
                        ? sym === 'สบายดี ไม่มีอาการผิดปกติ'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date of Measurement */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm">วันที่ตรวจวัด:</span>
            </div>
            <input
              type="date"
              value={measureDate}
              onChange={(e) => setMeasureDate(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Giant Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold text-xl shadow-xl shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>กำลังบันทึกข้อมูล...</span>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>บันทึกผลการตรวจน้ำตาล</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
