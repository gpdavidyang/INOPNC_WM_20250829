import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

async function main() {
  const userId = process.argv[2]
  const year = Number(process.argv[3])
  const month = Number(process.argv[4])
  if (!userId || !year || !month) {
    console.error('Usage: tsx scripts/debug-calc.ts <userId> <year> <month>')
    process.exit(1)
  }

  const res = await salaryCalculationService.calculateMonthlySalary(
    userId,
    year,
    month,
    undefined,
    true
  )
  console.log(JSON.stringify(res, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
