const USERNAME_KEY = "juntify_username"

/**
 * Store username in localStorage
 * @param username The username to store
 */
export function storeUsername(username: string): void {
  if (typeof window !== "undefined" && username && username.trim() !== "") {
    localStorage.setItem(USERNAME_KEY, username.trim())
    console.log("Username stored in localStorage:", username.trim())
  } else {
    console.warn("Attempted to store empty or invalid username")
  }
}

/**
 * Get username from localStorage
 * @returns The stored username or null if not found
 */
export function getUsername(): string | null {
  if (typeof window !== "undefined") {
    const username = localStorage.getItem(USERNAME_KEY)
    if (!username) {
      console.warn("No username found in localStorage")
    }
    return username
  }
  return null
}

/**
 * Check if a username is stored
 * @returns True if a username is stored, false otherwise
 */
export function hasUsername(): boolean {
  return getUsername() !== null
}

/**
 * Clear stored username
 */
export function clearUsername(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USERNAME_KEY)
  }
}

// Add this new function to check if a user is authenticated before making API calls
export function ensureAuthenticated(): boolean {
  const username = getUsername()

  if (!username) {
    console.warn("No username found in localStorage")
    return false
  }

  return true
}

// Update the addUsernameToHeaders function to be more robust
export function addUsernameToHeaders(headers: HeadersInit = {}): HeadersInit {
  const username = getUsername()

  // Create a new Headers object to ensure we can modify it
  const newHeaders = new Headers(headers)

  if (username) {
    newHeaders.append("X-Username", username)
    return newHeaders
  } else {
    console.warn("No username available for request headers")
    return headers
  }
}

export async function getUsernameFromCookie(): Promise<string | null> {
  return getUsername()
}

import type { NextRequest } from "next/server"

export async function getUsernameFromRequest(request: NextRequest): Promise<string | null> {
  // Primero intentamos obtener el username del encabezado X-Username
  const username = request.headers.get("X-Username")
  if (username) {
    return username
  }

  // Si no hay encabezado X-Username, intentamos obtenerlo de los parámetros de consulta
  const usernameParam = request.nextUrl.searchParams.get("username")
  if (usernameParam) {
    return usernameParam
  }

  // Si no hay username en los encabezados ni en los parámetros, devolvemos null
  return null
}
