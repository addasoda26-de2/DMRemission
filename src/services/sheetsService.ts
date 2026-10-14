import { Patient, BloodSugarLog, AppUser, VillageInfo } from '../types';
import { getAccessToken } from './auth';

export const DEFAULT_SPREADSHEET_ID = '1W1DncVSCeiJ9xN_dp7a-2x92Qs8yDWCIjlLIbOV2FmM';

export const VILLAGE_HEADERS = [
  'VillageNo',
  'VillageName',
  'Subdistrict',
  'District',
  'Province',
];

export const USER_HEADERS = [
  'UserID',
  'FullName',
  'Email',
  'Role',
  'Phone',
  'Position',
  'Status',
  'RegisteredDate',
];

export const PATIENT_HEADERS = [
  'PatientID',
  'Prefix',
  'FirstName',
  'LastName',
  'Age',
  'Address',
  'VillageNo',
  'Subdistrict',
  'District',
  'Province',
  'DOB',
  'IDCard',
  'Phone',
];

export const BLOOD_SUGAR_HEADERS = [
  'LogID',
  'IDCard',
  'FullName',
  'MeasureDate',
  'BloodSugarLevel',
  'HealthVolunteer',
  'Timestamp',
  'Weight',
  'Height',
  'Waistline',
  'BloodPressure',
  'Symptoms',
  'Village',
  'Pulse',
  'Prefix',
  'FirstName',
  'LastName',
];

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink?: string;
}

export const listUserSpreadsheets = async (): Promise<DriveSpreadsheetItem[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=15`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถค้นหา Google Sheet ใน Drive ได้');
  }

  const data = await res.json();
  return data.files || [];
};

export const createNewDMSpreadsheet = async (
  title: string = 'ข้อมูลผู้ป่วยเบาหวาน DM Remission - ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ'
): Promise<{ id: string; url: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'patient',
          gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: PATIENT_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                })),
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'BloodSugarLogs',
          gridProperties: { rowCount: 200, columnCount: 20, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: BLOOD_SUGAR_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                })),
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'User',
          gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: USER_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                })),
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheet ใหม่ได้');
  }

  const result = await res.json();
  return {
    id: result.spreadsheetId,
    url: result.spreadsheetUrl,
  };
};

export const getSpreadsheetMetadata = async (spreadsheetId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่พบข้อมูล Google Sheet นี้ หรือไม่มีสิทธิ์เข้าถึง');
  }

  return await res.json();
};

export const ensureSheetsExist = async (spreadsheetId: string) => {
  const meta = await getSpreadsheetMetadata(spreadsheetId);
  const existingSheets = meta.sheets?.map((s: any) => s.properties?.title) || [];
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const requests: any[] = [];
  if (!existingSheets.includes('patient')) {
    requests.push({
      addSheet: {
        properties: { title: 'patient' },
      },
    });
  }
  if (!existingSheets.includes('BloodSugarLogs')) {
    requests.push({
      addSheet: {
        properties: { title: 'BloodSugarLogs' },
      },
    });
  }
  if (!existingSheets.includes('User')) {
    requests.push({
      addSheet: {
        properties: { title: 'User' },
      },
    });
  }
  if (!existingSheets.some((s: string) => s.toLowerCase() === 'village' || s.toLowerCase() === 'villages')) {
    requests.push({
      addSheet: {
        properties: { title: 'Village' },
      },
    });
  }

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    // Add headers to newly created sheets
    if (!existingSheets.includes('patient')) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'patient'!A1:M1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [PATIENT_HEADERS] }),
        }
      );
    }

    if (!existingSheets.includes('BloodSugarLogs')) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugarLogs'!A1:Q1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [BLOOD_SUGAR_HEADERS] }),
        }
      );
    }

    if (!existingSheets.includes('User')) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'User'!A1:H1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [USER_HEADERS] }),
        }
      );
    }

    if (!existingSheets.some((s: string) => s.toLowerCase() === 'village' || s.toLowerCase() === 'villages')) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Village'!A1:E1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [VILLAGE_HEADERS] }),
        }
      );
    }
  }
};

export const fetchViaGviz = async (
  spreadsheetId: string,
  sheetName: string
): Promise<any[][]> => {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ไม่สามารถเข้าถึงแผ่นงาน ${sheetName} ได้ (สถานะ: ${res.status})`);
  }
  const text = await res.text();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`รูปแบบข้อมูลไม่ถูกต้องสำหรับชีต ${sheetName}`);
  }
  const jsonStr = text.substring(jsonStart, jsonEnd + 1);
  const data = JSON.parse(jsonStr);
  const cols = data.table?.cols || [];
  const rows = data.table?.rows || [];

  const headers = cols.map((c: any) => String(c?.label || '').trim());
  const dataRows = rows.map((r: any) => {
    return (r.c || []).map((cell: any) => {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null) return cell.f;
      return cell.v !== undefined && cell.v !== null ? cell.v : '';
    });
  });

  return [headers, ...dataRows];
};

export const fetchPatientsFromSheet = async (spreadsheetId: string): Promise<Patient[]> => {
  let rows: any[][] = [];
  const token = await getAccessToken();

  if (token) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'patient'!A1:Z500`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        rows = data.values || [];
      }
    } catch (e) {
      console.warn('Authenticated fetch failed, attempting public gviz fetch:', e);
    }
  }

  // Fallback to gviz if unauthenticated (e.g. VHV without Google login) or token call failed
  if (rows.length === 0) {
    try {
      rows = await fetchViaGviz(spreadsheetId, 'patient');
    } catch (err) {
      console.warn('Gviz fetch failed:', err);
      if (!token) {
        throw new Error('ไม่สามารถโหลดข้อมูลผู้ป่วยจาก Google Sheet ได้');
      }
      throw err;
    }
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim());
  
  // Find column indices or fall back to default order
  const getIdx = (name: string, fallbackIdx: number) => {
    const idx = headers.findIndex((h: string) => h.toLowerCase() === name.toLowerCase());
    return idx >= 0 ? idx : fallbackIdx;
  };

  const idIdx = getIdx('PatientID', 0);
  const prefixIdx = getIdx('Prefix', 1);
  const fnIdx = getIdx('FirstName', 2);
  const lnIdx = getIdx('LastName', 3);
  const ageIdx = getIdx('Age', 4);
  const addrIdx = getIdx('Address', 5);
  const villageIdx = getIdx('VillageNo', 6);
  const subIdx = getIdx('Subdistrict', 7);
  const distIdx = getIdx('District', 8);
  const provIdx = getIdx('Province', 9);
  const dobIdx = getIdx('DOB', 10);
  const idCardIdx = getIdx('IDCard', 11);
  const phoneIdx = getIdx('Phone', 12);

  const patients: Patient[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || (!r[fnIdx] && !r[idIdx])) continue;

    patients.push({
      patientId: String(r[idIdx] || `DM-${i}`),
      prefix: String(r[prefixIdx] || ''),
      firstName: String(r[fnIdx] || '').trim(),
      lastName: String(r[lnIdx] || '').trim(),
      age: Number(r[ageIdx]) || 0,
      address: String(r[addrIdx] || ''),
      villageNo: Number(r[villageIdx]) || 1,
      subdistrict: String(r[subIdx] || 'โซ่').trim(),
      district: String(r[distIdx] || 'โซ่พิสัย').trim(),
      province: String(r[provIdx] || 'บึงกาฬ').trim(),
      dob: String(r[dobIdx] || ''),
      idCard: String(r[idCardIdx] || ''),
      phone: String(r[phoneIdx] || ''),
      rowIndex: i + 1, // 1-indexed row number in Google Sheets
    });
  }

  return patients;
};

export const fetchLogsFromSheet = async (spreadsheetId: string): Promise<BloodSugarLog[]> => {
  let rows: any[][] = [];
  const token = await getAccessToken();

  if (token) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugarLogs'!A1:Z1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        rows = data.values || [];
      }
    } catch (e) {
      console.warn('Authenticated fetch failed for logs, attempting gviz fetch:', e);
    }
  }

  // Fallback to gviz if unauthenticated
  if (rows.length === 0) {
    try {
      rows = await fetchViaGviz(spreadsheetId, 'BloodSugarLogs');
    } catch (err) {
      console.warn('Gviz fetch for logs failed:', err);
      if (!token) return [];
      throw err;
    }
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim());
  const getIdx = (name: string, fallbackIdx: number) => {
    const idx = headers.findIndex((h: string) => h.toLowerCase() === name.toLowerCase());
    return idx >= 0 ? idx : fallbackIdx;
  };

  const logIdIdx = getIdx('LogID', 0);
  const idCardIdx = getIdx('IDCard', 1);
  const fullNameIdx = getIdx('FullName', 2);
  const measureDateIdx = getIdx('MeasureDate', 3);
  const sugarIdx = getIdx('BloodSugarLevel', 4);
  const vhvIdx = getIdx('HealthVolunteer', 5);
  const timestampIdx = getIdx('Timestamp', 6);
  const weightIdx = getIdx('Weight', 7);
  const heightIdx = getIdx('Height', 8);
  const waistIdx = getIdx('Waistline', 9);
  const bpIdx = getIdx('BloodPressure', 10);
  const symIdx = getIdx('Symptoms', 11);
  const vilIdx = getIdx('Village', 12);
  const pulseIdx = getIdx('Pulse', 13);
  const prefixIdx = getIdx('Prefix', 14);
  const fnIdx = getIdx('FirstName', 15);
  const lnIdx = getIdx('LastName', 16);

  const logs: BloodSugarLog[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    logs.push({
      logId: String(r[logIdIdx] || `LOG-${i}`),
      idCard: String(r[idCardIdx] || ''),
      fullName: String(r[fullNameIdx] || ''),
      measureDate: String(r[measureDateIdx] || ''),
      bloodSugarLevel: Number(r[sugarIdx]) || 0,
      healthVolunteer: String(r[vhvIdx] || ''),
      timestamp: String(r[timestampIdx] || ''),
      weight: r[weightIdx] || '',
      height: r[heightIdx] || '',
      waistline: r[waistIdx] || '',
      bloodPressure: String(r[bpIdx] || ''),
      symptoms: String(r[symIdx] || ''),
      village: String(r[vilIdx] || ''),
      pulse: r[pulseIdx] || '',
      prefix: String(r[prefixIdx] || ''),
      firstName: String(r[fnIdx] || ''),
      lastName: String(r[lnIdx] || ''),
      rowIndex: i + 1,
    });
  }

  return logs;
};

export const appendPatientToSheet = async (
  spreadsheetId: string,
  patient: Patient
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const row = [
    patient.patientId,
    patient.prefix,
    patient.firstName,
    patient.lastName,
    patient.age,
    patient.address,
    patient.villageNo,
    patient.subdistrict,
    patient.district,
    patient.province,
    patient.dob,
    patient.idCard,
    patient.phone,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'patient'!A:M:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'บันทึกข้อมูลผู้ป่วยลง Google Sheet ล้มเหลว');
  }
};

export const updatePatientInSheet = async (
  spreadsheetId: string,
  rowIndex: number,
  patient: Patient
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const row = [
    patient.patientId,
    patient.prefix,
    patient.firstName,
    patient.lastName,
    patient.age,
    patient.address,
    patient.villageNo,
    patient.subdistrict,
    patient.district,
    patient.province,
    patient.dob,
    patient.idCard,
    patient.phone,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'patient'!A${rowIndex}:M${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'แก้ไขข้อมูลผู้ป่วยใน Google Sheet ล้มเหลว');
  }
};

export const appendLogToSheet = async (
  spreadsheetId: string,
  log: BloodSugarLog
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const row = [
    log.logId,
    log.idCard,
    log.fullName,
    log.measureDate,
    log.bloodSugarLevel,
    log.healthVolunteer,
    log.timestamp,
    log.weight,
    log.height,
    log.waistline,
    log.bloodPressure,
    log.symptoms,
    log.village,
    log.pulse,
    log.prefix,
    log.firstName,
    log.lastName,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugarLogs'!A:Q:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'บันทึกประวัติระดับน้ำตาลลง Google Sheet ล้มเหลว');
  }
};

// Delete row via batchUpdate
export const deleteRowFromSheet = async (
  spreadsheetId: string,
  sheetName: 'patient' | 'BloodSugarLogs',
  rowIndex: number
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const meta = await getSpreadsheetMetadata(spreadsheetId);
  const targetSheet = meta.sheets?.find((s: any) => s.properties?.title === sheetName);
  if (!targetSheet) throw new Error(`ไม่พบชีต ${sheetName}`);
  const sheetId = targetSheet.properties.sheetId;

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ลบแถวข้อมูลใน Google Sheet ล้มเหลว');
  }
};

export const fetchUsersFromSheet = async (spreadsheetId: string): Promise<AppUser[]> => {
  let rows: any[][] = [];
  const token = await getAccessToken();

  if (token) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'User'!A1:Z500`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        rows = data.values || [];
      }
    } catch (e) {
      console.warn('Authenticated fetch failed for users, attempting gviz fetch:', e);
    }
  }

  // Fallback to gviz if unauthenticated
  if (rows.length === 0) {
    try {
      rows = await fetchViaGviz(spreadsheetId, 'User');
    } catch (err) {
      console.warn('Gviz fetch for users failed:', err);
      if (!token) return [];
      throw err;
    }
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim());
  const getIdx = (name: string, fallbackIdx: number) => {
    const idx = headers.findIndex((h: string) => h.toLowerCase() === name.toLowerCase());
    return idx >= 0 ? idx : fallbackIdx;
  };

  const idIdx = getIdx('UserID', 0);
  const nameIdx = getIdx('FullName', 1);
  const emailIdx = getIdx('Email', 2);
  const roleIdx = getIdx('Role', 3);
  const phoneIdx = getIdx('Phone', 4);
  const posIdx = getIdx('Position', 5);
  const statusIdx = getIdx('Status', 6);
  const dateIdx = getIdx('RegisteredDate', 7);

  const users: AppUser[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || (!r[emailIdx] && !r[nameIdx])) continue;

    users.push({
      userId: String(r[idIdx] || `USR-${i}`),
      fullName: String(r[nameIdx] || '').trim(),
      email: String(r[emailIdx] || '').trim().toLowerCase(),
      role: (r[roleIdx] as any) || 'Nurse',
      phone: String(r[phoneIdx] || ''),
      position: String(r[posIdx] || 'พยาบาลวิชาชีพ'),
      status: (r[statusIdx] as any) || 'Active',
      registeredDate: String(r[dateIdx] || ''),
      rowIndex: i + 1,
    });
  }

  return users;
};

export const appendUserToSheet = async (
  spreadsheetId: string,
  user: AppUser
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const row = [
    user.userId,
    user.fullName,
    user.email.trim().toLowerCase(),
    user.role,
    user.phone,
    user.position,
    user.status,
    user.registeredDate,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'User'!A:H:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'บันทึกข้อมูลเจ้าหน้าที่ลงชีต User ล้มเหลว');
  }
};

export const fetchVillagesFromSheet = async (spreadsheetId: string): Promise<VillageInfo[]> => {
  let rows: any[][] = [];
  const token = await getAccessToken();

  if (token) {
    try {
      let res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Village'!A1:Z100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'villages'!A1:Z100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      if (res.ok) {
        const data = await res.json();
        rows = data.values || [];
      }
    } catch (e) {
      console.warn('Authenticated fetch failed for villages, attempting gviz fetch:', e);
    }
  }

  // Fallback to gviz if unauthenticated
  if (rows.length === 0) {
    try {
      rows = await fetchViaGviz(spreadsheetId, 'Village');
    } catch (err) {
      try {
        rows = await fetchViaGviz(spreadsheetId, 'villages');
      } catch (err2) {
        console.warn('Gviz fetch for villages failed:', err2);
        if (!token) return [];
        throw err;
      }
    }
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim());
  const getIdx = (name: string, fallbackIdx: number) => {
    const idx = headers.findIndex((h: string) => h.toLowerCase() === name.toLowerCase());
    return idx >= 0 ? idx : fallbackIdx;
  };

  const vNoIdx = getIdx('VillageNo', 0);
  const vNameIdx = getIdx('VillageName', 1);
  const subIdx = getIdx('Subdistrict', 2);
  const distIdx = getIdx('District', 3);
  const provIdx = getIdx('Province', 4);

  const list: VillageInfo[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || !r[vNoIdx]) continue;

    const no = parseInt(String(r[vNoIdx]).replace(/\D/g, ''), 10);
    if (isNaN(no)) continue;

    const rawName = String(r[vNameIdx] || '').trim();
    const name = rawName.startsWith('บ้าน') ? rawName.replace(/^บ้าน/, '') : rawName;

    list.push({
      villageNo: no,
      name: name || `หมู่ ${no}`,
      subdistrict: String(r[subIdx] || 'โซ่').trim(),
      district: String(r[distIdx] || 'โซ่พิสัย').trim(),
      province: String(r[provIdx] || 'บึงกาฬ').trim(),
    });
  }

  // Sort ascending by villageNo
  list.sort((a, b) => a.villageNo - b.villageNo);
  return list;
};

export const appendVillageToSheet = async (
  spreadsheetId: string,
  village: VillageInfo
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const row = [
    village.villageNo,
    village.name,
    village.subdistrict,
    village.district,
    village.province,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Village'!A:E:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'บันทึกข้อมูลหมู่บ้านลงชีต Village ล้มเหลว');
  }
};


