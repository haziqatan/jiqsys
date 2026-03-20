export function isWorkspaceOwner(access) {
  return access?.membership?.role === 'owner';
}

export function hasWorkspacePermission(access, permission) {
  if (!access || access.status !== 'ready') return false;
  if (isWorkspaceOwner(access)) return true;
  return !!access?.membership?.[permission];
}

export function getUserDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Jiqsys User'
  );
}

export function getUserInitials(user) {
  return getUserDisplayName(user)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'JU';
}
