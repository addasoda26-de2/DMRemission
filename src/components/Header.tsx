import React from 'react';
import {
  Activity,
  FileSpreadsheet,
  Share2,
  CheckCircle2,
  CloudOff,
  UserCheck,
  Stethoscope,
  Type,
  KeyRound,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'huge';
  setFontSize: (size: 'normal' | 'large' | 'huge') => void;
  userRole: 'vhv' | 'nurse';
  setUserRole: (role: 'vhv' | 'nurse') => void;
  isSheetConnected: boolean;
  sheetTitle?: string;
  onOpenSheetSettings: () => void;
  villageCount?: number;
  pendingLogsCount?: number;
  onOpenAppsScriptModal?: () => void;
  isAppsScriptConnected?: boolean;
  currentUser?: AppUser | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSize,
  setFontSize,
  userRole,
  setUserRole,
  isSheetConnected,
  sheetTitle,
  onOpenSheetSettings,
  villageCount,
  pendingLogsCount = 0,
  onOpenAppsScriptModal,
  isAppsScriptConnected = false,
  currentUser,
  onOpenLoginModal,
  onLogout,
}) => {
  const handleShareLine = () => {
    const url = window.location.href;
    const text = 'ระบบบันทึกค่าน้ำตาล DM Remission ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ สำหรับ อสม. และเจ้าหน้าที่';
    if (navigator.share) {
      navigator.share({ title: text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์เรียบร้อยแล้ว สามารถนำไปส่งในกลุ่ม LINE อสม. ได้ทันที');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  DM Remission โซ่พิสัย
                </h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {villageCount ? `${villageCount} หมู่บ้าน` : 'ตำบลโซ่'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ
              </p>
            </div>
          </div>

          {/* Quick Actions Header: Font Scale + Role + Share */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Font Size Toggle for Elderly & VHVs */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                title="ขนาดตัวอักษรปกติ"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fontSize === 'normal'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ก
              </button>
              <button
                type="button"
                title="ขนาดตัวอักษรใหญ่"
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-lg text-sm font-bold transition-all ${
                  fontSize === 'large'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ก+
              </button>
              <button
                type="button"
                title="ขนาดตัวอักษรใหญ่พิเศษ (อ่านง่ายสุดๆ)"
                onClick={() => setFontSize('huge')}
                className={`px-2 py-1 rounded-lg text-base font-extrabold transition-all ${
                  fontSize === 'huge'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ก++
              </button>
            </div>

            {/* User Login / Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  title={`ผู้ใช้งาน: ${currentUser.fullName} (${currentUser.role})`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 shadow-xs max-w-[140px] sm:max-w-[200px]"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">{currentUser.fullName.split(' ')[0]}</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-black shrink-0">
                    {currentUser.role}
                  </span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                <span className="sm:hidden">ล็อกอิน</span>
              </button>
            )}

            {/* Role Switcher (VHV / Nurse) */}
            <button
              onClick={() => setUserRole(userRole === 'vhv' ? 'nurse' : 'vhv')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                userRole === 'nurse'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
              }`}
            >
              {userRole === 'nurse' ? (
                <>
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>พยาบาล</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>อสม.</span>
                </>
              )}
            </button>

            {/* Share / LINE button */}
            <button
              onClick={handleShareLine}
              title="แชร์ลิงก์เข้า LINE"
              className="p-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Status Bar */}
        <div className="mt-2 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenSheetSettings}
              className="flex items-center gap-1.5 text-left text-slate-600 hover:text-emerald-700 transition-colors"
            >
              {isSheetConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[170px] sm:max-w-[260px]">
                    {sheetTitle || 'Google Sheet พร้อม'}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>โหมดออฟไลน์</span>
                </span>
              )}
            </button>

            {isAppsScriptConnected ? (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                ⚡ ส่งชีตอัตโนมัติ
              </span>
            ) : null}

            {pendingLogsCount > 0 && (
              <button
                type="button"
                onClick={onOpenAppsScriptModal}
                className="text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors animate-pulse"
              >
                ⚠️ รอส่งเข้าชีต {pendingLogsCount} รายการ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {onOpenAppsScriptModal && (
              <button
                type="button"
                onClick={onOpenAppsScriptModal}
                className="text-emerald-800 hover:text-emerald-950 font-bold text-[11px] px-2 py-0.5 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>ระบบส่ง อสม.</span>
              </button>
            )}
            <button
              onClick={onOpenSheetSettings}
              className="text-slate-600 font-semibold hover:text-emerald-700 text-xs flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ตั้งค่าชีต</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
