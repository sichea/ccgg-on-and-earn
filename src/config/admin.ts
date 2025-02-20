// config/admin.ts
export const ADMIN_USER_IDS = [
  "5172197798"
];

export const isAdminUser = (userId: string | number): boolean => {
  const userIdStr = userId.toString();
  return ADMIN_USER_IDS.includes(userIdStr);
};