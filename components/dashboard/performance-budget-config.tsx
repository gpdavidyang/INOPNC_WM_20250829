'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Save, 
  RotateCcw,
  Download,
  Upload
} from 'lucide-react'
import { 
  PerformanceBudget, 
  PerformanceAlert,
  performanceBudgetManager,
  onPerformanceAlert,
  getPerformanceBudgetStatus 
} from '@/lib/monitoring/performance-budgets'

export function PerformanceBudgetConfig() {
  const [budgets, setBudgets] = useState<PerformanceBudget[]>([])
  const [recentAlerts, setRecentAlerts] = useState<PerformanceAlert[]>([])
  const [budgetStatus, setBudgetStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('budgets')

  // Load initial data
  useEffect(() => {
    loadBudgets()
    loadAlerts()
    loadStatus()
    
    // Subscribe to real-time alerts
    const handleAlert = (alert: PerformanceAlert) => {
      setRecentAlerts(prev => [alert, ...prev.slice(0, 49)]) // Keep latest 50 alerts
    }
    
    onPerformanceAlert(handleAlert)
    
    // Clean up subscription on unmount
    return () => {
      performanceBudgetManager.offAlert(handleAlert)
    }
  }, [])

  const loadBudgets = () => {
    const currentBudgets = performanceBudgetManager.getBudgets()
    setBudgets(currentBudgets)
  }

  const loadAlerts = () => {
    const alerts = performanceBudgetManager.getRecentAlerts(50)
    setRecentAlerts(alerts)
  }

  const loadStatus = () => {
    const status = getPerformanceBudgetStatus()
    setBudgetStatus(status)
  }

  const handleBudgetChange = (index: number, field: string, value: any) => {
    const newBudgets = [...budgets]
    if (field.includes('threshold.')) {
      const thresholdField = field.split('.')[1]
      newBudgets[index].thresholds = {
        ...newBudgets[index].thresholds,
        [thresholdField]: parseFloat(value) || 0
      }
    } else if (field === 'enabled') {
      newBudgets[index].enabled = value
    } else {
      newBudgets[index] = { ...newBudgets[index], [field]: value }
    }
    setBudgets(newBudgets)
    setHasChanges(true)
  }

  const saveBudgets = async () => {
    setIsLoading(true)
    try {
      // Update the budget manager
      performanceBudgetManager.importConfig(budgets)
      
      // Optionally save to server
      await fetch('/api/performance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets }),
      })
      
      setHasChanges(false)
      loadStatus()
    } catch (error) {
      console.error('Failed to save budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetBudgets = () => {
    loadBudgets()
    setHasChanges(false)
  }

  const exportConfig = () => {
    const config = performanceBudgetManager.exportConfig()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'performance-budgets.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        setBudgets(config)
        setHasChanges(true)
      } catch (error) {
        console.error('Failed to import config:', error)
      }
    }
    reader.readAsText(file)
  }

  const clearAlerts = () => {
    performanceBudgetManager.clearAlerts()
    setRecentAlerts([])
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'good': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Performance Budget Configuration</h3>
          <p className="text-muted-foreground">
            Configure performance thresholds and monitor budget violations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="secondary">Unsaved Changes</Badge>
          )}
          <Button variant="outline" size="sm" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={importConfig}
            className="hidden"
            id="import-config"
          />
          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-config')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {budgetStatus && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetStatus.total}</div>
              <p className="text-xs text-muted-foreground">
                {budgetStatus.enabled} enabled, {budgetStatus.disabled} disabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                {recentAlerts.filter(a => a.severity === 'critical').length} critical, {' '}
                {recentAlerts.filter(a => a.severity === 'warning').length} warnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Metrics</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetStatus.enabled}</div>
              <p className="text-xs text-muted-foreground">
                Active performance monitors
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Performance Budgets</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
        </TabsList>

        {/* Performance Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unsaved Changes</AlertTitle>
              <AlertDescription>
                You have unsaved changes to your performance budgets. Remember to save your changes.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={resetBudgets}
              disabled={!hasChanges || isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={saveBudgets}
              disabled={!hasChanges || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="space-y-4">
            {budgets.map((budget, index) => (
              <Card key={budget.metric}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription>
                        Metric: {budget.metric} ({budget.unit})
                      </CardDescription>
                    </div>
                    <Switch
                      checked={budget.enabled}
                      onCheckedChange={(checked) => handleBudgetChange(index, 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`good-${index}`}>Good Threshold</Label>
                      <Input
                        id={`good-${index}`}
                        type="number"
                        value={budget.thresholds.good}
                        onChange={(e) => handleBudgetChange(index, 'threshold.good', e.target.value)}
                        disabled={!budget.enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Values ≤ this are considered good
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`warning-${index}`}>Warning Threshold</Label>
                      <Input
                        id={`warning-${index}`}
                        type="number"
                        value={budget.thresholds.warning}
                        onChange={(e) => handleBudgetChange(index, 'threshold.warning', e.target.value)}
                        disabled={!budget.enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Values {'>'}= this trigger warnings
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`critical-${index}`}>Critical Threshold</Label>
                      <Input
                        id={`critical-${index}`}
                        type="number"
                        value={budget.thresholds.critical}
                        onChange={(e) => handleBudgetChange(index, 'threshold.critical', e.target.value)}
                        disabled={!budget.enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Values {'>'}= this trigger critical alerts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recent Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Recent Performance Alerts</h4>
            <Button variant="outline" size="sm" onClick={clearAlerts}>
              <XCircle className="h-4 w-4 mr-2" />
              Clear Alerts
            </Button>
          </div>

          {recentAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Recent Alerts</h3>
                  <p className="text-muted-foreground">All performance metrics are within budget</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: alert.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className={`${getSeverityColor(alert.severity)} text-white`}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <h4 className="font-semibold">{alert.budget.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {alert.value}{alert.budget.unit} (threshold: {alert.severity === 'critical' ? alert.budget.thresholds.critical : alert.budget.thresholds.warning}{alert.budget.unit})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="mt-3 p-2 bg-muted rounded">
                        <p className="text-xs font-medium mb-1">Additional Context:</p>
                        <pre className="text-xs text-muted-foreground">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}