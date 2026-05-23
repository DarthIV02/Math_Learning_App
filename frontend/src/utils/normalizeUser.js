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
  coins: user.coins ?? 0,
  streak: user.streak ?? 0,
  solvedTasks: user.solvedTasks ?? user.solved_tasks ?? 0,
});