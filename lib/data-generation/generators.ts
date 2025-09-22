/**
 * Construction Data Generator for Korean Construction Sites
 * Generates realistic data for workers, daily reports, and construction activities
 */

;

export interface WorkerProfile {
  name: string;
  phone: string;
  role: 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin';
  site_id?: string;
  skills: string[];
  certifications: string[];
  years_experience: number;
  hourly_rate: number;
}

export interface DailyReport {
  date: string;
  site_id: string;
  weather: string;
  work_description: string;
  materials_used: MaterialUsage[];
  equipment_used: string[];
  safety_incidents: SafetyIncident[];
  progress_percentage: number;
  member_name: string;
  process_type: string;
  total_workers: number;
  issues?: string;
}

export interface MaterialUsage {
  material_name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface SafetyIncident {
  type: 'near_miss' | 'minor_injury' | 'property_damage' | 'none';
  description?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ConstructionSite {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  status: 'active' | 'inactive' | 'completed';
  project_type: string;
  start_date: string;
  estimated_completion: string;
}

export class ConstructionDataGenerator {
  private koreanSurnames = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'
  ];

  private koreanGivenNames = [
    '민준', '서준', '도윤', '시우', '주원', '하준', '지호', '건우', '우진', '선우',
    '연우', '유준', '정우', '승우', '시윤', '준서', '예준', '도현', '지우', '현우',
    '서진', '민서', '하은', '서윤', '지유', '채원', '정원', '다은', '수아', '소율',
    '서연', '예원', '지원', '윤서', '채윤', '지안', '시은', '수빈', '예진', '서영'
  ];

  private constructionSkills = [
    '철근 작업', '콘크리트 타설', '형틀 공사', '용접', '도장 작업',
    '전기 공사', '배관 공사', '타일 시공', '조적 공사', '미장 공사',
    '방수 공사', '단열 공사', '창호 설치', '지붕 공사', '도로 포장',
    '토공사', '기초 공사', '안전 관리', '품질 관리', '현장 관리'
  ];

  private certifications = [
    '건설기술자격증', '용접기능사', '전기기능사', '배관기능사', '타일기능사',
    '미장기능사', '방수기능사', '도장기능사', '조적기능사', '철근기능사',
    '안전관리자', '품질관리자', '건축기사', '토목기사', '건설안전기사',
    'ISO 인증', 'OSHA 인증', '크레인 운전자격증', '굴삭기 운전자격증', '지게차 운전자격증'
  ];

  private constructionProcesses = [
    '기초 공사', '골조 공사', '조적 공사', '미장 공사', '타일 공사',
    '도장 공사', '방수 공사', '단열 공사', '창호 공사', '지붕 공사',
    '전기 공사', '배관 공사', '마감 공사', '외부 공사', '조경 공사',
    '토공사', '철근 공사', '콘크리트 공사', '형틀 공사', '안전 점검'
  ];

  private weatherConditions = [
    '맑음', '흐림', '비', '눈', '안개', '바람',
    '더움', '추위', '습함', '건조함'
  ];

  private constructionMaterials = [
    { name: '시멘트', unit: 'kg', basePrice: 150 },
    { name: '모래', unit: 'm³', basePrice: 25000 },
    { name: '자갈', unit: 'm³', basePrice: 30000 },
    { name: '철근', unit: 'kg', basePrice: 800 },
    { name: '벽돌', unit: '개', basePrice: 300 },
    { name: '타일', unit: 'm²', basePrice: 15000 },
    { name: '페인트', unit: 'L', basePrice: 8000 },
    { name: '단열재', unit: 'm²', basePrice: 12000 },
    { name: '창호', unit: '개', basePrice: 200000 },
    { name: '배관재', unit: 'm', basePrice: 3000 }
  ];

  private constructionEquipment = [
    '굴삭기', '덤프트럭', '크레인', '지게차', '콘크리트 믹서기',
    '용접기', '절단기', '드릴', '해머드릴', '비계',
    '안전장비', '측량기', '레이저 레벨기', '발전기', '에어컴프레셔'
  ];

  private siteTypes = [
    '아파트 건설', '오피스텔 건설', '상업시설 건설', '공장 건설', '학교 건설',
    '병원 건설', '도로 건설', '교량 건설', '하수처리장 건설', '주차장 건설'
  ];

  private seoulDistricts = [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  /**
   * Generate Korean name
   */
  generateKoreanName(): string {
    const surname = faker.helpers.arrayElement(this.koreanSurnames);
    const givenName = faker.helpers.arrayElement(this.koreanGivenNames);
    return `${surname}${givenName}`;
  }

  /**
   * Generate Korean phone number
   */
  generateKoreanPhone(): string {
    const prefix = faker.helpers.arrayElement(['010', '011', '016', '017', '018', '019']);
    const middle = faker.string.numeric(4);
    const last = faker.string.numeric(4);
    return `${prefix}-${middle}-${last}`;
  }

  /**
   * Select worker role with realistic distribution
   */
  selectRole(): WorkerProfile['role'] {
    const random = Math.random();
    if (random < 0.7) return 'worker';
    if (random < 0.85) return 'site_manager';
    if (random < 0.93) return 'customer_manager';
    if (random < 0.98) return 'admin';
    return 'system_admin';
  }

  /**
   * Generate worker skills
   */
  generateSkills(): string[] {
    const numSkills = faker.number.int({ min: 2, max: 6 });
    return faker.helpers.arrayElements(this.constructionSkills, numSkills);
  }

  /**
   * Generate certifications
   */
  generateCertifications(): string[] {
    const numCertifications = faker.number.int({ min: 1, max: 4 });
    return faker.helpers.arrayElements(this.certifications, numCertifications);
  }

  /**
   * Generate worker profile
   */
  generateWorkerProfile(siteId?: string): WorkerProfile {
    const role = this.selectRole();
    const yearsExperience = faker.number.int({ min: 1, max: 30 });
    
    // Base hourly rate by role (in KRW)
    let baseRate = 15000; // Basic worker
    if (role === 'site_manager') baseRate = 25000;
    if (role === 'customer_manager') baseRate = 20000;
    if (role === 'admin') baseRate = 30000;
    if (role === 'system_admin') baseRate = 35000;
    
    // Adjust by experience
    const experienceMultiplier = 1 + (yearsExperience * 0.02);
    const hourlyRate = Math.round(baseRate * experienceMultiplier / 1000) * 1000; // Round to nearest 1000

    return {
      name: this.generateKoreanName(),
      phone: this.generateKoreanPhone(),
      role,
      site_id: siteId,
      skills: this.generateSkills(),
      certifications: this.generateCertifications(),
      years_experience: yearsExperience,
      hourly_rate: hourlyRate
    };
  }

  /**
   * Generate weather condition
   */
  generateWeather(): string {
    return faker.helpers.arrayElement(this.weatherConditions);
  }

  /**
   * Generate work description
   */
  generateWorkDescription(): string {
    const process = faker.helpers.arrayElement(this.constructionProcesses);
    const details = [
      '순조롭게 진행됨',
      '일부 지연 발생',
      '예정보다 빠르게 완료',
      '품질 검사 통과',
      '안전 점검 완료',
      '자재 추가 필요',
      '날씨로 인한 일정 조정',
      '기술적 문제 해결'
    ];
    const detail = faker.helpers.arrayElement(details);
    return `${process} - ${detail}`;
  }

  /**
   * Generate material usage
   */
  generateMaterialUsage(): MaterialUsage[] {
    const numMaterials = faker.number.int({ min: 2, max: 5 });
    const selectedMaterials = faker.helpers.arrayElements(this.constructionMaterials, numMaterials);
    
    return selectedMaterials.map(material => ({
      material_name: material.name,
      quantity: faker.number.float({ min: 1, max: 100, multipleOf: 0.5 }),
      unit: material.unit,
      cost: material.basePrice * faker.number.float({ min: 0.8, max: 1.2 })
    }));
  }

  /**
   * Generate equipment usage
   */
  generateEquipmentUsage(): string[] {
    const numEquipment = faker.number.int({ min: 2, max: 6 });
    return faker.helpers.arrayElements(this.constructionEquipment, numEquipment);
  }

  /**
   * Generate safety data
   */
  generateSafetyData(): SafetyIncident[] {
    const random = Math.random();
    
    // 85% chance of no incidents
    if (random < 0.85) {
      return [{
        type: 'none',
        severity: 'low'
      }];
    }
    
    // 10% chance of near miss
    if (random < 0.95) {
      return [{
        type: 'near_miss',
        description: '안전모 미착용 발견',
        severity: 'low'
      }];
    }
    
    // 4% chance of minor injury
    if (random < 0.99) {
      return [{
        type: 'minor_injury',
        description: '경미한 찰과상',
        severity: 'medium'
      }];
    }
    
    // 1% chance of property damage
    return [{
      type: 'property_damage',
      description: '장비 손상',
      severity: 'high'
    }];
  }

  /**
   * Calculate progress percentage
   */
  calculateProgress(): number {
    return faker.number.int({ min: 1, max: 100 });
  }

  /**
   * Generate daily report
   */
  generateDailyReport(date: Date, siteId: string, memberName?: string): DailyReport {
    return {
      date: date.toISOString().split('T')[0],
      site_id: siteId,
      weather: this.generateWeather(),
      work_description: this.generateWorkDescription(),
      materials_used: this.generateMaterialUsage(),
      equipment_used: this.generateEquipmentUsage(),
      safety_incidents: this.generateSafetyData(),
      progress_percentage: this.calculateProgress(),
      member_name: memberName || this.generateKoreanName(),
      process_type: faker.helpers.arrayElement(this.constructionProcesses),
      total_workers: faker.number.int({ min: 3, max: 15 }),
      issues: faker.datatype.boolean(0.2) ? '자재 지연으로 인한 일정 조정 필요' : undefined
    };
  }

  /**
   * Generate construction site
   */
  generateSite(): ConstructionSite {
    const district = faker.helpers.arrayElement(this.seoulDistricts);
    const buildingNumber = faker.number.int({ min: 1, max: 999 });
    const roadNumber = faker.number.int({ min: 1, max: 100 });
    
    const startDate = faker.date.past({ years: 1 });
    const estimatedCompletion = new Date(startDate);
    estimatedCompletion.setMonth(estimatedCompletion.getMonth() + faker.number.int({ min: 6, max: 36 }));

    return {
      name: `${district} ${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}현장`,
      address: `서울시 ${district} ${faker.helpers.arrayElement(['강남대로', '테헤란로', '역삼로', '논현로', '선릉로'])} ${roadNumber}길 ${buildingNumber}`,
      contact_person: this.generateKoreanName(),
      contact_phone: this.generateKoreanPhone(),
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive', 'completed']), // 75% active
      project_type: faker.helpers.arrayElement(this.siteTypes),
      start_date: startDate.toISOString().split('T')[0],
      estimated_completion: estimatedCompletion.toISOString().split('T')[0]
    };
  }

  /**
   * Generate attendance record with labor hours (공수)
   */
  generateAttendanceRecord(userId: string, siteId: string, date: Date) {
    const workDate = new Date(date);
    const isWeekend = workDate.getDay() === 0 || workDate.getDay() === 6;
    const isHoliday = faker.datatype.boolean(0.05); // 5% chance of holiday
    
    let status = 'present';
    let laborHours = 1.0; // Default full day
    let workHours = 8;
    let overtimeHours = 0;

    if (isWeekend || isHoliday) {
      if (faker.datatype.boolean(0.8)) { // 80% chance of no work on weekend/holiday
        status = 'absent';
        laborHours = 0;
        workHours = 0;
      } else {
        // Weekend/holiday work
        laborHours = faker.helpers.arrayElement([0.5, 1.0, 1.5]);
        workHours = laborHours * 8;
        overtimeHours = workHours > 8 ? workHours - 8 : 0;
      }
    } else {
      // Weekday work
      const random = Math.random();
      if (random < 0.05) { // 5% absent
        status = 'absent';
        laborHours = 0;
        workHours = 0;
      } else if (random < 0.15) { // 10% half day
        status = 'present';
        laborHours = 0.5;
        workHours = 4;
      } else if (random < 0.25) { // 10% overtime
        status = 'present';
        laborHours = 1.5;
        workHours = 12;
        overtimeHours = 4;
      } else { // 75% full day
        status = 'present';
        laborHours = 1.0;
        workHours = 8;
      }
    }

    const checkInTime = workHours > 0 ? 
      `${String(faker.number.int({ min: 7, max: 9 })).padStart(2, '0')}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}:00` : 
      null;
    
    const checkOutTime = workHours > 0 ? 
      `${String(faker.number.int({ min: 17, max: 21 })).padStart(2, '0')}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, '0')}:00` : 
      null;

    return {
      user_id: userId,
      site_id: siteId,
      work_date: workDate.toISOString().split('T')[0],
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      status,
      work_hours: workHours,
      overtime_hours: overtimeHours,
      labor_hours: laborHours,
      notes: faker.datatype.boolean(0.1) ? '정상 근무' : null
    };
  }

  /**
   * Generate multiple months of historical data
   */
  generateHistoricalAttendance(userId: string, siteId: string, months: number = 6) {
    const records = [];
    const endDate = new Date();
    
    for (let monthOffset = 0; monthOffset < months; monthOffset++) {
      const currentDate = new Date(endDate);
      currentDate.setMonth(currentDate.getMonth() - monthOffset);
      currentDate.setDate(1);
      
      // Generate entire month
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const workDate = new Date(currentDate);
        workDate.setDate(day);
        
        records.push(this.generateAttendanceRecord(userId, siteId, workDate));
      }
    }
    
    return records;
  }
}

/**
 * Korean Payroll Calculator
 * Handles 공수 (labor hours) calculation, overtime, and deductions
 */
export interface PayrollData {
  user_id: string;
  period: string; // YYYY-MM format
  base_salary: number;
  hourly_rate: number;
  regular_hours: number;
  overtime_hours: number;
  total_labor_hours: number; // 공수
  regular_pay: number;
  overtime_pay: number;
  total_gross_pay: number;
  
  // Korean deductions
  national_pension: number; // 국민연금 (4.5%)
  health_insurance: number; // 건강보험 (3.495%)
  long_term_care: number; // 장기요양보험 (0.4591%)
  employment_insurance: number; // 고용보험 (0.9%)
  income_tax: number; // 소득세
  local_tax: number; // 지방소득세 (소득세의 10%)
  
  total_deductions: number;
  net_pay: number;
  
  work_days: number;
  absent_days: number;
  overtime_days: number;
}

export interface PayrollSummary {
  total_employees: number;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  average_labor_hours: number;
  period: string;
}

export class PayrollCalculator {
  // Korean tax and insurance rates (2024)
  private readonly NATIONAL_PENSION_RATE = 0.045; // 4.5%
  private readonly HEALTH_INSURANCE_RATE = 0.03495; // 3.495%
  private readonly LONG_TERM_CARE_RATE = 0.004591; // 0.4591%
  private readonly EMPLOYMENT_INSURANCE_RATE = 0.009; // 0.9%
  private readonly LOCAL_TAX_RATE = 0.1; // 10% of income tax
  
  // Income tax brackets (simplified)
  private readonly INCOME_TAX_BRACKETS = [
    { min: 0, max: 14000000, rate: 0.06 }, // 6%
    { min: 14000000, max: 50000000, rate: 0.15 }, // 15%
    { min: 50000000, max: 88000000, rate: 0.24 }, // 24%
    { min: 88000000, max: 150000000, rate: 0.35 }, // 35%
    { min: 150000000, max: 300000000, rate: 0.38 }, // 38%
    { min: 300000000, max: 500000000, rate: 0.40 }, // 40%
    { min: 500000000, max: 1000000000, rate: 0.42 }, // 42%
    { min: 1000000000, max: Infinity, rate: 0.45 } // 45%
  ];
  
  /**
   * Calculate monthly payroll for a worker
   */
  calculateMonthlyPayroll(
    userId: string,
    attendanceRecords: unknown[],
    hourlyRate: number,
    period: string
  ): PayrollData {
    // Calculate work statistics
    const workDays = attendanceRecords.filter(record => record.status === 'present').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    const overtimeDays = attendanceRecords.filter(record => record.overtime_hours > 0).length;
    
    // Calculate hours
    const regularHours = attendanceRecords.reduce((sum, record) => {
      return sum + Math.min(record.work_hours || 0, 8);
    }, 0);
    
    const overtimeHours = attendanceRecords.reduce((sum, record) => {
      return sum + (record.overtime_hours || 0);
    }, 0);
    
    const totalLaborHours = attendanceRecords.reduce((sum, record) => {
      return sum + (record.labor_hours || 0);
    }, 0);
    
    // Calculate gross pay
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.5; // 150% for overtime
    const totalGrossPay = regularPay + overtimePay;
    
    // Calculate annual income estimate for tax calculation
    const annualIncomeEstimate = totalGrossPay * 12;
    
    // Calculate deductions
    const nationalPension = Math.min(totalGrossPay * this.NATIONAL_PENSION_RATE, 243000); // 2024 max
    const healthInsurance = totalGrossPay * this.HEALTH_INSURANCE_RATE;
    const longTermCare = healthInsurance * (this.LONG_TERM_CARE_RATE / this.HEALTH_INSURANCE_RATE);
    const employmentInsurance = totalGrossPay * this.EMPLOYMENT_INSURANCE_RATE;
    
    const incomeTax = this.calculateIncomeTax(annualIncomeEstimate) / 12;
    const localTax = incomeTax * this.LOCAL_TAX_RATE;
    
    const totalDeductions = nationalPension + healthInsurance + longTermCare + 
                          employmentInsurance + incomeTax + localTax;
    
    const netPay = totalGrossPay - totalDeductions;
    
    return {
      user_id: userId,
      period,
      base_salary: hourlyRate * 8 * 22, // Assuming 22 working days
      hourly_rate: hourlyRate,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      total_labor_hours: totalLaborHours,
      regular_pay: Math.round(regularPay),
      overtime_pay: Math.round(overtimePay),
      total_gross_pay: Math.round(totalGrossPay),
      national_pension: Math.round(nationalPension),
      health_insurance: Math.round(healthInsurance),
      long_term_care: Math.round(longTermCare),
      employment_insurance: Math.round(employmentInsurance),
      income_tax: Math.round(incomeTax),
      local_tax: Math.round(localTax),
      total_deductions: Math.round(totalDeductions),
      net_pay: Math.round(netPay),
      work_days: workDays,
      absent_days: absentDays,
      overtime_days: overtimeDays
    };
  }
  
  /**
   * Calculate income tax using Korean tax brackets
   */
  private calculateIncomeTax(annualIncome: number): number {
    let tax = 0;
    let remainingIncome = annualIncome;
    
    for (const bracket of this.INCOME_TAX_BRACKETS) {
      if (remainingIncome <= 0) break;
      
      const taxableInThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInThisBracket * bracket.rate;
      remainingIncome -= taxableInThisBracket;
    }
    
    return tax;
  }
  
  /**
   * Generate payroll summary for multiple employees
   */
  generatePayrollSummary(payrollData: PayrollData[], period: string): PayrollSummary {
    const totalEmployees = payrollData.length;
    const totalGrossPay = payrollData.reduce((sum, data) => sum + data.total_gross_pay, 0);
    const totalDeductions = payrollData.reduce((sum, data) => sum + data.total_deductions, 0);
    const totalNetPay = payrollData.reduce((sum, data) => sum + data.net_pay, 0);
    const totalLaborHours = payrollData.reduce((sum, data) => sum + data.total_labor_hours, 0);
    const averageLaborHours = totalLaborHours / totalEmployees;
    
    return {
      total_employees: totalEmployees,
      total_gross_pay: Math.round(totalGrossPay),
      total_deductions: Math.round(totalDeductions),
      total_net_pay: Math.round(totalNetPay),
      average_labor_hours: Math.round(averageLaborHours * 100) / 100, // Round to 2 decimals
      period
    };
  }
  
  /**
   * Generate sample payroll data for testing
   */
  generateSamplePayrollData(
    userIds: string[],
    siteId: string,
    period: string,
    generator: ConstructionDataGenerator
  ): PayrollData[] {
    const payrollData: PayrollData[] = [];
    
    for (const userId of userIds) {
      // Generate 6 months of attendance data
      const attendanceRecords = generator.generateHistoricalAttendance(userId, siteId, 1); // Just 1 month for the period
      
      // Filter for the specific period
      const [year, month] = period.split('-');
      const periodRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.work_date);
        return recordDate.getFullYear() === parseInt(year) && 
               recordDate.getMonth() === parseInt(month) - 1;
      });
      
      // Generate random hourly rate based on role
      const workerProfile = generator.generateWorkerProfile(siteId);
      const hourlyRate = workerProfile.hourly_rate;
      
      const payroll = this.calculateMonthlyPayroll(userId, periodRecords, hourlyRate, period);
      payrollData.push(payroll);
    }
    
    return payrollData;
  }
  
  /**
   * Format payroll data for display
   */
  formatPayrollForDisplay(payroll: PayrollData): Record<string, string> {
    return {
      period: payroll.period,
      totalLaborHours: `${payroll.total_labor_hours} 공수`,
      workDays: `${payroll.work_days}일`,
      regularPay: `${payroll.regular_pay.toLocaleString('ko-KR')}원`,
      overtimePay: `${payroll.overtime_pay.toLocaleString('ko-KR')}원`,
      totalGrossPay: `${payroll.total_gross_pay.toLocaleString('ko-KR')}원`,
      totalDeductions: `${payroll.total_deductions.toLocaleString('ko-KR')}원`,
      netPay: `${payroll.net_pay.toLocaleString('ko-KR')}원`,
      nationalPension: `${payroll.national_pension.toLocaleString('ko-KR')}원`,
      healthInsurance: `${payroll.health_insurance.toLocaleString('ko-KR')}원`,
      employmentInsurance: `${payroll.employment_insurance.toLocaleString('ko-KR')}원`,
      incomeTax: `${payroll.income_tax.toLocaleString('ko-KR')}원`
    };
  }
}

/**
 * Material Management Workflow System
 * Handles material requests, approvals, and inventory management
 */
export interface MaterialRequest {
  id: string;
  request_number: string;
  site_id: string;
  requested_by: string;
  requested_date: string;
  required_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  total_estimated_cost: number;
  materials: RequestedMaterial[];
  approvals: MaterialApproval[];
  delivery_info?: DeliveryInfo;
  notes?: string;
}

export interface RequestedMaterial {
  material_name: string;
  npc_code?: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_unit_cost: number;
  estimated_total_cost: number;
  specification?: string;
  supplier_preference?: string;
  justification?: string;
}

export interface MaterialApproval {
  id: string;
  approver_id: string;
  approver_name: string;
  approver_role: string;
  status: 'pending' | 'approved' | 'rejected';
  decision_date?: string;
  comments?: string;
  approval_level: number; // 1: Site Manager, 2: Admin, 3: System Admin
}

export interface DeliveryInfo {
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  supplier: string;
  supplier_contact: string;
  delivery_address: string;
  special_instructions?: string;
}

export interface MaterialInventory {
  site_id: string;
  material_name: string;
  npc_code?: string;
  category: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  reorder_level: number;
  last_updated: string;
}

export class MaterialWorkflowManager {
  private requestCounter = 1000;
  
  private materialCategories = [
    '구조재', '마감재', '설비재', '전기재', '안전용품',
    '기계부품', '소모품', '화학제품', '도구', '기타'
  ];
  
  private npcMaterials = [
    { name: '레미콘', npc_code: 'NPC-1001', category: '구조재', unit: 'm³', basePrice: 120000 },
    { name: '철근D10', npc_code: 'NPC-1002', category: '구조재', unit: 'kg', basePrice: 850 },
    { name: '철근D13', npc_code: 'NPC-1003', category: '구조재', unit: 'kg', basePrice: 880 },
    { name: '철근D16', npc_code: 'NPC-1004', category: '구조재', unit: 'kg', basePrice: 900 },
    { name: '형틀합판', npc_code: 'NPC-1005', category: '구조재', unit: '장', basePrice: 25000 },
    { name: '각목', npc_code: 'NPC-1006', category: '구조재', unit: 'm', basePrice: 3500 },
    { name: '시멘트', npc_code: 'NPC-1007', category: '구조재', unit: '포', basePrice: 8500 },
    { name: '모래', npc_code: 'NPC-1008', category: '구조재', unit: 'm³', basePrice: 35000 },
    { name: '자갈', npc_code: 'NPC-1009', category: '구조재', unit: 'm³', basePrice: 40000 },
    { name: '벽돌', npc_code: 'NPC-1010', category: '마감재', unit: '개', basePrice: 450 },
    { name: '타일(300x300)', npc_code: 'NPC-1011', category: '마감재', unit: '장', basePrice: 2500 },
    { name: '타일(600x600)', npc_code: 'NPC-1012', category: '마감재', unit: '장', basePrice: 5500 },
    { name: '도료', npc_code: 'NPC-1013', category: '마감재', unit: 'L', basePrice: 12000 },
    { name: '석고보드', npc_code: 'NPC-1014', category: '마감재', unit: '장', basePrice: 8500 },
    { name: '단열재', npc_code: 'NPC-1015', category: '마감재', unit: 'm²', basePrice: 15000 },
    { name: 'PVC파이프', npc_code: 'NPC-1016', category: '설비재', unit: 'm', basePrice: 4500 },
    { name: '급수관', npc_code: 'NPC-1017', category: '설비재', unit: 'm', basePrice: 6500 },
    { name: '전선', npc_code: 'NPC-1018', category: '전기재', unit: 'm', basePrice: 2200 },
    { name: '콘센트', npc_code: 'NPC-1019', category: '전기재', unit: '개', basePrice: 8500 },
    { name: '안전모', npc_code: 'NPC-1020', category: '안전용품', unit: '개', basePrice: 15000 }
  ];
  
  private suppliers = [
    { name: '대한건설자재', contact: '02-1234-5678' },
    { name: '서울시멘트', contact: '02-2345-6789' },
    { name: '한국철강', contact: '02-3456-7890' },
    { name: '동부자재', contact: '02-4567-8901' },
    { name: '중앙레미콘', contact: '02-5678-9012' }
  ];

  /**
   * Generate material request number
   */
  generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(this.requestCounter++).padStart(4, '0');
    return `MR${year}${month}${sequence}`;
  }

  /**
   * Generate requested materials
   */
  generateRequestedMaterials(): RequestedMaterial[] {
    const numMaterials = faker.number.int({ min: 2, max: 8 });
    const selectedMaterials = faker.helpers.arrayElements(this.npcMaterials, numMaterials);
    
    return selectedMaterials.map(material => {
      const quantity = faker.number.float({ min: 1, max: 200, multipleOf: 0.5 });
      const unitCostVariation = faker.number.float({ min: 0.85, max: 1.15 });
      const estimatedUnitCost = Math.round(material.basePrice * unitCostVariation);
      const estimatedTotalCost = Math.round(quantity * estimatedUnitCost);
      
      return {
        material_name: material.name,
        npc_code: material.npc_code,
        category: material.category,
        quantity,
        unit: material.unit,
        estimated_unit_cost: estimatedUnitCost,
        estimated_total_cost: estimatedTotalCost,
        specification: faker.datatype.boolean(0.3) ? '표준 규격' : undefined,
        supplier_preference: faker.datatype.boolean(0.4) ? faker.helpers.arrayElement(this.suppliers).name : undefined,
        justification: faker.datatype.boolean(0.5) ? '공사 진행을 위해 필요' : undefined
      };
    });
  }

  /**
   * Generate material approval workflow
   */
  generateApprovalWorkflow(siteManagerName: string, status: MaterialRequest['status']): MaterialApproval[] {
    const approvals: MaterialApproval[] = [];
    
    // Level 1: Site Manager approval
    const siteManagerApproval: MaterialApproval = {
      id: faker.string.uuid(),
      approver_id: faker.string.uuid(),
      approver_name: siteManagerName,
      approver_role: 'site_manager',
      status: status === 'pending' ? 'pending' : 'approved',
      approval_level: 1,
      decision_date: status !== 'pending' ? faker.date.recent({ days: 2 }).toISOString().split('T')[0] : undefined,
      comments: status !== 'pending' ? '승인합니다.' : undefined
    };
    approvals.push(siteManagerApproval);
    
    // Level 2: Admin approval (for high-cost items)
    if (status !== 'pending') {
      const adminApproval: MaterialApproval = {
        id: faker.string.uuid(),
        approver_id: faker.string.uuid(),
        approver_name: '관리팀장',
        approver_role: 'admin',
        status: status === 'rejected' ? 'rejected' : 'approved',
        approval_level: 2,
        decision_date: faker.date.recent({ days: 1 }).toISOString().split('T')[0],
        comments: status === 'rejected' ? '예산 부족으로 반려' : '최종 승인'
      };
      approvals.push(adminApproval);
    }
    
    return approvals;
  }

  /**
   * Generate delivery information
   */
  generateDeliveryInfo(siteAddress: string, status: MaterialRequest['status']): DeliveryInfo | undefined {
    if (status !== 'ordered' && status !== 'delivered') return undefined;
    
    const supplier = faker.helpers.arrayElement(this.suppliers);
    const estimatedDelivery = faker.date.future({ days: 7 });
    
    return {
      estimated_delivery_date: estimatedDelivery.toISOString().split('T')[0],
      actual_delivery_date: status === 'delivered' ? 
        faker.date.recent({ days: 3 }).toISOString().split('T')[0] : undefined,
      supplier: supplier.name,
      supplier_contact: supplier.contact,
      delivery_address: siteAddress,
      special_instructions: faker.datatype.boolean(0.3) ? '현장 정문으로 배송' : undefined
    };
  }

  /**
   * Generate material request
   */
  generateMaterialRequest(
    siteId: string,
    siteAddress: string,
    requesterId: string,
    requesterName: string,
    siteManagerName: string
  ): MaterialRequest {
    const requestedMaterials = this.generateRequestedMaterials();
    const totalEstimatedCost = requestedMaterials.reduce((sum, material) => sum + material.estimated_total_cost, 0);
    
    // Determine status based on cost and random factors
    let status: MaterialRequest['status'] = 'pending';
    const random = Math.random();
    
    if (totalEstimatedCost < 500000) { // Under 500k KRW - usually approved quickly
      if (random < 0.7) status = 'approved';
      else if (random < 0.85) status = 'ordered';
      else if (random < 0.95) status = 'delivered';
      else status = 'rejected';
    } else if (totalEstimatedCost < 2000000) { // 500k-2M KRW - needs more approval
      if (random < 0.5) status = 'approved';
      else if (random < 0.7) status = 'ordered';
      else if (random < 0.8) status = 'delivered';
      else if (random < 0.9) status = 'pending';
      else status = 'rejected';
    } else { // Over 2M KRW - stricter approval
      if (random < 0.3) status = 'approved';
      else if (random < 0.4) status = 'ordered';
      else if (random < 0.5) status = 'delivered';
      else if (random < 0.8) status = 'pending';
      else status = 'rejected';
    }
    
    // Determine priority
    let priority: MaterialRequest['priority'] = 'medium';
    if (totalEstimatedCost > 5000000) priority = 'high';
    else if (totalEstimatedCost < 200000) priority = 'low';
    if (faker.datatype.boolean(0.1)) priority = 'urgent'; // 10% chance of urgent
    
    const requestedDate = faker.date.recent({ days: 10 });
    const requiredDate = faker.date.future({ days: 14 });
    
    return {
      id: faker.string.uuid(),
      request_number: this.generateRequestNumber(),
      site_id: siteId,
      requested_by: requesterId,
      requested_date: requestedDate.toISOString().split('T')[0],
      required_date: requiredDate.toISOString().split('T')[0],
      status,
      priority,
      total_estimated_cost: totalEstimatedCost,
      materials: requestedMaterials,
      approvals: this.generateApprovalWorkflow(siteManagerName, status),
      delivery_info: this.generateDeliveryInfo(siteAddress, status),
      notes: faker.datatype.boolean(0.4) ? '긴급히 필요한 자재입니다.' : undefined
    };
  }

  /**
   * Generate material inventory for site
   */
  generateMaterialInventory(siteId: string): MaterialInventory[] {
    const numMaterials = faker.number.int({ min: 15, max: 25 });
    const selectedMaterials = faker.helpers.arrayElements(this.npcMaterials, numMaterials);
    
    return selectedMaterials.map(material => {
      const currentStock = faker.number.float({ min: 0, max: 500, multipleOf: 0.5 });
      const reservedStock = faker.number.float({ min: 0, max: currentStock * 0.3, multipleOf: 0.5 });
      const availableStock = currentStock - reservedStock;
      const reorderLevel = faker.number.float({ min: 10, max: 50, multipleOf: 1 });
      const unitCostVariation = faker.number.float({ min: 0.9, max: 1.1 });
      const unitCost = Math.round(material.basePrice * unitCostVariation);
      
      return {
        site_id: siteId,
        material_name: material.name,
        npc_code: material.npc_code,
        category: material.category,
        current_stock: currentStock,
        reserved_stock: reservedStock,
        available_stock: availableStock,
        unit: material.unit,
        unit_cost: unitCost,
        total_value: Math.round(currentStock * unitCost),
        reorder_level: reorderLevel,
        last_updated: faker.date.recent({ days: 7 }).toISOString().split('T')[0]
      };
    });
  }

  /**
   * Generate multiple material requests for a site
   */
  generateMultipleMaterialRequests(
    siteId: string,
    siteAddress: string,
    workerProfiles: WorkerProfile[],
    count: number = 5
  ): MaterialRequest[] {
    const requests: MaterialRequest[] = [];
    const siteManager = workerProfiles.find(w => w.role === 'site_manager');
    const siteManagerName = siteManager?.name || '현장관리자';
    
    for (let i = 0; i < count; i++) {
      const requester = faker.helpers.arrayElement(workerProfiles);
      const request = this.generateMaterialRequest(
        siteId,
        siteAddress,
        faker.string.uuid(),
        requester.name,
        siteManagerName
      );
      requests.push(request);
    }
    
    return requests;
  }

  /**
   * Get material request statistics
   */
  getMaterialRequestStats(requests: MaterialRequest[]): {
    totalRequests: number;
    totalValue: number;
    statusBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    averageValue: number;
  } {
    const totalRequests = requests.length;
    const totalValue = requests.reduce((sum, req) => sum + req.total_estimated_cost, 0);
    const averageValue = totalValue / totalRequests;
    
    const statusBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};
    
    requests.forEach(req => {
      statusBreakdown[req.status] = (statusBreakdown[req.status] || 0) + 1;
      priorityBreakdown[req.priority] = (priorityBreakdown[req.priority] || 0) + 1;
    });
    
    return {
      totalRequests,
      totalValue: Math.round(totalValue),
      statusBreakdown,
      priorityBreakdown,
      averageValue: Math.round(averageValue)
    };
  }

  /**
   * Format material request for display
   */
  formatMaterialRequestForDisplay(request: MaterialRequest): Record<string, string> {
    const statusLabels = {
      'pending': '승인 대기',
      'approved': '승인 완료',
      'rejected': '반려',
      'ordered': '발주 완료',
      'delivered': '배송 완료',
      'cancelled': '취소'
    };
    
    const priorityLabels = {
      'low': '낮음',
      'medium': '보통',
      'high': '높음',
      'urgent': '긴급'
    };
    
    return {
      requestNumber: request.request_number,
      requestedDate: request.requested_date,
      requiredDate: request.required_date,
      status: statusLabels[request.status],
      priority: priorityLabels[request.priority],
      totalCost: `${request.total_estimated_cost.toLocaleString('ko-KR')}원`,
      materialsCount: `${request.materials.length}개 자재`,
      approvalsCount: `${request.approvals.length}단계 승인`
    };
  }
}

// Export singleton instances
export const constructionDataGenerator = new ConstructionDataGenerator();
export const payrollCalculator = new PayrollCalculator();
export const materialWorkflowManager = new MaterialWorkflowManager();