// src/config/admin.ts
export const ADMIN_IDS = [
  '5172197798' // 여기에 관리자의 텔레그램 ID를 입력하세요
];

export const isAdminUser = (userId: string | number): boolean => {
  return ADMIN_IDS.includes(userId.toString());
};