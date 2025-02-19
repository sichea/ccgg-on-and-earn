// src/config/admin.ts 파일이 필요합니다
export const ADMIN_IDS = [
  '5172197798' // 관리자의 텔레그램 ID
];

export const isAdminUser = (userId: string | number): boolean => {
  return ADMIN_IDS.includes(userId.toString());
};