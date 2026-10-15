import { Patient, BloodSugarLog, AppUser, VillageInfo } from '../types';
import { getAccessToken } from './auth';
import { evaluateBloodSugar } from '../utils/sugarEvaluation';

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
  'username',
  'password',
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
  'Date ',
  'Measure',
  'BloodSugar',
  'LevelHealth',
  'Volunteer',
  'Timestamp',
  'Weight',
  'Height',
  'Waistline',
  'Blood',
  'Pressure',
  'Symptoms',
  'Village',
  'Prefix',
  'FirstName',
  'LastName',
];

export const APPS_SCRIPT_STORAGE_KEY = 'dm_apps_script_url';

export const getAppsScriptUrl = (): string => {
  return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || '';
};

export const setAppsScriptUrl = (url: string): void => {
  if (url && url.trim()) {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
  } else {
    localStorage.removeItem(APPS_SCRIPT_STORAGE_KEY);
  }
};

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * DM Remission Tracker - ต.โซ่ อ.โซ่พิสัย จ.บึงกาฬ
 * เว็บแอป Google Apps Script สำหรับรับบันทึกผลน้ำตาล (BloodSugarLogs)
 * รองรับการส่งจาก อสม. และผู้ใช้งานทุกคน โดยไม่ต้องล็อกอิน Google
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      status: 'ok',
      message: 'DM Remission Google Apps Script พร้อมใช้งานและเชื่อมต่อสมบูรณ์'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('BloodSugarLogs');
    if (!sheet) {
      sheet = ss.getSheetByName('BloodSugar');
    }
    if (!sheet) {
      sheet = ss.insertSheet('BloodSugarLogs');
      sheet.appendRow([
        'LogID', 'IDCard', 'FullName', 'Date ', 'Measure', 'BloodSugar', 'LevelHealth',
        'Volunteer', 'Timestamp', 'Weight', 'Height', 'Waistline', 'Blood', 'Pressure',
        'Symptoms', 'Village', 'Prefix', 'FirstName', 'LastName'
      ]);
    }

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Support single log or array of logs
    var logs = Array.isArray(payload) ? payload : (payload.logs || [payload]);
    var appendedCount = 0;

    for (var i = 0; i < logs.length; i++) {
      var item = logs[i];
      if (!item) continue;

      var row = [
        item.logId || item.LogID || ('LOG-' + new Date().getTime()),
        item.idCard || item.IDCard || '',
        item.fullName || item.FullName || '',
        item.measureDate || item.date || item.Date || '',
        item.measureType || item.Measure || 'DTX',
        Number(item.bloodSugarLevel || item.bloodSugar || item.BloodSugar || 0),
        item.levelHealth || item.LevelHealth || '',
        item.healthVolunteer || item.volunteer || item.Volunteer || '',
        item.timestamp || item.Timestamp || '',
        item.weight || item.Weight || '',
        item.height || item.Height || '',
        item.waistline || item.Waistline || '',
        item.bloodPressure || item.blood || item.Blood || '',
        item.pulse || item.pressure || item.Pressure || '',
        item.symptoms || item.Symptoms || '',
        item.village || item.Village || '',
        item.prefix || item.Prefix || '',
        item.firstName || item.FirstName || '',
        item.lastName || item.LastName || ''
      ];

      sheet.appendRow(row);
      appendedCount++;
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'บันทึกสำเร็จ ' + appendedCount + ' รายการ',
      count: appendedCount
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const testAppsScriptConnection = async (
  url: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const pingUrl = `${url.trim()}${url.includes('?') ? '&' : '?'}action=ping`;
    await fetch(pingUrl, { method: 'GET', mode: 'no-cors' });
    return {
      success: true,
      message: 'ส่งสัญญาณทดสอบสำเร็จ! เว็บแอปพร้อมบันทึกค่าน้ำตาลเข้าชีต BloodSugarLogs',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'ไม่สามารถเชื่อมต่อได้: ' + (err.message || 'กรุณาตรวจสอบ URL เว็บแอป'),
    };
  }
};

export const appendLogViaAppsScript = async (
  scriptUrl: string,
  log: BloodSugarLog | BloodSugarLog[]
): Promise<void> => {
  if (!scriptUrl) throw new Error('ไม่พบ URL ของ Google Apps Script');

  const payload = Array.isArray(log) ? { logs: log } : log;
  await fetch(scriptUrl.trim(), {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
};

export const parseGvizDate = (val: any): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (str.startsWith('Date(') && str.endsWith(')')) {
    const parts = str.slice(5, -1).split(',').map((p) => parseInt(p.trim(), 10));
    if (parts.length >= 3) {
      const year = parts[0];
      const month = String(parts[1] + 1).padStart(2, '0');
      const day = String(parts[2]).padStart(2, '0');
      if (parts.length >= 5) {
        const hour = String(parts[3] || 0).padStart(2, '0');
        const min = String(parts[4] || 0).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${min}`;
      }
      return `${year}-${month}-${day}`;
    }
  }
  return str;
};

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
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugarLogs'!A1:S1?valueInputOption=USER_ENTERED`,
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
      let res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugarLogs'!A1:Z1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'BloodSugar'!A1:Z1000`,
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
      console.warn('Authenticated fetch failed for logs, attempting gviz fetch:', e);
    }
  }

  // Fallback to gviz if unauthenticated
  if (rows.length === 0) {
    try {
      rows = await fetchViaGviz(spreadsheetId, 'BloodSugarLogs');
    } catch (err) {
      try {
        rows = await fetchViaGviz(spreadsheetId, 'BloodSugar');
      } catch (err2) {
        console.warn('Gviz fetch for logs failed:', err2);
        if (!token) return [];
        throw err;
      }
    }
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((h: any) => String(h || '').trim());
  const findCol = (aliases: string[], fallbackIdx: number) => {
    const idx = headers.findIndex((h: string) => {
      const clean = h.toLowerCase().replace(/[\s_()\-]/g, '');
      return aliases.some((a) => clean === a.toLowerCase().replace(/[\s_()\-]/g, ''));
    });
    return idx >= 0 ? idx : fallbackIdx;
  };

  const logIdIdx = findCol(['logid', 'log_id', 'id'], 0);
  const idCardIdx = findCol(['idcard', 'id_card', 'card', 'บัตรประชาชน'], 1);
  const fullNameIdx = findCol(['fullname', 'full_name', 'name', 'ชื่อ-นามสกุล', 'ชื่อ'], 2);
  const dateIdx = findCol(['date', 'date ', 'measuredate', 'วันที่'], 3);
  const measureIdx = findCol(['measure', 'measuretype', 'การวัด'], 4);
  const sugarIdx = findCol(['bloodsugar', 'bloodsugarlevel', 'sugar', 'น้ำตาล'], 5);
  const levelHealthIdx = findCol(['levelhealth', 'healthlevel', 'ระดับสุขภาพ', 'เกณฑ์'], 6);
  const volunteerIdx = findCol(['volunteer', 'healthvolunteer', 'อสม'], 7);
  const timestampIdx = findCol(['timestamp', 'เวลา', 'วันเวลา'], 8);
  const weightIdx = findCol(['weight', 'น้ำหนัก'], 9);
  const heightIdx = findCol(['height', 'ส่วนสูง'], 10);
  const waistIdx = findCol(['waistline', 'รอบเอว'], 11);
  const bloodIdx = findCol(['blood', 'bloodpressure', 'ความดัน'], 12);
  const pressureIdx = findCol(['pressure', 'pulse', 'ชีพจร'], 13);
  const symIdx = findCol(['symptoms', 'อาการ'], 14);
  const vilIdx = findCol(['village', 'หมู่บ้าน'], 15);
  const prefixIdx = findCol(['prefix', 'คำนำหน้า'], 16);
  const fnIdx = findCol(['firstname', 'ชื่อ'], 17);
  const lnIdx = findCol(['lastname', 'นามสกุล'], 18);

  const logs: BloodSugarLog[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    let sugarVal = Number(r[sugarIdx]);
    let measureTypeVal = String(r[measureIdx] || 'DTX');
    let levelHealthVal = String(r[levelHealthIdx] || '');
    let volunteerVal = String(r[volunteerIdx] || '');
    let timestampVal = String(r[timestampIdx] || '');
    let weightVal = r[weightIdx] || '';
    let heightVal = r[heightIdx] || '';
    let waistVal = r[waistIdx] || '';
    let bloodVal = String(r[bloodIdx] || '');
    let pressureVal = r[pressureIdx] || '';
    let symVal = String(r[symIdx] || '');
    let vilVal = String(r[vilIdx] || '');
    let prefixVal = String(r[prefixIdx] || '');
    let fnVal = String(r[fnIdx] || '');
    let lnVal = String(r[lnIdx] || '');

    // Auto-detect legacy shifted row format:
    // If sugarVal is 0 or NaN, but r[4] (Measure) has numeric sugar like 110,
    // and r[5] (BloodSugar) has text like "สมใจ รักษาดี"
    if (
      (isNaN(sugarVal) || sugarVal <= 0) &&
      !isNaN(Number(r[4])) &&
      Number(r[4]) > 0
    ) {
      sugarVal = Number(r[4]);
      measureTypeVal = 'DTX';
      volunteerVal = String(r[5] || '');
      timestampVal = String(r[6] || '');
      weightVal = r[7] || '';
      heightVal = r[8] || '';
      waistVal = r[9] || '';
      bloodVal = String(r[10] || '');
      symVal = String(r[11] || '');
      vilVal = String(r[12] || '');
      pressureVal = r[13] || '';
      prefixVal = String(r[14] || '');
      fnVal = String(r[15] || '');
      lnVal = String(r[16] || '');
    }

    if (!levelHealthVal && sugarVal > 0) {
      levelHealthVal = evaluateBloodSugar(sugarVal).label;
    }

    logs.push({
      logId: String(r[logIdIdx] || `LOG-${i}`),
      idCard: String(r[idCardIdx] || ''),
      fullName: String(r[fullNameIdx] || `${prefixVal}${fnVal} ${lnVal}`.trim()),
      measureDate: parseGvizDate(r[dateIdx]) || String(r[dateIdx] || ''),
      measureType: measureTypeVal,
      bloodSugarLevel: isNaN(sugarVal) ? 0 : sugarVal,
      levelHealth: levelHealthVal,
      healthVolunteer: volunteerVal,
      timestamp: parseGvizDate(timestampVal) || timestampVal,
      weight: weightVal,
      height: heightVal,
      waistline: waistVal,
      bloodPressure: bloodVal,
      pulse: pressureVal,
      symptoms: symVal,
      village: vilVal,
      prefix: prefixVal,
      firstName: fnVal,
      lastName: lnVal,
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
): Promise<{ success: boolean; method: 'appsscript' | 'sheets_api' }> => {
  const evalResult = evaluateBloodSugar(log.bloodSugarLevel);

  // Exact 19 columns:
  // LogID, IDCard, FullName, Date , Measure, BloodSugar, LevelHealth, Volunteer, Timestamp, Weight, Height, Waistline, Blood, Pressure, Symptoms, Village, Prefix, FirstName, LastName
  const row = [
    log.logId,
    log.idCard,
    log.fullName,
    log.measureDate,
    log.measureType || 'DTX',
    log.bloodSugarLevel,
    log.levelHealth || evalResult.label,
    log.healthVolunteer,
    log.timestamp,
    log.weight,
    log.height,
    log.waistline,
    log.bloodPressure,
    log.pulse,
    log.symptoms,
    log.village,
    log.prefix,
    log.firstName,
    log.lastName,
  ];

  // 1. Try Google Apps Script Web App first (allows saving without Google login!)
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl) {
    try {
      await appendLogViaAppsScript(appsScriptUrl, log);
      return { success: true, method: 'appsscript' };
    } catch (scriptErr) {
      console.warn('Apps Script submission error:', scriptErr);
    }
  }

  // 2. Fallback to Google Sheets API if logged into Google
  const token = await getAccessToken().catch(() => null);
  if (!token) {
    if (appsScriptUrl) {
      return { success: true, method: 'appsscript' };
    }
    throw new Error('กรุณาตั้งค่าเชื่อมต่อ Google Apps Script หรือเข้าสู่ระบบ Google เพื่อส่งข้อมูลเข้า Google Sheet');
  }

  let sheetName = 'BloodSugarLogs';
  try {
    const meta = await getSpreadsheetMetadata(spreadsheetId);
    const existing = meta.sheets?.map((s: any) => s.properties?.title) || [];
    if (existing.includes('BloodSugarLogs')) {
      sheetName = 'BloodSugarLogs';
    } else if (existing.includes('BloodSugar')) {
      sheetName = 'BloodSugar';
    }
  } catch (e) {
    // keep default
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A:S:append?valueInputOption=USER_ENTERED`,
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

  return { success: true, method: 'sheets_api' };
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
  const usernameIdx = getIdx('username', 8);
  const passwordIdx = getIdx('password', 9);

  const users: AppUser[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || (!r[emailIdx] && !r[nameIdx] && !r[usernameIdx])) continue;

    const rawStatus = r[statusIdx];
    const isActive =
      rawStatus === true ||
      String(rawStatus).toLowerCase() === 'true' ||
      String(rawStatus).toLowerCase() === 'active' ||
      rawStatus === 1 ||
      rawStatus === undefined ||
      rawStatus === null;

    users.push({
      userId: String(r[idIdx] || `USR-${i}`),
      fullName: String(r[nameIdx] || '').trim(),
      email: String(r[emailIdx] || '').trim().toLowerCase(),
      role: (r[roleIdx] as any) || 'Nurse',
      phone: String(r[phoneIdx] || ''),
      position: String(r[posIdx] || 'พยาบาลวิชาชีพ'),
      status: isActive ? 'Active' : 'Inactive',
      registeredDate: String(r[dateIdx] || ''),
      username:
        r[usernameIdx] !== undefined && r[usernameIdx] !== null
          ? String(r[usernameIdx]).trim()
          : undefined,
      password:
        r[passwordIdx] !== undefined && r[passwordIdx] !== null
          ? String(r[passwordIdx]).trim()
          : undefined,
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
    user.username || '',
    user.password || '',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'User'!A:J:append?valueInputOption=USER_ENTERED`,
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


