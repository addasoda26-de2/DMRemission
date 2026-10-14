import { VillageInfo } from '../types';

export const SUBDISTRICT_NAME = 'โซ่';
export const DISTRICT_NAME = 'โซ่พิสัย';
export const PROVINCE_NAME = 'บึงกาฬ';

export const VILLAGES_LIST: VillageInfo[] = [
  { villageNo: 1, name: 'โซ่', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 2, name: 'อ่างทอง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 3, name: 'สามเหลี่ยม', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 4, name: 'โนนชาด', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 5, name: 'ไทรงาม', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 6, name: 'โนนภูดิน', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 7, name: 'โคกสะอาด', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 8, name: 'ทรายทอง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 9, name: 'ท่าสวาท', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 10, name: 'โนนมันปลา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 11, name: 'หนองตะไก้', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 12, name: 'ห้วยสงคราม', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 13, name: 'หนองเอี่ยน', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 14, name: 'ท่าลี่', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 15, name: 'ทรายทอง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 16, name: 'อิสานพัฒนา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 17, name: 'โนนศรีสง่า', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 18, name: 'นารวงทอง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
];

export const getVillageLabel = (villageNo: number, list: VillageInfo[] = VILLAGES_LIST): string => {
  const v = list.find((item) => item.villageNo === Number(villageNo));
  if (v) {
    return `หมู่ ${v.villageNo} ${v.name}`;
  }
  return `หมู่ ${villageNo}`;
};
