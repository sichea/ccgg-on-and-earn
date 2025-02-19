// config/admin.ts

// 관리자 Telegram 사용자 ID 목록
const ADMIN_USER_IDS = [
  // 여기에 관리자의 Telegram 사용자 ID를 추가
  "5172197798"  // 예: "123456789"
];

export const isAdminUser = (userId: string | number): boolean => {
  const userIdStr = userId.toString();
  return ADMIN_USER_IDS.includes(userIdStr);
};