/**
 * A1 Diagnosis User Analytics - Detailed Section Timing & Behavior Tracking
 * Based on 01data Netlify Blob implementation
 * Tracks: section viewing time, scroll patterns, engagement metrics
 */

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    console.log('📊 A1 Diagnosis User Analytics Function');
    console.log('Method:', event.httpMethod);
    console.log('Headers:', event.headers);
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (event.httpMethod === 'POST') {
            return await saveAnalyticsData(event);
        } else if (event.httpMethod === 'GET') {
            return await getAnalyticsData(event);
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (error) {
        console.error('❌ Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

async function saveAnalyticsData(event) {
    try {
        const data = JSON.parse(event.body);
        console.log('📝 Saving analytics data:', {
            sessionId: data.sessionId,
            sections: data.sections?.length,
            totalTime: data.totalSessionTime
        });

        // Configure Netlify Blobs storage with error handling
        let store;
        try {
            const { getStore } = await import('@netlify/blobs');
            store = getStore({ name: 'a1-diagnosis-analytics' });
            console.log('✅ Netlify Blobs store initialized for saving');
        } catch (importError) {
            console.error('❌ Failed to import @netlify/blobs for saving:', importError);
            throw new Error('Netlify Blobs not available: ' + importError.message);
        }
        
        // Generate unique session ID with timestamp
        const sessionId = data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Prepare analytics data structure
        const analyticsData = {
            id: sessionId,
            timestamp: timestamp,
            page: data.page || 'index',
            device: data.device || 'unknown',
            userAgent: data.userAgent || '',
            screenResolution: data.screenResolution || '',
            language: data.language || 'en',
            referrer: data.referrer || '',
            
            // Session metrics
            totalSessionTime: data.totalSessionTime || 0,
            totalScrollDepth: data.totalScrollDepth || 0,
            maxScrollReached: data.maxScrollReached || 0,
            
            // Section timing data
            sections: data.sections || [],
            
            // User interactions
            interactions: data.interactions || [],
            
            // Exit data
            exitSection: data.exitSection || '',
            exitTime: data.exitTime || 0,
            bounceRate: data.bounceRate || false,
            
            // Business metrics
            viewedPresentation: data.viewedPresentation || false,
            contactEngagement: data.contactEngagement || false,
            emailClicked: data.emailClicked || false,
            
            metadata: {
                version: '1.0',
                source: 'a1-diagnosis-website',
                saved_at: timestamp,
                total_sections: data.sections?.length || 0,
                engagement_score: calculateEngagementScore(data)
            }
        };

        // Save to Netlify Blobs
        await store.setJSON(sessionId, analyticsData);
        
        console.log('✅ Analytics data saved successfully:', {
            sessionId: sessionId,
            sections: analyticsData.sections.length,
            engagementScore: analyticsData.metadata.engagement_score
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                sessionId: sessionId,
                message: 'Analytics data saved successfully'
            })
        };

    } catch (error) {
        console.error('❌ Error saving analytics data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to save analytics data',
                details: error.message 
            })
        };
    }
}

async function getAnalyticsData(event) {
    try {
        // Get query parameters
        const queryParams = event.queryStringParameters || {};
        const { 
            days = '7',
            format = 'summary',
            section = null 
        } = queryParams;

        console.log('📈 Fetching analytics data:', { days, format, section });
        console.log('Node version:', process.version);

        // Check if we're in a supported environment
        if (!process.version.startsWith('v18') && !process.version.startsWith('v20')) {
            console.warn('⚠️ Netlify Blobs requires Node.js 18+, current version:', process.version);
        }

        // Configure Netlify Blobs storage with error handling
        let store;
        try {
            const { getStore } = await import('@netlify/blobs');
            store = getStore({ name: 'a1-diagnosis-analytics' });
            console.log('✅ Netlify Blobs store initialized');
        } catch (importError) {
            console.error('❌ Failed to import @netlify/blobs:', importError);
            throw new Error('Netlify Blobs not available: ' + importError.message);
        }
        
        // List all analytics sessions
        let blobs = [];
        try {
            const result = await store.list();
            blobs = result.blobs || [];
        } catch (error) {
            console.log('📝 No analytics data found yet (first time):', error.message);
            blobs = [];
        }
        
        console.log(`📁 Found ${blobs.length} analytics sessions`);
        
        const sessions = [];
        const daysAgo = parseInt(days);
        const cutoffDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
        
        // Read and filter sessions
        for (const blob of blobs) {
            try {
                const session = await store.get(blob.key, { type: 'json' });
                
                if (session && new Date(session.timestamp) >= cutoffDate) {
                    sessions.push(session);
                }
            } catch (error) {
                console.error(`Error reading session ${blob.key}:`, error);
                continue;
            }
        }

        console.log(`✅ Loaded ${sessions.length} sessions from last ${days} days`);

        // Generate analytics based on format
        let analyticsResult;
        if (format === 'detailed') {
            analyticsResult = generateDetailedAnalytics(sessions, section);
        } else {
            analyticsResult = generateSummaryAnalytics(sessions);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                period_days: daysAgo,
                total_sessions: sessions.length,
                analytics: analyticsResult
            })
        };

    } catch (error) {
        console.error('❌ Error fetching analytics data:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch analytics data',
                details: error.message 
            })
        };
    }
}

function calculateEngagementScore(data) {
    let score = 0;
    
    // Time-based scoring (max 40 points)
    const timeScore = Math.min(40, (data.totalSessionTime || 0) / 1000 / 60 * 10); // 10 points per minute
    score += timeScore;
    
    // Scroll depth scoring (max 20 points)
    const scrollScore = Math.min(20, (data.totalScrollDepth || 0) * 20 / 100);
    score += scrollScore;
    
    // Section engagement scoring (max 30 points)
    const sectionsVisited = (data.sections || []).filter(s => s.timeSpent > 3000).length; // 3+ seconds
    const sectionScore = Math.min(30, sectionsVisited * 5);
    score += sectionScore;
    
    // Interaction scoring (max 10 points)
    const interactions = data.interactions || [];
    const interactionScore = Math.min(10, interactions.length * 2);
    score += interactionScore;
    
    return Math.round(score);
}

function generateSummaryAnalytics(sessions) {
    const totalSessions = sessions.length;
    
    if (totalSessions === 0) {
        return {
            summary: { total_sessions: 0, average_time: 0, bounce_rate: 0 },
            sections: {},
            devices: {},
            engagement: { average_score: 0, high_engagement_sessions: 0 }
        };
    }

    // Summary metrics
    const totalTime = sessions.reduce((sum, s) => sum + (s.totalSessionTime || 0), 0);
    const averageTime = totalTime / totalSessions / 1000; // in seconds
    const bounced = sessions.filter(s => s.bounceRate).length;
    const bounceRate = (bounced / totalSessions) * 100;

    // Section analytics
    const sectionData = {};
    sessions.forEach(session => {
        (session.sections || []).forEach(section => {
            if (!sectionData[section.name]) {
                sectionData[section.name] = {
                    total_views: 0,
                    total_time: 0,
                    average_time: 0,
                    max_time: 0,
                    engagement_rate: 0
                };
            }
            
            sectionData[section.name].total_views++;
            sectionData[section.name].total_time += section.timeSpent || 0;
            sectionData[section.name].max_time = Math.max(
                sectionData[section.name].max_time, 
                section.timeSpent || 0
            );
        });
    });

    // Calculate section averages
    Object.keys(sectionData).forEach(sectionName => {
        const section = sectionData[sectionName];
        section.average_time = section.total_time / section.total_views;
        section.engagement_rate = (section.total_views / totalSessions) * 100;
        section.average_time_seconds = Math.round(section.average_time / 1000);
    });

    // Device analytics
    const deviceData = {};
    sessions.forEach(session => {
        const device = session.device || 'unknown';
        deviceData[device] = (deviceData[device] || 0) + 1;
    });

    // Engagement metrics
    const engagementScores = sessions.map(s => s.metadata?.engagement_score || 0);
    const averageEngagement = engagementScores.reduce((a, b) => a + b, 0) / totalSessions;
    const highEngagementSessions = sessions.filter(s => (s.metadata?.engagement_score || 0) > 60).length;

    return {
        summary: {
            total_sessions: totalSessions,
            average_time_seconds: Math.round(averageTime),
            bounce_rate: Math.round(bounceRate),
            presentation_views: sessions.filter(s => s.viewedPresentation).length,
            contact_engagements: sessions.filter(s => s.contactEngagement).length
        },
        sections: sectionData,
        devices: deviceData,
        engagement: {
            average_score: Math.round(averageEngagement),
            high_engagement_sessions: highEngagementSessions,
            engagement_rate: Math.round((highEngagementSessions / totalSessions) * 100)
        }
    };
}

function generateDetailedAnalytics(sessions, sectionFilter = null) {
    const summary = generateSummaryAnalytics(sessions);
    
    // Add detailed session data
    const detailedSessions = sessions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 100) // Limit for performance
        .map(session => ({
            id: session.id,
            timestamp: session.timestamp,
            duration_seconds: Math.round((session.totalSessionTime || 0) / 1000),
            scroll_depth: session.totalScrollDepth || 0,
            sections_visited: session.sections?.length || 0,
            engagement_score: session.metadata?.engagement_score || 0,
            device: session.device || 'unknown',
            page: session.page || 'index',
            viewed_presentation: session.viewedPresentation || false,
            contact_engagement: session.contactEngagement || false
        }));

    // Section-specific analysis if requested
    let sectionAnalysis = null;
    if (sectionFilter && summary.sections[sectionFilter]) {
        const sectionSessions = sessions.filter(s => 
            s.sections?.some(sec => sec.name === sectionFilter)
        );
        
        sectionAnalysis = {
            section_name: sectionFilter,
            total_sessions: sectionSessions.length,
            conversion_rate: (sectionSessions.length / sessions.length) * 100,
            time_distribution: sectionSessions.map(s => {
                const section = s.sections.find(sec => sec.name === sectionFilter);
                return {
                    session_id: s.id,
                    time_spent: Math.round((section?.timeSpent || 0) / 1000),
                    scroll_depth: section?.scrollDepth || 0
                };
            })
        };
    }

    return {
        ...summary,
        detailed_sessions: detailedSessions,
        section_analysis: sectionAnalysis
    };
}