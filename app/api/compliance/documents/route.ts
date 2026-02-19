import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employee_id, doc_type, expiry_date, doc_status } = body;

        if (!employee_id || !doc_type) {
            return NextResponse.json(
                { success: false, message: 'Employee ID and Document Type are required.' },
                { status: 400 }
            );
        }

        // Upsert: If document type already exists for employee, update it. Otherwise, insert.
        // First, check if it exists
        const { data: existing } = await supabase
            .from('document_inventory')
            .select('id')
            .eq('employee_id', employee_id)
            .eq('doc_type', doc_type)
            .single();

        let result;
        if (existing) {
            result = await supabase
                .from('document_inventory')
                .update({
                    upload_date: new Date().toISOString().split('T')[0],
                    expiry_date,
                    doc_status: doc_status || 'Active'
                })
                .eq('id', existing.id)
                .select();
        } else {
            result = await supabase
                .from('document_inventory')
                .insert([
                    {
                        employee_id,
                        doc_type,
                        upload_date: new Date().toISOString().split('T')[0],
                        expiry_date,
                        doc_status: doc_status || 'Active'
                    }
                ])
                .select();
        }

        if (result.error) throw result.error;

        return NextResponse.json({
            success: true,
            data: result.data[0],
            message: 'Document updated successfully!'
        });
    } catch (error: any) {
        console.error('Document API error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
