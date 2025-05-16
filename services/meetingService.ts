import { query, queryOne } from "@/utils/mysql"

/**
 * Obtiene todas las reuniones de un usuario
 * @param username Nombre de usuario
 * @returns Lista de reuniones
 */
export async function getMeetings(username: string) {
  const sql = `SELECT * FROM meetings WHERE username = ? ORDER BY date DESC`
  return await query(sql, [username])
}

/**
 * Obtiene una reunión por su ID
 * @param id ID de la reunión
 * @param username Nombre de usuario (para verificación)
 * @returns Datos de la reunión
 */
export async function getMeetingById(id: number, username: string) {
  const sql = `SELECT * FROM meetings WHERE id = ? AND username = ?`
  return await queryOne(sql, [id, username])
}

/**
 * Crea una nueva reunión
 * @param meetingData Datos de la reunión
 * @param username Nombre de usuario
 * @returns ID de la reunión creada
 */
export async function createMeeting(meetingData: any, username: string) {
  const { title, date, summary, duration, participants } = meetingData

  const sql = `
    INSERT INTO meetings 
    (username, title, date, summary, duration, participants) 
    VALUES (?, ?, ?, ?, ?, ?)
  `

  const result = await query(sql, [
    username,
    title,
    new Date(date),
    summary || null,
    duration || null,
    participants || null,
  ])

  return result.insertId
}

/**
 * Actualiza una reunión existente
 * @param id ID de la reunión
 * @param meetingData Datos actualizados de la reunión
 * @param username Nombre de usuario (para verificación)
 * @returns Resultado de la actualización
 */
export async function updateMeeting(id: number, meetingData: any, username: string) {
  const { title, date, summary, duration, participants } = meetingData

  const sql = `
    UPDATE meetings 
    SET title = ?, date = ?, summary = ?, duration = ?, participants = ?
    WHERE id = ? AND username = ?
  `

  return await query(sql, [
    title,
    new Date(date),
    summary || null,
    duration || null,
    participants || null,
    id,
    username,
  ])
}

/**
 * Elimina una reunión
 * @param id ID de la reunión
 * @param username Nombre de usuario (para verificación)
 * @returns Resultado de la eliminación
 */
export async function deleteMeeting(id: number, username: string) {
  const sql = `DELETE FROM meetings WHERE id = ? AND username = ?`
  return await query(sql, [id, username])
}

/**
 * Busca reuniones por término de búsqueda
 * @param searchTerm Término de búsqueda
 * @param username Nombre de usuario
 * @returns Lista de reuniones que coinciden con la búsqueda
 */
export async function searchMeetings(searchTerm: string, username: string) {
  const sql = `
    SELECT * FROM meetings 
    WHERE username = ? AND (title LIKE ? OR summary LIKE ?)
    ORDER BY date DESC
  `
  return await query(sql, [username, `%${searchTerm}%`, `%${searchTerm}%`])
}

// Exportar todas las funciones como un objeto para compatibilidad
export const meetingService = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  searchMeetings,
}
