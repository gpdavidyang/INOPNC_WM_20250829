import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { INITIAL_WORK_DATA, SALARY_HISTORY } from './constants'
import { WorkDataMap } from '@inopnc/shared/types'
import { MainLayout } from '@inopnc/shared'
import PayStubOverlay from './components/PayStubOverlay'
import OutputPage from './src/pages/OutputPage'
import SalaryPage from './src/pages/SalaryPage'

function App() {
  // Global state
  const [workData, setWorkData] = useState<WorkDataMap>(INITIAL_WORK_DATA)
  const [isPrivacyOn, setIsPrivacyOn] = useState(true)
  const [selectedPayStub, setSelectedPayStub] = useState<(typeof SALARY_HISTORY)[0] | null>(null)
  const [isPayStubOpen, setIsPayStubOpen] = useState(false)

  return (
    <BrowserRouter>
      <MainLayout title="INOPNC">
        <Routes>
          <Route path="/" element={<OutputPage workData={workData} setWorkData={setWorkData} />} />
          <Route
            path="/output"
            element={<OutputPage workData={workData} setWorkData={setWorkData} />}
          />
          <Route
            path="/salary"
            element={
              <SalaryPage
                isPrivacyOn={isPrivacyOn}
                setIsPrivacyOn={setIsPrivacyOn}
                selectedPayStub={selectedPayStub}
                setSelectedPayStub={setSelectedPayStub}
                isPayStubOpen={isPayStubOpen}
                setIsPayStubOpen={setIsPayStubOpen}
              />
            }
          />
        </Routes>

        {/* Global Overlays */}
        <PayStubOverlay
          isOpen={isPayStubOpen}
          onClose={() => setIsPayStubOpen(false)}
          data={selectedPayStub}
        />
      </MainLayout>
    </BrowserRouter>
  )
}

export default App
