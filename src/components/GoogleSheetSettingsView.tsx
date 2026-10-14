import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  FolderOpen,
  LogOut,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/auth';
import {
  createNewDMSpreadsheet,
  listUserSpreadsheets,
  ensureSheetsExist,
  DriveSpreadsheetItem,
} from '../services/sheetsService';

interface GoogleSheetSettingsViewProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
  spreadsheetId: string | null;
  spreadsheetTitle: string;
  onSetSpreadsheet: (id: string, title: string) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  onSeedInitialDataToSheet?: () => Promise<void>;
  patientCount: number;
  logCount: number;
}

export const GoogleSheetSettingsView: React.FC<GoogleSheetSettingsViewProps> = ({
  user,
  onUserChange,
  spreadsheetId,
  spreadsheetTitle,
  onSetSpreadsheet,
  onSyncNow,
  isSyncing,
  onSeedInitialDataToSheet,
  patientCount,
  logCount,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load drive spreadsheets when user is signed in
  useEffect(() => {
    if (user) {
      loadDriveFiles();
    }
  }, [user]);

  const loadDriveFiles = async () => {
    setIsLoadingDrive(true);
    try {
      const files = await listUserSpreadsheets();
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Could not list drive spreadsheets:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
        setStatusMessage({
          text: `เข้าสู่ระบบสำเร็จในชื่อ ${result.user.displayName || result.user.email}`,
          type: 'success',
        });
        loadDriveFiles();
      }
    } catch (err: any) {
      setStatusMessage({
        text: 'การเข้าสู่ระบบไม่สำเร็จ: ' + (err.message || err),
        type: 'error',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChange(null);
    setDriveFiles([]);
    setStatusMessage({
      text: 'ออกจากระบบ Google เรียบร้อยแล้ว (แอปจะใช้โหมดออฟไลน์)',
      type: 'info',
    });
  };

  const handleCreateNewSheet = async () => {
    setStatusMessage(null);
    try {
      setStatusMessage({
        text: 'กำลังสร้าง Google Sheet ใหม่ใน Google Drive ของคุณ...',
        type: 'info',
      });
      const title = 'ข้อมูลผู้ป่วยเบาหวาน DM Remission - ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ';
      const created = await createNewDMSpreadsheet(title);

      onSetSpreadsheet(created.id, title);
      setStatusMessage({
        text: 'สร้าง Google Sheet เรียบร้อยแล้ว! พร้อมใช้งาน 2 ชีต (patient และ BloodSugarLogs)',
        type: 'success',
      });
      loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({
        text: 'สร้าง Google Sheet ไม่สำเร็จ: ' + (err.message || err),
        type: 'error',
      });
    }
  };

  const handleSelectDriveFile = async (file: DriveSpreadsheetItem) => {
    try {
      setStatusMessage({ text: `กำลังตรวจสอบชีต "${file.name}"...`, type: 'info' });
      await ensureSheetsExist(file.id);
      onSetSpreadsheet(file.id, file.name);
      setStatusMessage({
        text: `เชื่อมต่อกับ Google Sheet "${file.name}" เรียบร้อยแล้ว`,
        type: 'success',
      });
      await onSyncNow();
    } catch (err: any) {
      setStatusMessage({
        text: 'เชื่อมต่อชีตไม่สำเร็จ: ' + (err.message || err),
        type: 'error',
      });
    }
  };

  const handleConnectCustomId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetInput.trim()) return;

    let id = customSheetInput.trim();
    // If user pasted a full URL
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      id = match[1];
    }

    try {
      setStatusMessage({ text: 'กำลังเชื่อมต่อ Google Sheet...', type: 'info' });
      await ensureSheetsExist(id);
      onSetSpreadsheet(id, 'Google Sheet ที่ระบุ');
      setStatusMessage({
        text: 'เชื่อมต่อ Google Sheet เรียบร้อยแล้ว',
        type: 'success',
      });
      setCustomSheetInput('');
      await onSyncNow();
    } catch (err: any) {
      setStatusMessage({
        text: 'ไม่สามารถเชื่อมต่อได้: ตรวจสอบสิทธิ์และการแชร์ของ Sheet: ' + (err.message || err),
        type: 'error',
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-28 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          <span>เชื่อมต่อ Google Sheets</span>
        </h2>
        <p className="text-xs text-slate-500">
          จัดเก็บข้อมูลผู้ป่วยและผลการตรวจลงใน Google Sheet ของคุณโดยตรง
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>1. บัญชี Google ผู้ใช้งาน</span>
        </h3>

        {!user ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500 mb-4">
              เข้าสู่ระบบด้วยบัญชี Google เพื่ออนุญาตให้แอปอ่านและบันทึกข้อมูลลง Google Sheet ของคุณ
            </p>
            {/* Official Material Google Sign-In Button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button w-full sm:w-auto"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-medium">
                  {isSigningIn ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-emerald-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {user.displayName || 'ผู้ใช้งาน Google'}
                </h4>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออก</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Spreadsheet Details */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <span>2. Google Sheet ที่ใช้งานอยู่</span>
          </h3>

          {spreadsheetId && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}</span>
            </button>
          )}
        </div>

        {spreadsheetId ? (
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-3">
            <div>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                เชื่อมต่อสำเร็จ
              </span>
              <h4 className="font-bold text-slate-800 text-base mt-1">
                {spreadsheetTitle}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                ID: {spreadsheetId}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
              <span className="text-slate-600">
                ข้อมูลในระบบ: {patientCount} คนไข้ • {logCount} ประวัติตรวจ
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>เปิดดูใน Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {onSeedInitialDataToSheet && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSeedInitialDataToSheet}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-colors"
                >
                  🚀 นำเข้าข้อมูลตัวอย่างตำบลโซ่ ({patientCount} คนไข้) ขึ้น Google Sheet
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500">
              ยังไม่ได้เชื่อมต่อ Google Sheet (ขณะนี้บันทึกข้อมูลแบบออฟไลน์ในเครื่อง)
            </p>
          </div>
        )}
      </div>

      {/* Connect / Create Options (Only when signed in) */}
      {user && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <span>3. จัดการหรือเลือก Google Sheet</span>
          </h3>

          {/* Option A: Create New Sheet with 1 Click */}
          <button
            type="button"
            onClick={handleCreateNewSheet}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>สร้าง Google Sheet ใหม่ทันที (สร้าง 2 ชีตพร้อมคอลัมน์อัตโนมัติ)</span>
          </button>

          {/* Option B: Pick from Drive */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                หรือเลือกจาก Google Sheet ที่มีอยู่ใน Drive:
              </label>
              <button
                type="button"
                onClick={loadDriveFiles}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>รีเฟรช</span>
              </button>
            </div>

            {isLoadingDrive ? (
              <p className="text-xs text-slate-400 py-3 text-center">กำลังค้นหา Google Sheets ใน Drive...</p>
            ) : driveFiles.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center bg-slate-50 rounded-xl">
                ไม่พบ Google Sheet ใน Drive (สามารถกดปุ่ม "สร้าง Google Sheet ใหม่" ด้านบนได้)
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 flex items-center justify-between text-xs transition-all"
                  >
                    <div className="truncate mr-2">
                      <p className="font-bold text-slate-800 truncate">{file.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{file.id.slice(0, 16)}...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectDriveFile(file)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0"
                    >
                      เลือกชีตนี้
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Option C: Paste Custom ID */}
          <form onSubmit={handleConnectCustomId} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หรือวาง Spreadsheet ID / URL เอง:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSheetInput}
                onChange={(e) => setCustomSheetInput(e.target.value)}
                placeholder="วาง URL หรือ ID เช่น 1BxiMVs0XRA5nFMd..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                เชื่อมต่อ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information Box on Required Headers */}
      <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <span>📋 โครงสร้างแผ่นงาน (ชีต) ใน Google Sheet</span>
        </h4>
        <p className="text-[11px] leading-relaxed">
          <strong>1. ชีต 'patient':</strong> เก็บข้อมูลผู้ป่วย 13 คอลัมน์ (PatientID, Prefix, FirstName, LastName, Age, Address, VillageNo, Subdistrict, District, Province, DOB, IDCard, Phone)
        </p>
        <p className="text-[11px] leading-relaxed">
          <strong>2. ชีต 'BloodSugarLogs' (หรือ 'BloodSugar'):</strong> เก็บประวัติการตรวจน้ำตาล 19 คอลัมน์ ได้แก่ LogID, IDCard, FullName, Date , Measure, BloodSugar, LevelHealth, Volunteer, Timestamp, Weight, Height, Waistline, Blood, Pressure, Symptoms, Village, Prefix, FirstName, LastName
        </p>
        <p className="text-[11px] leading-relaxed text-indigo-900 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
          <strong>3. ชีต 'User' (สิทธิ์พยาบาล):</strong> เก็บรายชื่อผู้ใช้งานและพยาบาลที่มีสิทธิ์เพิ่ม/แก้ไขรายชื่อคนไข้ (UserID, FullName, Email, Role, Phone, Position, Status, RegisteredDate)
        </p>
        <p className="text-[11px] leading-relaxed text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
          <strong>4. ชีต 'Village':</strong> ข้อมูล 18 หมู่บ้านของตำบลโซ่ อำเภอโซ่พิสัย จังหวัดบึงกาฬ (VillageNo, VillageName)
        </p>
      </div>
    </div>
  );
};
