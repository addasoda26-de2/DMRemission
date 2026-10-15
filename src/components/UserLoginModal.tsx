import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { AppUser } from '../types';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  onRegisterUser?: (newUser: AppUser) => Promise<void>;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  registeredUsers,
  onLoginSuccess,
  onRegisterUser,
  currentUser,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'Nurse' | 'Staff' | 'VHV'>('Nurse');
  const [regPosition, setRegPosition] = useState('พยาบาลวิชาชีพ (รพ.สต.โซ่)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const query = usernameInput.trim().toLowerCase();
    const pwd = passwordInput.trim();

    if (!query) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้ (Username) หรืออีเมล');
      return;
    }
    if (!pwd) {
      setErrorMessage('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }

    // Match in registeredUsers (from Google Sheet 'User')
    const matched = registeredUsers.find((u) => {
      const matchUsername = u.username && u.username.toLowerCase() === query;
      const matchEmail = u.email && u.email.toLowerCase() === query;
      const matchFullName = u.fullName && u.fullName.toLowerCase() === query;
      return matchUsername || matchEmail || matchFullName;
    });

    if (!matched) {
      setErrorMessage(
        `ไม่พบบัญชีผู้ใช้ "${usernameInput}" ในระบบ กรุณาตรวจสอบชื่อผู้ใช้ที่ระบุในชีต User`
      );
      return;
    }

    // Verify Password
    // If password is set in sheet, must match; if blank in sheet, accept 123456 or default
    const registeredPwd = matched.password != null ? String(matched.password).trim() : '';
    if (registeredPwd && registeredPwd !== pwd) {
      setErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Check status
    if (
      matched.status === 'Inactive' ||
      matched.status === false ||
      String(matched.status).toLowerCase() === 'false'
    ) {
      setErrorMessage('บัญชีผู้ใช้นี้ถูกระงับการใช้งานในแผ่นงาน User');
      return;
    }

    setSuccessMessage(`ยินดีต้อนรับคุณ ${matched.fullName} เข้าสู่ระบบ (${matched.role})`);
    setTimeout(() => {
      onLoginSuccess(matched);
      onClose();
    }, 600);
  };

  const handleQuickLogin = (user: AppUser) => {
    setUsernameInput(user.username || user.email || user.fullName);
    setPasswordInput(user.password || '123456');
    setErrorMessage(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ใช้ (Username)');
      return;
    }
    if (!regPassword.trim()) {
      setErrorMessage('กรุณากำหนดรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser: AppUser = {
        userId: `USR-${Date.now().toString().slice(-4)}`,
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        password: regPassword.trim(),
        email: regEmail.trim().toLowerCase() || `${regUsername.trim()}@dm-so.local`,
        role: regRole,
        phone: regPhone.trim() || '042-491-000',
        position: regPosition.trim() || 'เจ้าหน้าที่สาธารณสุข',
        status: 'Active',
        registeredDate: new Date().toISOString().split('T')[0],
      };

      if (onRegisterUser) {
        await onRegisterUser(newUser);
      }
      setSuccessMessage(`ลงทะเบียน ${newUser.fullName} เรียบร้อยแล้ว`);
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage('ลงทะเบียนไม่สำเร็จ: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-800/70 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  ชีต User
                </span>
                <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  ไม่ต้องล็อกอิน Google
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1">
                {currentUser ? 'ข้อมูลผู้ใช้งานที่ล็อกอิน' : 'เข้าสู่ระบบ (Username & Password)'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* If already logged in */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-slate-800">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {currentUser.fullName}
                    </h3>
                    <p className="text-xs text-emerald-800 font-semibold">
                      ตำแหน่ง: {currentUser.position || currentUser.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/70 mt-2">
                  <div>
                    <span className="text-slate-500">ชื่อผู้ใช้:</span>{' '}
                    <strong className="text-slate-800 font-mono">
                      {currentUser.username || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สิทธิ์ระบบ:</span>{' '}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 font-black text-[11px]">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500">อีเมล:</span>{' '}
                    <span className="text-slate-700 font-mono text-[11px]">
                      {currentUser.email || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setSuccessMessage('ออกจากระบบเรียบร้อยแล้ว');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs active:scale-95 transition-all text-center"
                  >
                    ออกจากระบบ
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all text-center"
                >
                  ตกลง / ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'register'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ลงทะเบียนผู้ใช้ใหม่
                </button>
              </div>

              {/* Status Notice */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}

              {mode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อผู้ใช้ (Username) หรืออีเมล:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="เช่น admin หรือ addasoda226@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-hidden shadow-xs font-medium"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสผ่าน (Password):
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="กรอกรหัสผ่าน (เช่น 123456)"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-hidden shadow-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Login Chips for easy testing */}
                  {registeredUsers.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>แตะเพื่อเลือกเข้าสู่ระบบด่วนจากชีต User:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {registeredUsers.slice(0, 4).map((u) => (
                          <button
                            key={u.userId}
                            type="button"
                            onClick={() => handleQuickLogin(u)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1"
                          >
                            <span className="font-bold text-emerald-800">
                              {u.username || u.fullName.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({u.role})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ-นามสกุล:
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="เช่น พว.สมศรี รักษาดี"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อผู้ใช้ (Username):
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="เช่น somporn"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        รหัสผ่าน:
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="เช่น 123456"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        สิทธิ์ (Role):
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-emerald-600 focus:outline-hidden font-semibold"
                      >
                        <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                        <option value="Nurse">Nurse (พยาบาล)</option>
                        <option value="Staff">Staff (เจ้าหน้าที่)</option>
                        <option value="VHV">VHV (อสม.)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เบอร์โทรศัพท์:
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08x-xxx-xxxx"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ตำแหน่ง / สังกัด:
                    </label>
                    <input
                      type="text"
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      placeholder="เช่น พยาบาลวิชาชีพ รพ.สต.โซ่"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'กำลังบันทึกลงชีต User...' : 'บันทึกและเข้าใช้งาน'}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>ตรวจสอบจากชีต User</span>
          <span>ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ</span>
        </div>
      </div>
    </div>
  );
};
