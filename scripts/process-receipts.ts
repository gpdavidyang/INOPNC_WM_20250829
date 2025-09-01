import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RECEIPT_FOLDER = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/영수증_사진데이터';

// Sample receipt categories and amounts for auto-generation
const RECEIPT_CATEGORIES = [
  '교통비', '식비', '자재비', '연료비', '통신비', '기타 경비', '장비 렌탈비', '안전용품비'
];

// Daily reports from the database query
const DAILY_REPORTS = [
  { id: '8d7a56f8-4bac-4835-9036-9d2741ac67d7', work_date: '2025-08-31' },
  { id: 'a9f2317b-57a0-4b89-a014-89c34a130ab9', work_date: '2025-08-30' },
  { id: '3a88f591-04c8-45db-a34d-24200556af4e', work_date: '2025-08-28' },
  { id: 'f89b0947-9f78-4961-813e-05fa245df9da', work_date: '2025-08-28' },
  { id: '8b6746d7-cc9d-42b1-b6bf-6ed5a117a40a', work_date: '2025-08-28' },
  { id: 'ebb825c2-6230-414e-99ef-4b9008845787', work_date: '2025-08-28' },
  { id: '2f3d4e26-3930-4a95-b94d-94b469c1ddac', work_date: '2025-08-27' },
  { id: 'cb90d8f3-90de-4ee4-a3da-35a632b9771f', work_date: '2025-08-27' },
  { id: '335af3fe-868c-4160-9964-77bd4ce062ad', work_date: '2025-08-27' },
  { id: '583b85c5-b1e9-43da-a96d-7058df51f87c', work_date: '2025-08-27' },
  { id: '10540900-ff0b-49a0-b8b0-f4a4b6edfadd', work_date: '2025-08-26' },
  { id: '48819b4f-0161-4e24-b2bc-89c60498b4f6', work_date: '2025-08-26' },
  { id: '784035e1-2637-4331-aeae-14f2af550311', work_date: '2025-08-26' },
  { id: '5fe3a9a8-2ba1-4b23-bff5-bf592bc466fe', work_date: '2025-08-26' },
  { id: '62ea0ff6-1d66-4556-93f5-c5f0bf16df26', work_date: '2025-08-26' }
];

function generateRandomAmount(): number {
  // Generate amounts between 5,000 and 150,000 KRW
  const amounts = [5000, 8000, 12000, 15000, 20000, 25000, 30000, 45000, 50000, 80000, 120000, 150000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function generateRandomCategory(): string {
  return RECEIPT_CATEGORIES[Math.floor(Math.random() * RECEIPT_CATEGORIES.length)];
}

function getRandomDailyReport() {
  return DAILY_REPORTS[Math.floor(Math.random() * DAILY_REPORTS.length)];
}

function generateReceiptDate(workDate: string): string {
  // Generate receipt date within ±2 days of work date
  const baseDate = new Date(workDate);
  const dayOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2 days
  const receiptDate = new Date(baseDate);
  receiptDate.setDate(receiptDate.getDate() + dayOffset);
  return receiptDate.toISOString().split('T')[0];
}

async function uploadReceiptFile(filePath: string, fileName: string): Promise<string> {
  try {
    const fileBuffer = readFileSync(filePath);
    const timestamp = Date.now();
    const fileExt = extname(fileName).substring(1);
    const safeFileName = `${timestamp}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(safeFileName, fileBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: false
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error);
    throw error;
  }
}

async function insertReceiptRecord(receiptData: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('daily_documents')
      .insert([receiptData]);

    if (error) {
      console.error('Error inserting receipt record:', error);
      throw error;
    }

    console.log(`✓ Inserted receipt: ${receiptData.filename} -> ${receiptData.category} (${receiptData.amount}원)`);
  } catch (error) {
    console.error('Failed to insert receipt record:', error);
    throw error;
  }
}

async function processReceipts(): Promise<void> {
  try {
    console.log('Starting receipt processing...');
    
    // Get all receipt files
    const files = readdirSync(RECEIPT_FOLDER).filter(file => 
      ['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())
    );

    console.log(`Found ${files.length} receipt files to process`);

    for (const fileName of files) {
      try {
        const filePath = join(RECEIPT_FOLDER, fileName);
        const dailyReport = getRandomDailyReport();
        
        // Upload file to Supabase storage
        const storagePath = await uploadReceiptFile(filePath, fileName);
        
        // Generate public URL
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(storagePath);
        
        // Generate receipt metadata
        const receiptData = {
          daily_report_id: dailyReport.id,
          document_type: 'receipt',
          file_name: storagePath,
          filename: fileName,
          file_path: `receipts/${storagePath}`,
          file_url: urlData.publicUrl,
          file_size: readFileSync(filePath).length,
          category: generateRandomCategory(),
          amount: generateRandomAmount(),
          receipt_date: generateReceiptDate(dailyReport.work_date)
        };

        // Insert into database
        await insertReceiptRecord(receiptData);
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error);
        continue;
      }
    }

    console.log('✅ Receipt processing completed!');
    
  } catch (error) {
    console.error('Fatal error in receipt processing:', error);
    process.exit(1);
  }
}

// Run the script
processReceipts().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});