import { googleAuth } from './googleAuth'

const API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

async function getHeaders(): Promise<HeadersInit> {
  const token = await googleAuth.ensureAuthenticated()
  return {
    Authorization: `Bearer ${token}`,
  }
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  createdTime?: string
}

export async function findFileByName(name: string, parentId?: string): Promise<DriveFile | null> {
  const headers = await getHeaders()
  
  // Escape single quotes in filename
  const escapedName = name.replace(/'/g, "\\'")
  let query = `name='${escapedName}' and trashed=false`
  
  // If looking for folder, add mimeType filter
  if (parentId === undefined) {
    query += ` and mimeType='application/vnd.google-apps.folder'`
  }
  
  if (parentId) {
    query += ` and '${parentId}' in parents`
  }
  
  // Order by modifiedTime desc to get most recent first
  const response = await fetch(
    `${API_BASE}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name,mimeType,modifiedTime,createdTime)&orderBy=modifiedTime desc`,
    { headers }
  )
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to find file: ${response.statusText} - ${errorText}`)
  }
  
  const data = await response.json()
  
  if (data.files && data.files.length > 0) {
    if (data.files.length > 1) {
      console.warn(`Multiple files found for '${name}':`, data.files.map((f: DriveFile) => ({ id: f.id, modified: f.modifiedTime })))
    }
    return data.files[0]
  }
  
  return null
}

export async function createFolder(name: string, parentId?: string): Promise<DriveFile> {
  const headers = await getHeaders()
  
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId && { parents: [parentId] }),
  }
  
  const response = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create folder: ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

export async function findOrCreateFolder(name: string): Promise<DriveFile> {
  const existing = await findFileByName(name)
  if (existing) {
    return existing
  }
  return createFolder(name)
}

export async function createFile(name: string, content: string, parentId: string): Promise<DriveFile> {
  const headers = await getHeaders()
  
  const metadata = {
    name,
    parents: [parentId],
  }
  
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`
  
  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelimiter
  
  const response = await fetch(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  )
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create file: ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

export async function updateFile(fileId: string, content: string): Promise<void> {
  const headers = await getHeaders()
  
  const response = await fetch(
    `${UPLOAD_BASE}/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: content,
    }
  )
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update file: ${response.statusText} - ${errorText}`)
  }
}

export async function getFileContent(fileId: string): Promise<string> {
  const headers = await getHeaders()
  
  const response = await fetch(
    `${API_BASE}/files/${fileId}?alt=media`,
    { headers }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to get file content: ${response.statusText}`)
  }
  
  return response.text()
}

export async function getFileBlob(fileId: string): Promise<Blob> {
  const headers = await getHeaders()
  
  const response = await fetch(
    `${API_BASE}/files/${fileId}?alt=media`,
    { headers }
  )
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(`Access denied (403). The file may have been deleted or you don't have permission.`)
    }
    if (response.status === 404) {
      throw new Error(`File not found (404). The file may have been deleted.`)
    }
    throw new Error(`Failed to get file: ${response.statusText}`)
  }
  
  return response.blob()
}

export async function uploadBlob(
  name: string, 
  blob: Blob, 
  parentId: string
): Promise<DriveFile> {
  const headers = await getHeaders()
  
  const metadata = {
    name,
    parents: [parentId],
  }
  
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`
  
  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${blob.type}\r\n\r\n`
  
  const encoder = new TextEncoder()
  const metadataBuffer = encoder.encode(body)
  const blobBuffer = await blob.arrayBuffer()
  const closeBuffer = encoder.encode(closeDelimiter)
  
  const combined = new Uint8Array(metadataBuffer.length + blobBuffer.byteLength + closeBuffer.length)
  combined.set(metadataBuffer, 0)
  combined.set(new Uint8Array(blobBuffer), metadataBuffer.length)
  combined.set(closeBuffer, metadataBuffer.length + blobBuffer.byteLength)
  
  const response = await fetch(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: combined,
    }
  )
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload blob: ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

export async function deleteFile(fileId: string): Promise<void> {
  const headers = await getHeaders()
  
  const response = await fetch(`${API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`)
  }
}

export function getFileDownloadUrl(fileId: string): string {
  const token = googleAuth.getAccessToken()
  return `${API_BASE}/files/${fileId}?alt=media&access_token=${token}`
}

// ── Public sharing ──────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined

/** Make a Drive file publicly readable (anyone with the link). */
export async function shareFilePublic(fileId: string): Promise<void> {
  const headers = await getHeaders()

  const response = await fetch(
    `${API_BASE}/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to share file: ${response.statusText} - ${errorText}`)
  }
}

/** Revoke public access from a Drive file. */
export async function unshareFilePublic(fileId: string): Promise<void> {
  const headers = await getHeaders()

  const response = await fetch(
    `${API_BASE}/files/${fileId}/permissions/anyoneWithLink`,
    {
      method: 'DELETE',
      headers,
    }
  )

  // 404 is fine – permission may already be removed
  if (!response.ok && response.status !== 404) {
    const errorText = await response.text()
    throw new Error(`Failed to unshare file: ${response.statusText} - ${errorText}`)
  }
}

export class PublicApiError extends Error {
  constructor(public readonly status: number) {
    super(`Public API error: ${status}`)
    this.name = 'PublicApiError'
  }
}

async function fetchPublic(fileId: string): Promise<Response> {
  if (!API_KEY) throw new Error('VITE_GOOGLE_API_KEY is not configured')
  const response = await fetch(`${API_BASE}/files/${fileId}?alt=media&key=${API_KEY}`)
  if (!response.ok) throw new PublicApiError(response.status)
  return response
}

export async function getFileContentPublic(fileId: string): Promise<string> {
  const response = await fetchPublic(fileId)
  return response.text()
}

export async function getFileBlobPublic(fileId: string): Promise<Blob> {
  const response = await fetchPublic(fileId)
  return response.blob()
}

// Helper to list all duplicate folders/files (for cleanup)
export async function listAllByName(name: string): Promise<DriveFile[]> {
  const headers = await getHeaders()
  
  const escapedName = name.replace(/'/g, "\\'")
  const query = `name='${escapedName}' and trashed=false`
  
  const response = await fetch(
    `${API_BASE}/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name,mimeType,modifiedTime,createdTime)`,
    { headers }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.files || []
}
