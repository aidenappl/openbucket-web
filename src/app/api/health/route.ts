import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Basic health check - you can add more sophisticated checks here
        // such as database connectivity, external service availability, etc.

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '0.1.0',
            environment: process.env.NODE_ENV || 'development',
        };

        return NextResponse.json(healthStatus, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);

        const errorStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        };

        return NextResponse.json(errorStatus, { status: 503 });
    }
}