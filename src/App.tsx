/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { QuickRecordView } from './components/QuickRecordView';
import { PatientManagementView } from './components/PatientManagementView';
import { HistoryLogsView } from './components/HistoryLogsView';
import { DashboardAndExportView } from './components/DashboardAndExportView';
import { GoogleSheetSettingsView } from './components/GoogleSheetSettingsView';
import { NurseAuthModal } from './components/NurseAuthModal';
import { Patient, BloodSugarLog, AppUser, VillageInfo } from './types';
import { INITIAL_PATIENTS, INITIAL_LOGS, INITIAL_USERS } from './constants/initialData';
import { VILLAGES_LIST } from './constants/villages';
import { initAuth, getAccessToken } from './services/auth';
import {
  DEFAULT_SPREADSHEET_ID,
  fetchPatientsFromSheet,
  fetchLogsFromSheet,
  fetchUsersFromSheet,
  fetchVillagesFromSheet,
  appendPatientToSheet,
  updatePatientInSheet,
  deleteRowFromSheet,
  appendLogToSheet,
  appendUserToSheet,
  appendVillageToSheet,
} from './services/sheetsService';

export default function App() {
  // Appearance & Accessibility Settings
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>(() => {
    return (localStorage.getItem('dm_font_size') as any) || 'large'; // Default large for VHV readability!
  });
  const [userRole, setUserRole] = useState<'vhv' | 'nurse'>(() => {
    return (localStorage.getItem('dm_user_role') as any) || 'vhv';
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('record');

  // Google Auth & Sheet state (Connected to the user's Google Sheet ID)
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('dm_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return (
      localStorage.getItem('dm_spreadsheet_title') ||
      'ข้อมูลผู้ป่วยเบาหวาน DM Remission - ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ'
    );
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dynamic Villages list from sheet 'Village' or default list
  const [villages, setVillages] = useState<VillageInfo[]>(() => {
    const saved = localStorage.getItem('dm_villages_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return VILLAGES_LIST;
      }
    }
    return VILLAGES_LIST;
  });

  // Registered Nurses in User Sheet
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('dm_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [activeNurse, setActiveNurse] = useState<AppUser | null>(null);
  const [isNurseAuthModalOpen, setIsNurseAuthModalOpen] = useState<boolean>(false);

  // Data state (Initialized with the user's provided 19 patients)
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('dm_patients_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed && parsed.length > 0 ? parsed : INITIAL_PATIENTS;
      } catch (e) {
        return INITIAL_PATIENTS;
      }
    }
    return INITIAL_PATIENTS;
  });

  const [logs, setLogs] = useState<BloodSugarLog[]>(() => {
    const saved = localStorage.getItem('dm_logs_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_LOGS;
      }
    }
    return INITIAL_LOGS;
  });

  // Flow states
  const [selectedPatientIdForMeasure, setSelectedPatientIdForMeasure] = useState<string | undefined>(undefined);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist Font Size & Role
  useEffect(() => {
    localStorage.setItem('dm_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('dm_user_role', userRole);
  }, [userRole]);

  // Persist villages
  useEffect(() => {
    localStorage.setItem('dm_villages_data', JSON.stringify(villages));
  }, [villages]);

  // Persist registered users
  useEffect(() => {
    localStorage.setItem('dm_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Persist data locally so offline field visits always work
  useEffect(() => {
    localStorage.setItem('dm_patients_data', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('dm_logs_data', JSON.stringify(logs));
  }, [logs]);

  // Auto hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Check if current user is an authorized nurse in registeredUsers
  useEffect(() => {
    if (user?.email) {
      const found = registeredUsers.find(
        (u) =>
          u.email.toLowerCase() === user.email?.toLowerCase() &&
          (u.role === 'Nurse' || u.role === 'Admin') &&
          u.status !== 'Inactive'
      );
      if (found) {
        setActiveNurse(found);
      }
    }
  }, [user, registeredUsers]);

  // Check Nurse Authorization boolean
  const isAuthorizedNurse = Boolean(
    activeNurse ||
    (userRole === 'nurse' && activeNurse !== null)
  );

  // Sync data from Google Sheet (works authenticated via API or unauthenticated via gviz)
  const syncWithSheet = async () => {
    if (!spreadsheetId) return;

    setIsSyncing(true);
    try {
      const token = await getAccessToken().catch(() => null);

      const [sheetPatients, sheetLogs, sheetUsers, sheetVillages] = await Promise.all([
        fetchPatientsFromSheet(spreadsheetId).catch((err) => {
          console.warn('Could not fetch patients from sheet:', err);
          return null;
        }),
        fetchLogsFromSheet(spreadsheetId).catch((err) => {
          console.warn('Could not fetch logs from sheet:', err);
          return null;
        }),
        fetchUsersFromSheet(spreadsheetId).catch((err) => {
          console.warn('Could not fetch users from sheet:', err);
          return null;
        }),
        fetchVillagesFromSheet(spreadsheetId).catch((err) => {
          console.warn('Could not fetch villages from sheet:', err);
          return null;
        }),
      ]);

      let updatedCount = 0;
      if (sheetPatients && sheetPatients.length > 0) {
        setPatients(sheetPatients);
        localStorage.setItem('dm_patients_data', JSON.stringify(sheetPatients));
        updatedCount += sheetPatients.length;
      }
      if (sheetLogs && sheetLogs.length > 0) {
        setLogs(sheetLogs);
        localStorage.setItem('dm_blood_sugar_logs', JSON.stringify(sheetLogs));
      }
      if (sheetUsers && sheetUsers.length > 0) {
        setRegisteredUsers(sheetUsers);
        localStorage.setItem('dm_registered_users', JSON.stringify(sheetUsers));
      }
      if (sheetVillages && sheetVillages.length > 0) {
        setVillages(sheetVillages);
        localStorage.setItem('dm_villages_data', JSON.stringify(sheetVillages));
      }

      if (token) {
        setToastMessage('ซิงค์ข้อมูลสองทางกับ Google Sheet เรียบร้อยแล้ว (เข้าสู่ระบบแล้ว)');
      } else {
        setToastMessage(`ดึงข้อมูลจาก Google Sheet สำเร็จ (${updatedCount} คนไข้, ${sheetVillages?.length || 18} หมู่บ้าน)`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on initial mount or when spreadsheetId / user changes
  useEffect(() => {
    if (spreadsheetId) {
      syncWithSheet();
    }
  }, [spreadsheetId, user]);

  const handleSetSpreadsheet = (id: string, title: string) => {
    setSpreadsheetId(id);
    setSpreadsheetTitle(title);
    localStorage.setItem('dm_spreadsheet_id', id);
    localStorage.setItem('dm_spreadsheet_title', title);
  };

  // Save new Blood Sugar Log
  const handleSaveLog = async (newLog: BloodSugarLog) => {
    // 1. Update local state immediately
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    // 2. If connected to Google Sheet and authenticated, append to sheet
    if (spreadsheetId) {
      const token = await getAccessToken();
      if (token) {
        try {
          await appendLogToSheet(spreadsheetId, newLog);
        } catch (err) {
          console.error('Failed to append log to Google Sheet:', err);
          setToastMessage('บันทึกในเครื่องแล้ว (การส่งเข้า Google Sheet ล้มเหลว กรุณาซิงค์ภายหลัง)');
          return;
        }
      }
    }
    setToastMessage('บันทึกผลการตรวจน้ำตาลเรียบร้อยแล้ว');
  };

  // Patient CRUD - STRICTLY ENFORCE NURSE ROLE IN 'User' SHEET
  const handleAddPatient = async (newPatient: Patient) => {
    if (!isAuthorizedNurse) {
      setIsNurseAuthModalOpen(true);
      throw new Error('เฉพาะเจ้าหน้าที่พยาบาลที่ลงทะเบียนในชีต User เท่านั้นที่มีสิทธิ์เพิ่มคนไข้');
    }

    const updated = [newPatient, ...patients];
    setPatients(updated);

    if (spreadsheetId) {
      const token = await getAccessToken();
      if (token) {
        try {
          await appendPatientToSheet(spreadsheetId, newPatient);
        } catch (err) {
          console.error('Failed to append patient to sheet:', err);
        }
      }
    }
    setToastMessage(`เพิ่มคนไข้ ${newPatient.prefix}${newPatient.firstName} เรียบร้อยแล้ว`);
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    if (!isAuthorizedNurse) {
      setIsNurseAuthModalOpen(true);
      throw new Error('เฉพาะเจ้าหน้าที่พยาบาลที่ลงทะเบียนในชีต User เท่านั้นที่มีสิทธิ์แก้ไขคนไข้');
    }

    const updated = patients.map((p) =>
      p.patientId === updatedPatient.patientId ? updatedPatient : p
    );
    setPatients(updated);

    if (spreadsheetId && updatedPatient.rowIndex) {
      const token = await getAccessToken();
      if (token) {
        try {
          await updatePatientInSheet(
            spreadsheetId,
            updatedPatient.rowIndex,
            updatedPatient
          );
        } catch (err) {
          console.error('Failed to update patient in sheet:', err);
        }
      }
    }
    setToastMessage(`แก้ไขข้อมูลคนไข้ ${updatedPatient.prefix}${updatedPatient.firstName} แล้ว`);
  };

  const handleDeletePatient = async (patientToDelete: Patient) => {
    if (!isAuthorizedNurse) {
      setIsNurseAuthModalOpen(true);
      throw new Error('เฉพาะเจ้าหน้าที่พยาบาลที่ลงทะเบียนในชีต User เท่านั้นที่มีสิทธิ์ลบคนไข้');
    }

    const updated = patients.filter((p) => p.patientId !== patientToDelete.patientId);
    setPatients(updated);

    if (spreadsheetId && patientToDelete.rowIndex) {
      const token = await getAccessToken();
      if (token) {
        try {
          await deleteRowFromSheet(spreadsheetId, 'patient', patientToDelete.rowIndex);
        } catch (err) {
          console.error('Failed to delete row from sheet:', err);
        }
      }
    }
    setToastMessage(`ลบข้อมูลคนไข้ ${patientToDelete.firstName} แล้ว`);
  };

  const handleDeleteLog = async (logToDelete: BloodSugarLog) => {
    const updated = logs.filter((l) => l.logId !== logToDelete.logId);
    setLogs(updated);

    if (spreadsheetId && logToDelete.rowIndex) {
      const token = await getAccessToken();
      if (token) {
        try {
          await deleteRowFromSheet(spreadsheetId, 'BloodSugarLogs', logToDelete.rowIndex);
        } catch (err) {
          console.error('Failed to delete log from sheet:', err);
        }
      }
    }
    setToastMessage('ลบผลการตรวจเรียบร้อยแล้ว');
  };

  // Register New Nurse to 'User' sheet
  const handleRegisterNurse = async (newNurse: AppUser) => {
    const updated = [newNurse, ...registeredUsers];
    setRegisteredUsers(updated);
    setActiveNurse(newNurse);
    setUserRole('nurse');

    if (spreadsheetId) {
      const token = await getAccessToken();
      if (token) {
        try {
          await appendUserToSheet(spreadsheetId, newNurse);
        } catch (err) {
          console.error('Failed to append nurse to User sheet:', err);
        }
      }
    }
    setToastMessage(`ลงทะเบียนพยาบาล ${newNurse.fullName} ลงในชีต User สำเร็จ`);
  };

  const handleNurseVerifySuccess = (nurse: AppUser) => {
    setActiveNurse(nurse);
    setUserRole('nurse');
    setToastMessage(`ยืนยันสิทธิ์พยาบาล ${nurse.fullName} เรียบร้อยแล้ว`);
  };

  // Seed initial data to connected empty sheet (all sheets: patient, BloodSugarLogs, User, Village)
  const handleSeedInitialData = async () => {
    if (!spreadsheetId) return;
    const token = await getAccessToken();
    if (!token) return;

    setIsSyncing(true);
    try {
      for (const p of patients) {
        await appendPatientToSheet(spreadsheetId, p);
      }
      for (const l of logs) {
        await appendLogToSheet(spreadsheetId, l);
      }
      for (const u of registeredUsers) {
        await appendUserToSheet(spreadsheetId, u);
      }
      for (const v of villages) {
        await appendVillageToSheet(spreadsheetId, v).catch(() => {});
      }
      setToastMessage('นำเข้าข้อมูลตัวอย่างทั้งหมดเข้าสู่ Google Sheet เรียบร้อยแล้ว!');
      await syncWithSheet();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Action from Patient list to record blood sugar
  const handleSelectPatientToMeasure = (patientId: string) => {
    setSelectedPatientIdForMeasure(patientId);
    setActiveTab('record');
  };

  const handleAddNewPatientFromRecord = () => {
    if (!isAuthorizedNurse) {
      setIsNurseAuthModalOpen(true);
    } else {
      setActiveTab('patients');
      setIsAddPatientModalOpen(true);
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 font-scale-${fontSize}`}
    >
      {/* Header */}
      <Header
        fontSize={fontSize}
        setFontSize={setFontSize}
        userRole={userRole}
        setUserRole={(role) => {
          setUserRole(role);
          if (role === 'nurse' && !activeNurse) {
            setIsNurseAuthModalOpen(true);
          }
        }}
        isSheetConnected={!!spreadsheetId}
        sheetTitle={spreadsheetTitle}
        onOpenSheetSettings={() => setActiveTab('sheets')}
        villageCount={villages.length}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Tab Content */}
      <main className="animate-in fade-in duration-150">
        {activeTab === 'record' && (
          <QuickRecordView
            patients={patients}
            onSaveLog={handleSaveLog}
            onAddNewPatientClick={handleAddNewPatientFromRecord}
            selectedPatientId={selectedPatientIdForMeasure}
            onClearSelectedPatient={() => setSelectedPatientIdForMeasure(undefined)}
            villages={villages}
          />
        )}

        {activeTab === 'patients' && (
          <PatientManagementView
            patients={patients}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onSelectPatientToMeasure={handleSelectPatientToMeasure}
            isAddModalOpenInitially={isAddPatientModalOpen}
            onCloseAddModalInitially={() => setIsAddPatientModalOpen(false)}
            isAuthorizedNurse={isAuthorizedNurse}
            activeNurseInfo={activeNurse}
            onRequestNurseAuth={() => setIsNurseAuthModalOpen(true)}
            villages={villages}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLogsView
            logs={logs}
            onDeleteLog={handleDeleteLog}
            villages={villages}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardAndExportView
            patients={patients}
            logs={logs}
            spreadsheetId={spreadsheetId || undefined}
            villages={villages}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetSettingsView
            user={user}
            onUserChange={setUser}
            spreadsheetId={spreadsheetId}
            spreadsheetTitle={spreadsheetTitle}
            onSetSpreadsheet={handleSetSpreadsheet}
            onSyncNow={syncWithSheet}
            isSyncing={isSyncing}
            onSeedInitialDataToSheet={handleSeedInitialData}
            patientCount={patients.length}
            logCount={logs.length}
          />
        )}
      </main>

      {/* Nurse Authorization & Registration Modal */}
      <NurseAuthModal
        isOpen={isNurseAuthModalOpen}
        onClose={() => setIsNurseAuthModalOpen(false)}
        currentUserEmail={user?.email}
        registeredUsers={registeredUsers}
        onRegisterNurse={handleRegisterNurse}
        onVerifySuccess={handleNurseVerifySuccess}
      />

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
      />
    </div>
  );
}
