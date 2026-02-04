import { getDashboardStats } from './app/actions/admin/dashboard-stats'

async function test() {
  try {
    console.log('Testing getDashboardStats...')
    const result = await getDashboardStats()
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Caught error:', err)
  }
}

test()
