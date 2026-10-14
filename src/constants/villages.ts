import { VillageInfo } from '../types';

export const SUBDISTRICT_NAME = 'โซ่';
export const DISTRICT_NAME = 'โซ่พิสัย';
export const PROVINCE_NAME = 'บึงกาฬ';

export const VILLAGES_LIST: VillageInfo[] = [
  { villageNo: 1, name: 'บ้านโซ่', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 2, name: 'บ้านโนนม่วง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 3, name: 'บ้านโนนสมบูรณ์', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 4, name: 'บ้านห้วยลึก', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 5, name: 'บ้านคำเจริญ', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 6, name: 'บ้านโนนสำราญ', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 7, name: 'บ้านหนองบัวเงิน', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 8, name: 'บ้านดอนแก้ว', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 9, name: 'บ้านโนนสวรรค์', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 10, name: 'บ้านชัยศรีพัฒนา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 11, name: 'บ้านโซ่ใหม่', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 12, name: 'บ้านโนนชาด', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 13, name: 'บ้านสายปัญญา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 14, name: 'บ้านหนองบัวทอง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 15, name: 'บ้านสัมพันธ์พัฒนา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 16, name: 'บ้านเทพมีชัย', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 17, name: 'บ้านร่วมใจพัฒนา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 18, name: 'บ้านศรีบุญเรือง', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
  { villageNo: 19, name: 'บ้านทดสอบพัฒนา', subdistrict: SUBDISTRICT_NAME, district: DISTRICT_NAME, province: PROVINCE_NAME },
];

export const getVillageLabel = (villageNo: number, list: VillageInfo[] = VILLAGES_LIST): string => {
  const v = list.find((item) => item.villageNo === Number(villageNo));
  if (v) {
    return `หมู่ ${v.villageNo} ${v.name}`;
  }
  return `หมู่ ${villageNo}`;
};
