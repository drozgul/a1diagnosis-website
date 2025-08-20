/**
 * Simple test function to verify Netlify deployment and Blobs access
 */

const { getStore } = require('@netlify/blobs');

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
        // Test basic function
        const response = {
            success: true,
            message: 'A1 Diagnosis Netlify function is working!',
            timestamp: new Date().toISOString(),
            node_version: process.version,
            environment: process.env.NODE_ENV || 'production',
            site_id: process.env.NETLIFY_SITE_ID || 'Not found',
            blobs_test: 'Testing...'
        };

        // Test Netlify Blobs access
        try {
            const explicitSiteId = '22d6cc06-98bf-4c11-8e05-b1c37cc42562';
            const storeOptions = { name: 'test-store' };
            
            if (!process.env.NETLIFY_SITE_ID) {
                storeOptions.siteID = explicitSiteId;
                storeOptions.token = process.env.NETLIFY_BLOBS_TOKEN;
            }
            
            const store = getStore(storeOptions);
            
            // Try to write a test value
            await store.set('test-key', 'test-value');
            
            // Try to read it back
            const testValue = await store.get('test-key');
            
            response.blobs_test = 'SUCCESS - Blobs are working!';
            response.test_value = testValue;
            
        } catch (blobsError) {
            console.log('Blobs test failed:', blobsError.message);
            response.blobs_test = 'FAILED - ' + blobsError.message;
            response.blobs_error = blobsError.name;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response, null, 2)
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