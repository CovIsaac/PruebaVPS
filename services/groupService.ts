import { supabase } from "../utils/database"

export async function getGroups(userId: string) {
  try {
    // Primero obtenemos las membresías del usuario
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)

    if (membershipError) throw membershipError

    if (!memberships || memberships.length === 0) {
      return []
    }

    // Obtenemos los IDs de los grupos
    const groupIds = memberships.map((m) => m.group_id)

    // Obtenemos los grupos
    const { data: groups, error: groupError } = await supabase.from("groups").select("*").in("id", groupIds)

    if (groupError) throw groupError
    return groups || []
  } catch (error) {
    console.error("Error fetching groups:", error)
    throw error
  }
}

export async function getGroup(id: string) {
  try {
    const { data, error } = await supabase.from("groups").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error fetching group with id ${id}:`, error)
    throw error
  }
}

export async function createGroup(groupData: any) {
  try {
    const { data, error } = await supabase.from("groups").insert(groupData).select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

export async function updateGroup(id: string, groupData: any) {
  try {
    const { data, error } = await supabase.from("groups").update(groupData).eq("id", id).select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error(`Error updating group with id ${id}:`, error)
    throw error
  }
}

export async function deleteGroup(id: string) {
  try {
    // Primero eliminamos todas las membresías del grupo
    const { error: membersError } = await supabase.from("group_members").delete().eq("group_id", id)

    if (membersError) {
      console.error(`Error deleting members for group ${id}:`, membersError)
      throw membersError
    }

    // Luego eliminamos el grupo
    const { error } = await supabase.from("groups").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error deleting group with id ${id}:`, error)
    throw error
  }
}

export async function leaveGroup(groupId: string, userId: string) {
  try {
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error leaving group ${groupId} for user ${userId}:`, error)
    throw error
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq("group_id", groupId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error fetching members for group ${groupId}:`, error)
    throw error
  }
}

export async function addGroupMember(memberData: any) {
  try {
    const { data, error } = await supabase.from("group_members").insert(memberData).select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error("Error adding group member:", error)
    throw error
  }
}

export async function removeGroupMember(groupId: string, userId: string) {
  try {
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error removing member ${userId} from group ${groupId}:`, error)
    throw error
  }
}

export async function updateGroupMember(groupId: string, userId: string, updateData: any) {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .update(updateData)
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error(`Error updating member ${userId} in group ${groupId}:`, error)
    throw error
  }
}
