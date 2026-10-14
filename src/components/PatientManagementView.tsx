import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Droplets,
  X,
  Check,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import { Patient, AppUser } from '../types';
import { VILLAGES_LIST, getVillageLabel, SUBDISTRICT_NAME, DISTRICT_NAME, PROVINCE_NAME } from '../constants/villages';
import { ConfirmModal } from './ConfirmModal';

interface PatientManagementViewProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => Promise<void>;
  onUpdatePatient: (patient: Patient) => Promise<void>;
  onDeletePatient: (patient: Patient) => Promise<void>;
  onSelectPatientToMeasure: (patientId: string) => void;
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
  isAuthorizedNurse: boolean;
  activeNurseInfo?: AppUser | null;
  onRequestNurseAuth: () => void;
  villages?: import('../types').VillageInfo[];
}

export const PatientManagementView: React.FC<PatientManagementViewProps> = ({
  patients,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onSelectPatientToMeasure,
  isAddModalOpenInitially = false,
  onCloseAddModalInitially,
  isAuthorizedNurse,
  activeNurseInfo,
  onRequestNurseAuth,
  villages,
}) => {
  const activeVillages = villages && villages.length > 0 ? villages : VILLAGES_LIST;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<number | 'all'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<Patient>>({
    patientId: '',
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    age: 60,
    address: '',
    villageNo: 1,
    subdistrict: SUBDISTRICT_NAME,
    district: DISTRICT_NAME,
    province: PROVINCE_NAME,
    dob: '',
    idCard: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Open Add Modal (Restricted to authorized nurses in User sheet)
  const handleOpenAddModal = () => {
    if (!isAuthorizedNurse) {
      onRequestNurseAuth();
      return;
    }

    const nextIdNum = patients.length + 1;
    const autoId = `DM-SO-${String(nextIdNum).padStart(3, '0')}`;
    setFormData({
      patientId: autoId,
      prefix: 'นาย',
      firstName: '',
      lastName: '',
      age: 60,
      address: '',
      villageNo: selectedVillage === 'all' ? 1 : Number(selectedVillage),
      subdistrict: SUBDISTRICT_NAME,
      district: DISTRICT_NAME,
      province: PROVINCE_NAME,
      dob: '',
      idCard: '',
      phone: '',
    });
    setEditingPatient(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal (Restricted to authorized nurses)
  const handleOpenEditModal = (p: Patient) => {
    if (!isAuthorizedNurse) {
      onRequestNurseAuth();
      return;
    }

    setEditingPatient(p);
    setFormData({ ...p });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
    if (onCloseAddModalInitially) onCloseAddModalInitially();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName?.trim()) errors.firstName = 'กรุณาระบุชื่อ';
    if (!formData.lastName?.trim()) errors.lastName = 'กรุณาระบุนามสกุล';
    if (!formData.idCard?.trim()) {
      errors.idCard = 'กรุณาระบุเลขบัตรประชาชน';
    } else if (formData.idCard.replace(/\D/g, '').length !== 13) {
      errors.idCard = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const patientData: Patient = {
        patientId: formData.patientId?.trim() || `DM-${Date.now().toString().slice(-4)}`,
        prefix: formData.prefix || 'นาย',
        firstName: formData.firstName?.trim() || '',
        lastName: formData.lastName?.trim() || '',
        age: Number(formData.age) || 0,
        address: formData.address?.trim() || '',
        villageNo: Number(formData.villageNo) || 1,
        subdistrict: formData.subdistrict?.trim() || SUBDISTRICT_NAME,
        district: formData.district?.trim() || DISTRICT_NAME,
        province: formData.province?.trim() || PROVINCE_NAME,
        dob: formData.dob?.trim() || '',
        idCard: formData.idCard?.trim() || '',
        phone: formData.phone?.trim() || '',
        rowIndex: editingPatient?.rowIndex,
      };

      if (editingPatient) {
        await onUpdatePatient(patientData);
      } else {
        await onAddPatient(patientData);
      }
      handleCloseModal();
    } catch (err: any) {
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    if (!isAuthorizedNurse) {
      onRequestNurseAuth();
      return;
    }
    try {
      await onDeletePatient(patientToDelete);
      setPatientToDelete(null);
    } catch (err: any) {
      alert('ลบข้อมูลไม่สำเร็จ: ' + (err.message || err));
    }
  };

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const matchVillage =
      selectedVillage === 'all' || p.villageNo === Number(selectedVillage);
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      p.firstName.toLowerCase().includes(s) ||
      p.lastName.toLowerCase().includes(s) ||
      p.idCard.includes(searchTerm) ||
      p.patientId.toLowerCase().includes(s) ||
      p.phone.includes(searchTerm);

    return matchVillage && matchSearch;
  });

  return (
    <div className="max-w-xl mx-auto p-4 pb-28">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>ทะเบียนผู้ป่วย DM Remission</span>
          </h2>
          <p className="text-xs text-slate-500">
            ตำบลโซ่ อำเภอโซ่พิสัย จังหวัดบึงกาฬ ({patients.length} คน)
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className={`px-4 py-2.5 rounded-2xl active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-1.5 transition-all shrink-0 ${
            isAuthorizedNurse
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isAuthorizedNurse ? <Plus className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
          <span>เพิ่มคนไข้</span>
        </button>
      </div>

      {/* Nurse Authorization Status Banner (Crucial Requirement) */}
      {isAuthorizedNurse ? (
        <div className="mb-3.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>สิทธิ์พยาบาลยืนยันแล้ว:</strong> {activeNurseInfo?.fullName || 'พยาบาลวิชาชีพ'} (ลงทะเบียนในชีต <strong>User</strong> แล้ว มีสิทธิ์เพิ่ม/แก้ไขคนไข้)
            </span>
          </div>
          <button
            type="button"
            onClick={onRequestNurseAuth}
            className="text-[11px] text-emerald-700 font-bold hover:underline shrink-0 ml-2"
          >
            เปลี่ยน
          </button>
        </div>
      ) : (
        <div className="mb-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="leading-tight">
              <strong>หน้าที่พยาบาล:</strong> การเพิ่มหรือแก้ไขรายชื่อคนไข้ ต้องลงทะเบียนที่ชีต <strong>User</strong> ก่อน
            </span>
          </div>
          <button
            type="button"
            onClick={onRequestNurseAuth}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 shadow-xs active:scale-95 transition-all"
          >
            ยืนยันสิทธิ์/ลงทะเบียน
          </button>
        </div>
      )}

      {/* Village Quick Pills */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedVillage('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedVillage === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({activeVillages.length} หมู่บ้าน) ({patients.length})
          </button>
          {activeVillages.map((v) => {
            const countInVillage = patients.filter(
              (p) => p.villageNo === v.villageNo
            ).length;
            return (
              <button
                key={v.villageNo}
                type="button"
                onClick={() => setSelectedVillage(v.villageNo)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedVillage === v.villageNo
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                ม.{v.villageNo} {v.name.replace('บ้าน', '')}
                {countInVillage > 0 && ` (${countInVillage})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อ, นามสกุล, บัตร ปชช., เบอร์โทร..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base outline-none shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-base">ไม่พบข้อมูลผู้ป่วย</h4>
            <p className="text-slate-400 text-sm mt-1">
              ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "เพิ่มคนไข้" ด้านบน
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.patientId}
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xl shrink-0">
                    {patient.prefix === 'นาย' ? '👨' : '👩'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                        {patient.patientId}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        ม.{patient.villageNo} {getVillageLabel(patient.villageNo)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mt-1">
                      {patient.prefix}
                      {patient.firstName} {patient.lastName}
                    </h3>
                  </div>
                </div>

                {/* Top right actions: Edit / Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(patient)}
                    title="แก้ไขข้อมูล"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPatientToDelete(patient)}
                    title="ลบข้อมูล"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    อายุ {patient.age} ปี {patient.dob ? `(เกิด ${patient.dob})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">ปชช: {patient.idCard}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    บ้านเลขที่ {patient.address || '-'} ต.โซ่
                  </span>
                </div>
                {patient.phone ? (
                  <a
                    href={`tel:${patient.phone}`}
                    className="flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{patient.phone}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>ไม่มีเบอร์โทร</span>
                  </div>
                )}
              </div>

              {/* Action: Measure Blood Sugar */}
              <div className="mt-3.5 pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onSelectPatientToMeasure(patient.patientId)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Droplets className="w-4 h-4" />
                  <span>ตรวจวัดค่าน้ำตาลคนนี้ทันที</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingPatient ? 'แก้ไขข้อมูลคนไข้' : 'เพิ่มรายชื่อคนไข้ใหม่'}
                </span>
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* PatientID & Prefix */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    รหัสคนไข้
                  </label>
                  <input
                    type="text"
                    value={formData.patientId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    placeholder="DM-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    คำนำหน้า
                  </label>
                  <select
                    value={formData.prefix || 'นาย'}
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    อายุ (ปี)
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, age: Number(e.target.value) })
                    }
                    placeholder="60"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="ชื่อจริง"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      formErrors.firstName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    } font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {formErrors.firstName && (
                    <span className="text-[11px] text-rose-600 mt-0.5 block">
                      {formErrors.firstName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    นามสกุล *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="นามสกุล"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      formErrors.lastName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    } font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {formErrors.lastName && (
                    <span className="text-[11px] text-rose-600 mt-0.5 block">
                      {formErrors.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* ID Card 13 digits & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    เลขบัตร ปชช. (13 หลัก) *
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={formData.idCard || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCard: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="3380400xxxxxx"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      formErrors.idCard ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    } font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {formErrors.idCard && (
                    <span className="text-[11px] text-rose-600 mt-0.5 block">
                      {formErrors.idCard}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="081-xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* DOB & Village */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    วันเกิด (วว/ดด/ปปปป หรือ พ.ศ.)
                  </label>
                  <input
                    type="text"
                    value={formData.dob || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                    placeholder="เช่น 2505-04-12"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    หมู่บ้าน *
                  </label>
                  <select
                    value={formData.villageNo || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, villageNo: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {activeVillages.map((v) => (
                      <option key={v.villageNo} value={v.villageNo}>
                        หมู่ {v.villageNo} {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  บ้านเลขที่
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="เช่น 45/1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Readonly Location Info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>ตำบล: <strong>{SUBDISTRICT_NAME}</strong></span>
                <span>อำเภอ: <strong>{DISTRICT_NAME}</strong></span>
                <span>จังหวัด: <strong>{PROVINCE_NAME}</strong></span>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>บันทึกข้อมูลคนไข้</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!patientToDelete}
        title="ยืนยันการลบข้อมูลคนไข้"
        message={
          patientToDelete
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${patientToDelete.prefix}${patientToDelete.firstName} ${patientToDelete.lastName}" (รหัส: ${patientToDelete.patientId}) ออกจากฐานข้อมูล? การกระทำนี้ไม่สามารถย้อนกลับได้`
            : ''
        }
        confirmLabel="ลบคนไข้"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPatientToDelete(null)}
      />
    </div>
  );
};
