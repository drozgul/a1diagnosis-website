/**
 * A1 Diagnosis Section Analytics - Real-time User Behavior Tracking
 * Tracks section viewing time, scroll patterns, and engagement metrics
 * Sends data to Netlify Blob storage via user-analytics function
 */

class A1DiagnosisAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.currentSection = null;
        this.sectionStartTime = null;
        this.sectionsData = [];
        this.interactions = [];
        this.maxScrollReached = 0;
        this.isVisible = true;
        this.exitTime = null;
        
        // Configuration
        this.config = {
            saveInterval: 30000, // Save every 30 seconds
            minSectionTime: 1000, // Minimum 1 second in section to count
            scrollThreshold: 10, // Minimum scroll distance in pixels
            endpoint: '/.netlify/functions/user-analytics'
        };
        
        // Track sections and their elements
        this.sections = [
            { name: 'hero', selector: '.hero, #home' },
            { name: 'problem', selector: '.problem-section, #problem' },
            { name: 'solution', selector: '.solution-section, #solution' },
            { name: 'benefits', selector: '.value-section, #benefits' },
            { name: 'team', selector: '.team-preview, #team' },
            { name: 'cta', selector: '.cta-section, #contact' },
            { name: 'footer', selector: '.footer' }
        ];
        
        this.init();
    }
    
    generateSessionId() {
        return `a1d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    init() {
        console.log('🚀 A1 Diagnosis Analytics initialized:', this.sessionId);
        
        // Set up intersection observer for section tracking
        this.setupSectionObserver();
        
        // Set up scroll tracking
        this.setupScrollTracking();
        
        // Set up interaction tracking
        this.setupInteractionTracking();
        
        // Set up visibility tracking
        this.setupVisibilityTracking();
        
        // Set up periodic saving
        this.setupPeriodicSaving();
        
        // Set up exit tracking
        this.setupExitTracking();
        
        // Initial section detection
        this.detectCurrentSection();
    }
    
    setupSectionObserver() {
        const options = {
            threshold: [0.25, 0.5, 0.75], // Track when 25%, 50%, 75% visible
            rootMargin: '-50px 0px -50px 0px' // Only count when substantially visible
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionName = this.getSectionName(entry.target);
                
                if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                    // Section became visible
                    this.onSectionEnter(sectionName, entry.intersectionRatio);
                } else if (!entry.isIntersecting && this.currentSection === sectionName) {
                    // Section became invisible
                    this.onSectionExit(sectionName);
                }
            });
        }, options);
        
        // Observe all sections
        this.sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                this.observer.observe(element);
            }
        });
    }
    
    setupScrollTracking() {
        let scrollTimeout;
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
            
            // Update max scroll reached
            this.maxScrollReached = Math.max(this.maxScrollReached, scrollPercent);
            
            // Track scroll direction and speed
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
            const scrollSpeed = Math.abs(scrollTop - lastScrollTop);
            
            lastScrollTop = scrollTop;
            
            // Debounced scroll end detection
            scrollTimeout = setTimeout(() => {
                this.onScrollEnd(scrollPercent, scrollDirection, scrollSpeed);
            }, 150);
        });
    }
    
    setupInteractionTracking() {
        // Track button clicks
        const trackableButtons = [
            'a[href*="presentation"]',
            'a[href*="contact"]',
            'a[href*="mailto"]',
            '.cta-button',
            '.btn-primary',
            '.btn-secondary'
        ];
        
        trackableButtons.forEach(selector => {
            document.addEventListener('click', (event) => {
                if (event.target.matches(selector) || event.target.closest(selector)) {
                    const element = event.target.closest(selector) || event.target;
                    this.trackInteraction('click', {
                        element: selector,
                        text: element.textContent?.trim() || '',
                        href: element.href || '',
                        section: this.currentSection
                    });
                }
            });
        });
        
        // Track form interactions
        document.addEventListener('focus', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackInteraction('form_focus', {
                    element: event.target.tagName.toLowerCase(),
                    name: event.target.name || event.target.id || '',
                    section: this.currentSection
                });
            }
        }, true);
    }
    
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isVisible = false;
                this.onPageHidden();
            } else {
                this.isVisible = true;
                this.onPageVisible();
            }
        });
    }
    
    setupPeriodicSaving() {
        setInterval(() => {
            if (this.isVisible) {
                this.saveAnalytics(false); // Periodic save, not final
            }
        }, this.config.saveInterval);
    }
    
    setupExitTracking() {
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.onPageExit();
        });
        
        // Track back button and navigation
        window.addEventListener('pagehide', () => {
            this.onPageExit();
        });
    }
    
    getSectionName(element) {
        const section = this.sections.find(s => element.matches(s.selector));
        return section ? section.name : 'unknown';
    }
    
    detectCurrentSection() {
        // Find the section that's most visible
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        const viewportCenter = scrollTop + (viewportHeight / 2);
        
        let bestMatch = null;
        let bestDistance = Infinity;
        
        this.sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + scrollTop;
                const elementCenter = elementTop + (rect.height / 2);
                const distance = Math.abs(viewportCenter - elementCenter);
                
                if (distance < bestDistance && rect.height > 0) {
                    bestDistance = distance;
                    bestMatch = section.name;
                }
            }
        });
        
        if (bestMatch && bestMatch !== this.currentSection) {
            this.onSectionEnter(bestMatch, 0.5);
        }
    }
    
    onSectionEnter(sectionName, visibilityRatio) {
        console.log(`📍 Entered section: ${sectionName} (${Math.round(visibilityRatio * 100)}% visible)`);
        
        // Save previous section data
        if (this.currentSection && this.sectionStartTime) {
            this.finalizeSectionData(this.currentSection);
        }
        
        // Start tracking new section
        this.currentSection = sectionName;
        this.sectionStartTime = Date.now();
        
        // Initialize section data
        const existingData = this.sectionsData.find(s => s.name === sectionName);
        if (!existingData) {
            this.sectionsData.push({
                name: sectionName,
                timeSpent: 0,
                enterTime: this.sectionStartTime,
                exitTime: null,
                scrollDepth: 0,
                interactions: 0,
                visibilityRatio: visibilityRatio,
                visits: 1
            });
        } else {
            existingData.visits++;
            existingData.enterTime = this.sectionStartTime;
            existingData.visibilityRatio = Math.max(existingData.visibilityRatio, visibilityRatio);
        }
    }
    
    onSectionExit(sectionName) {
        console.log(`📍 Exited section: ${sectionName}`);
        
        if (this.currentSection === sectionName) {
            this.finalizeSectionData(sectionName);
            this.currentSection = null;
            this.sectionStartTime = null;
        }
    }
    
    finalizeSectionData(sectionName) {
        const sectionData = this.sectionsData.find(s => s.name === sectionName);
        if (sectionData && this.sectionStartTime) {
            const timeSpent = Date.now() - this.sectionStartTime;
            sectionData.timeSpent += timeSpent;
            sectionData.exitTime = Date.now();
            
            console.log(`⏱️ Section ${sectionName}: ${Math.round(timeSpent / 1000)}s (total: ${Math.round(sectionData.timeSpent / 1000)}s)`);
        }
    }
    
    onScrollEnd(scrollPercent, direction, speed) {
        // Update current section's scroll depth
        const sectionData = this.sectionsData.find(s => s.name === this.currentSection);
        if (sectionData) {
            sectionData.scrollDepth = Math.max(sectionData.scrollDepth, scrollPercent);
        }
        
        // Track significant scroll events
        if (speed > 100) { // Fast scroll
            this.trackInteraction('fast_scroll', {
                direction: direction,
                speed: speed,
                scrollPercent: scrollPercent,
                section: this.currentSection
            });
        }
    }
    
    trackInteraction(type, data) {
        console.log(`🖱️ Interaction: ${type}`, data);
        
        this.interactions.push({
            type: type,
            timestamp: Date.now(),
            section: this.currentSection,
            data: data
        });
        
        // Update section interaction count
        const sectionData = this.sectionsData.find(s => s.name === this.currentSection);
        if (sectionData) {
            sectionData.interactions++;
        }
        
        // Track special interactions
        if (type === 'click' && data.href?.includes('presentation')) {
            this.trackPresentationView();
        }
        
        if (type === 'click' && (data.href?.includes('mailto') || data.href?.includes('contact'))) {
            this.trackContactEngagement();
        }
    }
    
    trackPresentationView() {
        console.log('🎯 Presentation view tracked');
        this.viewedPresentation = true;
    }
    
    trackContactEngagement() {
        console.log('🎯 Contact engagement tracked');
        this.contactEngagement = true;
        this.emailClicked = true;
    }
    
    onPageHidden() {
        console.log('👁️ Page hidden');
        if (this.currentSection) {
            this.finalizeSectionData(this.currentSection);
        }
    }
    
    onPageVisible() {
        console.log('👁️ Page visible');
        // Restart section timing if we have a current section
        if (this.currentSection) {
            this.sectionStartTime = Date.now();
        }
    }
    
    onPageExit() {
        console.log('🚪 Page exit detected');
        this.exitTime = Date.now();
        
        if (this.currentSection) {
            this.finalizeSectionData(this.currentSection);
        }
        
        // Final save
        this.saveAnalytics(true);
    }
    
    async saveAnalytics(isFinal = false) {
        try {
            const now = Date.now();
            const sessionTime = now - this.sessionStartTime;
            
            // Finalize current section if still active
            if (!isFinal && this.currentSection && this.sectionStartTime) {
                const currentTime = now - this.sectionStartTime;
                const sectionData = this.sectionsData.find(s => s.name === this.currentSection);
                if (sectionData) {
                    sectionData.timeSpent += currentTime;
                    this.sectionStartTime = now; // Reset for next period
                }
            }
            
            const analyticsData = {
                sessionId: this.sessionId,
                page: 'index',
                device: this.getDeviceInfo(),
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                language: navigator.language,
                referrer: document.referrer,
                
                totalSessionTime: sessionTime,
                totalScrollDepth: this.maxScrollReached,
                maxScrollReached: this.maxScrollReached,
                
                sections: this.sectionsData.map(s => ({
                    name: s.name,
                    timeSpent: s.timeSpent,
                    scrollDepth: s.scrollDepth || 0,
                    interactions: s.interactions || 0,
                    visits: s.visits || 1,
                    visibilityRatio: s.visibilityRatio || 0
                })),
                
                interactions: this.interactions,
                
                exitSection: this.currentSection || '',
                exitTime: this.exitTime || now,
                bounceRate: sessionTime < 10000 && this.interactions.length === 0,
                
                viewedPresentation: this.viewedPresentation || false,
                contactEngagement: this.contactEngagement || false,
                emailClicked: this.emailClicked || false
            };
            
            console.log('💾 Saving analytics data:', {
                sessionTime: Math.round(sessionTime / 1000) + 's',
                sections: analyticsData.sections.length,
                interactions: analyticsData.interactions.length,
                isFinal: isFinal
            });
            
            // Send to Netlify function
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(analyticsData)
            });
            
            if (response.ok) {
                console.log('✅ Analytics saved successfully');
            } else {
                console.error('❌ Failed to save analytics:', response.status);
            }
            
        } catch (error) {
            console.error('❌ Error saving analytics:', error);
        }
    }
    
    getDeviceInfo() {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }
    
    // Public methods for manual tracking
    trackCustomEvent(eventName, data = {}) {
        this.trackInteraction('custom_event', {
            eventName: eventName,
            ...data
        });
    }
    
    getCurrentMetrics() {
        return {
            sessionId: this.sessionId,
            currentSection: this.currentSection,
            sessionTime: Date.now() - this.sessionStartTime,
            sectionsVisited: this.sectionsData.length,
            interactionsCount: this.interactions.length,
            maxScrollReached: this.maxScrollReached
        };
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on A1 Diagnosis website
    if (window.location.hostname.includes('a1diagnosis.com') || 
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
        
        window.a1Analytics = new A1DiagnosisAnalytics();
        
        // Make analytics available globally for debugging
        window.getAnalyticsMetrics = () => window.a1Analytics.getCurrentMetrics();
        window.saveAnalyticsNow = () => window.a1Analytics.saveAnalytics(false);
        
        console.log('📊 A1 Diagnosis Analytics ready. Use getAnalyticsMetrics() to view current data.');
    }
});