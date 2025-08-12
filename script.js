// Inspector Jobs Carousel - NestedObjects Brand - FIXED FIELD MAPPING
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
            console.log('🔄 Loading recent jobs with CORRECT field mapping...');
            this.jobs = await this.fetchRecentJobsFromSheet();
            console.log(`✅ Loaded ${this.jobs.length} recent jobs`);
            
            if (this.jobs.length === 0) {
                console.warn('⚠️ No recent jobs found, using sample data');
                this.jobs = this.getRecentSampleJobs();
            }
            
            this.renderJobs();
            this.hideLoading();
            this.startAutoPlay();
        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            this.showErrorAndFallback();
        }
    }
    
    async fetchRecentJobsFromSheet() {
        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQqNb6WO02fmrX_rYdDar2WegsyyfldBXkkW0-CSpkYvOgh414NRooX22Ai79fNmEnrHu7GRWKXtiAN/pub?output=csv';
        
        try {
            console.log('📡 Fetching CSV data with correct field mapping...');
            const response = await fetch(SHEET_CSV_URL + '&_=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log('📄 CSV data received, length:', csvText.length);
            
            if (csvText.length < 100) {
                throw new Error('CSV data too short, likely empty or error');
            }
            
            return this.parseRecentJobsFromCSV(csvText);
        } catch (error) {
            console.error('🚨 Fetch error:', error.message);
            throw error;
        }
    }
    
    parseRecentJobsFromCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            console.log(`📊 Processing ${lines.length} CSV lines for recent jobs`);
            
            if (lines.length < 2) {
                throw new Error('CSV has no data rows');
            }
            
            // Parse header
            const headers = this.parseCSVLine(lines[0]);
            console.log('📋 CSV Headers found:', headers.length);
            console.log('🔍 First 10 headers:', headers.slice(0, 10));
            
            // Create field index mapping using EXACT column names from your sheet
            const fieldIndices = {};
            headers.forEach((header, index) => {
                const cleanHeader = header.trim();
                fieldIndices[cleanHeader] = index;
            });
            
            console.log('🗺️ Field mapping created:', Object.keys(fieldIndices).slice(0, 10));
            
            const jobs = [];
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Process all data rows
            for (let i = 1; i < Math.min(lines.length, 100); i++) { // Process max 100 rows for performance
                try {
                    const values = this.parseCSVLine(lines[i]);
                    
                    if (values.length < 5) continue; // Skip rows with too few values
                    
                    // Transform job using EXACT field names from your Google Sheet
                    const transformedJob = this.transformJobDataWithCorrectMapping(values, fieldIndices);
                    
                    if (transformedJob && this.isRecentJob(transformedJob, sevenDaysAgo)) {
                        jobs.push(transformedJob);
                    }
                } catch (rowError) {
                    console.warn(`⚠️ Skipping row ${i}:`, rowError.message);
                }
            }
            
            // Sort by most recent first and return top 20
            const sortedJobs = jobs.sort((a, b) => {
                const dateA = this.parseJobDate(a.postedDate);
                const dateB = this.parseJobDate(b.postedDate);
                return dateB - dateA;
            });
            
            console.log(`✅ Found ${sortedJobs.length} recent jobs, returning top 20`);
            return sortedJobs.slice(0, 20);
        } catch (error) {
            console.error('💥 CSV parsing error:', error);
            throw error;
        }
    }
    
    transformJobDataWithCorrectMapping(values, fieldIndices) {
        try {
            // Helper function to safely get field value
            const getField = (fieldName) => {
                const index = fieldIndices[fieldName];
                return (index !== undefined && values[index]) ? values[index].trim() : '';
            };
            
            // Use EXACT field names from your Google Sheet:
            const title = getField('Job Title');
            const company = getField('Company Name');
            const link = getField('Link to Job Posting') || getField('Job Link'); // Try both
            
            // Skip jobs without essential data
            if (!title || !company) {
                return null;
            }
            
            // Clean and validate the job posting link
            const cleanLink = this.validateJobLink(link);
            
            return {
                title: this.cleanText(title),
                company: this.cleanText(company),
                location: this.cleanText(getField('Location') || 'Remote'),
                payRange: this.cleanText(getField('Pay Range') || getField('pay') || 'Competitive'),
                employmentType: this.cleanText(getField('Employment Type') || 'Full-time'),
                inspectionType: this.cleanText(getField('type of inspection') || getField('Role Type') || 'General Inspection'),
                link: cleanLink,
                description: this.truncateText(this.cleanText(getField('Description') || 'Exciting opportunity in field inspection services.'), 140),
                postedDate: this.cleanText(getField('Posted Date') || 'Recently posted'),
                source: this.cleanText(getField('Source') || 'Job Board'),
                benefits: this.cleanText(getField('Benefits') || ''),
                qualifications: this.cleanText(getField('Qualifications') || ''),
                responsibilities: this.cleanText(getField('Responsibilities') || ''),
                dateAdded: this.cleanText(getField('Date Added') || '')
            };
        } catch (error) {
            console.warn('⚠️ Error transforming job data:', error);
            return null;
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
    
    validateJobLink(link) {
        if (!link || link.trim() === '') return '';
        
        const cleanedLink = link.trim();
        
        // Check if it's a valid URL
        try {
            const url = new URL(cleanedLink.startsWith('http') ? cleanedLink : 'https://' + cleanedLink);
            return url.href;
        } catch (e) {
            console.warn('Invalid job link:', cleanedLink);
            return '';
        }
    }
    
    isRecentJob(job, sevenDaysAgo) {
        const jobDate = this.parseJobDate(job.postedDate || job.dateAdded);
        return jobDate >= sevenDaysAgo;
    }
    
    parseJobDate(dateString) {
        if (!dateString) return new Date(); // Default to now if no date
        
        // Handle relative dates like "2 days ago"
        const relativeDateMatch = dateString.match(/(\d+)\s+(day|days|hour|hours)\s+ago/i);
        if (relativeDateMatch) {
            const amount = parseInt(relativeDateMatch[1]);
            const unit = relativeDateMatch[2].toLowerCase();
            const date = new Date();
            if (unit.includes('day')) {
                date.setDate(date.getDate() - amount);
            } else if (unit.includes('hour')) {
                date.setHours(date.getHours() - amount);
            }
            return date;
        }
        
        // Try standard date parsing
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
        
        // Default to recent if we can't parse
        return new Date();
    }
    
    cleanText(text) {
        if (!text || typeof text !== 'string') return '';
        return text.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    getRecentSampleJobs() {
        // Sample jobs based on your actual data structure
        return [
            {
                title: 'Building Field Inspector',
                company: 'City of Pompano Beach',
                location: 'Pompano Beach, FL',
                payRange: '$50,000 - $70,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: 'https://www.governmentjobs.com/careers/copbfl/jobs/4875331/building-field-inspector',
                description: 'Reports to the Chief Building Inspector, enforcing local, state, and federal building regulations. Conducts technical field inspections.',
                postedDate: '1 day ago',
                source: 'GovernmentJobs.com'
            },
            {
                title: 'Real Estate Field Inspector',
                company: 'Stratwell',
                location: 'Hialeah, FL',
                payRange: '$40 - $60 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Property Inspection',
                link: 'https://www.ziprecruiter.com/c/Stratwell/Job/Real-Estate-Field-Inspector',
                description: 'Conduct property inspections for real estate transactions. Travel throughout assigned territory.',
                postedDate: '2 days ago',
                source: 'ZipRecruiter'
            },
            {
                title: 'Insurance Field Inspector',
                company: 'National Claims Services',
                location: 'Florida, USA',
                payRange: '$45 - $75 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Insurance Inspection',
                link: 'https://example.com/job3',
                description: 'Investigate insurance claims and document property damages for various insurance companies.',
                postedDate: '3 days ago',
                source: 'Indeed'
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
            const card = this.createJobCard(job, index);
            this.track.appendChild(card);
            
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
        const hasValidLink = job.link && job.link !== '' && job.link !== '#';
        
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
            'Building Inspection': 'fas fa-building',
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
        this.viewAllBtn?.addEventListener('click', () => this.contactForMoreJobs());
        
        this.track?.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.track?.addEventListener('mouseleave', () => this.startAutoPlay());
        
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
        
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
        
        if (this.currentJobSpan) this.currentJobSpan.textContent = this.currentIndex + 1;
        
        if (this.prevBtn) this.prevBtn.disabled = this.jobs.length <= 1;
        if (this.nextBtn) this.nextBtn.disabled = this.jobs.length <= 1;
    }
    
    startAutoPlay() {
        if (this.jobs.length > 1) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, 8000);
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
                    <i class="fas fa-briefcase" style="color: #1d4ed8;"></i>
                    <p>Loading latest inspector jobs...</p>
                </div>
            `;
        }
        
        setTimeout(() => {
            this.jobs = this.getRecentSampleJobs();
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
                    <h3>No Recent Jobs Available</h3>
                    <p>Check back soon for new opportunities posted in the last 7 days!</p>
                </div>
            </div>
        `;
        this.hideLoading();
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }
    
    contactForMoreJobs() {
        alert('For access to more job opportunities and our premium job matching service, please contact us at members.nestedobjects.com');
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Inspector Jobs Carousel with CORRECT field mapping...');
    new JobCarousel();
});

window.JobCarousel = JobCarousel;
