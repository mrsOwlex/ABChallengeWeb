import { Tile, TilesData, createInitialTiles, DEFAULT_FILLER_TEXT } from '@/models/tile'
import * as driveApi from './driveApi'

const APP_FOLDER_NAME = import.meta.env.VITE_APP_FOLDER_NAME || 'ABChallenge'
const TILES_FILE_NAME = 'tiles.json'

class DriveStorage {
  private folderId: string | null = null
  private tilesFileId: string | null = null
  private initializing: boolean = false
  private initPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    // Prevent concurrent initialization
    if (this.initializing && this.initPromise) {
      return this.initPromise
    }

    this.initializing = true
    this.initPromise = this.doInitialize()
    
    try {
      await this.initPromise
    } finally {
      this.initializing = false
    }
  }

  private async doInitialize(): Promise<void> {
    // Double-check if already initialized
    if (this.folderId && this.tilesFileId) {
      return
    }

    // Find or create app folder
    const folder = await this.findOrCreateFolderExclusive(APP_FOLDER_NAME)
    this.folderId = folder.id

    // Find or create tiles.json
    const tilesFile = await driveApi.findFileByName(TILES_FILE_NAME, this.folderId)
    if (tilesFile) {
      this.tilesFileId = tilesFile.id
    }
  }

  private async findOrCreateFolderExclusive(name: string): Promise<driveApi.DriveFile> {
    // First, try to find existing folder
    const existing = await driveApi.findFileByName(name)
    if (existing) {
      console.log('Found existing folder:', existing.id)
      return existing
    }

    // If not found, check again (in case of race condition)
    // Then create if still not found
    console.log('Creating new folder:', name)
    try {
      const newFolder = await driveApi.createFolder(name)
      console.log('Created folder:', newFolder.id)
      return newFolder
    } catch (error) {
      // If creation fails, try finding one more time
      // (another instance might have created it)
      const retry = await driveApi.findFileByName(name)
      if (retry) {
        console.log('Found folder on retry:', retry.id)
        return retry
      }
      throw error
    }
  }

  async loadData(): Promise<TilesData> {
    await this.initialize()

    // If no tiles file exists, create one with initial data
    if (!this.tilesFileId) {
      console.log('No tiles file found, creating initial data')
      const data: TilesData = {
        version: 2,
        tiles: createInitialTiles(),
        fillerText: DEFAULT_FILLER_TEXT,
      }
      await this.saveData(data)
      return data
    }

    try {
      console.log('Loading data from file:', this.tilesFileId)
      const content = await driveApi.getFileContent(this.tilesFileId)
      const parsed = JSON.parse(content)

      // Migration: detect v1 (plain array) vs v2 (object with version)
      let data: TilesData
      let needsSave = false
      if (Array.isArray(parsed)) {
        console.log('Migrating v1 data format to v2')
        data = { version: 2, tiles: parsed, fillerText: DEFAULT_FILLER_TEXT }
        needsSave = true
      } else {
        data = parsed as TilesData
      }

      // Ensure all A-Z tiles exist
      const existingIds = new Set(data.tiles.map(t => t.id))
      const missingIds = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
        .filter(id => !existingIds.has(id))

      if (missingIds.length > 0) {
        console.log('Adding missing tiles:', missingIds)
        data.tiles = [...data.tiles, ...missingIds.map(id => ({
          id,
          note: '',
          dateEnabled: false,
          date: null,
          thumbFileId: null,
          updatedAt: new Date().toISOString(),
        }))]
        needsSave = true
      }

      if (needsSave) {
        await this.saveData(data)
      }

      return data
    } catch (error) {
      console.error('Failed to load data:', error)
      const data: TilesData = {
        version: 2,
        tiles: createInitialTiles(),
        fillerText: DEFAULT_FILLER_TEXT,
      }
      await this.saveData(data)
      return data
    }
  }

  async saveData(data: TilesData): Promise<void> {
    await this.initialize()

    const content = JSON.stringify(data, null, 2)

    if (this.tilesFileId) {
      console.log('Updating existing tiles file:', this.tilesFileId)
      await driveApi.updateFile(this.tilesFileId, content)
    } else {
      // Check if file was created by another instance
      const existing = await driveApi.findFileByName(TILES_FILE_NAME, this.folderId!)
      if (existing) {
        console.log('Found existing tiles file, updating:', existing.id)
        this.tilesFileId = existing.id
        await driveApi.updateFile(this.tilesFileId, content)
      } else {
        console.log('Creating new tiles file')
        const file = await driveApi.createFile(TILES_FILE_NAME, content, this.folderId!)
        this.tilesFileId = file.id
      }
    }
  }

  async uploadThumbnail(blob: Blob, fileName: string): Promise<string> {
    await this.initialize()

    console.log('Uploading thumbnail:', fileName)
    const file = await driveApi.uploadBlob(fileName, blob, this.folderId!)
    return file.id
  }

  async deleteThumbnail(fileId: string): Promise<void> {
    try {
      await driveApi.deleteFile(fileId)
    } catch (error) {
      console.warn('Failed to delete thumbnail:', error)
      // Don't throw - orphaned files are acceptable in prototype
    }
  }

  getThumbnailUrl(fileId: string): string {
    return driveApi.getFileDownloadUrl(fileId)
  }

  getTilesFileId(): string | null {
    return this.tilesFileId
  }

  getFolderId(): string | null {
    return this.folderId
  }

  async shareAllPublic(tiles: Tile[]): Promise<void> {
    await this.batchPermissionOp(tiles, driveApi.shareFilePublic)
  }

  async unshareAll(tiles: Tile[]): Promise<void> {
    await this.batchPermissionOp(tiles, driveApi.unshareFilePublic)
  }

  /** Share a single file publicly. Used by thumbStorage for auto-sharing new uploads. */
  async shareFilePublic(fileId: string): Promise<void> {
    await driveApi.shareFilePublic(fileId)
  }

  private async batchPermissionOp(
    tiles: Tile[],
    op: (fileId: string) => Promise<void>,
  ): Promise<void> {
    await this.initialize()

    const fileIds: string[] = []
    if (this.tilesFileId) fileIds.push(this.tilesFileId)
    for (const tile of tiles) {
      if (tile.thumbFileId) fileIds.push(tile.thumbFileId)
    }

    for (let i = 0; i < fileIds.length; i += 5) {
      const batch = fileIds.slice(i, i + 5)
      const results = await Promise.allSettled(batch.map(id => op(id)))
      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.warn(`${failures.length} permission operation(s) failed:`, failures)
      }
    }
  }

  // Cleanup method for testing/debugging
  reset(): void {
    this.folderId = null
    this.tilesFileId = null
    this.initializing = false
    this.initPromise = null
  }
}

export const driveStorage = new DriveStorage()
