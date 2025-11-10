'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Bell, 
  Settings, 
  Search, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  FileText,
  Calendar,
  Filter,
  ChevronRight,
  Package,
  Truck,
  Building2,
  User,
  LogOut,
  UserCircle,
  X,
  Plus,
  Download,
  Trophy,
  Medal,
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Target,
  Minus,
  Sparkles,
  RefreshCw,
  Activity, 
  Clock, 
  DollarSign, 
  Shield, 
  Users, 
  AlertCircle,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import DemoController from '../components/shared/demo-controller/DemoController'
import ToastNotifications from '../components/shared/toast-notifications/ToastNotifications'

// Types
interface Project {
  id: string
  name: string
  status: 'active' | 'completed'
  rfqCount: number
  cycleTime: number
  savingsAmount: number
  complianceRate: number
  vendorCount: number
  activeDecisions: number
}

interface VendorOffer {
  vendorId: string
  vendorName: string
  price: number
  deliveryDays: number
  paymentTerms: string
  compliance: string
  score: number
  rank: number
  status: 'pending' | 'approved' | 'rejected' | 'negotiating'
  materialGrade: string
  complianceStatus: 'compliant' | 'non-compliant'
}

interface Notification {
  id: string
  type: 'decision' | 'alert' | 'success' | 'info'
  title: string
  message: string
  time: Date
  isRead: boolean
  actionRequired: boolean
}

interface UserProfile {
  name: string
  role: string
  department: string
  avatar?: string
  email: string
}

declare global {
  interface Date {
    toRelativeString(): string;
  }
}


interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  textColor: string;
  expandedContent?: React.ReactNode;
  cardKey: string;
  expandedCardKey: string | null;
  setExpandedCardKey: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function Dashboard() {
  // State
  const [activeView, setActiveView] = useState('overview')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Demo and polling state
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [pollingError, setPollingError] = useState<string | null>(null)
  
  // Toast notifications
  const [toasts, setToasts] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
  }>>([])
  
  const addToast = (toast: Omit<typeof toasts[0], 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
  }
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Dynamic KPIs state
  const [kpis, setKpis] = useState({
    activeRfqs: isDemoMode ? 0 : 3,
    cycleTime: isDemoMode ? 0 : 9,
    monthlySavings: isDemoMode ? 0 : 180000,
    complianceRate: isDemoMode ? 0 : 94,
    vendorResponse: isDemoMode ? 0 : 3,
    criticalAlerts: isDemoMode ? 0 : 1
  })

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState({
    status: isDemoMode ? 'Idle' : 'Monitoring',
    message: isDemoMode ? 'Awaiting RFQ initiation...' : 'System operating within normal parameters. All vendors compliant.',
    lastUpdate: new Date()
  })

  // Demo start time for cycle time calculation
  const [demoStartTime, setDemoStartTime] = useState<Date | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'decision',
      title: 'Decision Required',
      message: 'Commercial evaluation complete for Project Eagle - 3 vendors ready for review',
      time: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      actionRequired: true
    },
    {
      id: '2',
      type: 'alert',
      title: 'Technical Non-Compliance',
      message: 'Vendor B Solutions submitted SS_304 instead of required SS_316L',
      time: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      actionRequired: false
    },
    {
      id: '3',
      type: 'success',
      title: 'RFQ Distributed',
      message: 'Project Eagle RFQ sent to 3 approved vendors',
      time: new Date(Date.now() - 30 * 60 * 1000),
      isRead: true,
      actionRequired: false
    }
  ])

  const currentUser: UserProfile = {
    name: 'Muhammad Ar-Rashid',
    role: 'Procurement Manager',
    department: 'Strategic Sourcing',
    email: 'muhammad.arrashid@binquraya.com',
    avatar: undefined
  }

  // Projects data
  const projects: Project[] = [
    { id: '001', name: 'Project Eagle', status: 'active', rfqCount: 3, cycleTime: 9, savingsAmount: 90000, complianceRate: 94, vendorCount: 3, activeDecisions: 1 },
    { id: '002', name: 'Project Falcon', status: 'active', rfqCount: 5, cycleTime: 12, savingsAmount: 72500, complianceRate: 89, vendorCount: 5, activeDecisions: 0 },
    { id: '003', name: 'Project Hawk', status: 'completed', rfqCount: 8, cycleTime: 15, savingsAmount: 160000, complianceRate: 96, vendorCount: 6, activeDecisions: 0 }
  ]

  // Get initial state based on mode
  const getInitialVendorOffers = () => {
    if (isDemoMode) {
      return [] // Start with no vendor offers in demo mode
    }
    // Live mode starts empty too, will be populated by real events
    return []
  }

  // Vendor offers
  const [vendorOffers, setVendorOffers] = useState<VendorOffer[]>(getInitialVendorOffers())

  // Process stages - dynamic based on events
  const [currentProcessStage, setCurrentProcessStage] = useState(isDemoMode ? 'initiation' : 'decision')
  const [processProgress, setProcessProgress] = useState(isDemoMode ? 0 : 90)
  
  const getProcessStages = () => {
    const stages = [
      { name: 'Initiation', status: 'pending', icon: FileText },
      { name: 'Distribution', status: 'pending', icon: Users },
      { name: 'Technical Review', status: 'pending', icon: Shield },
      { name: 'Commercial Evaluation', status: 'pending', icon: DollarSign },
      { name: 'Decision', status: 'pending', icon: CheckCircle2 },
      { name: 'Award', status: 'pending', icon: Trophy }
    ]
    
    // Update status based on current stage
    const stageOrder = ['initiation', 'distribution', 'technical-review', 'commercial-evaluation', 'decision', 'award']
    const currentIndex = stageOrder.indexOf(currentProcessStage)
    
    stages.forEach((stage, index) => {
      if (index < currentIndex) {
        stage.status = 'completed'
      } else if (index === currentIndex) {
        stage.status = 'current'
      }
    })
    
    return stages
  }
  

  // Recent activity
  const recentActivity = [
    { time: '10:15 AM', event: 'Commercial evaluation completed', type: 'success' },
    { time: '09:45 AM', event: 'Vendor C offer approved', type: 'info' },
    { time: '09:30 AM', event: 'TBC sent to Vendor B', type: 'warning' },
    { time: '08:00 AM', event: 'RFQ distributed to vendors', type: 'info' }
  ]

  // Vendor performance data for charts
  const vendorPerformance = [
    { vendorName: 'Vendor A Industries', wonRFQs: 18, totalRFQs: 24, responseTime: 2.5, complianceRate: 98, score: 92, rank: 1 },
    { vendorName: 'Vendor B Solutions', wonRFQs: 9, totalRFQs: 20, responseTime: 3.8, complianceRate: 85, score: 78, rank: 3 },
    { vendorName: 'Vendor C Global', wonRFQs: 6, totalRFQs: 18, responseTime: 4.2, complianceRate: 92, score: 71, rank: 4 },
    { vendorName: 'Delta Engineering', wonRFQs: 12, totalRFQs: 17, responseTime: 3.1, complianceRate: 94, score: 85, rank: 2 }
  ]

  // Project-specific data
  const projectSpecificData: Record<string, {
    vendors: string[];
    events: Array<{ time: string; event: string; type: string }>;
    cycleBreakdown: { initiation: number; distribution: number; technical: number; commercial: number; decision: number };
  }> = {
    '001': {
      vendors: ['Vendor A Industries', 'Vendor B Solutions', 'Vendor C Global'],
      events: [
        { time: '14:32', event: 'Decision package ready', type: 'success' },
        { time: '13:15', event: 'Vendor A technically approved', type: 'info' },
        { time: '12:45', event: 'TBC issued to Vendor B', type: 'warning' }
      ],
      cycleBreakdown: { initiation: 1, distribution: 2, technical: 3, commercial: 2, decision: 1 }
    },
    '002': {
      vendors: ['Delta Engineering', 'Echo Systems', 'Foxtrot Industries', 'Global Tech Solutions', 'Prime Contractors'],
      events: [
        { time: '11:20', event: 'Vendors under evaluation', type: 'info' },
        { time: '10:00', event: 'All technical reviews complete', type: 'success' },
        { time: 'Yesterday', event: 'RFQ sent to 5 vendors', type: 'info' }
      ],
      cycleBreakdown: { initiation: 1, distribution: 2, technical: 5, commercial: 3, decision: 1 }
    },
    '003': {
      vendors: ['Gulf Mechanical', 'Harbor Tech', 'Industrial Solutions', 'Advanced Systems', 'Tech Pioneers', 'Regional Suppliers'],
      events: [
        { time: '2 days ago', event: 'PO issued to Gulf Mechanical', type: 'success' },
        { time: '3 days ago', event: 'Award approved by management', type: 'success' },
        { time: '5 days ago', event: 'Decision package submitted', type: 'info' }
      ],
      cycleBreakdown: { initiation: 2, distribution: 3, technical: 4, commercial: 3, decision: 3 }
    }
  }

  // Kanban data for Live RFQ Tracker
  const [kanbanData, setKanbanData] = useState<Record<string, {
    sent: Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>;
    review: Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>;
    approved: Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>;
    evaluating: Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>;
    decided: Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>;
  }>>({
    '001': {
      sent: [
        { id: 'RFQ-001-A', commodity: 'Heat Exchanger', vendor: 'Delta Corp', date: '2 hours ago', urgent: false },
      ],
      review: [
        { id: 'RFQ-001-B', commodity: 'Heat Exchanger', vendor: 'Echo Systems', date: '1 day ago', urgent: true },
      ],
      approved: [
        { id: 'RFQ-001-C', commodity: 'Heat Exchanger', vendor: 'Vendor C Global', date: '2 days ago', urgent: false },
      ],
      evaluating: [
        { id: 'RFQ-001-ABC', commodity: 'Heat Exchanger', vendor: 'Multiple (3)', date: 'Now', urgent: true },
      ],
      decided: [
        { id: 'RFQ-001-FINAL', commodity: 'Heat Exchanger', vendor: 'Vendor A Industries', date: 'Ready', urgent: true },
      ]
    },
    '002': {
      sent: [
        { id: 'RFQ-002-D', commodity: 'Valves Package', vendor: 'Gulf Mechanical', date: '3 hours ago', urgent: false },
        { id: 'RFQ-002-E', commodity: 'Valves Package', vendor: 'Harbor Tech', date: '3 hours ago', urgent: false },
      ],
      review: [
        { id: 'RFQ-002-F', commodity: 'Valves Package', vendor: 'Foxtrot Industries', date: '1 day ago', urgent: false },
      ],
      approved: [
        { id: 'RFQ-002-DEF', commodity: 'Valves Package', vendor: 'Multiple (2)', date: '3 days ago', urgent: false },
      ],
      evaluating: [],
      decided: []
    },
    '003': {
      sent: [],
      review: [],
      approved: [],
      evaluating: [],
      decided: [
        { id: 'RFQ-003-COMPLETE', commodity: 'Compressor Unit', vendor: 'Gulf Mechanical', date: 'Completed', urgent: false },
      ]
    }
  })

  // Company-wide vendor rankings data
  const companyWideVendorRankings = [
    { rank: 1, name: 'Gulf Mechanical', totalRFQs: 145, winRate: 82, businessAwarded: 45750000, avgResponse: 2.2, compliance: 98, projectsCount: 28, trend: 'up', category: 'Mechanical Equipment', score: 95 },
    { rank: 2, name: 'Vendor A Industries', totalRFQs: 132, winRate: 75, businessAwarded: 38900000, avgResponse: 2.5, compliance: 98, projectsCount: 24, trend: 'up', category: 'Industrial Supplies', score: 92 },
    { rank: 3, name: 'Al-Faris Trading', totalRFQs: 118, winRate: 71, businessAwarded: 32500000, avgResponse: 2.8, compliance: 96, projectsCount: 22, trend: 'stable', category: 'General Trading', score: 89 },
    { rank: 4, name: 'Delta Engineering', totalRFQs: 98, winRate: 68, businessAwarded: 28700000, avgResponse: 2.8, compliance: 95, projectsCount: 18, trend: 'up', category: 'Engineering Services', score: 88 },
    { rank: 5, name: 'Harbor Tech', totalRFQs: 95, winRate: 60, businessAwarded: 24300000, avgResponse: 2.9, compliance: 94, projectsCount: 20, trend: 'stable', category: 'Technology Solutions', score: 86 },
    { rank: 6, name: 'Advanced Systems', totalRFQs: 87, winRate: 58, businessAwarded: 21800000, avgResponse: 3.0, compliance: 93, projectsCount: 16, trend: 'up', category: 'Automation Systems', score: 84 },
    { rank: 7, name: 'Echo Systems', totalRFQs: 82, winRate: 52, businessAwarded: 18900000, avgResponse: 3.2, compliance: 90, projectsCount: 15, trend: 'down', category: 'IT Solutions', score: 82 },
    { rank: 8, name: 'Prime Contractors', totalRFQs: 78, winRate: 48, businessAwarded: 17200000, avgResponse: 3.5, compliance: 92, projectsCount: 14, trend: 'stable', category: 'Construction', score: 80 },
    { rank: 9, name: 'Vendor B Solutions', totalRFQs: 75, winRate: 45, businessAwarded: 15600000, avgResponse: 3.8, compliance: 85, projectsCount: 13, trend: 'down', category: 'Software Solutions', score: 78 },
    { rank: 10, name: 'Tech Pioneers', totalRFQs: 72, winRate: 42, businessAwarded: 14100000, avgResponse: 3.6, compliance: 91, projectsCount: 12, trend: 'up', category: 'Innovation Tech', score: 76 },
    { rank: 11, name: 'Foxtrot Industries', totalRFQs: 68, winRate: 40, businessAwarded: 12800000, avgResponse: 4.0, compliance: 88, projectsCount: 11, trend: 'stable', category: 'Manufacturing', score: 75 },
    { rank: 12, name: 'Industrial Solutions', totalRFQs: 65, winRate: 35, businessAwarded: 10500000, avgResponse: 3.5, compliance: 90, projectsCount: 10, trend: 'down', category: 'Industrial Services', score: 73 },
    { rank: 13, name: 'Vendor C Global', totalRFQs: 62, winRate: 30, businessAwarded: 8900000, avgResponse: 4.2, compliance: 92, projectsCount: 9, trend: 'stable', category: 'Global Sourcing', score: 71 },
    { rank: 14, name: 'Regional Suppliers', totalRFQs: 58, winRate: 28, businessAwarded: 7200000, avgResponse: 4.5, compliance: 87, projectsCount: 8, trend: 'down', category: 'Local Suppliers', score: 68 },
    { rank: 15, name: 'Global Tech Solutions', totalRFQs: 45, winRate: 22, businessAwarded: 5100000, avgResponse: 4.8, compliance: 84, projectsCount: 6, trend: 'down', category: 'Technology', score: 65 }
  ]
  
  // Project-specific vendor performance data
  const projectVendorPerformance: Record<string, Array<{
    vendorName: string;
    bidsInProject: number;
    winsInProject: number;
    avgResponseTime: number;
    complianceIssues: number;
    lastBidDate: string;
  }>> = {
    '001': [
      { vendorName: 'Vendor A Industries', bidsInProject: 3, winsInProject: 2, avgResponseTime: 2.3, complianceIssues: 0, lastBidDate: '2024-10-20' },
      { vendorName: 'Vendor B Solutions', bidsInProject: 3, winsInProject: 1, avgResponseTime: 3.5, complianceIssues: 1, lastBidDate: '2024-10-20' },
      { vendorName: 'Vendor C Global', bidsInProject: 2, winsInProject: 0, avgResponseTime: 4.0, complianceIssues: 0, lastBidDate: '2024-10-18' }
    ],
    '002': [
      { vendorName: 'Delta Engineering', bidsInProject: 5, winsInProject: 3, avgResponseTime: 2.5, complianceIssues: 0, lastBidDate: '2024-10-22' },
      { vendorName: 'Echo Systems', bidsInProject: 4, winsInProject: 1, avgResponseTime: 3.0, complianceIssues: 0, lastBidDate: '2024-10-21' },
      { vendorName: 'Foxtrot Industries', bidsInProject: 3, winsInProject: 1, avgResponseTime: 3.8, complianceIssues: 0, lastBidDate: '2024-10-20' },
      { vendorName: 'Global Tech Solutions', bidsInProject: 2, winsInProject: 0, avgResponseTime: 4.5, complianceIssues: 1, lastBidDate: '2024-10-19' },
      { vendorName: 'Prime Contractors', bidsInProject: 1, winsInProject: 0, avgResponseTime: 5.0, complianceIssues: 0, lastBidDate: '2024-10-18' }
    ],
    '003': [
      { vendorName: 'Gulf Mechanical', bidsInProject: 8, winsInProject: 6, avgResponseTime: 2.0, complianceIssues: 0, lastBidDate: '2024-10-15' },
      { vendorName: 'Harbor Tech', bidsInProject: 7, winsInProject: 1, avgResponseTime: 2.8, complianceIssues: 0, lastBidDate: '2024-10-14' },
      { vendorName: 'Industrial Solutions', bidsInProject: 6, winsInProject: 1, avgResponseTime: 3.3, complianceIssues: 1, lastBidDate: '2024-10-13' },
      { vendorName: 'Advanced Systems', bidsInProject: 4, winsInProject: 0, avgResponseTime: 3.5, complianceIssues: 0, lastBidDate: '2024-10-12' },
      { vendorName: 'Tech Pioneers', bidsInProject: 3, winsInProject: 0, avgResponseTime: 3.8, complianceIssues: 0, lastBidDate: '2024-10-10' },
      { vendorName: 'Regional Suppliers', bidsInProject: 2, winsInProject: 0, avgResponseTime: 4.2, complianceIssues: 1, lastBidDate: '2024-10-08' }
    ]
  }

  // Audit trail events
  const [auditEvents, setAuditEvents] = useState<any[]>([
    { id: 1, timestamp: '2024-10-23 14:32:15', workflow: 'RFQ Processor', event: 'RFQ_SENT', details: 'RFQ sent to 3 vendors for Heat Exchanger', actor: 'Bin Quraya Engine', type: 'info', projectId: '001' },
    { id: 2, timestamp: '2024-10-23 14:28:10', workflow: 'Email Handler', event: 'VENDOR_RESPONDED', details: 'Vendor A submitted quotation', actor: 'vendor.a.demo@gmail.com', type: 'success', projectId: '001' },
    { id: 3, timestamp: '2024-10-23 14:25:05', workflow: 'Technical Review', event: 'TBC_ISSUED', details: 'Technical Bid Clarification sent to Vendor B - Material grade SS_304 non-compliant', actor: 'Bin Quraya Engine', type: 'warning', projectId: '001' },
    { id: 4, timestamp: '2024-10-23 14:20:00', workflow: 'Commercial Eval', event: 'EVALUATION_STARTED', details: 'Commercial evaluation triggered - Quorum reached (3 vendors)', actor: 'Bin Quraya Engine', type: 'info', projectId: '001' },
    { id: 5, timestamp: '2024-10-23 14:15:30', workflow: 'Decision Engine', event: 'DECISION_READY', details: 'Decision package generated - Vendor A recommended', actor: 'Bin Quraya Engine', type: 'success', projectId: '001' },
    { id: 6, timestamp: '2024-10-23 14:10:00', workflow: 'Management', event: 'DECISION_EXECUTED', details: 'Purchase Order approved for Vendor A', actor: 'Muhammad Ar-Rashid', type: 'success', projectId: '001' },
    { id: 7, timestamp: '2024-10-23 13:45:00', workflow: 'RFQ Processor', event: 'RFQ_SENT', details: 'RFQ sent to 5 vendors for Valves Package', actor: 'Bin Quraya Engine', type: 'info', projectId: '002' },
    { id: 8, timestamp: '2024-10-23 13:30:00', workflow: 'Email Handler', event: 'VENDOR_RESPONDED', details: 'Delta Engineering submitted quotation', actor: 'delta@example.com', type: 'success', projectId: '002' },
    { id: 9, timestamp: '2024-10-22 16:00:00', workflow: 'Management', event: 'PO_ISSUED', details: 'Purchase Order sent to Gulf Mechanical', actor: 'Bin Quraya Engine', type: 'success', projectId: '003' },
    { id: 10, timestamp: '2024-10-22 15:45:00', workflow: 'RFQ Processor', event: 'WORKFLOW_COMPLETE', details: 'RFQ cycle completed successfully', actor: 'Bin Quraya Engine', type: 'info', projectId: '003' },
  ])

  // Drag and drop state for kanban
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Filter state for audit trail
  const [auditSearchTerm, setAuditSearchTerm] = useState('')
  const [auditFilterType, setAuditFilterType] = useState('all')
  const [auditFilterWorkflow, setAuditFilterWorkflow] = useState('all')

  useEffect(() => {
    setSelectedProject(projects[0])
  }, [])

  // Handle notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  // Handle vendor actions
  const handleVendorAction = async (vendorId: string, action: 'approve' | 'reject' | 'negotiate') => {
    // Find the vendor offer
    const vendorOffer = vendorOffers.find(offer => offer.vendorId === vendorId)
    if (!vendorOffer) return

    // Update local state
    setVendorOffers(prev => prev.map(offer => {
      if (offer.vendorId === vendorId) {
        if (action === 'approve') {
          return { ...offer, status: 'approved' }
        } else if (action === 'reject') {
          return { ...offer, status: 'rejected' }
        } else {
          return { ...offer, status: 'negotiating' }
        }
      } else if (action === 'approve') {
        return { ...offer, status: 'rejected' }
      }
      return offer
    }))

    // Send decision to n8n webhook
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        projectId: selectedProject?.id || '001',
        projectName: selectedProject?.name || 'Unknown Project',
        vendorId: vendorId,
        vendorName: vendorOffer.vendorName,
        action: action,
        decisionDetails: {
          price: vendorOffer.price,
          deliveryDays: vendorOffer.deliveryDays,
          paymentTerms: vendorOffer.paymentTerms,
          complianceStatus: vendorOffer.complianceStatus,
          score: vendorOffer.score,
          rank: vendorOffer.rank
        },
        decisionMaker: currentUser.name,
        decisionMakerEmail: currentUser.email
      }

      await fetch('https://tariqah.app.n8n.cloud/webhook-test/rfq-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Decision sent to n8n webhook:', payload)
    } catch (error) {
      console.error('Error sending decision to n8n:', error)
    }

    const notification: Notification = {
      id: Date.now().toString(),
      type: action === 'approve' ? 'success' : action === 'reject' ? 'alert' : 'decision',
      title: action === 'approve' ? 'Vendor Approved' : action === 'reject' ? 'Vendor Rejected' : 'Negotiation Started',
      message: `${action === 'approve' ? 'PO will be generated for' : action === 'reject' ? 'Regret letter sent to' : 'Negotiation request sent to'} vendor`,
      time: new Date(),
      isRead: false,
      actionRequired: false
    }
    setNotifications(prev => [notification, ...prev])
  }

  // Drag and drop functions for kanban
  const handleDragStart = (item: any, column: string) => {
    setDraggedItem({ ...item, sourceColumn: column })
  }

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault()
    setDragOverColumn(column)
  }

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (draggedItem && selectedProject) {
      const sourceColumn = draggedItem.sourceColumn
      const newKanbanData = { ...kanbanData }
      const projectData = newKanbanData[selectedProject.id]
      
      // Remove from source column
      const sourceItems = projectData[sourceColumn as keyof typeof projectData] as Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>
      projectData[sourceColumn as keyof typeof projectData] = sourceItems.filter((item) => item.id !== draggedItem.id) as any
      
      // Add to target column  
      const targetItems = projectData[targetColumn as keyof typeof projectData] as Array<{ id: string; commodity: string; vendor: string; date: string; urgent: boolean }>
      targetItems.push({ ...draggedItem, sourceColumn: undefined } as any)
      
      setKanbanData(newKanbanData)
      setDraggedItem(null)
      setDragOverColumn(null)
    }
  }

  // Helper function to update KPIs with animation
  const updateKPI = (key: keyof typeof kpis, updater: (prev: number) => number) => {
    setKpis(prev => ({
      ...prev,
      [key]: updater(prev[key])
    }))
  }

  // Helper function to update process status
  const updateProcessStatus = (stage: string, progress: number) => {
    setCurrentProcessStage(stage)
    setProcessProgress(progress)
  }

  // Helper function to update AI Analysis
  const updateAIAnalysis = (update: { status: string, message: string }) => {
    setAiAnalysis({
      ...update,
      lastUpdate: new Date()
    })
  }

  // Calculate cycle time in days
  const calculateCycleTime = (startTime: Date | null) => {
    if (!startTime) return 0
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    // For demo, simulate days based on minutes
    const demoDays = Math.floor(diffMs / (1000 * 60)) // 1 minute = 1 day
    return demoDays || 1
  }

  // Calculate compliance rate
  const calculateComplianceRate = (compliant: number, total: number) => {
    if (total === 0) return 0
    return Math.round((compliant / total) * 100)
  }

  // Process new events from webhook
  const processNewEvents = (events: any[]) => {
    if (!events || events.length === 0) return

    // Filter new events we haven't processed yet
    const newEvents = lastEventId 
      ? events.filter(e => parseInt(e.id) > parseInt(lastEventId))
      : events

    if (newEvents.length === 0) return

    // Update last processed event ID
    const latestEventId = Math.max(...newEvents.map(e => parseInt(e.id)))
    setLastEventId(latestEventId.toString())

    // Process each new event
    newEvents.forEach((event) => {
      // Only process events for the selected project
      if (event.projectId !== selectedProject?.id) return

      // Add to audit trail
      const auditEvent = {
        id: event.id,
        timestamp: new Date(event.timestamp).toLocaleString(),
        workflow: event.source || 'n8n Workflow',
        event: event.event,
        details: event.details || event.event,
        actor: event.actor || 'Bin Quraya Engine',
        type: getEventType(event.event),
        projectId: event.projectId
      }
      setAuditEvents(prev => [auditEvent, ...prev])

      // Process specific event types
      switch (event.event) {
        case 'RFQ_SENT':
          handleRFQSent(event)
          break
        case 'VENDOR_RESPONDED':
          handleVendorResponse(event)
          break
        case 'VENDOR_APPROVED':
          handleVendorApproved(event)
          break
        case 'TBC_ISSUED':
          handleTBCIssued(event)
          break
        case 'EVALUATION_STARTED':
          handleEvaluationStarted(event)
          break
        case 'DECISION_READY':
          handleDecisionReady(event)
          break
        case 'DECISION_EXECUTED':
          handleDecisionExecuted(event)
          break
      }

      // Add notification for major events
      if (['RFQ_SENT', 'TBC_ISSUED', 'DECISION_READY'].includes(event.event)) {
        const notification: Notification = {
          id: event.id.toString(),
          type: getNotificationType(event.event),
          title: getEventTitle(event.event),
          message: event.details || '',
          time: new Date(event.timestamp),
          isRead: false,
          actionRequired: event.event === 'DECISION_READY'
        }
        setNotifications(prev => [notification, ...prev])
        
        // Add toast notification
        addToast({
          type: event.event === 'TBC_ISSUED' ? 'warning' : event.event === 'DECISION_READY' ? 'info' : 'success',
          title: getEventTitle(event.event),
          message: event.details || '',
          duration: 4000
        })
      }
    })
  }

  // Helper functions for event processing
  const getEventType = (eventName: string): 'info' | 'success' | 'warning' | 'error' => {
    switch (eventName) {
      case 'TBC_ISSUED': return 'warning'
      case 'VENDOR_APPROVED':
      case 'DECISION_EXECUTED': return 'success'
      default: return 'info'
    }
  }

  const getNotificationType = (eventName: string): 'info' | 'alert' | 'success' | 'decision' => {
    switch (eventName) {
      case 'TBC_ISSUED': return 'alert'
      case 'DECISION_READY': return 'decision'
      case 'RFQ_SENT': return 'info'
      default: return 'info'
    }
  }

  const getEventTitle = (eventName: string): string => {
    switch (eventName) {
      case 'RFQ_SENT': return 'RFQ Distributed'
      case 'TBC_ISSUED': return 'Technical Clarification Sent'
      case 'DECISION_READY': return 'Decision Package Ready'
      default: return eventName.replace(/_/g, ' ')
    }
  }

  // Event handlers
  const handleRFQSent = (event: any) => {
    if (!selectedProject) return
    
    // Set demo start time if first event
    if (!demoStartTime && isDemoMode) {
      setDemoStartTime(new Date())
    }
    
    // Update KPIs
    updateKPI('activeRfqs', prev => prev + 1)
    
    // Update Process Status to Distribution (20%)
    updateProcessStatus('distribution', 20)
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Processing',
      message: `RFQ distributed to ${event.vendors?.length || 3} vendors. Awaiting responses...`
    })
    
    // Add cards to Kanban
    const newKanbanData = { ...kanbanData }
    const projectData = newKanbanData[selectedProject.id]
    
    // Add cards for each vendor
    const vendors = event.vendors || ['Vendor A Industries', 'Vendor B Solutions', 'Vendor C Global']
    vendors.forEach((vendor: string, index: number) => {
      const card = {
        id: `RFQ-${event.rfqId}-${vendor.charAt(vendor.indexOf(' ') + 1)}`,
        commodity: event.commodity || 'Heat Exchanger',
        vendor: vendor,
        date: 'Just now',
        urgent: index === 0
      }
      projectData.sent.push(card)
    })
    
    setKanbanData(newKanbanData)
  }

  const handleVendorResponse = (event: any) => {
    if (!selectedProject) return
    
    // Update Vendor Response KPI
    updateKPI('vendorResponse', prev => prev + 1)
    
    // Update Process Status if first response
    const totalResponses = kpis.vendorResponse + 1
    if (totalResponses === 1) {
      updateProcessStatus('technical-review', 40)
    }
    
    // Update compliance rate based on material
    const isCompliant = event.materialGrade === 'SS_316L' || event.status === 'Technically Approved'
    if (!isCompliant) {
      updateKPI('criticalAlerts', prev => prev + 1)
    }
    
    // Calculate new compliance rate
    const currentCompliantCount = Math.round((kpis.complianceRate / 100) * (totalResponses - 1))
    const newCompliantCount = currentCompliantCount + (isCompliant ? 1 : 0)
    const newComplianceRate = Math.round((newCompliantCount / totalResponses) * 100)
    updateKPI('complianceRate', () => newComplianceRate)
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Analyzing',
      message: `${event.vendor} offer received. ${isCompliant ? 'Technical review in progress...' : 'Non-compliance detected - ' + event.materialGrade}`
    })
    
    // Update cycle time
    if (demoStartTime) {
      updateKPI('cycleTime', () => calculateCycleTime(demoStartTime))
    }
    
    // Move card in Kanban
    const newKanbanData = { ...kanbanData }
    const projectData = newKanbanData[selectedProject.id]
    
    // Move card from sent to review/approved
    const vendor = event.vendor
    const cardId = projectData.sent.find(c => c.vendor === vendor)?.id
    if (cardId) {
      const card = projectData.sent.find(c => c.id === cardId)
      if (card) {
        projectData.sent = projectData.sent.filter(c => c.id !== cardId)
        if (event.status === 'Technically Approved' || event.status === 'Under Review') {
          projectData.review.push({ ...card, date: 'Just now' })
        } else if (event.status === 'Non-Compliant') {
          projectData.review.push({ ...card, date: 'Non-compliant' })
        }
      }
    }
    
    setKanbanData(newKanbanData)
  }

  const handleTBCIssued = (event: any) => {
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Alert',
      message: `Technical Bid Clarification sent to ${event.vendor}. Issue: ${event.issue}`
    })
  }

  const handleVendorApproved = (event: any) => {
    if (!selectedProject) return
    
    // Move card from review to approved
    const newKanbanData = { ...kanbanData }
    const projectData = newKanbanData[selectedProject.id]
    
    const vendor = event.vendor
    const cardId = projectData.review.find(c => c.vendor === vendor)?.id
    if (cardId) {
      const card = projectData.review.find(c => c.id === cardId)
      if (card) {
        projectData.review = projectData.review.filter(c => c.id !== cardId)
        projectData.approved.push({ ...card, date: 'Approved' })
      }
    }
    
    setKanbanData(newKanbanData)
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Processing',
      message: `${event.vendor} passed technical evaluation. ${projectData.approved.length} vendors approved.`
    })
  }

  const handleEvaluationStarted = (event: any) => {
    if (!selectedProject) return
    
    // Update Process Status to Commercial Evaluation (70%)
    updateProcessStatus('commercial-evaluation', 70)
    
    // Update cycle time
    if (demoStartTime) {
      updateKPI('cycleTime', () => calculateCycleTime(demoStartTime))
    }
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Evaluating',
      message: 'All vendors technically approved. Running commercial evaluation model...'
    })
    
    // Move cards to evaluating
    const newKanbanData = { ...kanbanData }
    const projectData = newKanbanData[selectedProject.id]
    
    // Move all approved vendors to evaluating
    const approvedCards = [...projectData.approved]
    projectData.approved = []
    projectData.evaluating = approvedCards.map(card => ({
      ...card,
      commodity: `${card.commodity} - Multiple (${approvedCards.length})`,
      vendor: 'Multiple',
      date: 'Evaluating',
      id: `RFQ-EVAL-${event.rfqId}`
    })).slice(0, 1) // Only show one consolidated card
    
    setKanbanData(newKanbanData)
  }

  const handleDecisionReady = (event: any) => {
    // Update Process Status to Decision (90%)
    updateProcessStatus('decision', 90)
    
    // Show vendor decision cards
    if (event.vendors) {
      const vendorOffers = event.vendors.map((v: any) => ({
        vendorId: v.name.replace(/\s/g, ''),
        vendorName: v.name,
        price: v.price,
        deliveryDays: 45 + (v.rank - 1) * 5,
        paymentTerms: v.rank === 1 ? '30/70' : '40/60',
        compliance: 'Full',
        score: v.score,
        rank: v.rank,
        status: 'pending',
        materialGrade: 'SS_316L',
        complianceStatus: 'compliant'
      }))
      setVendorOffers(vendorOffers)
    }
    
    // Update Monthly Savings projection
    const savingsAmount = 12000 // Average savings per RFQ (40+ hours saved)
    updateKPI('monthlySavings', prev => prev + savingsAmount)
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Complete',
      message: `Recommendation: Award to ${event.recommendedVendor}. Process time reduced from 20+ days to <1 hour. Value-based decision: superior payment terms outweigh 33% price premium.`
    })
  }

  const handleDecisionExecuted = (event: any) => {
    if (!selectedProject) return
    
    // Update Process Status to Award (100%)
    updateProcessStatus('award', 100)
    
    // Mark vendor as awarded
    setVendorOffers(prev => prev.map(offer => 
      offer.vendorName === event.vendor 
        ? { ...offer, status: 'approved' }
        : { ...offer, status: 'rejected' }
    ))
    
    // Move card to decided
    const newKanbanData = { ...kanbanData }
    const projectData = newKanbanData[selectedProject.id]
    
    // Move from evaluating to decided
    const evalCard = projectData.evaluating[0]
    if (evalCard) {
      projectData.evaluating = []
      projectData.decided.push({
        ...evalCard,
        vendor: event.vendor || 'Vendor A Industries',
        date: 'PO Issued'
      })
    }
    
    setKanbanData(newKanbanData)
    
    // Update AI Analysis
    updateAIAnalysis({
      status: 'Completed',
      message: `Purchase Order ${event.poNumber} issued to ${event.vendor}. Value: $${event.value?.toLocaleString() || '1,250,000'}`
    })
    
    // Update Active RFQs (completed)
    updateKPI('activeRfqs', prev => Math.max(0, prev - 1))
  }

  // Webhook polling effect
  useEffect(() => {
    if (isDemoMode) return // Skip polling in demo mode

    let retryCount = 0
    const maxRetries = 3
    let retryTimeout: NodeJS.Timeout

    const pollWebhook = async () => {
      try {
        const response = await fetch(
          `/api/webhooks/status${selectedProject ? `?projectId=${selectedProject.id}` : ''}`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        processNewEvents(data.events)
        
        // Reset retry count on success
        retryCount = 0
        setIsConnected(true)
        setPollingError(null)
      } catch (error) {
        console.error('Webhook polling error:', error)
        setPollingError(error instanceof Error ? error.message : 'Connection failed')
        
        // Implement exponential backoff
        if (retryCount < maxRetries) {
          retryCount++
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000)
          retryTimeout = setTimeout(pollWebhook, retryDelay)
        } else {
          setIsConnected(false)
          // Auto-switch to demo mode on persistent failure
          if (!isDemoMode) {
            setIsDemoMode(true)
            setNotifications(prev => [{
              id: Date.now().toString(),
              type: 'alert',
              title: 'Connection Lost',
              message: 'Switching to demo mode due to connection issues',
              time: new Date(),
              isRead: false,
              actionRequired: false
            }, ...prev])
          }
        }
      }
    }

    // Start polling
    const pollInterval = setInterval(pollWebhook, 1000)
    pollWebhook() // Initial poll

    return () => {
      clearInterval(pollInterval)
      clearTimeout(retryTimeout)
    }
  }, [isDemoMode, selectedProject, lastEventId])

  // Filter audit events
  const filteredAuditEvents = auditEvents
    .filter(event => selectedProject ? event.projectId === selectedProject.id : true)
    .filter(event => {
      if (auditSearchTerm && !event.details.toLowerCase().includes(auditSearchTerm.toLowerCase())) {
        return false
      }
      if (auditFilterType !== 'all' && event.type !== auditFilterType) {
        return false
      }
      if (auditFilterWorkflow !== 'all' && event.workflow !== auditFilterWorkflow) {
        return false
      }
      return true
    })

  // Components
  const KPICard: React.FC<KPICardProps> = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    textColor,
    expandedContent,
    cardKey,
    expandedCardKey,
    setExpandedCardKey
  }) => {
    const isSelected = expandedCardKey === cardKey;

    const handleCardClick = () => {
      if (expandedContent) {
        setExpandedCardKey(isSelected ? null : cardKey);
      }
    };
    
    return (
      <div 
        className={`
          bg-white rounded-xl shadow-lg p-5 transition-all duration-300 ease-in-out
          ${expandedContent ? 'cursor-pointer' : ''}
          hover:shadow-xl hover:-translate-y-1
          ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
        `}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}/10`}>
              <Icon className={`h-6 w-6 ${textColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                {title}
                {expandedContent && (
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(change)}%
          </span>
        </div>
      </div>
    )
  }

  const ProjectSelector = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
        <span className="text-sm text-gray-500">{projects.filter(p => p.status === 'active').length} active</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedProject?.id === project.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between h-full">
              <div className="space-y-1">
                <span className="font-semibold text-gray-900 block">{project.name}</span>
                <span className="text-xs text-gray-500">
                  {project.rfqCount} RFQs · {project.status}
                </span>
              </div>
              <div className="flex items-center">
                {project.activeDecisions > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {project.activeDecisions}
                  </span>
                )}
                {project.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const ProcessStatus = () => {
    const stages = getProcessStages()
    
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Process Status
        </h3>
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-300"></div>
          {/* Progress bar fill */}
          <div 
            className="absolute top-5 left-8 h-0.5 bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.max(0, (processProgress / 100) * (100 - 16))}%` }}
          ></div>
          <div className="flex justify-between relative z-10">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              
              return (
                <div key={stage.name} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${stage.status === 'completed' ? 'bg-green-600' : 
                      stage.status === 'current' ? 'bg-blue-600 animate-pulse' : 
                      'bg-gray-300'}
                  `}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs mt-2 text-gray-600">{stage.name}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {currentProcessStage === 'initiation' && '📋 Preparing RFQ documentation...'}
            {currentProcessStage === 'distribution' && '📨 RFQ sent to vendors - awaiting responses...'}
            {currentProcessStage === 'technical-review' && '🔍 Reviewing vendor technical submissions...'}
            {currentProcessStage === 'commercial-evaluation' && '💰 Evaluating commercial proposals...'}
            {currentProcessStage === 'decision' && '🎯 Decision package ready - awaiting approval...'}
            {currentProcessStage === 'award' && '✅ Purchase order issued successfully!'}
          </p>
        </div>
      </div>
    )
  }

  const AIAnalysis = () => {
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Analysis & Recommendations
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              aiAnalysis.status === 'Idle' ? 'bg-gray-100' :
              aiAnalysis.status === 'Processing' ? 'bg-blue-100' :
              aiAnalysis.status === 'Alert' ? 'bg-yellow-100' :
              aiAnalysis.status === 'Analyzing' ? 'bg-purple-100' :
              aiAnalysis.status === 'Evaluating' ? 'bg-indigo-100' :
              aiAnalysis.status === 'Complete' ? 'bg-green-100' :
              aiAnalysis.status === 'Completed' ? 'bg-green-100' :
              'bg-purple-100'
            }`}>
              <Zap className={`h-4 w-4 ${
                aiAnalysis.status === 'Idle' ? 'text-gray-600' :
                aiAnalysis.status === 'Processing' ? 'text-blue-600' :
                aiAnalysis.status === 'Alert' ? 'text-yellow-600' :
                aiAnalysis.status === 'Analyzing' ? 'text-purple-600' :
                aiAnalysis.status === 'Evaluating' ? 'text-indigo-600' :
                aiAnalysis.status === 'Complete' ? 'text-green-600' :
                aiAnalysis.status === 'Completed' ? 'text-green-600' :
                'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Status: {aiAnalysis.status}
              </p>
              <p className="text-xs text-gray-700">
                {aiAnalysis.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {aiAnalysis.lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          {kpis.criticalAlerts > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Active Alerts:</p>
                <p className="text-xs text-gray-600">
                  {kpis.criticalAlerts} technical compliance issue{kpis.criticalAlerts > 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const VendorDecisionCards = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Vendor Decision Required</h2>
        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
          Action Required
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vendorOffers.map((offer) => (
          <div 
            key={offer.vendorId} 
            className={`border-2 rounded-lg p-4 transition-all ${
              offer.status === 'approved' ? 'border-green-500 bg-green-50' :
              offer.status === 'rejected' ? 'border-red-500 bg-red-50' :
              offer.status === 'negotiating' ? 'border-yellow-500 bg-yellow-50' :
              'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{offer.vendorName}</h3>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${
                  offer.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  offer.rank === 2 ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  Rank #{offer.rank}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                offer.complianceStatus === 'compliant' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {offer.complianceStatus === 'compliant' ? '✓ Compliant' : '✗ Non-compliant'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold">SAR {offer.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-semibold">{offer.deliveryDays} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Terms</span>
                <span className="font-semibold">{offer.paymentTerms}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Score</span>
                <span className="font-bold text-blue-600">{offer.score}/100</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVendorAction(offer.vendorId, 'approve')}
                disabled={offer.status !== 'pending'}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  offer.status === 'approved' 
                    ? 'bg-green-600 text-white cursor-default'
                    : offer.status !== 'pending'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {offer.status === 'approved' ? '✓ Approved' : 'Approve'}
              </button>
              <button
                onClick={() => handleVendorAction(offer.vendorId, 'negotiate')}
                disabled={offer.status !== 'pending'}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  offer.status === 'negotiating'
                    ? 'bg-yellow-600 text-white cursor-default'
                    : offer.status !== 'pending'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {offer.status === 'negotiating' ? '⚡ Negotiating' : 'Negotiate'}
              </button>
              <button
                onClick={() => handleVendorAction(offer.vendorId, 'reject')}
                disabled={offer.status !== 'pending'}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  offer.status === 'rejected'
                    ? 'bg-red-600 text-white cursor-default'
                    : offer.status !== 'pending'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {offer.status === 'rejected' ? '✗ Rejected' : 'Reject'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const NewProjectModal = () => {
    if (!showNewProjectModal) return null

    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commodity Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Heat Exchangers</option>
                <option>Valves</option>
                <option>Pumps</option>
                <option>Compressors</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Value (SAR)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <ProjectSelector />
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProcessStatus />
                <div className="lg:border-l lg:pl-8">
                  <AIAnalysis />
                </div>
              </div>
            </div>
            {vendorOffers.length > 0 && vendorOffers.some(v => v.status === 'pending') && <VendorDecisionCards />}
            
            {/* First Row of KPI Cards */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                  title="Active RFQs"
                  value={kpis.activeRfqs}
                  change={12}
                  icon={Activity}
                  color="bg-blue-600"
                  textColor="text-blue-600"
                  expandedContent={true}
                  cardKey="activeRFQs"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
                
                <KPICard
                  title="Average Cycle Time"
                  value={`${kpis.cycleTime} days`}
                  change={-25}
                  icon={Clock}
                  color="bg-green-600"
                  textColor="text-green-600"
                  expandedContent={true}
                  cardKey="cycleTime"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
                
                <KPICard
                  title="Monthly Savings"
                  value={`SAR ${Math.round(kpis.monthlySavings / 1000)}K`}
                  change={8}
                  icon={DollarSign}
                  color="bg-purple-600"
                  textColor="text-purple-600"
                  expandedContent={true}
                  cardKey="savingsAmount"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
              </div>
              
              {/* Detail Panel for First Row */}
              {(expandedCard === 'activeRFQs' || expandedCard === 'cycleTime' || expandedCard === 'savingsAmount') && (
                <DetailPanel selectedKey={expandedCard} />
              )}
              
              {/* Second Row of KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                  title="Compliance Rate"
                  value={`${kpis.complianceRate}%`}
                  change={3}
                  icon={Shield}
                  color="bg-orange-600"
                  textColor="text-orange-600"
                  expandedContent={true}
                  cardKey="complianceRate"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
                
                <KPICard
                  title="Vendor Response"
                  value={`${kpis.vendorResponse} vendors`}
                  change={15}
                  icon={Users}
                  color="bg-teal-600"
                  textColor="text-teal-600"
                  expandedContent={true}
                  cardKey="vendorCount"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
                
                <KPICard
                  title="Critical Alerts"
                  value={kpis.criticalAlerts}
                  change={-33}
                  icon={AlertCircle}
                  color="bg-red-600"
                  textColor="text-red-600"
                  expandedContent={true}
                  cardKey="criticalAlerts"
                  expandedCardKey={expandedCard}
                  setExpandedCardKey={setExpandedCard}
                />
              </div>
              
              {/* Detail Panel for Second Row */}
              {(expandedCard === 'complianceRate' || expandedCard === 'vendorCount' || expandedCard === 'criticalAlerts') && (
                <DetailPanel selectedKey={expandedCard} />
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Project Vendor Performance</h3>
                <p className="text-sm text-gray-500 mt-1">Performance metrics for vendors in {selectedProject?.name || 'Project Eagle'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectVendorPerformance[selectedProject?.id || '001'].map((vendor, index) => (
                  <div key={vendor.vendorName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">{vendor.vendorName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        vendor.complianceIssues === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {vendor.complianceIssues === 0 ? 'Compliant' : `${vendor.complianceIssues} Issue${vendor.complianceIssues > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bids in Project</span>
                        <span className="font-semibold">{vendor.bidsInProject}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Wins</span>
                        <span className="font-semibold">{vendor.winsInProject} ({Math.round((vendor.winsInProject / vendor.bidsInProject) * 100)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Response</span>
                        <span className="font-semibold">{vendor.avgResponseTime} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Bid</span>
                        <span className="font-semibold text-xs">{new Date(vendor.lastBidDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(vendor.winsInProject / vendor.bidsInProject) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Win Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'tracker':
        const projectKanban = selectedProject ? kanbanData[selectedProject.id] : kanbanData['001']
        const columns = [
          { key: 'sent', title: 'Sent', color: 'bg-gray-50', borderColor: 'border-gray-200' },
          { key: 'review', title: 'In Review', color: 'bg-blue-50', borderColor: 'border-blue-200' },
          { key: 'approved', title: 'Approved', color: 'bg-green-50', borderColor: 'border-green-200' },
          { key: 'evaluating', title: 'Evaluating', color: 'bg-yellow-50', borderColor: 'border-yellow-200' },
          { key: 'decided', title: 'Decision', color: 'bg-purple-50', borderColor: 'border-purple-200' }
        ]

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">Live RFQ Tracker</h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {selectedProject?.name || 'All Projects'}
                  </span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {columns.map((column) => {
                  const items = projectKanban[column.key as keyof typeof projectKanban] || []
                  return (
                    <div
                      key={column.key}
                      className={`${column.color} ${column.borderColor} border-2 rounded-lg p-4 min-h-[500px] transition-colors ${
                        dragOverColumn === column.key ? 'border-blue-500 border-dashed' : ''
                      }`}
                      onDragOver={(e) => handleDragOver(e, column.key)}
                      onDrop={(e) => handleDrop(e, column.key)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{column.title}</h3>
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {items.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {items.map((item: any, index: number) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item, column.key)}
                            className={`bg-white rounded-lg p-3 shadow cursor-move hover:shadow-lg transition-all duration-300 animate-slideIn ${
                              item.urgent ? 'border-2 border-red-400 animate-pulse' : ''
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-bold text-gray-900">{item.id}</span>
                              {item.urgent && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800 mb-1">{item.commodity}</p>
                            <p className="text-xs text-gray-600 mb-2">{item.vendor}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{item.date}</span>
                              {column.key === 'decision' && (
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                  View →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                      <span className="text-gray-600">Urgent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                      <span className="text-gray-600">Normal</span>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'rankings':
        // Note: In a real app, these would be state variables defined at the component level
        // For now, using static values to demonstrate the concept
        const timePeriod = 'all'
        const minRFQs = 0
        const vendorCategory = 'all'
        
        // Filter vendors based on criteria
        const filteredRankings = companyWideVendorRankings.filter(vendor => {
          if (minRFQs > 0 && vendor.totalRFQs < minRFQs) return false
          if (vendorCategory !== 'all' && vendor.category !== vendorCategory) return false
          return true
        })
        
        // Get unique categories
        const uniqueCategories = [...new Set(companyWideVendorRankings.map(v => v.category))]
        
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Company-Wide Vendor Rankings</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Export Report
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue={timePeriod}
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue={minRFQs}
                  >
                    <option value="0">All Vendors</option>
                    <option value="10">Min 10 RFQs</option>
                    <option value="25">Min 25 RFQs</option>
                    <option value="50">Min 50 RFQs</option>
                    <option value="100">Min 100 RFQs</option>
                  </select>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue={vendorCategory}
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Podium Display */}
              {filteredRankings.length >= 3 && (
                <div className="mb-8">
                  <div className="flex justify-center items-end gap-4 mb-6">
                    {/* Second Place */}
                    <div className="text-center">
                      <div className="bg-gray-100 rounded-t-lg p-4 w-32 h-32 flex flex-col items-center justify-center">
                        <Medal className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-2xl font-bold text-gray-700">2nd</span>
                      </div>
                      <div className="bg-gray-200 p-3">
                        <p className="text-sm font-semibold text-gray-800">{filteredRankings[1]?.name}</p>
                        <p className="text-xs text-gray-600">Score: {filteredRankings[1]?.score}</p>
                        <p className="text-xs text-gray-500">SAR {(filteredRankings[1]?.businessAwarded / 1000000).toFixed(1)}M</p>
                      </div>
                    </div>
                    
                    {/* First Place */}
                    <div className="text-center -mt-8">
                      <div className="bg-yellow-100 rounded-t-lg p-4 w-36 h-40 flex flex-col items-center justify-center">
                        <Trophy className="h-14 w-14 text-yellow-600 mb-2" />
                        <span className="text-3xl font-bold text-yellow-700">1st</span>
                      </div>
                      <div className="bg-yellow-200 p-3">
                        <p className="text-sm font-semibold text-gray-800">{filteredRankings[0]?.name}</p>
                        <p className="text-xs text-gray-600">Score: {filteredRankings[0]?.score}</p>
                        <p className="text-xs text-gray-500">SAR {(filteredRankings[0]?.businessAwarded / 1000000).toFixed(1)}M</p>
                      </div>
                    </div>
                    
                    {/* Third Place */}
                    <div className="text-center">
                      <div className="bg-orange-100 rounded-t-lg p-4 w-32 h-32 flex flex-col items-center justify-center">
                        <Medal className="h-12 w-12 text-orange-400 mb-2" />
                        <span className="text-2xl font-bold text-orange-700">3rd</span>
                      </div>
                      <div className="bg-orange-200 p-3">
                        <p className="text-sm font-semibold text-gray-800">{filteredRankings[2]?.name}</p>
                        <p className="text-xs text-gray-600">Score: {filteredRankings[2]?.score}</p>
                        <p className="text-xs text-gray-500">SAR {(filteredRankings[2]?.businessAwarded / 1000000).toFixed(1)}M</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Rankings Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total RFQs</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Win Rate</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Business Awarded</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg Response</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Compliance</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Projects</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.map((vendor) => (
                      <tr key={vendor.rank} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                            vendor.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            vendor.rank === 2 ? 'bg-gray-100 text-gray-700' :
                            vendor.rank === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {vendor.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-700">
                                {vendor.name.split(' ').map((w: string) => w[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{vendor.name}</p>
                              <p className="text-xs text-gray-500">ID: V{vendor.rank.toString().padStart(3, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-600">{vendor.category}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-gray-900">{vendor.totalRFQs}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-gray-900">{vendor.winRate}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-[60px]">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${vendor.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-gray-900">SAR {(vendor.businessAwarded / 1000000).toFixed(1)}M</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-700">{vendor.avgResponse} days</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            vendor.compliance >= 95 ? 'bg-green-100 text-green-700' :
                            vendor.compliance >= 90 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {vendor.compliance}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-700">{vendor.projectsCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xl font-bold text-blue-600">{vendor.score}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {vendor.trend === 'up' ? (
                            <ArrowUp className="h-5 w-5 text-green-500 mx-auto" />
                          ) : vendor.trend === 'down' ? (
                            <ArrowDown className="h-5 w-5 text-red-500 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Top Performer</p>
                      <p className="text-xs text-green-600">{filteredRankings[0]?.name}</p>
                      <p className="text-xs text-green-600">SAR {(filteredRankings[0]?.businessAwarded / 1000000).toFixed(1)}M total business</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Most Improved</p>
                      <p className="text-xs text-blue-600">
                        {filteredRankings.find(v => v.trend === 'up')?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600">Positive trend in performance</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-semibold text-purple-800">Highest Compliance</p>
                      <p className="text-xs text-purple-600">
                        {filteredRankings.reduce((best, vendor) => 
                          vendor.compliance > best.compliance ? vendor : best
                        , filteredRankings[0])?.name}
                      </p>
                      <p className="text-xs text-purple-600">
                        {filteredRankings.reduce((best, vendor) => 
                          vendor.compliance > best.compliance ? vendor : best
                        , filteredRankings[0])?.compliance}% compliance rate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'audit':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  Export Log
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={auditSearchTerm}
                      onChange={(e) => setAuditSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <select 
                  value={auditFilterType}
                  onChange={(e) => setAuditFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <select 
                  value={auditFilterWorkflow}
                  onChange={(e) => setAuditFilterWorkflow(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Workflows</option>
                  <option value="RFQ Processor">RFQ Processor</option>
                  <option value="Email Handler">Email Handler</option>
                  <option value="Technical Review">Technical Review</option>
                  <option value="Commercial Eval">Commercial Eval</option>
                  <option value="Decision Engine">Decision Engine</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              {/* Events Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Workflow</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditEvents.map((event) => (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{event.timestamp}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">{event.workflow}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            event.type === 'success' ? 'bg-green-100 text-green-700' :
                            event.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            event.type === 'error' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {event.event}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-700 max-w-md truncate">{event.details}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{event.actor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredAuditEvents.length} of {auditEvents.length} events
                </p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  // KPI Details content
  const kpiDetails: Record<string, React.ReactNode> = {
    activeRFQs: (
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        <h4 className="font-semibold text-gray-900 col-span-2 mb-2">Participating Vendors</h4>
        {projectSpecificData[selectedProject?.id || '001'].vendors.map((vendor: string, idx: number) => (
          <div key={idx} className="flex justify-between text-sm bg-white rounded-lg px-4 py-2">
            <span className="text-gray-600">{vendor}</span>
            <span className="text-green-600 font-semibold">Active</span>
          </div>
        ))}
      </div>
    ),
    cycleTime: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 mb-2">Breakdown by Stage</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(projectSpecificData[selectedProject?.id || '001'].cycleBreakdown).map(([stage, days]) => (
            <div key={stage} className="bg-white rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-gray-600 capitalize text-sm">{stage}</span>
              <span className="font-bold text-lg text-gray-900">{days} days</span>
            </div>
          ))}
        </div>
      </div>
    ),
    savingsAmount: (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-2">Automation Savings Breakdown</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg px-4 py-3">
            <p className="text-gray-600 text-sm">Process Automation</p>
            <p className="font-bold text-lg text-green-600">SAR {selectedProject?.id === '001' ? '42,500' : selectedProject?.id === '002' ? '34,000' : '75,000'}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-3">
            <p className="text-gray-600 text-sm">Time Reduction</p>
            <p className="font-bold text-lg text-green-600">SAR {selectedProject?.id === '001' ? '22,500' : selectedProject?.id === '002' ? '18,000' : '40,000'}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-3">
            <p className="text-gray-600 text-sm">Error Prevention</p>
            <p className="font-bold text-lg text-green-600">SAR {selectedProject?.id === '001' ? '15,000' : selectedProject?.id === '002' ? '12,000' : '27,000'}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-3">
            <p className="text-gray-600 text-sm">Resource Optimization</p>
            <p className="font-bold text-lg text-green-600">SAR {selectedProject?.id === '001' ? '10,000' : selectedProject?.id === '002' ? '8,500' : '18,000'}</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg px-4 py-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-semibold">Total Monthly Savings</span>
            <span className="font-bold text-xl text-green-600">SAR {(selectedProject?.savingsAmount || 90000).toLocaleString()}</span>
          </div>
        </div>
      </div>
    ),
    complianceRate: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 mb-2">Compliance Rate Breakdown</h4>
        {vendorOffers.length > 0 ? (
          <div className="space-y-3">
            {/* Compliance Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {vendorOffers.filter(v => v.complianceStatus === 'compliant').length}
                  </p>
                  <p className="text-xs text-gray-600">Compliant</p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <p className="text-2xl font-bold text-red-600">
                    {vendorOffers.filter(v => v.complianceStatus !== 'compliant').length}
                  </p>
                  <p className="text-xs text-gray-600">Non-Compliant</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {vendorOffers.length}
                  </p>
                  <p className="text-xs text-gray-600">Total Vendors</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 font-medium text-center">
                Compliance Rate: {Math.round((vendorOffers.filter(v => v.complianceStatus === 'compliant').length / vendorOffers.length) * 100)}% 
                ({vendorOffers.filter(v => v.complianceStatus === 'compliant').length}/{vendorOffers.length} vendors)
              </p>
            </div>
            
            {/* Vendor Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vendorOffers.map((v) => (
                <div key={v.vendorId} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{v.vendorName}</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    v.complianceStatus === 'compliant' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {v.complianceStatus === 'compliant' ? '✓ Compliant' : '✗ Non-compliant'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Compliance Rate Explanation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-orange-500" />
                <p className="font-semibold text-gray-900">How Compliance Rate is Calculated</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded p-3">
                  <span className="text-sm text-gray-700">Compliant Vendors</span>
                  <span className="text-sm font-bold">19</span>
                </div>
                <div className="text-center text-xl font-bold text-gray-400">÷</div>
                <div className="flex items-center justify-between bg-white rounded p-3">
                  <span className="text-sm text-gray-700">Total Active Vendors</span>
                  <span className="text-sm font-bold">20</span>
                </div>
                <div className="text-center text-xl font-bold text-gray-400">=</div>
                <div className="flex items-center justify-between bg-orange-100 rounded p-3">
                  <span className="text-sm font-semibold text-orange-700">Compliance Rate</span>
                  <span className="text-lg font-bold text-orange-700">95%</span>
                </div>
              </div>
            </div>
            
            {/* Compliance Requirements */}
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Key Compliance Requirements</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">SS 316L Material Spec</span>
                  <span className="text-green-600 font-semibold">Mandatory</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Aramco SAES-A-301</span>
                  <span className="text-green-600 font-semibold">Required</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Safety Certifications</span>
                  <span className="text-green-600 font-semibold">Verified</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valid Trade License</span>
                  <span className="text-green-600 font-semibold">Current</span>
                </div>
              </div>
            </div>
            
            {/* Common Non-Compliance Issues */}
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 mb-2">Common Non-Compliance Issues</p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Wrong material grade (SS 304 instead of SS 316L)</li>
                <li>• Expired certifications</li>
                <li>• Missing technical documentation</li>
                <li>• Incomplete safety compliance</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    ),
    vendorCount: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 mb-2">Response Times</h4>
        {vendorOffers.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {vendorOffers.map((v, idx) => (
              <div key={v.vendorId} className="bg-white rounded-lg px-4 py-3 text-center">
                <p className="text-gray-600 text-sm truncate">{v.vendorName}</p>
                <p className="font-bold text-lg text-blue-600">{[2, 4, 3][idx]} days</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-teal-500" />
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">2.5 days</p>
                <p className="text-xs text-gray-600 mt-1">Industry avg: 5 days</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Improvement</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">50%</p>
                <p className="text-xs text-gray-600 mt-1">Faster than manual</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Response Rate by Vendor Type</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tier 1 Vendors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-xs font-semibold">95%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tier 2 Vendors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                    <span className="text-xs font-semibold">82%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Vendors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="text-xs font-semibold">68%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    criticalAlerts: (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-2">Active Issues & Concerns</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded">High Priority</span>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Technical Non-Compliance</p>
            <p className="text-xs text-gray-600">Vendor: Al-Faris Trading</p>
            <p className="text-xs text-gray-600">Missing safety certifications</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Medium</span>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Document Expiry Warning</p>
            <p className="text-xs text-gray-600">3 vendor licenses</p>
            <p className="text-xs text-gray-600">Expiring within 30 days</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded">Medium</span>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Price Variance Alert</p>
            <p className="text-xs text-gray-600">Quotation exceeds budget</p>
            <p className="text-xs text-gray-600">Threshold: +15%</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-700">Compliance Trend</span>
          </div>
          <span className="text-sm font-semibold text-green-600">33% decrease from last month</span>
        </div>
      </div>
    )
  };

  // Detail Panel Component
  const DetailPanel = ({ selectedKey }: { selectedKey: string | null }) => {
    if (!selectedKey || !kpiDetails[selectedKey]) return null;
    
    return (
      <div className="col-span-full mt-4 animate-fadeIn">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="max-w-4xl mx-auto">
            {kpiDetails[selectedKey]}
          </div>
        </div>
      </div>
    );
  };

  // Add this helper for relative time
  Date.prototype.toRelativeString = function() {
    const seconds = Math.floor((new Date().getTime() - this.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[73px]">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center">
                <img src="/images/company-logo.png" alt="Bin Quraya" className="h-10 w-auto object-contain" />
              </div>
              
              {/* New Project Button */}
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>

              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={(e) => {
                      const newDemoMode = e.target.checked
                      setIsDemoMode(newDemoMode)
                      
                      // Reset state when toggling demo mode
                      if (newDemoMode) {
                        // Entering demo mode - reset to baseline
                        setKpis({
                          activeRfqs: 0,
                          cycleTime: 0,
                          monthlySavings: 0,
                          complianceRate: 0,
                          vendorResponse: 0,
                          criticalAlerts: 0
                        })
                        setAiAnalysis({
                          status: 'Idle',
                          message: 'Awaiting RFQ initiation...',
                          lastUpdate: new Date()
                        })
                        setCurrentProcessStage('initiation')
                        setProcessProgress(0)
                        setVendorOffers([])
                        setKanbanData({
                          '001': { sent: [], review: [], approved: [], evaluating: [], decided: [] },
                          '002': { sent: [], review: [], approved: [], evaluating: [], decided: [] },
                          '003': { sent: [], review: [], approved: [], evaluating: [], decided: [] }
                        })
                        setAuditEvents([])
                        setDemoStartTime(null)
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    isDemoMode ? 'bg-purple-600' : 'bg-gray-300'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                      isDemoMode ? 'translate-x-5' : 'translate-x-1'
                    } mt-1`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {isDemoMode ? 'Demo Mode' : 'Live Mode'}
                  </span>
                </label>
                {isDemoMode && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4" ref={userMenuRef}>
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${
                              notification.type === 'decision' ? 'text-yellow-600' :
                              notification.type === 'alert' ? 'text-red-600' :
                              'text-green-600'
                            }`}>
                              {notification.type === 'decision' ? <AlertCircle className="h-5 w-5" /> :
                               notification.type === 'alert' ? <AlertCircle className="h-5 w-5" /> :
                               <CheckCircle2 className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.time.toRelativeString()}
                              </p>
                            </div>
                            {notification.actionRequired && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {currentUser.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{currentUser.name}</p>
                          <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-3">
                        <UserCircle className="h-4 w-4" />
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-3">
                        <Settings className="h-4 w-4" />
                        Preferences
                      </button>
                      <hr className="my-2" />
                      <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg" style={{ height: 'calc(100vh - 73px)' }}>
          <div className="p-6 h-full flex flex-col">
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => setActiveView('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'overview' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Executive Overview</span>
              </button>
              
              <button
                onClick={() => setActiveView('tracker')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  activeView === 'tracker' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Activity className="h-5 w-5" />
                <span className="font-medium">Live RFQ Tracker</span>
                {selectedProject?.rfqCount && selectedProject.rfqCount > 0 && (
                  <span className="absolute right-4 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              <button
                onClick={() => setActiveView('rankings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'rankings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Trophy className="h-5 w-5" />
                <span className="font-medium">Vendor Rankings</span>
              </button>
              
              <button
                onClick={() => setActiveView('audit')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === 'audit' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Audit Trail</span>
              </button>
            </nav>

              {/* Client Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="/images/sidebar-logo.png" 
                    alt="Bin Quraya" 
                    className="h-8 w-auto object-contain flex-shrink-0" 
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Bin Quraya</p>
                    <p className="text-xs text-gray-500">Procurement Division</p>
                  </div>
                </div>
              </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
          <div className="max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewProjectModal />

      {/* Demo Controller */}
      <DemoController 
        isDemoMode={isDemoMode}
        onEventFire={(event) => {
          // Process the event as if it came from webhook
          processNewEvents([event])
        }}
        onReset={() => {
          // Clear all demo data
          setKanbanData({
            '001': {
              sent: [],
              review: [],
              approved: [],
              evaluating: [],
              decided: []
            },
            '002': {
              sent: [],
              review: [],
              approved: [],
              evaluating: [],
              decided: []
            },
            '003': {
              sent: [],
              review: [],
              approved: [],
              evaluating: [],
              decided: []
            }
          })
          setVendorOffers(prev => prev.map(offer => ({ ...offer, status: 'pending' })))
          setNotifications([])
          setLastEventId(null)
          setToasts([])
        }}
      />
      
      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </div>
  )
}