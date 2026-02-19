import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { emp_id, name, department, role, email, join_date, employment_type } = body;

        if (!emp_id || !name) {
            return NextResponse.json(
                { success: false, message: 'Employee ID and Name are required.' },
                { status: 400 }
            );
        }

        const { data: employee, error: empError } = await supabase
            .from('employees')
            .insert([
                {
                    emp_id,
                    name,
                    department,
                    role,
                    email,
                    join_date,
                    employment_type
                }
            ])
            .select()
            .single();

        if (empError) {
            console.error('Supabase employee error:', empError);
            return NextResponse.json(
                { success: false, message: empError.message },
                { status: 500 }
            );
        }

        // Add initial requirements if provided
        if (body.initial_requirements && body.initial_requirements.length > 0) {
            const requirements = body.initial_requirements.map((req: any) => ({
                employee_id: emp_id,
                document_type: req.document_type,
                criticality: req.criticality || 'Medium',
                category: req.category || 'General',
                validity_period: req.validity_period || 0,
                applies_to: 'Individual'
            }));

            const { error: reqError } = await supabase
                .from('compliance_matrix')
                .insert(requirements);

            if (reqError) {
                console.error('Supabase requirements error:', reqError);
                // We don't return error here because the employee was already created
            }
        }

        return NextResponse.json({
            success: true,
            data: employee,
            message: 'Employee added successfully!'
        });
    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to add employee.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch employees.' },
            { status: 500 }
        );
    }
}
