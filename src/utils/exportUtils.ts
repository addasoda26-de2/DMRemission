import { BloodSugarLog } from '../types';

export interface ExportFilterOptions {
  startDate?: string;
  endDate?: string;
  village?: string;
  sugarCategory?: 'all' | 'remission' | 'warning' | 'high_crisis';
}

export const filterLogsForExport = (
  logs: BloodSugarLog[],
  options: ExportFilterOptions
): BloodSugarLog[] => {
  return logs.filter((log) => {
    // Date filter
    if (options.startDate && log.measureDate < options.startDate) return false;
    if (options.endDate && log.measureDate > options.endDate) return false;

    // Village filter
    if (options.village && options.village !== 'all') {
      if (!log.village.includes(options.village)) return false;
    }

    // Sugar category filter
    if (options.sugarCategory && options.sugarCategory !== 'all') {
      const val = Number(log.bloodSugarLevel) || 0;
      if (options.sugarCategory === 'remission') {
        if (val < 70 || val > 125) return false;
      } else if (options.sugarCategory === 'warning') {
        if (val <= 125 || val > 154) return false;
      } else if (options.sugarCategory === 'high_crisis') {
        if (val <= 154 && val >= 70) return false; // high or crisis or hypo
      }
    }

    return true;
  });
};

/**
 * Generates and downloads a CSV file with UTF-8 BOM so Excel opens Thai properly.
 */
export const exportLogsToCSV = (
  logs: BloodSugarLog[],
  filenamePrefix: string = 'DM_BloodSugarLogs_TambonSo'
) => {
  const headers = [
    'LogID',
    'IDCard',
    'FullName',
    'MeasureDate',
    'BloodSugarLevel(mg/dL)',
    'HealthVolunteer',
    'Timestamp',
    'Weight(kg)',
    'Height(cm)',
    'Waistline',
    'BloodPressure(mmHg)',
    'Symptoms',
    'Village',
    'Pulse(bpm)',
    'Prefix',
    'FirstName',
    'LastName',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = logs.map((log) => [
    escapeCSV(log.logId),
    escapeCSV(`\t${log.idCard}`), // force Excel to treat 13-digit ID as text
    escapeCSV(log.fullName),
    escapeCSV(log.measureDate),
    escapeCSV(log.bloodSugarLevel),
    escapeCSV(log.healthVolunteer),
    escapeCSV(log.timestamp),
    escapeCSV(log.weight),
    escapeCSV(log.height),
    escapeCSV(log.waistline),
    escapeCSV(log.bloodPressure),
    escapeCSV(log.symptoms),
    escapeCSV(log.village),
    escapeCSV(log.pulse),
    escapeCSV(log.prefix),
    escapeCSV(log.firstName),
    escapeCSV(log.lastName),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Thai support in Microsoft Excel
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  a.href = url;
  a.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates an Excel-compatible XML/HTML spreadsheet download with styled headers and colored cells
 */
export const exportLogsToExcel = (
  logs: BloodSugarLog[],
  filenamePrefix: string = 'DM_BloodSugarLogs_TambonSo'
) => {
  const tableRows = logs
    .map((log) => {
      const sugar = Number(log.bloodSugarLevel) || 0;
      let bgColor = '#ffffff';
      if (sugar < 70) bgColor = '#f3e8ff'; // purple
      else if (sugar <= 125) bgColor = '#ecfdf5'; // light green
      else if (sugar <= 154) bgColor = '#fef3c7'; // amber
      else if (sugar <= 199) bgColor = '#ffedd5'; // orange
      else bgColor = '#ffe4e6'; // red

      return `<tr>
        <td style="mso-number-format:'\\@';">${log.logId}</td>
        <td style="mso-number-format:'\\@';">${log.idCard}</td>
        <td>${log.fullName}</td>
        <td style="text-align:center;">${log.measureDate}</td>
        <td style="text-align:center; font-weight:bold; background-color:${bgColor};">${log.bloodSugarLevel}</td>
        <td>${log.healthVolunteer}</td>
        <td style="text-align:center;">${log.timestamp}</td>
        <td style="text-align:center;">${log.weight || '-'}</td>
        <td style="text-align:center;">${log.height || '-'}</td>
        <td style="text-align:center;">${log.waistline || '-'}</td>
        <td style="text-align:center;">${log.bloodPressure || '-'}</td>
        <td>${log.symptoms || '-'}</td>
        <td>${log.village}</td>
        <td style="text-align:center;">${log.pulse || '-'}</td>
        <td>${log.prefix}</td>
        <td>${log.firstName}</td>
        <td>${log.lastName}</td>
      </tr>`;
    })
    .join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>BloodSugarLogs</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th { background-color: #059669; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #d1d5db; }
        td { padding: 8px; border: 1px solid #e5e7eb; font-family: Sarabun, sans-serif; }
      </style>
    </head>
    <body>
      <h3 style="font-family: Sarabun, sans-serif; color: #065f46;">รายงานผลการตรวจวัดระดับน้ำตาลในเลือด (DM Remission)</h3>
      <p style="font-family: Sarabun, sans-serif; color: #4b5563;">พื้นที่: ตำบลโซ่ อำเภอโซ่พิสัย จังหวัดบึงกาฬ (18 หมู่บ้าน)</p>
      <table border="1">
        <thead>
          <tr>
            <th>LogID</th>
            <th>IDCard</th>
            <th>FullName</th>
            <th>MeasureDate</th>
            <th>BloodSugarLevel (mg/dL)</th>
            <th>HealthVolunteer</th>
            <th>Timestamp</th>
            <th>Weight (kg)</th>
            <th>Height (cm)</th>
            <th>Waistline</th>
            <th>BloodPressure</th>
            <th>Symptoms</th>
            <th>Village</th>
            <th>Pulse</th>
            <th>Prefix</th>
            <th>FirstName</th>
            <th>LastName</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + template], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  a.href = url;
  a.download = `${filenamePrefix}_${dateStr}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
