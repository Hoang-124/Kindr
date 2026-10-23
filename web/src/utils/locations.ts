// d:\Kindr\web\src\utils\locations.ts

export interface WardOption {
  id: string;
  name: string;
}

export interface DistrictOption {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  wards: WardOption[];
}

export const DANANG_DISTRICTS: DistrictOption[] = [
  {
    id: 'dn_haichau',
    name: 'Quận Hải Châu',
    city: 'Đà Nẵng',
    lat: 16.0678,
    lng: 108.2208,
    wards: [
      { id: 'hc_thachthang', name: 'Phường Thạch Thang' },
      { id: 'hc_haichau1', name: 'Phường Hải Châu 1' },
      { id: 'hc_hoathuan', name: 'Phường Hòa Thuận Đông' },
      { id: 'hc_binhthuan', name: 'Phường Bình Thuận' },
      { id: 'hc_hoacuong', name: 'Phường Hòa Cường Bắc' },
    ],
  },
  {
    id: 'dn_sontra',
    name: 'Quận Sơn Trà',
    city: 'Đà Nẵng',
    lat: 16.0792,
    lng: 108.2415,
    wards: [
      { id: 'st_anhai', name: 'Phường An Hải Bắc' },
      { id: 'st_anhaidong', name: 'Phường An Hải Đông' },
      { id: 'st_phuocmy', name: 'Phường Phước Mỹ' },
      { id: 'st_manthai', name: 'Phường Mân Thái' },
    ],
  },
  {
    id: 'dn_nguhanhson',
    name: 'Quận Ngũ Hành Sơn',
    city: 'Đà Nẵng',
    lat: 15.9961,
    lng: 108.2564,
    wards: [
      { id: 'nhs_hoahai', name: 'Phường Hòa Hải (KĐT FPT City)' },
      { id: 'nhs_myan', name: 'Phường Mỹ An' },
      { id: 'nhs_khuemy', name: 'Phường Khuê Mỹ' },
      { id: 'nhs_hoaquy', name: 'Phường Hòa Quý' },
    ],
  },
  {
    id: 'dn_thankhe',
    name: 'Quận Thanh Khê',
    city: 'Đà Nẵng',
    lat: 16.0639,
    lng: 108.1889,
    wards: [
      { id: 'tk_vinhzhong', name: 'Phường Vĩnh Trung' },
      { id: 'tk_thacgian', name: 'Phường Thạc Gián' },
      { id: 'tk_xuanha', name: 'Phường Xuân Hà' },
      { id: 'tk_ankhe', name: 'Phường An Khê' },
    ],
  },
  {
    id: 'dn_camle',
    name: 'Quận Cẩm Lệ',
    city: 'Đà Nẵng',
    lat: 16.0125,
    lng: 108.2062,
    wards: [
      { id: 'cl_hoaxuan', name: 'Phường Hòa Xuân' },
      { id: 'cl_khuetrung', name: 'Phường Khuê Trung' },
      { id: 'cl_hoatho', name: 'Phường Hòa Thọ Đông' },
    ],
  },
  {
    id: 'dn_lienchieu',
    name: 'Quận Liên Chiểu',
    city: 'Đà Nẵng',
    lat: 16.0752,
    lng: 108.1492,
    wards: [
      { id: 'lc_hoakhanh', name: 'Phường Hòa Khánh Bắc' },
      { id: 'lc_hoaminh', name: 'Phường Hòa Minh' },
    ],
  },
];

export function getWardsByDistrictId(districtId: string): WardOption[] {
  const found = DANANG_DISTRICTS.find(
    (d) => d.id === districtId || d.name.toLowerCase().includes(districtId.toLowerCase())
  );
  return found ? found.wards : DANANG_DISTRICTS[0].wards;
}

export function getDistrictById(districtId?: string): DistrictOption {
  if (!districtId) return DANANG_DISTRICTS[0];
  return (
    DANANG_DISTRICTS.find(
      (d) => d.id === districtId || d.name.toLowerCase().includes(districtId.toLowerCase())
    ) || DANANG_DISTRICTS[0]
  );
}

export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
