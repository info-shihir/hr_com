import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employee_id, policy_name, version } = body;

        if (!employee_id || !policy_name) {
            return NextResponse.json(
                { success: false, message: 'Employee ID and Policy Name are required.' },
                { status: 400 }
            );
        }

        // Upsert logic for policy acknowledgements
        const { data: existing } = await supabase
            .from('policy_acknowledgements')
            .select('id')
            .eq('employee_id', employee_id)
            .eq('policy_name', policy_name)
            .single();

        let result;
        if (existing) {
            result = await supabase
                .from('policy_acknowledgements')
                .update({
                    acknowledged_date: new Date().toISOString().split('T')[0],
                    version: version || '1.0'
                })
                .eq('id', existing.id)
                .select();
        } else {
            result = await supabase
                .from('policy_acknowledgements')
                .insert([
                    {
                        employee_id,
                        policy_name,
                        acknowledged_date: new Date().toISOString().split('T')[0],
                        version: version || '1.0'
                    }
                ])
                .select();
        }

        if (result.error) throw result.error;

        return NextResponse.json({
            success: true,
            data: result.data[0],
            message: 'Policy acknowledged successfully!'
        });
    } catch (error: any) {
        console.error('Policy API error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
