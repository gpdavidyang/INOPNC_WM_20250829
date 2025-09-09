import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  details: string
  timestamp: string
}

const results: TestResult[] = []

function logResult(test: string, status: 'PASS' | 'FAIL', details: string) {
  const result: TestResult = {
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  }
  results.push(result)
  console.log(`[${status}] ${test}: ${details}`)
}

async function testWorkOptions() {
  console.log('\n=== Testing Work Options ===')
  
  try {
    // Test component types
    const { data: componentTypes, error: compError } = await supabase
      .from('work_option_settings')
      .select('*')
      .eq('option_type', 'component_type')
      .eq('is_active', true)
      .order('display_order')
    
    if (compError) {
      logResult('Component Types Query', 'FAIL', `Database error: ${compError.message}`)
      return false
    }
    
    logResult('Component Types Query', 'PASS', `Found ${componentTypes.length} active component types`)
    
    // Test process types
    const { data: processTypes, error: procError } = await supabase
      .from('work_option_settings')
      .select('*')
      .eq('option_type', 'process_type')
      .eq('is_active', true)
      .order('display_order')
    
    if (procError) {
      logResult('Process Types Query', 'FAIL', `Database error: ${procError.message}`)
      return false
    }
    
    logResult('Process Types Query', 'PASS', `Found ${processTypes.length} active process types`)
    
    // Check if 균열 (crack) is present instead of 균일 (uniform)
    const crackOption = processTypes.find(p => p.option_label === '균열')
    const uniformOption = processTypes.find(p => p.option_label === '균일')
    
    if (crackOption && !uniformOption) {
      logResult('Typo Fix Verification', 'PASS', '균일 → 균열 typo has been fixed')
    } else if (uniformOption) {
      logResult('Typo Fix Verification', 'FAIL', '균일 typo still exists in database')
    } else {
      logResult('Typo Fix Verification', 'FAIL', 'Neither 균일 nor 균열 found in process types')
    }
    
    return true
  } catch (error) {
    logResult('Work Options Test', 'FAIL', `Unexpected error: ${error}`)
    return false
  }
}

async function testDailyReportCRUD() {
  console.log('\n=== Testing Daily Report CRUD Operations ===')
  
  try {
    // Get a test user (first user from profiles)
    const { data: users } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1)
    
    if (!users || users.length === 0) {
      logResult('Test User Setup', 'FAIL', 'No users found in database')
      return false
    }
    
    const testUserId = users[0].id
    logResult('Test User Setup', 'PASS', `Using user ID: ${testUserId}`)
    
    // Get a test site
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    if (!sites || sites.length === 0) {
      logResult('Test Site Setup', 'FAIL', 'No sites found in database')
      return false
    }
    
    const testSiteId = sites[0].id
    logResult('Test Site Setup', 'PASS', `Using site: ${sites[0].name}`)
    
    // Get component and process types for test data
    const { data: componentTypes } = await supabase
      .from('work_option_settings')
      .select('option_label')
      .eq('option_type', 'component_type')
      .eq('is_active', true)
      .limit(1)
    
    const { data: processTypes } = await supabase
      .from('work_option_settings')
      .select('option_label')
      .eq('option_type', 'process_type')
      .eq('is_active', true)
      .limit(1)
    
    if (!componentTypes?.length || !processTypes?.length) {
      logResult('Work Options for Test', 'FAIL', 'No active work options found for test')
      return false
    }
    
    const testComponentType = componentTypes[0].option_label
    const testProcessType = processTypes[0].option_label
    
    // CREATE: Insert test daily report
    const testReportData = {
      site_id: testSiteId,
      worker_id: testUserId,
      work_date: new Date().toISOString().split('T')[0],
      weather: '맑음',
      temperature: '15°C',
      work_details: [
        {
          component_type: testComponentType,
          process_type: testProcessType,
          quantity: 5,
          unit: 'm²',
          notes: 'Test work detail with dynamic options'
        }
      ],
      overall_notes: 'Test daily report for CRUD operations'
    }
    
    const { data: createdReport, error: createError } = await supabase
      .from('daily_reports')
      .insert(testReportData)
      .select()
      .single()
    
    if (createError) {
      logResult('Daily Report Creation', 'FAIL', `Creation error: ${createError.message}`)
      return false
    }
    
    logResult('Daily Report Creation', 'PASS', `Created report ID: ${createdReport.id}`)
    const testReportId = createdReport.id
    
    // READ: Fetch the created report
    const { data: fetchedReport, error: readError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', testReportId)
      .single()
    
    if (readError) {
      logResult('Daily Report Read', 'FAIL', `Read error: ${readError.message}`)
    } else {
      logResult('Daily Report Read', 'PASS', 'Successfully retrieved created report')
      
      // Verify work details contain dynamic options
      const workDetails = fetchedReport.work_details
      if (workDetails && workDetails.length > 0) {
        const detail = workDetails[0]
        if (detail.component_type === testComponentType && detail.process_type === testProcessType) {
          logResult('Dynamic Options in Report', 'PASS', 'Work details contain correct dynamic options')
        } else {
          logResult('Dynamic Options in Report', 'FAIL', 'Dynamic options not properly stored')
        }
      }
    }
    
    // UPDATE: Modify the report
    const updatedData = {
      overall_notes: 'Updated test daily report - CRUD test',
      work_details: [
        ...testReportData.work_details,
        {
          component_type: testComponentType,
          process_type: testProcessType,
          quantity: 3,
          unit: 'm',
          notes: 'Additional work detail added during update'
        }
      ]
    }
    
    const { error: updateError } = await supabase
      .from('daily_reports')
      .update(updatedData)
      .eq('id', testReportId)
    
    if (updateError) {
      logResult('Daily Report Update', 'FAIL', `Update error: ${updateError.message}`)
    } else {
      logResult('Daily Report Update', 'PASS', 'Successfully updated report')
    }
    
    // Verify update
    const { data: updatedReport } = await supabase
      .from('daily_reports')
      .select('work_details, overall_notes')
      .eq('id', testReportId)
      .single()
    
    if (updatedReport?.work_details?.length === 2) {
      logResult('Update Verification', 'PASS', 'Update correctly added work detail')
    } else {
      logResult('Update Verification', 'FAIL', 'Update did not properly modify work details')
    }
    
    // CLEANUP: Delete test report
    const { error: deleteError } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', testReportId)
    
    if (deleteError) {
      logResult('Daily Report Cleanup', 'FAIL', `Delete error: ${deleteError.message}`)
    } else {
      logResult('Daily Report Cleanup', 'PASS', 'Test report cleaned up successfully')
    }
    
    return true
  } catch (error) {
    logResult('Daily Report CRUD', 'FAIL', `Unexpected error: ${error}`)
    return false
  }
}

async function testReceiptUpload() {
  console.log('\n=== Testing Receipt File Upload ===')
  
  try {
    // Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      logResult('Storage Bucket Check', 'FAIL', `Bucket error: ${bucketError.message}`)
      return false
    }
    
    const receiptBucket = buckets.find(b => b.name === 'receipts')
    if (!receiptBucket) {
      logResult('Receipt Bucket Exists', 'FAIL', 'Receipts bucket not found')
      return false
    }
    
    logResult('Receipt Bucket Exists', 'PASS', 'Receipts bucket found')
    
    // Create a test file
    const testContent = 'Test receipt file content for daily report testing'
    const testFileName = `test-receipt-${Date.now()}.txt`
    const testFilePath = `/tmp/${testFileName}`
    
    fs.writeFileSync(testFilePath, testContent)
    
    // Test file upload
    const fileBuffer = fs.readFileSync(testFilePath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(`daily-reports/${testFileName}`, fileBuffer, {
        contentType: 'text/plain'
      })
    
    if (uploadError) {
      logResult('Receipt File Upload', 'FAIL', `Upload error: ${uploadError.message}`)
      return false
    }
    
    logResult('Receipt File Upload', 'PASS', `File uploaded: ${uploadData.path}`)
    
    // Test file retrieval
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(`daily-reports/${testFileName}`)
    
    if (downloadError) {
      logResult('Receipt File Download', 'FAIL', `Download error: ${downloadError.message}`)
    } else {
      logResult('Receipt File Download', 'PASS', 'File successfully downloaded')
    }
    
    // Test file URL generation
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(`daily-reports/${testFileName}`)
    
    if (urlData?.publicUrl) {
      logResult('Receipt File URL', 'PASS', `Public URL generated: ${urlData.publicUrl}`)
    } else {
      logResult('Receipt File URL', 'FAIL', 'Could not generate public URL')
    }
    
    // Cleanup test file
    const { error: deleteError } = await supabase.storage
      .from('receipts')
      .remove([`daily-reports/${testFileName}`])
    
    if (deleteError) {
      logResult('Receipt File Cleanup', 'FAIL', `Cleanup error: ${deleteError.message}`)
    } else {
      logResult('Receipt File Cleanup', 'PASS', 'Test file cleaned up')
    }
    
    // Remove local test file
    fs.unlinkSync(testFilePath)
    
    return true
  } catch (error) {
    logResult('Receipt Upload Test', 'FAIL', `Unexpected error: ${error}`)
    return false
  }
}

async function testDailyReportQueries() {
  console.log('\n=== Testing Daily Report Queries ===')
  
  try {
    // Test daily reports list query (used by admin screens)
    const { data: reports, error: listError } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        weather,
        temperature,
        work_details,
        overall_notes,
        receipt_urls,
        created_at,
        sites (
          name
        ),
        profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (listError) {
      logResult('Daily Reports List Query', 'FAIL', `Query error: ${listError.message}`)
      return false
    }
    
    logResult('Daily Reports List Query', 'PASS', `Retrieved ${reports.length} reports with joined data`)
    
    // Test filtering by date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const endDate = new Date()
    
    const { data: filteredReports, error: filterError } = await supabase
      .from('daily_reports')
      .select('id, work_date')
      .gte('work_date', startDate.toISOString().split('T')[0])
      .lte('work_date', endDate.toISOString().split('T')[0])
    
    if (filterError) {
      logResult('Date Range Filter Query', 'FAIL', `Filter error: ${filterError.message}`)
    } else {
      logResult('Date Range Filter Query', 'PASS', `Retrieved ${filteredReports.length} reports in date range`)
    }
    
    // Test aggregation query (for statistics)
    const { data: stats, error: statsError } = await supabase
      .from('daily_reports')
      .select('id, work_date')
      .gte('work_date', startDate.toISOString().split('T')[0])
    
    if (statsError) {
      logResult('Statistics Query', 'FAIL', `Stats error: ${statsError.message}`)
    } else {
      logResult('Statistics Query', 'PASS', `Statistics query returned ${stats.length} records`)
    }
    
    return true
  } catch (error) {
    logResult('Daily Report Queries', 'FAIL', `Unexpected error: ${error}`)
    return false
  }
}

async function generateReport() {
  const timestamp = new Date().toISOString()
  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const totalTests = results.length
  
  const reportContent = `# Daily Report Functionality Test Results

**Test Execution Date:** ${timestamp}
**Total Tests:** ${totalTests}
**Passed:** ${passCount}
**Failed:** ${failCount}
**Success Rate:** ${((passCount / totalTests) * 100).toFixed(1)}%

## Summary

This comprehensive test covers the following areas:
- Dynamic work options (component types and process types)
- Daily report CRUD operations (Create, Read, Update, Delete)
- Receipt file upload and storage functionality
- Database queries and joins
- Data filtering and statistics

## Test Results

${results.map(result => `
### ${result.test}
- **Status:** ${result.status}
- **Details:** ${result.details}
- **Timestamp:** ${result.timestamp}
`).join('')}

## Analysis

### Work Options System
${results.filter(r => r.test.includes('Options') || r.test.includes('Typo')).length > 0 ? 
  results.filter(r => r.test.includes('Options') || r.test.includes('Typo'))
    .map(r => `- ${r.test}: ${r.status === 'PASS' ? '✅' : '❌'} ${r.details}`).join('\n') : 
  '- No work options tests performed'}

### Database Operations
${results.filter(r => r.test.includes('CRUD') || r.test.includes('Query') || r.test.includes('Creation') || r.test.includes('Read') || r.test.includes('Update')).length > 0 ? 
  results.filter(r => r.test.includes('CRUD') || r.test.includes('Query') || r.test.includes('Creation') || r.test.includes('Read') || r.test.includes('Update'))
    .map(r => `- ${r.test}: ${r.status === 'PASS' ? '✅' : '❌'} ${r.details}`).join('\n') : 
  '- No database operation tests performed'}

### File Storage
${results.filter(r => r.test.includes('Receipt') || r.test.includes('Upload') || r.test.includes('Storage')).length > 0 ? 
  results.filter(r => r.test.includes('Receipt') || r.test.includes('Upload') || r.test.includes('Storage'))
    .map(r => `- ${r.test}: ${r.status === 'PASS' ? '✅' : '❌'} ${r.details}`).join('\n') : 
  '- No file storage tests performed'}

## Recommendations

${failCount > 0 ? `
**⚠️ Issues Found:**
${results.filter(r => r.status === 'FAIL').map(r => `
- **${r.test}:** ${r.details}
  - Recommended action: Investigate and fix the underlying cause
`).join('')}
` : '**✅ All Tests Passed:** No issues detected in the daily report functionality.'}

## Technical Notes

- Tests were performed using Supabase service role key for full database access
- Receipt uploads tested with temporary files in /tmp directory
- Dynamic work options verified against database content
- All test data was cleaned up after execution

---
*Generated by automated test script on ${new Date().toLocaleDateString()}*
`
  
  return reportContent
}

async function runAllTests() {
  console.log('🧪 Starting Daily Report Functionality Tests...\n')
  
  const workOptionsOk = await testWorkOptions()
  const crudOk = await testDailyReportCRUD()
  const receiptOk = await testReceiptUpload()
  const queriesOk = await testDailyReportQueries()
  
  console.log('\n=== Test Execution Complete ===')
  
  const report = await generateReport()
  
  // Write report to file
  const reportPath = path.join(process.cwd(), 'daily-report-test-results.md')
  fs.writeFileSync(reportPath, report)
  
  console.log(`\n📄 Test report generated: ${reportPath}`)
  console.log('\n' + '='.repeat(50))
  console.log(report)
  
  // Exit with error code if any tests failed
  const hasFailures = results.some(r => r.status === 'FAIL')
  process.exit(hasFailures ? 1 : 0)
}

runAllTests().catch(console.error)