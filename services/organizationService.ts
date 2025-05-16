import { query, queryOne } from "@/utils/mysql"

/**
 * Obtiene todas las organizaciones
 * @returns Lista de organizaciones
 */
export async function getOrganizations() {
  const sql = `SELECT * FROM organizations ORDER BY name`
  return await query(sql, [])
}

/**
 * Obtiene una organización por su ID
 * @param id ID de la organización
 * @returns Datos de la organización
 */
export async function getOrganizationById(id: number) {
  const sql = `SELECT * FROM organizations WHERE id = ?`
  return await queryOne(sql, [id])
}

/**
 * Crea una nueva organización
 * @param name Nombre de la organización
 * @param createdBy ID del usuario que crea la organización
 * @returns ID de la organización creada
 */
export async function createOrganization(name: string, createdBy: string) {
  const sql = `INSERT INTO organizations (name, created_by) VALUES (?, ?)`
  const result = await query(sql, [name, createdBy])
  return result.insertId
}

/**
 * Actualiza una organización existente
 * @param id ID de la organización
 * @param name Nuevo nombre de la organización
 * @returns Resultado de la actualización
 */
export async function updateOrganization(id: number, name: string) {
  const sql = `UPDATE organizations SET name = ? WHERE id = ?`
  return await query(sql, [name, id])
}

/**
 * Elimina una organización
 * @param id ID de la organización
 * @returns Resultado de la eliminación
 */
export async function deleteOrganization(id: number) {
  const sql = `DELETE FROM organizations WHERE id = ?`
  return await query(sql, [id])
}

/**
 * Obtiene los miembros de una organización
 * @param organizationId ID de la organización
 * @returns Lista de miembros
 */
export async function getOrganizationMembers(organizationId: number) {
  const sql = `
    SELECT om.*, p.username, p.full_name, p.avatar_url
    FROM organization_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = ?
  `
  return await query(sql, [organizationId])
}

/**
 * Añade un miembro a una organización
 * @param organizationId ID de la organización
 * @param userId ID del usuario
 * @param role Rol del usuario en la organización
 * @returns Resultado de la operación
 */
export async function addOrganizationMember(organizationId: number, userId: string, role = "member") {
  const sql = `INSERT INTO organization_members (organization_id, user_id, role) VALUES (?, ?, ?)`
  return await query(sql, [organizationId, userId, role])
}

/**
 * Elimina un miembro de una organización
 * @param organizationId ID de la organización
 * @param userId ID del usuario
 * @returns Resultado de la operación
 */
export async function removeOrganizationMember(organizationId: number, userId: string) {
  const sql = `DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?`
  return await query(sql, [organizationId, userId])
}

/**
 * Cambia el rol de un miembro en una organización
 * @param organizationId ID de la organización
 * @param userId ID del usuario
 * @param newRole Nuevo rol
 * @returns Resultado de la operación
 */
export async function changeOrganizationMemberRole(organizationId: number, userId: string, newRole: string) {
  const sql = `UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?`
  return await query(sql, [newRole, organizationId, userId])
}

/**
 * Verifica si un usuario es miembro de una organización
 * @param organizationId ID de la organización
 * @param userId ID del usuario
 * @returns true si es miembro, false en caso contrario
 */
export async function isOrganizationMember(organizationId: number, userId: string) {
  const sql = `SELECT * FROM organization_members WHERE organization_id = ? AND user_id = ?`
  const result = await queryOne(sql, [organizationId, userId])
  return !!result
}

/**
 * Obtiene las organizaciones de un usuario
 * @param userId ID del usuario
 * @returns Lista de organizaciones
 */
export async function getUserOrganizations(userId: string) {
  const sql = `
    SELECT o.*, om.role
    FROM organizations o
    JOIN organization_members om ON o.id = om.organization_id
    WHERE om.user_id = ?
  `
  return await query(sql, [userId])
}

// Exportar todas las funciones como un objeto para compatibilidad
export const organizationService = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  addOrganizationMember,
  removeOrganizationMember,
  changeOrganizationMemberRole,
  isOrganizationMember,
  getUserOrganizations,
}
