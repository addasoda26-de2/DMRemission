import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Plus,
  X,
  Stethoscope,
  Mail,
  Phone,
  Hospital,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AppUser } from '../types';

interface NurseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  registeredUsers: AppUser[];
  onRegisterNurse: (newNurse: AppUser) => Promise<void>;
  onVerifySuccess: (nurse: AppUser) => void;
}

export const NurseAuthModal: React.FC<NurseAuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  registeredUsers,
  onRegisterNurse,
  onVerifySuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'verify' | 'register'>('verify');
  const [verifyEmail, setVerifyEmail] = useState(currentUserEmail || '');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(currentUserEmail || '');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('พยาบาลวิชาชีพชำนาญการ (รพ.สต.โซ่)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check matching nurse (by email, name, or phone)
  const handleVerify = () => {
    setErrorMessage(null);
    const target = verifyEmail.trim().toLowerCase();
    if (!target) {
      setErrorMessage('กรุณากรอกอีเมล หรือชื่อ-นามสกุลพยาบาลเพื่อตรวจสอบสิทธิ์');
      return;
    }

    const cleanDigits = target.replace(/\D/g, '');
    const matched = registeredUsers.find((u) => {
      const matchEmail = u.email && u.email.toLowerCase().includes(target);
      const matchName = u.fullName && u.fullName.toLowerCase().includes(target);
      const matchPhone =
        cleanDigits.length >= 4 &&
        u.phone &&
        u.phone.replace(/\D/g, '').includes(cleanDigits);

      const roleStr = (u.role || '').toLowerCase();
      const isNurseOrAdmin =
        roleStr === '' ||
        ['nurse', 'admin', 'staff', 'พยาบาล', 'เจ้าหน้าที่'].some((r) =>
          roleStr.includes(r)
        );

      return (
        (matchEmail || matchName || matchPhone) &&
        isNurseOrAdmin &&
        u.status !== 'Inactive'
      );
    });

    if (matched) {
      onVerifySuccess(matched);
      onClose();
    } else {
      setErrorMessage(
        `ไม่พบข้อมูล "${verifyEmail}" ในชีต User หรือสถานะไม่ได้รับอนุญาต กรุณาแตะเลือกจากรายชื่อด้านล่าง หรือลงทะเบียนพยาบาลใหม่`
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุลพยาบาล');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('กรุณาระบุอีเมล');
      return;
    }

    setIsSubmitting(true);
    try {
      const newNurse: AppUser = {
        userId: `USR-NURSE-${Date.now().toString().slice(-4)}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'Nurse',
        phone: phone.trim() || '042-491-000',
        position: position.trim() || 'พยาบาลวิชาชีพ (รพ.สต.โซ่)',
        status: 'Active',
        registeredDate: new Date().toISOString().split('T')[0],
      };

      await onRegisterNurse(newNurse);
      onVerifySuccess(newNurse);
      onClose();
    } catch (err: any) {
      setErrorMessage('ลงทะเบียนไม่สำเร็จ: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-indigo-100 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                สิทธิ์เฉพาะเจ้าหน้าที่พยาบาล
              </h3>
              <p className="text-xs text-slate-500">
                การเพิ่มคนไข้ใหม่ต้องได้รับการยืนยันตัวตนในชีต <strong>User</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 my-4 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'verify'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ตรวจสอบสิทธิ์พยาบาล
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ลงทะเบียนพยาบาลใหม่ (ลงชีต User)
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Verify Email */}
        {activeTab === 'verify' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-900">
              <p className="font-semibold mb-1">
                🔒 นโยบายความปลอดภัยของเวชระเบียน:
              </p>
              <p className="text-indigo-800 leading-relaxed">
                อสม. จะทำหน้าที่ตรวจวัดระดับน้ำตาลที่บ้านและบันทึกผล ส่วนการเพิ่มรายชื่อผู้ป่วยเบาหวานรายใหม่
                เป็นหน้าที่ของพยาบาลวิชาชีพ รพ.สต. หรือ รพ.โซ่พิสัย ที่ลงทะเบียนไว้ในชีต <strong>User</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลพยาบาลที่ลงทะเบียนไว้:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  placeholder="เช่น nurse@gmail.com หรือเมล Google"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ยืนยันสิทธิ์พยาบาลเพื่อเพิ่มคนไข้</span>
            </button>

            {/* List of Registered Nurses */}
            <div className="pt-2 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-500 mb-2">
                พยาบาลที่ลงทะเบียนในชีต User ขณะนี้ ({registeredUsers.length} ท่าน):
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {registeredUsers.map((u) => (
                  <div
                    key={u.userId}
                    onClick={() => {
                      setVerifyEmail(u.email);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <strong className="text-slate-800">{u.fullName}</strong>
                      <p className="text-slate-500 text-[11px]">{u.email} • {u.position}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      แตะเพื่อเลือก
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Register New Nurse to User Sheet */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ - นามสกุล พยาบาล *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น พว.สุดารัตน์ ใจเมตตา"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (Gmail / ทางการ) *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nurse@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ตำแหน่ง / สถานพยาบาล
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="พยาบาลวิชาชีพชำนาญการ (รพ.สต.โซ่)">พยาบาลวิชาชีพชำนาญการ (รพ.สต.โซ่)</option>
                <option value="พยาบาลวิชาชีพปฏิบัติการ (รพ.สต.โซ่)">พยาบาลวิชาชีพปฏิบัติการ (รพ.สต.โซ่)</option>
                <option value="พยาบาลวิชาชีพ (รพ.โซ่พิสัย)">พยาบาลวิชาชีพ (รพ.โซ่พิสัย)</option>
                <option value="เจ้าหน้าที่สาธารณสุขประจำ รพ.สต.">เจ้าหน้าที่สาธารณสุขประจำ รพ.สต.</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
              <span>ข้อมูลจะถูกบันทึกเข้าแผ่นงานชีต <strong>User</strong> ใน Google Sheet อัตโนมัติ</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกลงชีต User...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>บันทึกและเปิดสิทธิ์พยาบาล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
