export const normalizeUser = (user = {}) => ({
  id: user.id ?? '',
  firstName: user.firstName ?? user.firstname ?? '',
  lastName: user.lastName ?? user.lastname ?? '',
  displayName:
    user.displayName ??
    user.display_name ??
    `${user.firstName ?? user.firstname ?? ''} ${user.lastName ?? user.lastname ?? ''}`.trim(),
  email: user.email ?? '',
  grade: user.grade ?? '3',
  avatarUrl: user.avatarUrl ?? user.avatar_url ?? null,
});