import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Fetch base data from Supabase
        const [
            { data: employees },
            { data: requirements },
            { data: inventory },
            { data: policies },
            { data: auditLogs }
        ] = await Promise.all([
            supabase.from('employees').select('*').order('name'),
            supabase.from('compliance_matrix').select('*'),
            supabase.from('document_inventory').select('*'),
            supabase.from('policy_acknowledgements').select('*'),
            supabase.from('audit_log').select('*').order('audit_date', { ascending: false })
        ]);

        if (!employees) throw new Error('Failed to fetch employees');

        // 2. Universal requirements (baseline for all employees)
        const universalDocs = [
            { document_type: 'Employment Contract', validity_period: 0, criticality: 'High', category: 'Onboarding' },
            { document_type: 'ID Proof', validity_period: 60, criticality: 'High', category: 'Legal' },
            { document_type: 'Address Proof', validity_period: 12, criticality: 'Medium', category: 'Legal' },
            { document_type: 'Educational Certificates', validity_period: 0, criticality: 'High', category: 'Onboarding' },
            { document_type: 'Background Check', validity_period: 24, criticality: 'High', category: 'Legal' },
            { document_type: 'Tax Forms', validity_period: 12, criticality: 'High', category: 'Payroll' },
            { document_type: 'Emergency Contact', validity_period: 12, criticality: 'Medium', category: 'HR' },
            { document_type: 'Bank Details', validity_period: 0, criticality: 'High', category: 'Payroll' }
        ];

        const requiredPolicies = [
            'Code of Conduct',
            'Data Privacy Policy',
            'Anti-Harassment Policy',
            'Information Security Policy',
            'Confidentiality Agreement'
        ];

        const today = new Date();

        // 3. Process each employee
        const processedEmployees = employees.map(emp => {
            const empDocs = inventory?.filter(d => d.employee_id === emp.emp_id) || [];
            const empPolicies = policies?.filter(p => p.employee_id === emp.emp_id) || [];

            // Combine universal docs with role-specific and employee-specific ones
            const roleReqs = requirements?.filter(r =>
                !r.employee_id &&
                (r.department === 'All' || r.department === emp.department) &&
                (r.role === 'All' || r.role === emp.role)
            ) || [];

            const personalReqs = requirements?.filter(r => r.employee_id === emp.emp_id) || [];

            // Deduplicate requirements
            const allReqs = [...universalDocs];
            [...roleReqs, ...personalReqs].forEach(rr => {
                if (!allReqs.find(ar => ar.document_type.toLowerCase() === rr.document_type.toLowerCase())) {
                    allReqs.push(rr);
                }
            });

            const gaps = {
                missing_documents: [] as any[],
                expired_documents: [] as any[],
                expiring_soon: [] as any[],
                pending_acknowledgements: [] as any[]
            };

            // Check Documents
            allReqs.forEach(req => {
                const found = empDocs.find(d => d.doc_type.toLowerCase() === req.document_type.toLowerCase());

                if (!found) {
                    gaps.missing_documents.push({
                        document: req.document_type,
                        criticality: req.criticality,
                        category: req.category,
                        action: 'Upload Required'
                    });
                } else if (req.validity_period > 0 && found.expiry_date) {
                    const expiryDate = new Date(found.expiry_date);
                    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysUntilExpiry < 0) {
                        gaps.expired_documents.push({
                            document: req.document_type,
                            upload_date: found.upload_date,
                            expiry_date: found.expiry_date,
                            days_overdue: Math.abs(daysUntilExpiry),
                            criticality: req.criticality,
                            action: 'Renew Immediately'
                        });
                    } else if (daysUntilExpiry <= 30) {
                        gaps.expiring_soon.push({
                            document: req.document_type,
                            expiry_date: found.expiry_date,
                            days_remaining: daysUntilExpiry,
                            criticality: req.criticality,
                            action: 'Schedule Renewal'
                        });
                    }
                }
            });

            // Check Policies
            requiredPolicies.forEach(pName => {
                const ack = empPolicies.find(p => p.policy_name.toLowerCase().includes(pName.toLowerCase().split(' ')[0]));
                if (!ack) {
                    gaps.pending_acknowledgements.push({
                        policy: pName,
                        status: 'Not Acknowledged',
                        last_acknowledged: null,
                        action: 'Acknowledge Policy'
                    });
                }
            });

            const totalReqs = allReqs.length + requiredPolicies.length;
            const totalGaps = gaps.missing_documents.length + gaps.expired_documents.length + gaps.pending_acknowledgements.length;
            const score = Math.round(((totalReqs - totalGaps) / totalReqs) * 100);

            const highCritGaps = [
                ...gaps.missing_documents.filter(d => d.criticality === 'High'),
                ...gaps.expired_documents.filter(d => d.criticality === 'High')
            ].length;

            const riskLevel = score < 60 || highCritGaps >= 3 ? 'High' : (score < 85 || highCritGaps >= 1 ? 'Medium' : 'Low');

            return {
                employeeID: emp.emp_id,
                employeeName: emp.name,
                email: emp.email,
                department: emp.department,
                role: emp.role,
                compliance_score: score,
                risk_level: riskLevel,
                total_required: totalReqs,
                total_gaps: totalGaps,
                high_criticality_gaps: highCritGaps,
                ...gaps
            };
        });

        // 4. Calculate Stats
        const totalEmployees = processedEmployees.length;
        const avgCompliance = totalEmployees > 0 ? Math.round(processedEmployees.reduce((s, e) => s + e.compliance_score, 0) / totalEmployees) : 0;

        const stats = {
            totalEmployees,
            averageCompliance: avgCompliance,
            highRiskCount: processedEmployees.filter(e => e.risk_level === 'High').length,
            mediumRiskCount: processedEmployees.filter(e => e.risk_level === 'Medium').length,
            lowRiskCount: processedEmployees.filter(e => e.risk_level === 'Low').length,
            reportDate: today.toLocaleDateString(),
            overallStatus: avgCompliance >= 90 ? 'Healthy' : avgCompliance >= 70 ? 'Warning' : 'Critical'
        };

        return NextResponse.json({
            success: true,
            data: {
                employees: processedEmployees,
                stats,
                auditLog: auditLogs || []
            }
        });

    } catch (error: any) {
        console.error('Compliance Data Sync Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
