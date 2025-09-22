import type { DatabaseBackupOptions, BackupJob, BackupLocation } from './types'

export class DatabaseBackupService {
  private supabase = createClient()
  private backupDir = process.env.BACKUP_DIR || './backups/database'
  
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

  async createFullBackup(
    jobId: string, 
    options: DatabaseBackupOptions,
    location: BackupLocation,
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
    try {
      progressCallback?.(10)
      
      // Get database connection info from Supabase
      const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
      if (!dbUrl) {
        throw new AppError('Database URL not configured')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-full-${timestamp}.sql${options.compression === 'gzip' ? '.gz' : ''}`
      const filePath = path.join(this.backupDir, filename)

      progressCallback?.(30)

      // Create pg_dump command
      const dumpArgs = [
        dbUrl,
        '--verbose',
        '--no-owner',
        '--no-privileges'
      ]

      if (options.include_schema && options.include_data) {
        // Full backup (default)
      } else if (options.include_schema && !options.include_data) {
        dumpArgs.push('--schema-only')
      } else if (!options.include_schema && options.include_data) {
        dumpArgs.push('--data-only')
      }

      // Include specific tables if specified
      if (options.tables && options.tables.length > 0) {
        options.tables.forEach(table => {
          dumpArgs.push('--table', table)
        })
      }

      // Exclude specific tables if specified
      if (options.exclude_tables && options.exclude_tables.length > 0) {
        options.exclude_tables.forEach(table => {
          dumpArgs.push('--exclude-table', table)
        })
      }

      progressCallback?.(50)

      // Execute pg_dump
      const backupResult = await this.executePgDump(dumpArgs, filePath, options.compression === 'gzip')
      
      if (!backupResult.success) {
        throw new AppError(backupResult.error || 'Database backup failed')
      }

      progressCallback?.(80)

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
      logError(error, 'createFullBackup')
      return {
        success: false,
        error: error instanceof AppError ? error.message : '데이터베이스 백업 중 오류가 발생했습니다.'
      }
    }
  }

  async createIncrementalBackup(
    jobId: string,
    lastBackupTime: string,
    options: DatabaseBackupOptions,
    location: BackupLocation,
    progressCallback?: (progress: number) => void
  ): Promise<{ success: boolean; filePath?: string; size?: number; error?: string }> {
    try {
      progressCallback?.(10)

      // For incremental backups, we'll export tables with WHERE conditions
      // based on updated_at or created_at timestamps
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-incremental-${timestamp}.sql${options.compression === 'gzip' ? '.gz' : ''}`
      const filePath = path.join(this.backupDir, filename)

      progressCallback?.(30)

      // Get tables that have been modified since last backup
      const modifiedTables = await this.getModifiedTables(lastBackupTime)
      
      if (modifiedTables.length === 0) {
        return {
          success: true,
          filePath,
          size: 0
        }
      }

      progressCallback?.(50)

      // Create backup with modified data only
      const backupSql = await this.createIncrementalSQL(modifiedTables, lastBackupTime)
      
      if (options.compression === 'gzip') {
        await this.writeCompressedFile(filePath, backupSql)
      } else {
        await fs.writeFile(filePath, backupSql, 'utf8')
      }

      progressCallback?.(80)

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
      logError(error, 'createIncrementalBackup')
      return {
        success: false,
        error: error instanceof AppError ? error.message : '증분 백업 중 오류가 발생했습니다.'
      }
    }
  }

  private async executePgDump(
    args: string[], 
    outputPath: string, 
    compress: boolean
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const pgDump = spawn('pg_dump', args)
      let errorOutput = ''

      if (compress) {
        const gzip = createGzip()
        const writeStream = require('fs').createWriteStream(outputPath)
        
        pgDump.stdout.pipe(gzip).pipe(writeStream)
      } else {
        const writeStream = require('fs').createWriteStream(outputPath)
        pgDump.stdout.pipe(writeStream)
      }

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ 
            success: false, 
            error: `pg_dump exited with code ${code}: ${errorOutput}` 
          })
        }
      })

      pgDump.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `pg_dump process error: ${error.message}` 
        })
      })
    })
  }

  private async getModifiedTables(since: string): Promise<string[]> {
    // This is a simplified version - in production, you'd query information_schema
    // or maintain a change log table to track modifications
    const tables = [
      'daily_reports',
      'profiles',
      'sites',
      'organizations',
      'documents',
      'notifications',
      'materials',
      'material_transactions',
      'attendance_records'
    ]

    const modifiedTables: string[] = []

    for (const table of tables) {
      try {
        // Check if table has records modified since last backup
        const { data, error } = await (this.supabase as unknown)
          .from(table)
          .select('id')
          .gte('updated_at', since)
          .limit(1)

        if (error) {
          logError(error, `getModifiedTables:${table}`)
          continue
        }

        if (data && data.length > 0) {
          modifiedTables.push(table)
        }
      } catch (error) {
        logError(error, `getModifiedTables:${table}`)
      }
    }

    return modifiedTables
  }

  private async createIncrementalSQL(tables: string[], since: string): Promise<string> {
    let sql = `-- Incremental backup from ${since}\n-- Generated at ${new Date().toISOString()}\n\n`

    for (const table of tables) {
      try {
        const { data, error } = await (this.supabase as unknown)
          .from(table)
          .select('*')
          .gte('updated_at', since)

        if (error) {
          logError(error, `createIncrementalSQL:${table}`)
          continue
        }

        if (data && data.length > 0) {
          sql += `-- Table: ${table}\n`
          sql += `DELETE FROM ${table} WHERE updated_at >= '${since}';\n`
          
          for (const row of data) {
            const columns = Object.keys(row).join(', ')
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
            ).join(', ')
            
            sql += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`
          }
          sql += '\n'
        }
      } catch (error) {
        logError(error, `createIncrementalSQL:${table}`)
      }
    }

    return sql
  }

  private async writeCompressedFile(filePath: string, content: string): Promise<void> {
    const gzip = createGzip()
    const writeStream = require('fs').createWriteStream(filePath)
    const readStream = require('stream').Readable.from(content)
    
    await pipeline(readStream, gzip, writeStream)
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

      // For SQL files, check basic structure
      if (filePath.endsWith('.sql') || filePath.endsWith('.sql.gz')) {
        const isCompressed = filePath.endsWith('.gz')
        let content: string

        if (isCompressed) {
          // Read compressed file
          const buffer = await fs.readFile(filePath)
          const zlib = require('zlib')
          const decompressed = zlib.gunzipSync(buffer)
          content = decompressed.toString('utf8')
        } else {
          content = await fs.readFile(filePath, 'utf8')
        }

        // Basic SQL validation
        if (!content.includes('--') && !content.includes('INSERT') && !content.includes('CREATE')) {
          return { valid: false, error: '백업 파일이 유효한 SQL 형식이 아닙니다.' }
        }
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
}