// DocContent.tsx - MainLayout 없이 doc 앱의 핵심 컨텐츠만 export
import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Mic,
  X,
  ArrowLeft,
  Check,
  Plus,
  MapPin,
  AlertCircle,
  FileText,
  ChevronRight,
  UploadCloud,
  Download,
  Share2,
  Trash2,
  Folder,
  Camera,
  Edit3,
  MoreHorizontal,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { TabType, DocumentGroup, FileItem, PunchData } from '@inopnc/shared/types'
import { ReportEditor } from './components/ReportEditor'

// Re-export from original App.tsx
export { default as DocApp } from './App'
