import { Employee, DashboardStats } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
    {
        employeeID: 'EMP001',
        employeeName: 'Sarah Jenkins',
        department: 'Engineering',
        role: 'Senior Developer',
        joinDate: '2022-03-15',
        email: 'sarah.jenkins@company.com',
        compliance_score: 85,
        risk_level: 'Low',
        total_required: 12,
        total_gaps: 2,
        high_criticality_gaps: 0,
        check_date: '2026-02-18',
        missing_documents: [
            { document: 'Emergency Contact', criticality: 'Medium', category: 'HR', action: 'Upload Required' }
        ],
        expired_documents: [],
        expiring_soon: [
            { document: 'ID Proof', expiry_date: '2026-03-10', days_remaining: 20, criticality: 'High', action: 'Schedule Renewal' }
        ],
        pending_acknowledgements: []
    },
    {
        employeeID: 'EMP002',
        employeeName: 'Michael Chen',
        department: 'Sales',
        role: 'Account Executive',
        joinDate: '2023-01-10',
        email: 'michael.chen@company.com',
        compliance_score: 45,
        risk_level: 'High',
        total_required: 12,
        total_gaps: 7,
        high_criticality_gaps: 3,
        check_date: '2026-02-18',
        missing_documents: [
            { document: 'Employment Contract', criticality: 'High', category: 'Onboarding', action: 'Upload Required' },
            { document: 'Educational Certificates', criticality: 'High', category: 'Onboarding', action: 'Upload Required' }
        ],
        expired_documents: [
            { document: 'ID Proof', upload_date: '2023-01-10', expiry_date: '2025-01-10', days_overdue: 404, criticality: 'High', action: 'Renew Immediately' }
        ],
        expiring_soon: [],
        pending_acknowledgements: [
            { policy: 'Code of Conduct', status: 'Not Acknowledged', last_acknowledged: null, action: 'Acknowledge Policy' },
            { policy: 'Data Privacy Policy', status: 'Not Acknowledged', last_acknowledged: null, action: 'Acknowledge Policy' }
        ]
    },
    {
        employeeID: 'EMP003',
        employeeName: 'Jessica Rodriguez',
        department: 'Human Resources',
        role: 'HR Manager',
        joinDate: '2021-06-20',
        email: 'jessica.rodriguez@company.com',
        compliance_score: 100,
        risk_level: 'Low',
        total_required: 12,
        total_gaps: 0,
        high_criticality_gaps: 0,
        check_date: '2026-02-18',
        missing_documents: [],
        expired_documents: [],
        expiring_soon: [],
        pending_acknowledgements: []
    },
    {
        employeeID: 'EMP004',
        employeeName: 'David Wilson',
        department: 'Finance',
        role: 'Staff Accountant',
        joinDate: '2023-11-05',
        email: 'david.wilson@company.com',
        compliance_score: 72,
        risk_level: 'Medium',
        total_required: 12,
        total_gaps: 3,
        high_criticality_gaps: 1,
        check_date: '2026-02-18',
        missing_documents: [
            { document: 'Tax Forms', criticality: 'High', category: 'Payroll', action: 'Upload Required' }
        ],
        expired_documents: [],
        expiring_soon: [],
        pending_acknowledgements: [
            { policy: 'Information Security Policy', status: 'Not Acknowledged', last_acknowledged: null, action: 'Acknowledge Policy' },
            { policy: 'Confidentiality Agreement', status: 'Not Acknowledged', last_acknowledged: null, action: 'Acknowledge Policy' }
        ]
    },
    {
        employeeID: 'EMP005',
        employeeName: 'Emily Taylor',
        department: 'Engineering',
        role: 'Frontend Lead',
        joinDate: '2022-08-12',
        email: 'emily.taylor@company.com',
        compliance_score: 58,
        risk_level: 'High',
        total_required: 12,
        total_gaps: 5,
        high_criticality_gaps: 2,
        check_date: '2026-02-18',
        missing_documents: [
            { document: 'Background Check', criticality: 'High', category: 'Legal', action: 'Upload Required' },
            { document: 'Bank Details', criticality: 'High', category: 'Payroll', action: 'Upload Required' }
        ],
        expired_documents: [],
        expiring_soon: [
            { document: 'Address Proof', expiry_date: '2026-02-28', days_remaining: 10, criticality: 'Medium', action: 'Schedule Renewal' }
        ],
        pending_acknowledgements: [
            { policy: 'Anti-Harassment Policy', status: 'Not Acknowledged', last_acknowledged: null, action: 'Acknowledge Policy' }
        ]
    }
];

export const MOCK_STATS: DashboardStats = {
    totalEmployees: 5,
    averageCompliance: 72,
    highRiskCount: 2,
    mediumRiskCount: 1,
    lowRiskCount: 2,
    reportDate: '2026-02-18',
    overallStatus: 'Needs Attention'
};
