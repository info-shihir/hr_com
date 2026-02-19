import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

        if (N8N_WEBHOOK_URL) {
            console.log('Triggering actual n8n webhook:', N8N_WEBHOOK_URL);
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    triggeredFrom: 'HR Compliance Dashboard',
                    timestamp: new Date().toISOString(),
                    requestedBy: 'HR Admin'
                }),
            });

            if (!response.ok) {
                throw new Error(`n8n responded with status: ${response.status}`);
            }

            return NextResponse.json({
                success: true,
                message: 'n8n workflow triggered successfully.',
                mode: 'production'
            });
        }

        // Fallback/Simulated delay for the compliance check if no webhook is configured
        console.log('No N8N_WEBHOOK_URL found, running in mock mode.');
        await new Promise(resolve => setTimeout(resolve, 2000));

        return NextResponse.json({
            success: true,
            message: 'Compliance check initiated successfully (Mock Mode).',
            mode: 'mock',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Webhook trigger error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to initiate compliance check.'
        }, { status: 500 });
    }
}
