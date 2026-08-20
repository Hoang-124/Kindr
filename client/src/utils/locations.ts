// src/utils/locations.ts

export interface Ward {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  city: string;
  wards: Ward[];
}

export const VIETNAM_LOCATIONS: District[] = [
  // Đà Nẵng
  {
    id: 'dn_haichau',
    name: 'Quận Hải Châu',
    city: 'Đà Nẵng',
    wards: [
      { id: 'hc_thachthang', name: 'Phường Thạch Thang' },
      { id: 'hc_thuanphuoc', name: 'Phường Thuận Phước' },
      { id: 'hc_thanhbinh', name: 'Phường Thanh Bình' },
      { id: 'hc_hai_chau_1', name: 'Phường Hải Châu 1' },
      { id: 'hc_hai_chau_2', name: 'Phường Hải Châu 2' },
      { id: 'hc_phuocninh', name: 'Phường Phước Ninh' },
      { id: 'hc_hoathuan_tay', name: 'Phường Hòa Thuận Tây' },
      { id: 'hc_hoathuan_dong', name: 'Phường Hòa Thuận Đông' },
      { id: 'hc_namduong', name: 'Phường Nam Dương' },
      { id: 'hc_binhhien', name: 'Phường Bình Hiên' },
      { id: 'hc_binhthuan', name: 'Phường Bình Thuận' },
      { id: 'hc_hoacuongbac', name: 'Phường Hòa Cường Bắc' },
      { id: 'hc_hoacuongnam', name: 'Phường Hòa Cường Nam' },
    ],
  },
  {
    id: 'dn_thanhkhe',
    name: 'Quận Thanh Khê',
    city: 'Đà Nẵng',
    wards: [
      { id: 'tk_tamthuan', name: 'Phường Tam Thuận' },
      { id: 'tk_thanhkhedong', name: 'Phường Thanh Khê Đông' },
      { id: 'tk_thanhkhetay', name: 'Phường Thanh Khê Tây' },
      { id: 'tk_xuanha', name: 'Phường Xuân Hà' },
      { id: 'tk_chinhgian', name: 'Phường Chính Gián' },
      { id: 'tk_thacgian', name: 'Phường Thạc Gián' },
      { id: 'tk_anxuan', name: 'Phường An Khê' },
      { id: 'tk_hoakhe', name: 'Phường Hòa Khê' },
      { id: 'tk_vinhtrung', name: 'Phường Vĩnh Trung' },
      { id: 'tk_tanchinh', name: 'Phường Tân Chính' },
    ],
  },
  {
    id: 'dn_sontra',
    name: 'Quận Sơn Trà',
    city: 'Đà Nẵng',
    wards: [
      { id: 'st_anhaibac', name: 'Phường An Hải Bắc' },
      { id: 'st_anhaitay', name: 'Phường An Hải Tây' },
      { id: 'st_anhaidong', name: 'Phường An Hải Đông' },
      { id: 'st_phuocmy', name: 'Phường Phước Mỹ' },
      { id: 'st_thoqbquang', name: 'Phường Thọ Quang' },
      { id: 'st_manthai', name: 'Phường Mân Thái' },
      { id: 'st_naihiendong', name: 'Phường Nại Hiên Đông' },
    ],
  },
  {
    id: 'dn_nguhanhson',
    name: 'Quận Ngũ Hành Sơn',
    city: 'Đà Nẵng',
    wards: [
      { id: 'nhs_khuemy', name: 'Phường Khuê Mỹ' },
      { id: 'nhs_myan', name: 'Phường Mỹ An' },
      { id: 'nhs_hoahai', name: 'Phường Hòa Hải' },
      { id: 'nhs_hoaquy', name: 'Phường Hòa Quý' },
    ],
  },
  {
    id: 'dn_camle',
    name: 'Quận Cẩm Lệ',
    city: 'Đà Nẵng',
    wards: [
      { id: 'cl_khuetrung', name: 'Phường Khuê Trung' },
      { id: 'cl_hoatho_dong', name: 'Phường Hòa Thọ Đông' },
      { id: 'cl_hoatho_tay', name: 'Phường Hòa Thọ Tây' },
      { id: 'cl_hoaxuan', name: 'Phường Hòa Xuân' },
      { id: 'cl_hoaan', name: 'Phường Hòa An' },
      { id: 'cl_hoaphat', name: 'Phường Hòa Phát' },
    ],
  },
  {
    id: 'dn_lienchieu',
    name: 'Quận Liên Chiểu',
    city: 'Đà Nẵng',
    wards: [
      { id: 'lc_hoaminh', name: 'Phường Hòa Minh' },
      { id: 'lc_hoakhanhboc', name: 'Phường Hòa Khánh Bắc' },
      { id: 'lc_hoakhanhnam', name: 'Phường Hòa Khánh Nam' },
      { id: 'lc_hoahiepnam', name: 'Phường Hòa Hiệp Nam' },
      { id: 'lc_hoahiepbac', name: 'Phường Hòa Hiệp Bắc' },
    ],
  },

  // TP. Hồ Chí Minh (Mở rộng)
  {
    id: 'hcm_q1',
    name: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    wards: [
      { id: 'q1_benghe', name: 'Phường Bến Nghé' },
      { id: 'q1_benthanh', name: 'Phường Bến Thành' },
      { id: 'q1_dakao', name: 'Phường Đa Kao' },
      { id: 'q1_tandinh', name: 'Phường Tân Định' },
    ],
  },
  {
    id: 'hcm_q7',
    name: 'Quận 7',
    city: 'TP. Hồ Chí Minh',
    wards: [
      { id: 'q7_tanphong', name: 'Phường Tân Phong (Phú Mỹ Hưng)' },
      { id: 'q7_tanphu', name: 'Phường Tân Phú' },
      { id: 'q7_tanthuan_dong', name: 'Phường Tân Thuận Đông' },
    ],
  },

  // Hà Nội (Mở rộng)
  {
    id: 'hn_caugiay',
    name: 'Quận Cầu Giấy',
    city: 'Hà Nội',
    wards: [
      { id: 'cg_dichvong', name: 'Phường Dịch Vọng' },
      { id: 'cg_dichvonghau', name: 'Phường Dịch Vọng Hậu' },
      { id: 'cg_trunghoa', name: 'Phường Trung Hòa' },
      { id: 'cg_nghiado', name: 'Phường Nghĩa Đô' },
    ],
  },
];

/**
 * Lấy danh sách Quận theo Thành phố
 */
export function getDistrictsByCity(city: string = 'Đà Nẵng') {
  return VIETNAM_LOCATIONS.filter(d => d.city === city);
}

/**
 * Lấy danh sách Phường theo ID Quận
 */
export function getWardsByDistrictId(districtId: string) {
  const district = VIETNAM_LOCATIONS.find(d => d.id === districtId);
  return district ? district.wards : [];
}
