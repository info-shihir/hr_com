'use client';

import React, { useState } from 'react';
import {
    BarChart3,
    Users,
    ShieldAlert,
    ShieldCheck,
    ShieldQuestion,
    FileText,
    Settings,
    Search,
    Bell,
    Moon,
    Sun,
    LayoutDashboard,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ExternalLink,
    Zap,
    Filter,
    ArrowRight,
    Plus,
    UserPlus,
    Calendar,
    Briefcase,
    Building2,
    Loader2,
    ChevronDown,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MOCK_EMPLOYEES, MOCK_STATS } from './mockData';
import { Employee, RiskLevel } from './types';

const PRESET_REQUIREMENTS = [
    "NDA Agreement",
    "Security Clearance",
    "Visa Sponsorship",
    "Equipment Handover",
    "Background Verification",
    "Health Insurance",
    "Professional Certificate",
    "Driving License",
    "Training Completion",
    "Work Permit",
    "Passport Copy"
];

export default function HRComplianceApp() {
    const [complianceData, setComplianceData] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [lastRunResult, setLastRunResult] = useState<'success' | 'error' | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showAddRequirement, setShowAddRequirement] = useState(false);
    const [newRequirement, setNewRequirement] = useState({
        document_type: '',
        criticality: 'Medium',
        category: 'Legal',
        validity_period: 12
    });
    const [newEmployee, setNewEmployee] = useState({
        emp_id: '',
        name: '',
        email: '',
        department: '',
        role: '',
        join_date: new Date().toISOString().split('T')[0],
        employment_type: 'Full-time'
    });
    const [isUpdatingCompliance, setIsUpdatingCompliance] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleRunCompliance = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('/api/compliance/check', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setLastRunResult('success');
                fetchDashboardData();
            } else {
                setLastRunResult('error');
            }
        } catch (error) {
            setLastRunResult('error');
        } finally {
            setIsRunning(false);
            setTimeout(() => setLastRunResult(null), 5000);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEmployee,
                    initial_requirements: selectedItems.length > 0
                        ? selectedItems.map(item => ({
                            document_type: item,
                            criticality: 'Medium',
                            category: 'General',
                            validity_period: 12
                        }))
                        : []
                }),
            });
            const result = await response.json();
            if (result.success) {
                setLastRunResult('success');
                setIsAddModalOpen(false);
                setSelectedItems([]);
                setNewEmployee({
                    emp_id: '',
                    name: '',
                    email: '',
                    department: '',
                    role: '',
                    join_date: new Date().toISOString().split('T')[0],
                    employment_type: 'Full-time'
                });
                fetchDashboardData();
            } else {
                alert(result.message || 'Failed to add employee');
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddRequirement = async () => {
        if (!selectedEmployee || (selectedItems.length === 0 && !newRequirement.document_type)) return;
        setIsUpdatingCompliance(true);
        try {
            const itemsToSave = selectedItems.length > 0
                ? selectedItems.map(item => ({ ...newRequirement, document_type: item }))
                : [newRequirement];

            const response = await fetch('/api/compliance/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemsToSave.map(item => ({
                    employee_id: selectedEmployee.employeeID,
                    ...item
                })))
            });
            const result = await response.json();
            if (result.success) {
                setShowAddRequirement(false);
                setSelectedItems([]);
                setNewRequirement({
                    document_type: '',
                    criticality: 'Medium',
                    category: 'Legal',
                    validity_period: 12
                });
                await fetchDashboardData(true);
            }
        } catch (error) {
            console.error('Add requirement error:', error);
        } finally {
            setIsUpdatingCompliance(false);
        }
    };

    const handleUpdateDocument = async (employeeId: string, docType: string) => {
        setIsUpdatingCompliance(true);
        try {
            const response = await fetch('/api/compliance/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    doc_type: docType,
                    doc_status: 'Active'
                }),
            });
            const result = await response.json();
            if (result.success) {
                setLastRunResult('success');
                await fetchDashboardData(true);
            }
        } catch (error) {
            console.error('Error updating document:', error);
        } finally {
            setIsUpdatingCompliance(false);
        }
    };

    const handleAcknowledgePolicy = async (employeeId: string, policyName: string) => {
        setIsUpdatingCompliance(true);
        try {
            const response = await fetch('/api/compliance/policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    policy_name: policyName
                }),
            });
            const result = await response.json();
            if (result.success) {
                setLastRunResult('success');
                await fetchDashboardData(true);
            }
        } catch (error) {
            console.error('Error acknowledging policy:', error);
        } finally {
            setIsUpdatingCompliance(false);
        }
    };

    const fetchDashboardData = async (silent = false) => {
        if (!silent) setIsLoadingData(true);
        try {
            const response = await fetch('/api/compliance/data');
            const result = await response.json();
            if (result.success && result.data) {
                setComplianceData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            if (!silent) setIsLoadingData(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData();

        // 🟢 Real-time Data Binding with Supabase
        // Listen for ANY changes in audit_log or employees table
        const auditChannel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'audit_log' },
                () => {
                    console.log('Update detected in audit_log, refreshing...');
                    fetchDashboardData(true);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'employees' },
                () => {
                    console.log('Update detected in employees, refreshing...');
                    fetchDashboardData(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(auditChannel);
        };
    }, []);

    const reportsData = complianceData?.auditLog || [];
    const stats = complianceData?.stats;
    const employeesList = complianceData?.employees || [];
    const lastUpdate = complianceData?.stats?.reportDate || new Date().toLocaleDateString();    // Sync selected employee with the refreshed compliance data
    React.useEffect(() => {
        if (selectedEmployee && complianceData?.employees) {
            const updated = complianceData.employees.find((e: any) => e.employeeID === selectedEmployee.employeeID);
            if (updated) {
                setSelectedEmployee(updated);
            }
        }
    }, [complianceData]);

    const filteredEmployees = employeesList.filter((e: any) =>
        e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`flex h-screen bg-background text-foreground transition-colors duration-300 font-sans`}>
            {/* Notification Toast */}
            <AnimatePresence>
                {lastRunResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -100 }}
                        animate={{ opacity: 1, y: 20 }}
                        exit={{ opacity: 0, y: -100 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm"
                    >
                        <div className={`p-4 rounded-2xl premium-shadow border flex items-center gap-3 ${lastRunResult === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                            {lastRunResult === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            <p className="font-bold">{lastRunResult === 'success' ? 'Workflow triggered successfully!' : 'Failed to trigger workflow.'}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className="w-64 glass border-r border-border hidden md:flex flex-col p-6 z-20">
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="p-2 bg-primary rounded-xl">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Compliance<span className="text-primary italic">X</span></h1>
                </div>

                <nav className="space-y-2 flex-grow">
                    <SidebarLink
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <SidebarLink
                        icon={<Users className="w-5 h-5" />}
                        label="Employees"
                        active={activeTab === 'employees'}
                        onClick={() => setActiveTab('employees')}
                    />
                    <SidebarLink
                        icon={<FileText className="w-5 h-5" />}
                        label="Reports"
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
                    />
                    <SidebarLink
                        icon={<ShieldAlert className="w-5 h-5" />}
                        label="Incidents"
                        active={activeTab === 'incidents'}
                        onClick={() => setActiveTab('incidents')}
                    />
                </nav>

                <div className="pt-6 border-t border-border mt-auto">
                    <SidebarLink
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-secondary transition-colors mt-2"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button
                        onClick={() => {
                            setComplianceData(null);
                            fetchDashboardData();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-secondary transition-colors mt-2"
                    >
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="font-medium">Refresh Data</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full relative">
                {/* Header */}
                <header className="sticky top-0 z-10 glass border-b border-border px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-secondary/50 px-4 py-2 rounded-2xl border border-border w-1/3">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search employees, departments, roles..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        {isLoadingData && (
                            <div className="flex items-center gap-2 text-primary font-bold animate-pulse text-xs">
                                <Zap className="w-3 h-3 fill-current" />
                                SYNCING...
                            </div>
                        )}
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-colors premium-shadow mr-1 lg:mr-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">ADD EMPLOYEE</span>
                            </button>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">HR Admin</p>
                                <p className="text-xs text-muted-foreground">Compliance Manager</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <div className="flex flex-col">
                                            <h2 className="text-3xl font-black tracking-tight">Compliance Feed</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Sync Enabled • Last Update: {lastUpdate}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-1">Real-time overview of organization-wide HR compliance.</p>
                                    </div>
                                    <button
                                        onClick={handleRunCompliance}
                                        disabled={isRunning}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold premium-shadow hover:translate-y-[-2px] active:scale-95 transition-all h-fit disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <Zap className={`w-4 h-4 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
                                        {isRunning ? 'Running Check...' : 'Run Compliance Check'}
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    <StatCard
                                        icon={<Users className="text-indigo-500" />}
                                        label="Total Personnel"
                                        value={stats?.totalEmployees || 0}
                                        trend="+12% from last month"
                                        trendColor="text-emerald-500"
                                    />
                                    <StatCard
                                        icon={<ShieldCheck className="text-emerald-500" />}
                                        label="Avg. Compliance"
                                        value={`${stats?.averageCompliance || 0}%`}
                                        progress={stats?.averageCompliance || 0}
                                        trend="Target: 95%"
                                    />
                                    <StatCard
                                        icon={<AlertTriangle className="text-amber-500" />}
                                        label="Medium Risk"
                                        value={stats?.mediumRiskCount || 0}
                                        trend="Awaiting review"
                                        trendColor="text-amber-500"
                                    />
                                    <StatCard
                                        icon={<ShieldAlert className="text-destructive" />}
                                        label="Critical Issues"
                                        value={stats?.highRiskCount || 0}
                                        trend="Action required"
                                        trendColor="text-destructive"
                                    />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Recent Activity / Critical Employees */}
                                    <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold">Critical Compliance Issues</h3>
                                            <button
                                                onClick={() => setActiveTab('employees')}
                                                className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                                            >
                                                View all <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {filteredEmployees.filter((e: any) => e.risk_level === 'High').slice(0, 5).map((emp: any) => (
                                                <EmployeeMiniRow
                                                    key={emp.employeeID}
                                                    employee={emp}
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setActiveTab('employees');
                                                    }}
                                                />
                                            ))}
                                            {filteredEmployees.filter((e: any) => e.risk_level === 'High').length === 0 && (
                                                <div className="py-10 text-center">
                                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full w-fit mx-auto mb-3">
                                                        <ShieldCheck className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-bold">All clear!</p>
                                                    <p className="text-sm text-muted-foreground text-center">No high-risk compliance issues detected.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Risk Distribution */}
                                    <div className="glass p-8 rounded-3xl border border-border h-fit">
                                        <h3 className="text-xl font-bold mb-6">Risk Distribution</h3>
                                        <div className="space-y-6">
                                            <RiskBar label="High Risk" count={stats?.highRiskCount || 0} total={stats?.totalEmployees || 1} color="bg-destructive" />
                                            <RiskBar label="Medium Risk" count={stats?.mediumRiskCount || 0} total={stats?.totalEmployees || 1} color="bg-amber-500" />
                                            <RiskBar label="Low Risk" count={stats?.lowRiskCount || 0} total={stats?.totalEmployees || 1} color="bg-emerald-500" />
                                        </div>

                                        <div className="mt-10 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <p className="text-xs font-semibold text-primary uppercase mb-2">Pro Tip</p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Update your Google Sheet and click refresh to see real-time compliance improvements.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'employees' && (
                            <motion.div
                                key="employees"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold tracking-tight">Employee Compliance</h2>
                                    <p className="text-muted-foreground mt-1">Detailed breakdown of compliance status by individual.</p>
                                </div>

                                <div className="glass overflow-hidden rounded-3xl border border-border">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/30">
                                                <th className="px-6 py-4 font-semibold text-sm">Employee</th>
                                                <th className="px-6 py-4 font-semibold text-sm">Department</th>
                                                <th className="px-6 py-4 font-semibold text-sm">Risk Level</th>
                                                <th className="px-6 py-4 font-semibold text-sm">Compliance</th>
                                                <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees.map((emp: any) => (
                                                <tr
                                                    key={emp.employeeID}
                                                    className="border-t border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedEmployee(emp)}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                                                                {emp.employeeName.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{emp.employeeName}</p>
                                                                <p className="text-xs text-muted-foreground">{emp.employeeID}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-sm">{emp.department}</p>
                                                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <RiskBadge level={emp.risk_level} />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 bg-secondary rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${getScoreColor(emp.compliance_score)}`}
                                                                    style={{ width: `${emp.compliance_score}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-bold">{emp.compliance_score}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'reports' && (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold tracking-tight">Compliance Audit Trail</h2>
                                    <p className="text-muted-foreground mt-1">Historic records of compliance checks and generated reports.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="glass p-6 rounded-3xl border border-border">
                                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Reports</p>
                                        <p className="text-3xl font-black">{reportsData.length}</p>
                                    </div>
                                    <div className="glass p-6 rounded-3xl border border-border">
                                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Last Audit</p>
                                        <p className="text-lg font-bold">{reportsData[0]?.audit_date || 'Never'}</p>
                                    </div>
                                    <div className="glass p-6 rounded-3xl border border-border bg-primary/5">
                                        <p className="text-xs text-primary uppercase font-bold mb-1">Automation Status</p>
                                        <p className="text-lg font-bold text-primary">Active • Every Monday</p>
                                    </div>
                                </div>

                                <div className="glass overflow-hidden rounded-3xl border border-border">
                                    <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                                        <h3 className="font-bold">Recent Audit Logs</h3>
                                        <button className="px-4 py-2 bg-secondary rounded-xl text-xs font-bold hover:bg-border transition-colors flex items-center gap-2">
                                            <Filter className="w-3 h-3" /> Filter Logs
                                        </button>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/10">
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground">Date</th>
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground">Employee</th>
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground">Score</th>
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground">Notification</th>
                                                <th className="px-6 py-3 font-semibold text-xs uppercase text-muted-foreground text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportsData.map((log: any, idx: number) => (
                                                <tr key={idx} className="border-t border-border hover:bg-secondary/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium">{log.audit_date}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold">{log.employee_name}</p>
                                                        <p className="text-xs text-muted-foreground">{log.employee_id}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-sm">{log.compliance_score}%</td>
                                                    <td className="px-6 py-4">
                                                        <RiskBadge level={log.risk_level} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${log.notifications_sent === 'Sent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                                                            {log.notifications_sent?.toUpperCase() || 'NOT SENT'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <a href={log.report_url || '#'} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-xs hover:underline">View Sheet</a>
                                                    </td>
                                                </tr>
                                            ))}
                                            {reportsData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center">
                                                        <div className="p-3 bg-secondary rounded-full w-fit mx-auto mb-3">
                                                            <FileText className="w-8 h-8 text-muted-foreground" />
                                                        </div>
                                                        <p className="font-bold">No Audit Logs Found</p>
                                                        <p className="text-sm text-muted-foreground">Trigger a compliance check to start generating reports.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Employee Detail Slide-over */}
            <AnimatePresence>
                {
                    selectedEmployee && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedEmployee(null)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card border-l border-border z-50 overflow-y-auto"
                            >
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-bold">Employee Profile</h3>
                                        <button
                                            onClick={() => setSelectedEmployee(null)}
                                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                                        >
                                            <XCircle className="w-6 h-6 text-muted-foreground" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6 mb-10 p-6 bg-secondary/30 rounded-3xl border border-border">
                                        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary/20">
                                            {selectedEmployee.employeeName.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold">{selectedEmployee.employeeName}</h4>
                                            <p className="text-muted-foreground">{selectedEmployee.role} • {selectedEmployee.department}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <RiskBadge level={selectedEmployee.risk_level} />
                                                <div className="px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-xs font-semibold border border-border">
                                                    ID: {selectedEmployee.employeeID}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        <div className="p-4 glass rounded-2xl border border-border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Compliance Score</p>
                                            <p className="text-2xl font-black text-primary">{selectedEmployee.compliance_score}%</p>
                                            <div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
                                                <div className={`h-full ${getScoreColor(selectedEmployee.compliance_score)}`} style={{ width: `${selectedEmployee.compliance_score}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-4 glass rounded-2xl border border-border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Items Checked</p>
                                            <p className="text-2xl font-black">{selectedEmployee.total_required - selectedEmployee.total_gaps} / {selectedEmployee.total_required}</p>
                                            <p className="text-xs text-muted-foreground mt-2">{selectedEmployee.total_gaps} issues found</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <GapSection
                                            title="Missing Documents"
                                            items={selectedEmployee.missing_documents}
                                            icon={<ShieldQuestion className="text-destructive" />}
                                            onAction={(item) => handleUpdateDocument(selectedEmployee.employeeID, item.document)}
                                            isUpdating={isUpdatingCompliance}
                                        />
                                        <GapSection
                                            title="Expired Documents"
                                            items={selectedEmployee.expired_documents}
                                            icon={<AlertTriangle className="text-amber-500" />}
                                            onAction={(item) => handleUpdateDocument(selectedEmployee.employeeID, item.document)}
                                            isUpdating={isUpdatingCompliance}
                                            isExpired
                                        />
                                        <GapSection
                                            title="Expiring Soon"
                                            items={selectedEmployee.expiring_soon}
                                            icon={<ShieldAlert className="text-blue-500" />}
                                            onAction={(item) => handleUpdateDocument(selectedEmployee.employeeID, item.document)}
                                            isUpdating={isUpdatingCompliance}
                                            isSoon
                                        />
                                        <GapSection
                                            title="Policy Acknowledgements"
                                            items={selectedEmployee.pending_acknowledgements}
                                            icon={<FileText className="text-indigo-500" />}
                                            onAction={(item) => handleAcknowledgePolicy(selectedEmployee.employeeID, item.policy)}
                                            isUpdating={isUpdatingCompliance}
                                            isPolicy
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {showAddRequirement && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden border-t border-border pt-8 mt-4 space-y-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-black text-lg">Add Specific Items</h4>
                                                    <button onClick={() => setShowAddRequirement(false)} className="text-muted-foreground hover:text-foreground">
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Select From Presets</label>
                                                        <div className="relative">
                                                            <select
                                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                                                                value=""
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === 'custom') {
                                                                        const custom = prompt("Enter custom requirement name:");
                                                                        if (custom && !selectedItems.includes(custom)) {
                                                                            setSelectedItems([...selectedItems, custom]);
                                                                        }
                                                                    } else if (val && !selectedItems.includes(val)) {
                                                                        setSelectedItems([...selectedItems, val]);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="" disabled>Choose documents...</option>
                                                                {PRESET_REQUIREMENTS.map(item => (
                                                                    <option key={item} value={item} disabled={selectedItems.includes(item)}>{item}</option>
                                                                ))}
                                                                <option value="custom" className="text-primary font-bold">+ Custom Requirement</option>
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                                <ChevronDown className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedItems.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 p-3 bg-secondary/20 rounded-2xl border border-dashed border-border/60">
                                                            {selectedItems.map((item, idx) => (
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    key={idx}
                                                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                                                                >
                                                                    {item}
                                                                    <button
                                                                        onClick={() => setSelectedItems(selectedItems.filter(i => i !== item))}
                                                                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Category</label>
                                                            <select
                                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                                                                value={newRequirement.category}
                                                                onChange={(e) => setNewRequirement({ ...newRequirement, category: e.target.value })}
                                                            >
                                                                <option>Legal</option>
                                                                <option>Onboarding</option>
                                                                <option>HR</option>
                                                                <option>Payroll</option>
                                                                <option>General</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Criticality</label>
                                                            <select
                                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                                                                value={newRequirement.criticality}
                                                                onChange={(e) => setNewRequirement({ ...newRequirement, criticality: e.target.value })}
                                                            >
                                                                <option>High</option>
                                                                <option>Medium</option>
                                                                <option>Low</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Validity (Months)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                            value={newRequirement.validity_period}
                                                            onChange={(e) => setNewRequirement({ ...newRequirement, validity_period: parseInt(e.target.value) })}
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleAddRequirement}
                                                        disabled={(selectedItems.length === 0) || isUpdatingCompliance}
                                                        className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold premium-shadow hover:brightness-110 transition-all disabled:opacity-50 disabled:brightness-100 flex items-center justify-center gap-2"
                                                    >
                                                        {isUpdatingCompliance ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                        Confirm Selection ({selectedItems.length})
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mt-12 flex gap-4">
                                        <button
                                            onClick={() => setShowAddRequirement(true)}
                                            className="flex-1 bg-secondary text-primary py-4 rounded-2xl font-bold border border-primary/20 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" /> Add New Item
                                        </button>
                                        <button className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-bold premium-shadow hover:brightness-110 transition-all">
                                            Send Reminder Email
                                        </button>
                                    </div>
                                    <button className="p-4 bg-secondary rounded-2xl hover:bg-border transition-colors">
                                        <Settings className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
            </AnimatePresence>


            {/* Add Employee Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-card rounded-3xl border border-border z-[101] overflow-hidden premium-shadow"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                            <UserPlus className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black">Add New Personnel</h3>
                                            <p className="text-sm text-muted-foreground">Register a new employee into the system.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                        <XCircle className="w-6 h-6 text-muted-foreground" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddEmployee} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Employee ID</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="EMP001"
                                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    value={newEmployee.emp_id}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, emp_id: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={newEmployee.name}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Work Email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                required
                                                placeholder="john.doe@company.com"
                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={newEmployee.email}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Department</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Engineering"
                                                    className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    value={newEmployee.department}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Role/Designation</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Software Engineer"
                                                    className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    value={newEmployee.role}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Join Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    value={newEmployee.join_date}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, join_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Employment Type</label>
                                            <select
                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                                                value={newEmployee.employment_type}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, employment_type: e.target.value })}
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Initial Compliance Requirements</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                                                    value=""
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'custom') {
                                                            const custom = prompt("Enter custom requirement name:");
                                                            if (custom && !selectedItems.includes(custom)) {
                                                                setSelectedItems([...selectedItems, custom]);
                                                            }
                                                        } else if (val && !selectedItems.includes(val)) {
                                                            setSelectedItems([...selectedItems, val]);
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Choose documents...</option>
                                                    {PRESET_REQUIREMENTS.map(item => (
                                                        <option key={item} value={item} disabled={selectedItems.includes(item)}>{item}</option>
                                                    ))}
                                                    <option value="custom" className="text-primary font-bold">+ Custom Requirement</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {selectedItems.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-3 bg-secondary/20 rounded-2xl border border-dashed border-border/60">
                                                {selectedItems.map((item, idx) => (
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        key={idx}
                                                        className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                                                    >
                                                        {item}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedItems(selectedItems.filter(i => i !== item))}
                                                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="flex-1 px-6 py-4 rounded-2xl font-bold bg-secondary hover:bg-border transition-colors outline-none"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-[2] px-6 py-4 rounded-2xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all premium-shadow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                            {isSubmitting ? 'Saving...' : 'Register Employee'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function SidebarLink({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-primary text-primary-foreground premium-shadow translate-x-1'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
        >
            {icon}
            <span className="font-semibold">{label}</span>
            {active && <motion.div layoutId="activePill" className="ml-auto w-1 h-4 bg-white/50 rounded-full" />}
        </button>
    );
}

function StatCard({ icon, label, value, trend, trendColor = 'text-muted-foreground', progress }: { icon: any, label: string, value: string | number, trend?: string, trendColor?: string, progress?: number }) {
    return (
        <div className="glass p-6 rounded-3xl border border-border flex flex-col premium-shadow hover:translate-y-[-4px] transition-all cursor-default">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary rounded-2xl">
                    <div className="w-6 h-6 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
                {trend && <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>}
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
            <h4 className="text-2xl font-black">{value}</h4>
            {progress !== undefined && (
                <div className="w-full bg-secondary h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
    );
}

function EmployeeMiniRow({ employee, onClick }: { employee: Employee, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive font-bold group-hover:scale-105 transition-transform">
                {employee.employeeName.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm tracking-tight">{employee.employeeName}</p>
                <p className="text-xs text-muted-foreground">{employee.high_criticality_gaps} High Risk Gaps</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-black text-destructive uppercase tracking-widest">{employee.risk_level}</p>
                <p className="text-sm font-bold text-muted-foreground">{employee.compliance_score}%</p>
            </div>
        </div>
    );
}

function RiskBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percentage = Math.round((count / total) * 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs font-bold text-muted-foreground">{count} ({percentage}%)</span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
}

function RiskBadge({ level }: { level: RiskLevel }) {
    const styles = {
        High: 'bg-destructive/10 text-destructive border-destructive/20',
        Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        Low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[level]}`}>
            {level.toUpperCase()}
        </span>
    );
}

function GapSection({ title, items, icon, isExpired, isSoon, isPolicy, onAction, isUpdating }: { title: string, items: any[], icon: any, isExpired?: boolean, isSoon?: boolean, isPolicy?: boolean, onAction?: (item: any) => void, isUpdating?: boolean }) {
    if (items.length === 0) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h5 className="font-bold tracking-tight uppercase text-xs">{title}</h5>
                <span className="ml-auto px-2 py-0.5 bg-secondary rounded text-[10px] font-black">{items.length}</span>
            </div>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-secondary/20 rounded-2xl border border-border/40">
                        <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-sm">{isPolicy ? item.policy : item.document}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${item.criticality === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                                }`}>
                                {item.criticality || 'Medium'}
                            </span>
                        </div>
                        {isExpired && (
                            <p className="text-xs text-muted-foreground">
                                Expired on <span className="text-destructive font-bold">{item.expiry_date}</span> ({item.days_overdue} days ago)
                            </p>
                        )}
                        {isSoon && (
                            <p className="text-xs text-muted-foreground">
                                Expires on <span className="text-amber-500 font-bold">{item.expiry_date}</span> ({item.days_remaining} days left)
                            </p>
                        )}
                        {isPolicy && (
                            <p className="text-xs text-muted-foreground">Status: <span className="text-destructive font-bold">{item.status}</span></p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.category || (isPolicy ? 'Compliance' : 'General')}</span>
                            <button
                                onClick={() => onAction?.(item)}
                                disabled={isUpdating}
                                className="text-xs text-primary font-bold hover:underline underline-offset-4 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                                {item.action}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getScoreColor(score: number) {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-destructive';
}
