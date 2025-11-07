import fs from 'fs/promises'
import path from 'path'
import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  type SharedDocumentCategoryOption,
  normalizeSharedDocumentCategories,
} from '@/lib/constants/shared-document-categories'

const DEV_STORE_DIR = path.resolve(process.cwd(), '.tmp')
const DEV_STORE_PATH = path.join(DEV_STORE_DIR, 'shared-document-categories.json')

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(DEV_STORE_DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

export async function readDevSharedDocumentCategories(): Promise<SharedDocumentCategoryOption[]> {
  try {
    const raw = await fs.readFile(DEV_STORE_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return normalizeSharedDocumentCategories(parsed)
  } catch {
    return DEFAULT_SHARED_DOCUMENT_CATEGORIES
  }
}

export async function writeDevSharedDocumentCategories(
  categories: SharedDocumentCategoryOption[]
): Promise<void> {
  await ensureDir()
  await fs.writeFile(DEV_STORE_PATH, JSON.stringify(categories, null, 2), 'utf-8')
}

export async function resetDevSharedDocumentCategories(): Promise<SharedDocumentCategoryOption[]> {
  try {
    await fs.unlink(DEV_STORE_PATH)
  } catch {
    /* ignore */
  }
  return DEFAULT_SHARED_DOCUMENT_CATEGORIES
}
