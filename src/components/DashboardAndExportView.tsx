import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Calendar,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
  Phone,
  Filter,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Patient, BloodSugarLog } from '../types';
import { VILLAGES_LIST, getVillageLabel } from '../constants/villages';
import { evaluateBloodSugar } from '../utils/sugarEvaluation';
import {
  filterLogsForExport,
  exportLogsToCSV,
  exportLogsToExcel,
  ExportFilterOptions,
} from '../utils/exportUtils';

interface DashboardAndExportViewProps {
  patients: Patient[];
  logs: BloodSugarLog[];
  spreadsheetId?: string;
}

export const DashboardAndExportView: React.FC<DashboardAndExportViewProps> = ({
  patients,
  logs,
  spreadsheetId,
}) => {
  // Export filter states
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterVillage, setFilterVillage] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'remission' | 'warning' | 'high_crisis'>('all');

  // Handle Preset changes
  const handlePresetChange = (preset: 'all' | 'today' | '7days' | 'month' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Filtered logs for export
  const exportLogs = useMemo(() => {
    const options: ExportFilterOptions = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      village: filterVillage !== 'all' ? filterVillage : undefined,
      sugarCategory: filterCategory !== 'all' ? filterCategory : undefined,
    };
    return filterLogsForExport(logs, options);
  }, [logs, startDate, endDate, filterVillage, filterCategory]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const totalVisits = logs.length;

    let normalCount = 0;
    let controlledCount = 0;
    let warningCount = 0;
    let highCount = 0;
    let crisisCount = 0;
    let sumSugar = 0;

    const highRiskAlerts: { log: BloodSugarLog; patient?: Patient }[] = [];

    logs.forEach((log) => {
      const val = Number(log.bloodSugarLevel) || 0;
      sumSugar += val;

      if (val < 70) {
        crisisCount++;
        const p = patients.find((item) => item.idCard === log.idCard);
        highRiskAlerts.push({ log, patient: p });
      } else if (val <= 99) {
        normalCount++;
      } else if (val <= 125) {
        controlledCount++;
      } else if (val <= 154) {
        warningCount++;
      } else if (val <= 199) {
        highCount++;
        const p = patients.find((item) => item.idCard === log.idCard);
        highRiskAlerts.push({ log, patient: p });
      } else {
        crisisCount++;
        const p = patients.find((item) => item.idCard === log.idCard);
        highRiskAlerts.push({ log, patient: p });
      }
    });

    const remissionSuccessCount = normalCount + controlledCount;
    const remissionRate =
      totalVisits > 0 ? Math.round((remissionSuccessCount / totalVisits) * 100) : 0;
    const avgSugar = totalVisits > 0 ? Math.round(sumSugar / totalVisits) : 0;

    return {
      totalPatients,
      totalVisits,
      remissionSuccessCount,
      remissionRate,
      avgSugar,
      normalCount,
      controlledCount,
      warningCount,
      highCount,
      crisisCount,
      highRiskAlerts: highRiskAlerts.slice(0, 10), // latest 10
    };
  }, [patients, logs]);

  // Village statistics
  const villageStats = useMemo(() => {
    return VILLAGES_LIST.map((v) => {
      const villagePatients = patients.filter((p) => p.villageNo === v.villageNo);
      const villageLogs = logs.filter((l) => l.village.includes(`หมู่ ${v.villageNo}`));
      const remissionVisits = villageLogs.filter((l) => {
        const val = Number(l.bloodSugarLevel) || 0;
        return val >= 70 && val <= 125;
      }).length;

      const rate =
        villageLogs.length > 0
          ? Math.round((remissionVisits / villageLogs.length) * 100)
          : null;

      return {
        villageNo: v.villageNo,
        name: v.name,
        patientCount: villagePatients.length,
        logCount: villageLogs.length,
        remissionRate: rate,
      };
    });
  }, [patients, logs]);

  const handleExportCSV = () => {
    if (exportLogs.length === 0) {
      alert('ไม่พบข้อมูลตามเงื่อนไขที่เลือกเพื่อส่งออก');
      return;
    }
    exportLogsToCSV(exportLogs, 'DM_Remission_Logs_TambonSo');
  };

  const handleExportExcel = () => {
    if (exportLogs.length === 0) {
      alert('ไม่พบข้อมูลตามเงื่อนไขที่เลือกเพื่อส่งออก');
      return;
    }
    exportLogsToExcel(exportLogs, 'DM_Remission_Logs_TambonSo');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <span>แดชบอร์ด & รายงานส่งออก</span>
            </h2>
            <p className="text-xs text-slate-500">
              ระบบสารสนเทศติดตามผล DM Remission ตำบลโซ่ อำเภอโซ่พิสัย จังหวัดบึงกาฬ
            </p>
          </div>
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิด Google Sheet</span>
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ผู้ป่วยในระบบ</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {stats.totalPatients}
          </p>
          <span className="text-[11px] text-slate-400">18 หมู่บ้าน</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">จำนวนครั้งตรวจ</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {stats.totalVisits}
          </p>
          <span className="text-[11px] text-slate-400">อสม. ลงตรวจ</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">คุมน้ำตาลได้</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {stats.remissionRate}%
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            เกณฑ์ปกติ Remission
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ค่าน้ำตาลเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {stats.avgSugar || '-'}
          </p>
          <span className="text-[11px] text-slate-400">mg/dL</span>
        </div>
      </div>

      {/* Sugar Level Distribution Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-base mb-2">
          สัดส่วนการควบคุมระดับน้ำตาล (DM Remission Target)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          เป้าหมาย Remission: ค่าน้ำตาล &lt; 126 mg/dL (สีเขียวและเขียวเข้ม)
        </p>

        {/* Progress Bar Segments */}
        <div className="h-6 w-full rounded-xl bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
          {stats.normalCount > 0 && (
            <div
              style={{ width: `${(stats.normalCount / (stats.totalVisits || 1)) * 100}%` }}
              className="bg-emerald-500 rounded-lg flex items-center justify-center text-[10px] text-white font-bold"
              title={`ปกติ (<100): ${stats.normalCount}`}
            >
              {stats.normalCount}
            </div>
          )}
          {stats.controlledCount > 0 && (
            <div
              style={{ width: `${(stats.controlledCount / (stats.totalVisits || 1)) * 100}%` }}
              className="bg-teal-500 rounded-lg flex items-center justify-center text-[10px] text-white font-bold"
              title={`คุมได้ดี (100-125): ${stats.controlledCount}`}
            >
              {stats.controlledCount}
            </div>
          )}
          {stats.warningCount > 0 && (
            <div
              style={{ width: `${(stats.warningCount / (stats.totalVisits || 1)) * 100}%` }}
              className="bg-amber-400 rounded-lg flex items-center justify-center text-[10px] text-slate-900 font-bold"
              title={`เฝ้าระวัง (126-154): ${stats.warningCount}`}
            >
              {stats.warningCount}
            </div>
          )}
          {stats.highCount > 0 && (
            <div
              style={{ width: `${(stats.highCount / (stats.totalVisits || 1)) * 100}%` }}
              className="bg-orange-500 rounded-lg flex items-center justify-center text-[10px] text-white font-bold"
              title={`น้ำตาลสูง (155-199): ${stats.highCount}`}
            >
              {stats.highCount}
            </div>
          )}
          {stats.crisisCount > 0 && (
            <div
              style={{ width: `${(stats.crisisCount / (stats.totalVisits || 1)) * 100}%` }}
              className="bg-rose-500 rounded-lg flex items-center justify-center text-[10px] text-white font-bold"
              title={`อันตราย (≥200 หรือ <70): ${stats.crisisCount}`}
            >
              {stats.crisisCount}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>ปกติ (&lt;100): {stats.normalCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500"></span>
            <span>คุมได้ (100-125): {stats.controlledCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>เฝ้าระวัง (126-154): {stats.warningCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span>สูง (155-199): {stats.highCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>อันตราย (≥200): {stats.crisisCount}</span>
          </div>
        </div>
      </div>

      {/* High Risk / Alerts for Nurses */}
      {stats.highRiskAlerts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-base">
              รายชื่อคนไข้ที่ต้องติดตามใกล้ชิด (น้ำตาลสูง ≥155 หรือ &lt;70)
            </h3>
          </div>
          <div className="space-y-2">
            {stats.highRiskAlerts.map(({ log, patient }, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-2xl border border-rose-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-800 text-sm">
                      {log.fullName}
                    </strong>
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                      {log.bloodSugarLevel} mg/dL
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    {log.village} • วันที่ {log.measureDate} (อสม. {log.healthVolunteer})
                  </p>
                  {log.symptoms && (
                    <p className="text-rose-600 mt-0.5 font-medium">
                      อาการ: {log.symptoms}
                    </p>
                  )}
                </div>

                {patient?.phone && (
                  <a
                    href={`tel:${patient.phone}`}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 shrink-0 font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>โทร</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPORT DATA SECTION (User's Primary Request) */}
      <div className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-900">
          <Download className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-bold text-xl">
              ส่งออกข้อมูลการตรวจวัดระดับน้ำตาล (BloodSugarLogs)
            </h3>
            <p className="text-xs text-slate-500">
              ดาวน์โหลดเป็นไฟล์ CSV หรือ Excel กรองตามวันที่และหมู่บ้านได้ตามต้องการ
            </p>
          </div>
        </div>

        {/* Date Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. เลือกช่วงเวลา:
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === '7days'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              กำหนดเอง...
            </button>
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ตั้งแต่วันที่
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Village and Category */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. กรองหมู่บ้าน (1-18):
            </label>
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              3. กรองระดับน้ำตาล:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">ทุกระดับน้ำตาล</option>
              <option value="remission">🟢 เฉพาะอยู่ในเกณฑ์ Remission (70-125)</option>
              <option value="warning">🟡 เฉพาะเริ่มสูง เฝ้าระวัง (126-154)</option>
              <option value="high_crisis">🔴 เฉพาะเสี่ยงสูง/อันตราย (≥155 หรือ &lt;70)</option>
            </select>
          </div>
        </div>

        {/* Matching Records Count Badge */}
        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
          <span>พบข้อมูลที่ตรงกับเงื่อนไข:</span>
          <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-bold">
            {exportLogs.length} รายการ
          </span>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span>ส่งออกเป็น CSV (UTF-8 BOM)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-teal-200 flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>ส่งออกเป็น Excel (.xls)</span>
          </button>
        </div>
      </div>

      {/* Village Breakdown Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-slate-800 text-base mb-2">
          ข้อมูลแยกรายหมู่บ้าน (ตำบลโซ่ 18 หมู่บ้าน)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          สถิติจำนวนผู้ป่วยและการลงพื้นที่ตรวจของ อสม. แต่ละหมู่บ้าน
        </p>

        <div className="max-h-[360px] overflow-y-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2.5">หมู่บ้าน</th>
                <th className="p-2.5 text-center">ผู้ป่วย</th>
                <th className="p-2.5 text-center">ครั้งตรวจ</th>
                <th className="p-2.5 text-center">% Remission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {villageStats.map((item) => (
                <tr key={item.villageNo} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-medium text-slate-800">
                    หมู่ {item.villageNo} {item.name}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-700">
                    {item.patientCount}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-700">
                    {item.logCount}
                  </td>
                  <td className="p-2.5 text-center">
                    {item.remissionRate !== null ? (
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          item.remissionRate >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.remissionRate >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.remissionRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
