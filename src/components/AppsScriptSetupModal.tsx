import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  getAppsScriptUrl,
  setAppsScriptUrl,
  testAppsScriptConnection,
  DEFAULT_SPREADSHEET_ID,
} from '../services/sheetsService';
import { BloodSugarLog } from '../types';

interface AppsScriptSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  pendingLogsCount: number;
  onSyncPendingLogs: () => Promise<void>;
  isSyncing: boolean;
}

export const AppsScriptSetupModal: React.FC<AppsScriptSetupModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  pendingLogsCount,
  onSyncPendingLogs,
  isSyncing,
}) => {
  const currentSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
  const [scriptUrl, setScriptUrlInput] = useState(() => getAppsScriptUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSheetLink, setCopiedSheetLink] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | 'testing';
    message: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
      alert('กรุณาเลือกข้อความในกล่องโค้ดแล้วกดคัดลอกด้วยตนเอง');
    }
  };

  const handleSaveUrl = () => {
    const trimmed = scriptUrl.trim();
    setAppsScriptUrl(trimmed);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    const trimmed = scriptUrl.trim();
    if (!trimmed) {
      setTestStatus({
        type: 'error',
        message: 'กรุณากรอก URL ของ Google Apps Script ก่อนทดสอบ',
      });
      return;
    }

    setTestStatus({
      type: 'testing',
      message: 'กำลังทดสอบเชื่อมต่อไปยัง Google Apps Script...',
    });

    const res = await testAppsScriptConnection(trimmed);
    if (res.success) {
      setAppsScriptUrl(trimmed);
      setTestStatus({
        type: 'success',
        message: '✅ เชื่อมต่อสำเร็จ! ระบบพร้อมรับค่าน้ำตาลจาก อสม. ทุกคนแล้ว',
      });
    } else {
      setTestStatus({
        type: 'error',
        message: res.message,
      });
    }
  };

  const hasConfigured = Boolean(getAppsScriptUrl());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  แก้ปัญหา อสม. ส่งค่าน้ำตาลไม่เข้าชีต
                </span>
                {hasConfigured ? (
                  <span className="text-xs bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
                  </span>
                ) : (
                  <span className="text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black">
                    ยังไม่ได้เชื่อมต่อ
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mt-1">
                ระบบส่งค่าน้ำตาลเข้า Google Sheet อัตโนมัติ
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                (ช่วยให้ อสม. บันทึกค่าน้ำตาลผ่านมือถือ/LINE แล้วส่งเข้าชีตทันที โดยไม่ต้องล็อกอิน Google)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Explanation Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-base">
                  สาเหตุที่ อสม. บันทึกแล้วไม่ส่งไป Google Sheet
                </h4>
                <p className="text-emerald-800 text-xs mt-1 leading-relaxed">
                  เนื่องจาก Google Sheet กำหนดว่าหากส่งผ่าน Google API ปกติ ผู้ใช้งานทุกคนต้องล็อกอินบัญชี Google แต่ในทางปฏิบัติ อสม. ใช้งานผ่านมือถือ/LINE โดยไม่ล็อกอิน การติดตั้ง <strong>Google Apps Script Web App</strong> (บริการฟรีของ Google) จะทำหน้าที่เป็นประตูรับข้อมูลอัตโนมัติ ให้อสม. บันทึกส่งตรงเข้าแผ่นงาน <strong>BloodSugarLogs</strong> ได้ทันที 100%!
                </p>
              </div>
            </div>
          </div>

          {/* Pending Logs Sync Action */}
          {pendingLogsCount > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  มีค่าน้ำตาลที่บันทึกไว้ในเครื่อง รอส่งเข้าชีต {pendingLogsCount} รายการ
                </span>
                <p className="text-xs text-amber-700 mt-0.5">
                  (บันทึกเก็บไว้ปลอดภัยในเครื่องแล้ว ไม่สูญหาย)
                </p>
              </div>
              <button
                type="button"
                onClick={onSyncPendingLogs}
                disabled={isSyncing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'กำลังส่งข้อมูล...' : 'ส่งเข้าชีตตอนนี้'}
              </button>
            </div>
          )}

          {/* Step by Step Guide */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>วิธีตั้งค่าเชื่อมต่อ Google Sheet (ทำเพียงครั้งเดียว 2 นาที)</span>
            </h3>

            {/* Steps list */}
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li>
                เปิดแผ่นงาน Google Sheet ของ รพ.สต.:{' '}
                <a
                  href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 font-bold underline hover:text-emerald-900"
                >
                  คลิกที่นี่เพื่อเปิดชีต ({currentSpreadsheetId.slice(0, 10)}...)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                ที่แถบเมนูด้านบนของ Google Sheet ให้กดไปที่{' '}
                <strong className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                  ส่วนขยาย (Extensions)
                </strong>{' '}
                &gt;{' '}
                <strong className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                  Apps Script
                </strong>
              </li>
              <li>
                ลบโค้ดเดิมทั้งหมดในหน้าต่าง Apps Script ออก แล้ว{' '}
                <strong className="text-emerald-800">
                  วางโค้ดจากปุ่มด้านล่างนี้ลงไป
                </strong>
              </li>
              <li>
                กดบันทึก (รูปแผ่นดิสก์ 💾) แล้วกดปุ่มสีน้ำเงิน{' '}
                <strong className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                  ทำให้ใช้งานได้ (Deploy)
                </strong>{' '}
                &gt;{' '}
                <strong className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                  การทำให้ใช้งานได้ใหม่ (New deployment)
                </strong>
              </li>
              <li>
                กดไอคอนรูปเฟือง ⚙️ แล้วเลือก{' '}
                <strong className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">
                  เว็บแอป (Web app)
                </strong>{' '}
                และตั้งค่าดังนี้:
                <div className="ml-5 mt-1.5 p-2 bg-emerald-100/60 rounded-xl space-y-1 text-emerald-950 font-semibold">
                  <div>• ดำเนินการในฐานะ (Execute as): <u>ฉัน (Me)</u></div>
                  <div>
                    • ผู้ที่มีสิทธิ์เข้าถึง (Who has access):{' '}
                    <u className="text-rose-700 font-bold">ทุกคน (Anyone)</u>{' '}
                    <span className="text-[11px] text-slate-500 font-normal">
                      (สำคัญมาก เพื่อให้อสม. ส่งได้โดยไม่ต้องล็อกอิน)
                    </span>
                  </div>
                </div>
              </li>
              <li>
                กด <strong>Deploy</strong> (กดให้สิทธิ์ Review permissions / Advanced &gt; Go to...) แล้ว{' '}
                <strong>คัดลอก URL ของเว็บแอป (ที่ลงท้ายด้วย /exec)</strong> นำมาวางในช่องขั้นตอนที่ 2 ด้านล่าง
              </li>
            </ol>

            {/* Code Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  โค้ด Google Apps Script (พร้อมตาราง BloodSugarLogs)
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> คัดลอกเรียบร้อยแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> คัดลอกโค้ดทั้งหมด
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3 rounded-2xl overflow-x-auto max-h-40 border border-slate-800">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>

            {/* Step 2: Paste Web App URL */}
            <div className="pt-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>วาง URL เว็บแอป (Web App URL) ที่ได้จาก Google</span>
              </h3>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-xs font-mono focus:border-emerald-600 focus:outline-hidden pr-24 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
                  >
                    {savedSuccess ? 'บันทึกแล้ว!' : 'บันทึก URL'}
                  </button>
                </div>

                {/* Test button & status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    ทดสอบส่งสัญญาณเชื่อมต่อ
                  </button>

                  {scriptUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setScriptUrlInput('');
                        setAppsScriptUrl('');
                      }}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                    >
                      ลบการเชื่อมต่อ
                    </button>
                  )}
                </div>

                {/* Test Status feedback */}
                {testStatus && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                      testStatus.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : testStatus.type === 'testing'
                        ? 'bg-sky-100 text-sky-900 border border-sky-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {testStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                    {testStatus.type === 'testing' && <RefreshCw className="w-4 h-4 text-sky-700 animate-spin shrink-0" />}
                    {testStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            ระบบจะจดจำ URL นี้ไว้ในเครื่อง และส่งค่าน้ำตาลเข้า Google Sheet ทุกครั้งที่ อสม. บันทึก
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
          >
            เรียบร้อย ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
