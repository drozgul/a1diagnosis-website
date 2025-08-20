/**
 * Simple test function to verify Netlify deployment
 */

exports.handler = async (event, context) => {
    console.log('🧪 Test function called');
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const response = {
            success: true,
            message: 'A1 Diagnosis Netlify function is working!',
            timestamp: new Date().toISOString(),
            node_version: process.version,
            environment: process.env.NODE_ENV || 'production'
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Test function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Test function failed',
                details: error.message 
            })
        };
    }
};