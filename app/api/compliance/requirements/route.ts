import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];

        if (items.length === 0) {
            return NextResponse.json({ success: false, message: 'No items provided' }, { status: 400 });
        }

        const inserts = items.map(item => ({
            employee_id: item.employee_id,
            document_type: item.document_type,
            criticality: item.criticality || 'Medium',
            category: item.category || 'General',
            validity_period: item.validity_period || 0,
            applies_to: 'Individual'
        }));

        const { data, error } = await supabase
            .from('compliance_matrix')
            .insert(inserts)
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            message: `${inserts.length} requirement(s) added successfully!`
        });
    } catch (error: any) {
        console.error('Requirements API error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
