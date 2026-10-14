import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Heart,
  Droplets,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { BloodSugarLog } from '../types';
import { evaluateBloodSugar } from '../utils/sugarEvaluation';
import { VILLAGES_LIST, getVillageLabel } from '../constants/villages';
import { ConfirmModal } from './ConfirmModal';

interface HistoryLogsViewProps {
  logs: BloodSugarLog[];
  onDeleteLog: (log: BloodSugarLog) => Promise<void>;
}

export const HistoryLogsView: React.FC<HistoryLogsViewProps> = ({
  logs,
  onDeleteLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [logToDelete, setLogToDelete] = useState<BloodSugarLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    // Village filter
    if (selectedVillage !== 'all' && !log.village.includes(selectedVillage)) {
      return false;
    }

    // Category filter
    const val = Number(log.bloodSugarLevel) || 0;
    if (selectedCategory === 'remission') {
      if (val < 70 || val > 125) return false;
    } else if (selectedCategory === 'warning') {
      if (val <= 125 || val > 154) return false;
    } else if (selectedCategory === 'high') {
      if (val <= 154 && val >= 70) return false;
    }

    // Search term
    const s = searchTerm.toLowerCase();
    if (
      searchTerm &&
      !log.fullName.toLowerCase().includes(s) &&
      !log.healthVolunteer.toLowerCase().includes(s) &&
      !log.idCard.includes(searchTerm)
    ) {
      return false;
    }

    return true;
  });

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    try {
      await onDeleteLog(logToDelete);
      setLogToDelete(null);
    } catch (err: any) {
      alert('ลบรายการไม่สำเร็จ: ' + (err.message || err));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-28">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-sky-600" />
            <span>ประวัติการตรวจวัดน้ำตาล</span>
          </h2>
          <p className="text-xs text-slate-500">
            บันทึกผลการลงพื้นที่ตรวจเยี่ยมบ้านของ อสม. ({logs.length} ครั้ง)
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อคนไข้ หรือ อสม. ผู้ตรวจ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Row: Village & Category */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">
              หมู่บ้าน (1-18)
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-sky-500 text-xs"
            >
              <option value="all">ทั้งหมด 18 หมู่บ้าน</option>
              {VILLAGES_LIST.map((v) => (
                <option key={v.villageNo} value={`หมู่ ${v.villageNo}`}>
                  ม.{v.villageNo} {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">
              ระดับค่าน้ำตาล
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-sky-500 text-xs"
            >
              <option value="all">ทุกระดับน้ำตาล</option>
              <option value="remission">🟢 ปกติ (เกณฑ์ Remission &lt;126)</option>
              <option value="warning">🟡 เริ่มสูง (126 - 154)</option>
              <option value="high">🔴 สูง/อันตราย (≥155 หรือ &lt;70)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-base">ไม่พบประวัติการตรวจ</h4>
            <p className="text-slate-400 text-xs mt-1">
              ยังไม่มีการบันทึกข้อมูลตามเงื่อนไขที่เลือก
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const evalResult = evaluateBloodSugar(log.bloodSugarLevel);

            return (
              <div
                key={log.logId}
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">
                        {log.measureDate}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        {log.timestamp ? log.timestamp.split(' ')[1] : ''}
                      </span>
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                        {log.village}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-lg mt-1">
                      {log.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>อสม. ผู้ตรวจ: {log.healthVolunteer}</span>
                    </p>
                  </div>

                  {/* Blood Sugar Badge & Delete */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div
                      className={`px-3 py-1.5 rounded-2xl text-center border ${evalResult.badgeBg}`}
                    >
                      <span className="text-2xl font-black block leading-none">
                        {log.bloodSugarLevel}
                      </span>
                      <span className="text-[10px] font-bold block mt-0.5">
                        mg/dL
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogToDelete(log)}
                      title="ลบรายการตรวจนี้"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">ความดัน</span>
                    <strong className="text-slate-700">{log.bloodPressure || '-'}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">ชีพจร</span>
                    <strong className="text-slate-700">{log.pulse ? `${log.pulse} bpm` : '-'}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">น้ำหนัก/เอว</span>
                    <strong className="text-slate-700">
                      {log.weight || '-'} / {log.waistline || '-'}
                    </strong>
                  </div>
                </div>

                {/* Symptoms notes */}
                {log.symptoms && (
                  <p className="mt-2 text-xs text-slate-600 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                    <strong className="text-slate-700">อาการ:</strong> {log.symptoms}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!logToDelete}
        title="ยืนยันการลบผลการตรวจน้ำตาล"
        message={
          logToDelete
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจของ "${logToDelete.fullName}" วันที่ ${logToDelete.measureDate} (ค่าน้ำตาล: ${logToDelete.bloodSugarLevel} mg/dL) ออกจากระบบ?`
            : ''
        }
        confirmLabel="ลบประวัติตรวจ"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLogToDelete(null)}
      />
    </div>
  );
};
