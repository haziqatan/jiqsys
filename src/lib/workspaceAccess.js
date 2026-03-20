function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSetupRequiredError(error) {
  return (
    error?.code === '42P01' ||
    error?.code === '42883' ||
    error?.code === '42703' ||
    /does not exist/i.test(error?.message || '') ||
    /function .* does not exist/i.test(error?.message || '') ||
    /column .* does not exist/i.test(error?.message || '')
  );
}

function getUserFullName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Jiqsys User'
  );
}

async function fetchMembershipRows(supabase, userId) {
  const result = await supabase
    .from('workspace_members')
    .select('workspace_id, role, can_create_tickets, can_edit_tickets, can_delete_tickets, can_create_features, can_edit_features, can_delete_features, can_manage_team, can_manage_statuses, can_manage_settings, can_manage_members, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (result.error) {
    if (isSetupRequiredError(result.error)) {
      return {
        setupRequired: true,
        data: [],
      };
    }
    throw result.error;
  }

  return {
    setupRequired: false,
    data: result.data || [],
  };
}

async function fetchWorkspacesByIds(supabase, workspaceIds) {
  if (!workspaceIds.length) {
    return {
      setupRequired: false,
      data: [],
    };
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, kind, owner_user_id')
    .in('id', workspaceIds);

  if (error) {
    if (isSetupRequiredError(error)) {
      return {
        setupRequired: true,
        data: [],
      };
    }
    throw error;
  }

  return {
    setupRequired: false,
    data: data || [],
  };
}

async function fetchProfileRow(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, active_workspace_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (isSetupRequiredError(error)) {
      return {
        setupRequired: true,
        data: null,
      };
    }
    throw error;
  }

  return {
    setupRequired: false,
    data: data || null,
  };
}

export async function setActiveWorkspace(supabase, workspaceId) {
  const { error } = await supabase.rpc('set_active_workspace', {
    target_workspace_id: workspaceId,
  });

  if (error) {
    if (isSetupRequiredError(error)) {
      throw new Error('Run the multi-workspace Supabase SQL patch before switching workspaces.');
    }
    throw error;
  }
}

export async function ensureWorkspaceAccess(supabase, user) {
  const email = normalizeEmail(user?.email);

  if (!user?.id || !email) {
    return { status: 'no-session' };
  }

  const fullName = getUserFullName(user);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
      },
      { onConflict: 'id' },
    );

  if (profileError) {
    if (isSetupRequiredError(profileError)) {
      return {
        status: 'setup-required',
        message: 'Run the Supabase workspace SQL migration before using Google login.',
      };
    }
    throw profileError;
  }

  const { error: ensurePrivateError } = await supabase.rpc('ensure_private_workspace');
  if (ensurePrivateError) {
    if (isSetupRequiredError(ensurePrivateError)) {
      return {
        status: 'setup-required',
        message: 'Run the multi-workspace Supabase SQL patch before using Google login.',
      };
    }
    throw ensurePrivateError;
  }

  const { error: inviteAcceptError } = await supabase.rpc('accept_workspace_invitations');
  if (inviteAcceptError && !isSetupRequiredError(inviteAcceptError)) {
    throw inviteAcceptError;
  }

  const membershipResult = await fetchMembershipRows(supabase, user.id);
  if (membershipResult.setupRequired) {
    return {
      status: 'setup-required',
      message: 'Run the multi-workspace Supabase SQL patch before using Google login.',
    };
  }

  const memberships = membershipResult.data;
  if (!memberships.length) {
    return {
      status: 'no-access',
      message: 'Your Google account is signed in, but no workspace is available yet.',
    };
  }

  const profileResult = await fetchProfileRow(supabase, user.id);
  if (profileResult.setupRequired) {
    return {
      status: 'setup-required',
      message: 'Run the multi-workspace Supabase SQL patch before using Google login.',
    };
  }

  const profile = profileResult.data;
  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  const workspaceResult = await fetchWorkspacesByIds(supabase, workspaceIds);
  if (workspaceResult.setupRequired) {
    return {
      status: 'setup-required',
      message: 'Run the multi-workspace Supabase SQL patch before using Google login.',
    };
  }
  const workspaceRows = workspaceResult.data;
  const workspaceById = Object.fromEntries(workspaceRows.map((workspace) => [workspace.id, workspace]));

  const enrichedMemberships = memberships.map((membership) => ({
    ...membership,
    workspace: workspaceById[membership.workspace_id] || null,
  }));

  const activeWorkspaceId =
    enrichedMemberships.find((membership) => membership.workspace_id === profile?.active_workspace_id)?.workspace_id ||
    enrichedMemberships[0]?.workspace_id ||
    null;

  if (activeWorkspaceId && profile?.active_workspace_id !== activeWorkspaceId) {
    const { error: activeWorkspaceError } = await supabase
      .from('profiles')
      .update({ active_workspace_id: activeWorkspaceId })
      .eq('id', user.id);

    if (activeWorkspaceError && !isSetupRequiredError(activeWorkspaceError)) {
      throw activeWorkspaceError;
    }
  }

  const activeMembership =
    enrichedMemberships.find((membership) => membership.workspace_id === activeWorkspaceId) ||
    enrichedMemberships[0] ||
    null;

  return {
    status: 'ready',
    workspace: activeMembership?.workspace || null,
    membership: activeMembership,
    memberships: enrichedMemberships,
    activeWorkspaceId,
    profile,
  };
}
