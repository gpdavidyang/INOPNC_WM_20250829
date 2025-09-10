'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { TrendingUp, Users, DollarSign, Clock, Calendar } from 'lucide-react'

interface SalaryChartData {
  name: string
  value: number
  count?: number
  hours?: number
}

interface SalaryChartProps {
  data: SalaryChartData[]
  type: 'bar' | 'pie' | 'line'
  title: string
  subtitle?: string
  height?: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function SalaryChart({ 
  data, 
  type, 
  title, 
  subtitle, 
  height = 300 
}: SalaryChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`
  }

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'value' || name === '급여') {
      return [formatCurrency(value), '급여']
    }
    if (name === 'count' || name === '인원') {
      return [`${value}명`, '인원']
    }
    if (name === 'hours' || name === '시간') {
      return [`${value}시간`, '근무시간']
    }
    return [value, name]
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          formatter={formatTooltip}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ 
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem'
          }}
        />
        <Bar 
          dataKey="value" 
          fill="#3B82F6" 
          radius={[4, 4, 0, 0]}
          name="급여"
        />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          formatter={formatTooltip}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ 
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          name="급여"
        />
      </LineChart>
    </ResponsiveContainer>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {type === 'bar' && <BarChart className="h-4 w-4" />}
            {type === 'pie' && <PieChart className="h-4 w-4" />}
            {type === 'line' && <TrendingUp className="h-4 w-4" />}
            <span className="capitalize">{type} Chart</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'line' && renderLineChart()}
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">항목</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">총액</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(data.reduce((sum, item) => sum + item.value, 0) / data.length)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">평균</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 사전 정의된 차트 컴포넌트들
export function WorkerSalaryChart({ data }: { data: SalaryChartData[] }) {
  return (
    <SalaryChart
      data={data}
      type="bar"
      title="작업자별 급여"
      subtitle="월별 작업자 급여 현황"
      height={350}
    />
  )
}

export function SiteSalaryChart({ data }: { data: SalaryChartData[] }) {
  return (
    <SalaryChart
      data={data}
      type="pie"
      title="현장별 급여 분포"
      subtitle="현장별 급여 비율"
      height={300}
    />
  )
}

export function MonthlySalaryTrendChart({ data }: { data: SalaryChartData[] }) {
  return (
    <SalaryChart
      data={data}
      type="line"
      title="월별 급여 추이"
      subtitle="지난 6개월 급여 변화"
      height={300}
    />
  )
}