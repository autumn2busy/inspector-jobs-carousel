// Inspector Jobs Carousel - NestedObjects Brand
class JobCarousel {
    constructor() {
        this.currentIndex = 0;
        this.jobs = [];
        this.autoPlayInterval = null;
        this.isLoading = true;
        
        this.initElements();
        this.loadJobs();
        this.bindEvents();
    }
    
    initElements() {
        this.track = document.getElementById('carouselTrack');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.indicators = document.getElementById('indicators');
        this.currentJobSpan = document.getElementById('currentJob');
        this.totalJobsSpan = document.getElementById('totalJobs');
        this.viewAllBtn = document.getElementById('viewAllBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    
    async loadJobs() {
        try {
            console.log('🔄 Loading jobs from Google Sheet...');
            this.jobs = await this.fetchJobsFromSheet();
            console.log(`✅ Loaded ${this.jobs.length} jobs`);
            
            if (this.jobs.length === 0) {
                console.warn('⚠️ No jobs found, using sample data');
                this.jobs = this.getSampleJobs();
            }
            
            this.renderJobs();
            this.hideLoading();
            this.startAutoPlay();
        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            this.showErrorAndFallback();
        }
    }
    
    async fetchJobsFromSheet() {
        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQqNb6WO02fmrX_rYdDar2WegsyyfldBXkkW0-CSpkYvOgh414NRooX22Ai79fNmEnrHu7GRWKXtiAN/pub?output=csv';
        
        try {
            console.log('📡 Fetching CSV data...');
            const response = await fetch(SHEET_CSV_URL + '&_=' + Date.now()); // Cache busting
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log('📄 CSV data received, length:', csvText.length);
            
            if (csvText.length < 100) {
                throw new Error('CSV data too short, likely empty or error');
            }
            
            return this.parseCSVToJobs(csvText);
        } catch (error) {
            console.error('🚨 Fetch error:', error.message);
            throw error;
        }
    }
    
    parseCSVToJobs(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            console.log(`📊 Processing ${lines.length} CSV lines`);
            
            if (lines.length < 2) {
                throw new Error('CSV has no data rows');
            }
            
            // Parse header
            const headers = this.parseCSVLine(lines[0]);
            console.log('📋 CSV Headers:', headers.slice(0, 5), '... (showing first 5)');
            
            const jobs = [];
            
            // Process data rows (skip header)
            for (let i = 1; i < Math.min(26, lines.length); i++) { // Process up to 25 jobs
                try {
                    const values = this.parseCSVLine(lines[i]);
                    
                    if (values.length < headers.length || !values[0]) continue;
                    
                    const job = {};
                    headers.forEach((header, index) => {
                        job[header] = values[index] || '';
                    });
                    
                    // Only include jobs with essential data
                    if (job['Job Title'] && job['Company Name']) {
                        const transformedJob = this.transformJobData(job);
                        if (transformedJob) {
                            jobs.push(transformedJob);
                        }
                    }
                } catch (rowError) {
                    console.warn(`⚠️ Skipping row ${i}:`, rowError.message);
                }
            }
            
            console.log(`✅ Successfully parsed ${jobs.length} valid jobs`);
            return jobs.slice(0, 12); // Show top 12 jobs
        } catch (error) {
            console.error('💥 CSV parsing error:', error);
            throw error;
        }
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        
        return result;
    }
    
    transformJobData(rawJob) {
        try {
            // Get various possible field names for data
            const payRange = rawJob['Pay Range'] || rawJob['pay'] || '';
            const link = rawJob['Link to Job Posting'] || rawJob['Job Link'] || '';
            const description = rawJob['Description'] || '';
            const company = rawJob['Company Name'] || rawJob['Company name'] || '';
            const title = rawJob['Job Title'] || '';
            
            // Skip jobs without essential data
            if (!title || !company) return null;
            
            return {
                title: this.cleanText(title),
                company: this.cleanText(company),
                location: this.cleanText(rawJob['Location'] || 'Remote'),
                payRange: this.cleanText(payRange) || 'Competitive',
                employmentType: this.cleanText(rawJob['Employment Type'] || 'Full-time'),
                inspectionType: this.cleanText(rawJob['type of inspection'] || rawJob['Role Type'] || 'General Inspection'),
                link: this.cleanText(link) || '#',
                description: this.truncateText(this.cleanText(description) || 'Exciting opportunity in field inspection services.', 140),
                postedDate: this.cleanText(rawJob['Posted Date'] || 'Recently posted'),
                source: this.cleanText(rawJob['Source'] || 'Job Board'),
                benefits: this.cleanText(rawJob['Benefits'] || ''),
                qualifications: this.cleanText(rawJob['Qualifications'] || '')
            };
        } catch (error) {
            console.warn('⚠️ Error transforming job data:', error);
            return null;
        }
    }
    
    cleanText(text) {
        if (!text || typeof text !== 'string') return '';
        return text.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    getSampleJobs() {
        return [
            {
                title: 'Property Inspector - Residential',
                company: 'Guardian Inspection Services',
                location: 'Florida, USA',
                payRange: '$45,000 - $65,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: '#',
                description: 'Conduct comprehensive property inspections for residential properties. Excellent opportunity for detail-oriented professionals with growth potential.',
                postedDate: '2 days ago',
                source: 'Indeed',
                benefits: 'Health Insurance, Paid Time Off',
                qualifications: 'Inspector certification preferred'
            },
            {
                title: 'Insurance Field Inspector',
                company: 'Reliable Claims Solutions',
                location: 'Texas, USA',
                payRange: '$50 - $75 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Insurance Inspection',
                link: '#',
                description: 'Investigate insurance claims and document property damages. Travel throughout assigned territory with flexible scheduling.',
                postedDate: '1 day ago',
                source: 'ZipRecruiter',
                benefits: 'Flexible Schedule, Travel Reimbursement',
                qualifications: 'Valid drivers license required'
            },
            {
                title: 'USDA SNAP Reviewer',
                company: 'Federal Inspection Services',
                location: 'Remote',
                payRange: '$35 - $45 per hour',
                employmentType: 'Part-time',
                inspectionType: 'Government Inspection',
                link: '#',
                description: 'Review and process USDA SNAP applications remotely. Flexible work opportunity with competitive hourly rates.',
                postedDate: '3 days ago',
                source: 'Government Jobs',
                benefits: 'Remote Work, Flexible Hours',
                qualifications: 'Background check required'
            }
        ];
    }
    
    renderJobs() {
        if (!this.jobs.length) {
            this.showNoJobs();
            return;
        }
        
        this.track.innerHTML = '';
        this.indicators.innerHTML = '';
        
        this.jobs.forEach((job, index) => {
            // Create job card
            const card = this.createJobCard(job, index);
            this.track.appendChild(card);
            
            // Create indicator
            const indicator = this.createIndicator(index);
            this.indicators.appendChild(indicator);
        });
        
        this.totalJobsSpan.textContent = this.jobs.length;
        this.updateCarousel();
    }
    
    createJobCard(job, index) {
        const card = document.createElement('div');
        card.className = 'job-card';
        
        const icon = this.getJobIcon(job.inspectionType);
        const truncatedDescription = this.truncateText(job.description, 130);
        const hasValidLink = job.link && job.link !== '#';
        
        card.innerHTML = `
            <div class="job-header">
                <div class="job-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="job-company">${job.company}</div>
                    <div class="job-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${job.location}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>${job.payRange}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${job.postedDate}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="job-tags">
                <span class="job-tag primary">${job.inspectionType}</span>
                <span class="job-tag highlight">${job.employmentType}</span>
                <span class="job-tag">${job.source}</span>
            </div>
            
            <div class="job-description">
                ${truncatedDescription}
            </div>
            
            <div class="job-actions">
                <a href="${hasValidLink ? job.link : '#'}" 
                   target="${hasValidLink ? '_blank' : '_self'}" 
                   class="apply-btn" 
                   ${!hasValidLink ? 'onclick="return false;" style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                    ${hasValidLink ? 'Apply Now' : 'Link Unavailable'} <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="save-btn" title="Save Job">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        `;
        
        return card;
    }
    
    createIndicator(index) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.addEventListener('click', () => this.goToSlide(index));
        return indicator;
    }
    
    getJobIcon(inspectionType) {
        const iconMap = {
            'Property Inspection': 'fas fa-home',
            'Insurance Inspection': 'fas fa-shield-alt',
            'Mortgage Inspection': 'fas fa-university',
            'Government Inspection': 'fas fa-flag-usa',
            'USDA/Government Inspection': 'fas fa-flag-usa',
            'Building/Structural Inspection': 'fas fa-building',
            'Mystery Shopping': 'fas fa-shopping-cart',
            'General Inspection': 'fas fa-search',
            'General Field Inspection': 'fas fa-search',
            'Due Diligence Inspection': 'fas fa-clipboard-check',
            'Loss Control Audit': 'fas fa-shield-alt',
            'Property Appraisal': 'fas fa-calculator',
            'Notary Services': 'fas fa-stamp',
            'Occupancy Verification': 'fas fa-key',
            'Property Preservation': 'fas fa-tools'
        };
        
        return iconMap[inspectionType] || 'fas fa-briefcase';
    }
    
    bindEvents() {
        this.prevBtn?.addEventListener('click', () => this.previousSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        this.viewAllBtn?.addEventListener('click', () => this.openFullJobList());
        
        // Pause auto-play on hover
        this.track?.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.track?.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch/swipe support
        this.addTouchSupport();
    }
    
    addTouchSupport() {
        if (!this.track) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.pauseAutoPlay();
        });
        
        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });
        
        this.track.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diffX = startX - currentX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
            
            isDragging = false;
            this.startAutoPlay();
        });
    }
    
    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.jobs.length;
        this.updateCarousel();
    }
    
    previousSlide() {
        this.currentIndex = this.currentIndex === 0 ? this.jobs.length - 1 : this.currentIndex - 1;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    updateCarousel() {
        const offset = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${offset}%)`;
        
        // Update indicators
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
        
        // Update counter
        if (this.currentJobSpan) this.currentJobSpan.textContent = this.currentIndex + 1;
        
        // Update navigation buttons
        if (this.prevBtn) this.prevBtn.disabled = this.jobs.length <= 1;
        if (this.nextBtn) this.nextBtn.disabled = this.jobs.length <= 1;
    }
    
    startAutoPlay() {
        if (this.jobs.length > 1) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, 7000); // 7 seconds for better reading time
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }
    
    showErrorAndFallback() {
        console.log('🎭 Showing error message and falling back to sample data');
        
        if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <p>Loading sample jobs...</p>
                </div>
            `;
        }
        
        // Use sample data after brief delay
        setTimeout(() => {
            this.jobs = this.getSampleJobs();
            this.renderJobs();
            this.hideLoading();
            this.startAutoPlay();
        }, 2000);
    }
    
    showNoJobs() {
        this.track.innerHTML = `
            <div class="job-card">
                <div class="no-jobs-message">
                    <i class="fas fa-briefcase"></i>
                    <h3>No Jobs Available</h3>
                    <p>Check back soon for new opportunities!</p>
                </div>
            </div>
        `;
        this.hideLoading();
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }
    
    openFullJobList() {
        // Open the Google Sheet
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1E9Uu2I9cUGQjXqJ1hFX2LShOArmgQiPhMMECaj7BYz0/edit';
        window.open(sheetUrl, '_blank');
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Job Carousel...');
    new JobCarousel();
});

// Export for Wix integration
window.JobCarousel = JobCarousel;
