import type { FileBackupOptions, BackupLocation } from './types'

export class FileBackupService {
  private backupDir = process.env.BACKUP_DIR || './backups/files'
  
  constructor() {
    this.ensureBackupDirectory()
  }

  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      logError(error, 'ensureBackupDirectory')
    }
  }

  async createFileBackup(
    jobId: string,
    options: FileBackupOptions,
    location: BackupLocation,
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
    try {
      progressCallback?.(5)

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-files-${timestamp}.${this.getFileExtension(options.compression)}`
      const filePath = path.join(this.backupDir, filename)

      progressCallback?.(10)

      // Get list of files to backup
      const filesToBackup = await this.getFilesToBackup(options)
      
      if (filesToBackup.length === 0) {
        return {
          success: true,
          filePath,
          size: 0
        }
      }

      progressCallback?.(30)

      // Create backup based on compression type
      let backupResult: { success: boolean; error?: string }

      switch (options.compression) {
        case 'tar.gz':
          backupResult = await this.createTarGzBackup(filesToBackup, filePath, progressCallback)
          break
        case 'zip':
          backupResult = await this.createZipBackup(filesToBackup, filePath, progressCallback)
          break
        case 'gzip':
          backupResult = await this.createGzipBackup(filesToBackup, filePath, progressCallback)
          break
        default:
          backupResult = await this.createUncompressedBackup(filesToBackup, filePath, progressCallback)
          break
      }

      if (!backupResult.success) {
        throw new AppError(backupResult.error || '파일 백업 중 오류가 발생했습니다.')
      }

      progressCallback?.(90)

      // Get file size
      const stats = await fs.stat(filePath)
      const fileSize = stats.size

      // Move to final location if not local
      if (location.type !== 'local') {
        await this.moveToLocation(filePath, location)
      }

      progressCallback?.(100)

      return {
        success: true,
        filePath,
        size: fileSize
      }
    } catch (error) {
      logError(error, 'createFileBackup')
      return {
        success: false,
        error: error instanceof AppError ? error.message : '파일 백업 중 오류가 발생했습니다.'
      }
    }
  }

  private async getFilesToBackup(options: FileBackupOptions): Promise<string[]> {
    const allFiles: string[] = []

    for (const directory of options.directories) {
      try {
        // Check if directory exists
        const stats = await fs.stat(directory)
        if (!stats.isDirectory()) {
          logError(new Error(`Not a directory: ${directory}`), 'getFilesToBackup')
          continue
        }

        // Build glob patterns
        const includePatterns = options.include_patterns || ['**/*']
        const excludePatterns = options.exclude_patterns || []

        for (const pattern of includePatterns) {
          const fullPattern = path.join(directory, pattern)
          const files = await glob(fullPattern, {
            ignore: excludePatterns.map(ep => path.join(directory, ep)),
            nodir: true, // Only files, not directories
            follow: options.follow_symlinks
          })

          // Filter by file size if specified
          for (const file of files) {
            try {
              const fileStats = await fs.stat(file)
              
              if (options.max_file_size && fileStats.size > options.max_file_size) {
                continue // Skip files that are too large
              }

              allFiles.push(file)
            } catch (error) {
              logError(error, `getFilesToBackup:stat:${file}`)
            }
          }
        }
      } catch (error) {
        logError(error, `getFilesToBackup:${directory}`)
      }
    }

    // Remove duplicates
    return Array.from(new Set(allFiles))
  }

  private getFileExtension(compression: string): string {
    switch (compression) {
      case 'tar.gz':
        return 'tar.gz'
      case 'zip':
        return 'zip'
      case 'gzip':
        return 'gz'
      default:
        return 'tar'
    }
  }

  private async createTarGzBackup(
    files: string[], 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Create tar command with gzip compression
      const tarArgs = ['-czf', outputPath, ...files]
      const tar = spawn('tar', tarArgs)
      
      let errorOutput = ''

      tar.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      let processed = 0
      tar.stdout.on('data', () => {
        processed++
        const progress = Math.min(30 + (processed / files.length) * 50, 80)
        progressCallback?.(progress)
      })

      tar.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ 
            success: false, 
            error: `tar command failed with code ${code}: ${errorOutput}` 
          })
        }
      })

      tar.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `tar process error: ${error.message}` 
        })
      })
    })
  }

  private async createZipBackup(
    files: string[], 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Create zip command
      const zipArgs = ['-r', outputPath, ...files]
      const zip = spawn('zip', zipArgs)
      
      let errorOutput = ''

      zip.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      let processed = 0
      zip.stdout.on('data', () => {
        processed++
        const progress = Math.min(30 + (processed / files.length) * 50, 80)
        progressCallback?.(progress)
      })

      zip.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ 
            success: false, 
            error: `zip command failed with code ${code}: ${errorOutput}` 
          })
        }
      })

      zip.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `zip process error: ${error.message}` 
        })
      })
    })
  }

  private async createGzipBackup(
    files: string[], 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For gzip, we'll create a tar first, then gzip it
      const tarPath = outputPath.replace('.gz', '')
      
      // Create tar file first
      const tarResult = await this.createUncompressedBackup(files, tarPath, (progress) => {
        progressCallback?.(30 + progress * 0.4) // 30-70%
      })

      if (!tarResult.success) {
        return tarResult
      }

      // Compress with gzip
      const readStream = createReadStream(tarPath)
      const writeStream = createWriteStream(outputPath)
      const gzip = createGzip()

      await pipeline(readStream, gzip, writeStream)

      // Remove uncompressed tar file
      await fs.unlink(tarPath)

      progressCallback?.(80)

      return { success: true }
    } catch (error) {
      logError(error, 'createGzipBackup')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Gzip backup failed' 
      }
    }
  }

  private async createUncompressedBackup(
    files: string[], 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Create uncompressed tar
      const tarArgs = ['-cf', outputPath, ...files]
      const tar = spawn('tar', tarArgs)
      
      let errorOutput = ''

      tar.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      let processed = 0
      tar.stdout.on('data', () => {
        processed++
        const progress = Math.min(30 + (processed / files.length) * 50, 80)
        progressCallback?.(progress)
      })

      tar.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ 
            success: false, 
            error: `tar command failed with code ${code}: ${errorOutput}` 
          })
        }
      })

      tar.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `tar process error: ${error.message}` 
        })
      })
    })
  }

  private async moveToLocation(filePath: string, location: BackupLocation): Promise<void> {
    // Implementation for moving files to different storage locations
    switch (location.type) {
      case 's3':
        await this.uploadToS3(filePath, location)
        break
      case 'gcs':
        await this.uploadToGCS(filePath, location)
        break
      case 'azure':
        await this.uploadToAzure(filePath, location)
        break
      case 'ftp':
        await this.uploadToFTP(filePath, location)
        break
      default:
        // Local storage - no action needed
        break
    }
  }

  private async uploadToS3(filePath: string, location: BackupLocation): Promise<void> {
    // AWS S3 upload implementation
    throw new AppError('S3 upload not implemented yet')
  }

  private async uploadToGCS(filePath: string, location: BackupLocation): Promise<void> {
    // Google Cloud Storage upload implementation
    throw new AppError('GCS upload not implemented yet')
  }

  private async uploadToAzure(filePath: string, location: BackupLocation): Promise<void> {
    // Azure Blob Storage upload implementation
    throw new AppError('Azure upload not implemented yet')
  }

  private async uploadToFTP(filePath: string, location: BackupLocation): Promise<void> {
    // FTP upload implementation
    throw new AppError('FTP upload not implemented yet')
  }

  async validateBackup(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists and is readable
      const stats = await fs.stat(filePath)
      
      if (stats.size === 0) {
        return { valid: false, error: '백업 파일이 비어있습니다.' }
      }

      // Validate based on file extension
      const ext = path.extname(filePath).toLowerCase()
      
      if (ext === '.gz' || filePath.endsWith('.tar.gz')) {
        // Test gzip integrity
        return await this.validateGzipFile(filePath)
      } else if (ext === '.zip') {
        // Test zip integrity
        return await this.validateZipFile(filePath)
      } else if (ext === '.tar') {
        // Test tar integrity
        return await this.validateTarFile(filePath)
      }

      return { valid: true }
    } catch (error) {
      logError(error, 'validateBackup')
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : '백업 파일 검증 중 오류가 발생했습니다.' 
      }
    }
  }

  private async validateGzipFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const gunzip = spawn('gunzip', ['-t', filePath])
      let errorOutput = ''

      gunzip.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      gunzip.on('close', (code) => {
        if (code === 0) {
          resolve({ valid: true })
        } else {
          resolve({ 
            valid: false, 
            error: `Gzip validation failed: ${errorOutput}` 
          })
        }
      })

      gunzip.on('error', (error) => {
        resolve({ 
          valid: false, 
          error: `Gzip validation error: ${error.message}` 
        })
      })
    })
  }

  private async validateZipFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const unzip = spawn('unzip', ['-t', filePath])
      let errorOutput = ''

      unzip.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      unzip.on('close', (code) => {
        if (code === 0) {
          resolve({ valid: true })
        } else {
          resolve({ 
            valid: false, 
            error: `Zip validation failed: ${errorOutput}` 
          })
        }
      })

      unzip.on('error', (error) => {
        resolve({ 
          valid: false, 
          error: `Zip validation error: ${error.message}` 
        })
      })
    })
  }

  private async validateTarFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const tar = spawn('tar', ['-tf', filePath])
      let errorOutput = ''

      tar.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      tar.on('close', (code) => {
        if (code === 0) {
          resolve({ valid: true })
        } else {
          resolve({ 
            valid: false, 
            error: `Tar validation failed: ${errorOutput}` 
          })
        }
      })

      tar.on('error', (error) => {
        resolve({ 
          valid: false, 
          error: `Tar validation error: ${error.message}` 
        })
      })
    })
  }
}