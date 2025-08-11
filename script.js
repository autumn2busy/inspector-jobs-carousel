// Inspector Jobs Carousel - NestedObjects Brand - 20 Recent Jobs
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
            console.log('🔄 Loading recent jobs from Google Sheet...');
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
            console.log('📡 Fetching CSV data with cache busting...');
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
            
            const jobs = [];
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Process all data rows
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = this.parseCSVLine(lines[i]);
                    
                    if (values.length < headers.length || !values[0]) continue;
                    
                    const job = {};
                    headers.forEach((header, index) => {
                        job[header] = values[index] || '';
                    });
                    
                    // Only include jobs with essential data and valid links
                    if (job['Job Title'] && job['Company Name']) {
                        const transformedJob = this.transformJobData(job);
                        if (transformedJob && this.isRecentJob(transformedJob, sevenDaysAgo)) {
                            jobs.push(transformedJob);
                        }
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
            const payRange = rawJob['Pay Range'] || rawJob['pay'] || '';
            const link = rawJob['Link to Job Posting'] || rawJob['Job Link'] || '';
            const description = rawJob['Description'] || '';
            const company = rawJob['Company Name'] || rawJob['Company name'] || '';
            const title = rawJob['Job Title'] || '';
            
            // Skip jobs without essential data
            if (!title || !company) return null;
            
            // Clean and validate the job posting link
            const cleanLink = this.validateJobLink(link);
            
            return {
                title: this.cleanText(title),
                company: this.cleanText(company),
                location: this.cleanText(rawJob['Location'] || 'Remote'),
                payRange: this.cleanText(payRange) || 'Competitive',
                employmentType: this.cleanText(rawJob['Employment Type'] || 'Full-time'),
                inspectionType: this.cleanText(rawJob['type of inspection'] || rawJob['Role Type'] || 'General Inspection'),
                link: cleanLink,
                description: this.truncateText(this.cleanText(description) || 'Exciting opportunity in field inspection services.', 140),
                postedDate: this.cleanText(rawJob['Posted Date'] || rawJob['Date Added'] || 'Recently posted'),
                source: this.cleanText(rawJob['Source'] || 'Job Board'),
                benefits: this.cleanText(rawJob['Benefits'] || ''),
                qualifications: this.cleanText(rawJob['Qualifications'] || '')
            };
        } catch (error) {
            console.warn('⚠️ Error transforming job data:', error);
            return null;
        }
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
        const jobDate = this.parseJobDate(job.postedDate);
        return jobDate >= sevenDaysAgo;
    }
    
    parseJobDate(dateString) {
        // Try to parse various date formats
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
        // 20 sample inspector jobs for demonstration
        return [
            {
                title: 'Property Inspector - Residential',
                company: 'Guardian Inspection Services',
                location: 'Florida, USA',
                payRange: '$45,000 - $65,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job1',
                description: 'Conduct comprehensive property inspections for residential properties. Excellent opportunity for detail-oriented professionals.',
                postedDate: '1 day ago',
                source: 'Indeed'
            },
            {
                title: 'Insurance Field Inspector',
                company: 'Reliable Claims Solutions',
                location: 'Texas, USA',
                payRange: '$50 - $75 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Insurance Inspection',
                link: 'https://example.com/job2',
                description: 'Investigate insurance claims and document property damages. Travel throughout assigned territory.',
                postedDate: '2 days ago',
                source: 'ZipRecruiter'
            },
            {
                title: 'USDA SNAP Reviewer',
                company: 'Federal Inspection Services',
                location: 'Remote',
                payRange: '$35 - $45 per hour',
                employmentType: 'Part-time',
                inspectionType: 'Government Inspection',
                link: 'https://example.com/job3',
                description: 'Review and process USDA SNAP applications remotely. Flexible work opportunity.',
                postedDate: '3 days ago',
                source: 'Government Jobs'
            },
            {
                title: 'Building Inspector',
                company: 'City Municipal Services',
                location: 'California, USA',
                payRange: '$55,000 - $70,000',
                employmentType: 'Full-time',
                inspectionType: 'Building Inspection',
                link: 'https://example.com/job4',
                description: 'Inspect commercial and residential buildings for code compliance.',
                postedDate: '4 days ago',
                source: 'Municipal Website'
            },
            {
                title: 'Loss Control Inspector',
                company: 'ABC Insurance Group',
                location: 'New York, USA',
                payRange: '$40 - $60 per hour',
                employmentType: 'Contract',
                inspectionType: 'Loss Control Audit',
                link: 'https://example.com/job5',
                description: 'Conduct loss control inspections for commercial properties.',
                postedDate: '5 days ago',
                source: 'LinkedIn'
            },
            {
                title: 'Property Preservation Specialist',
                company: 'National Field Services',
                location: 'Multi-State',
                payRange: '$30 - $45 per hour',
                employmentType: 'Contract',
                inspectionType: 'Property Preservation',
                link: 'https://example.com/job6',
                description: 'Maintain and secure foreclosed properties nationwide.',
                postedDate: '6 days ago',
                source: 'Indeed'
            },
            {
                title: 'Home Inspector',
                company: 'Premier Home Inspections',
                location: 'Georgia, USA',
                payRange: '$50,000 - $80,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job7',
                description: 'Perform detailed home inspections for buyers and sellers.',
                postedDate: '1 day ago',
                source: 'Company Website'
            },
            {
                title: 'Occupancy Verifier',
                company: 'Field Data Solutions',
                location: 'Arizona, USA',
                payRange: '$25 - $35 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Occupancy Verification',
                link: 'https://example.com/job8',
                description: 'Verify property occupancy status for mortgage companies.',
                postedDate: '2 days ago',
                source: 'Glassdoor'
            },
            {
                title: 'Commercial Property Inspector',
                company: 'Elite Inspection Group',
                location: 'Illinois, USA',
                payRange: '$60,000 - $85,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job9',
                description: 'Inspect large commercial properties and industrial facilities.',
                postedDate: '3 days ago',
                source: 'Monster'
            },
            {
                title: 'Insurance Adjuster Trainee',
                company: 'National Insurance Corp',
                location: 'Remote',
                payRange: '$40,000 - $55,000',
                employmentType: 'Full-time',
                inspectionType: 'Insurance Inspection',
                link: 'https://example.com/job10',
                description: 'Entry-level position for insurance claim adjusting with full training.',
                postedDate: '4 days ago',
                source: 'CareerBuilder'
            },
            {
                title: 'Mortgage Field Inspector',
                company: 'Nationwide Field Services',
                location: 'Pennsylvania, USA',
                payRange: '$35 - $50 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Mortgage Inspection',
                link: 'https://example.com/job11',
                description: 'Conduct property condition reports for mortgage lenders.',
                postedDate: '5 days ago',
                source: 'Indeed'
            },
            {
                title: 'Quality Assurance Inspector',
                company: 'Manufacturing Solutions Inc',
                location: 'Ohio, USA',
                payRange: '$45,000 - $60,000',
                employmentType: 'Full-time',
                inspectionType: 'General Inspection',
                link: 'https://example.com/job12',
                description: 'Ensure product quality meets company standards.',
                postedDate: '6 days ago',
                source: 'ZipRecruiter'
            },
            {
                title: 'REO Property Inspector',
                company: 'Bank Asset Management',
                location: 'Nevada, USA',
                payRange: '$40 - $65 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job13',
                description: 'Inspect bank-owned properties for condition and occupancy.',
                postedDate: '1 day ago',
                source: 'LinkedIn'
            },
            {
                title: 'Code Enforcement Inspector',
                company: 'County Government',
                location: 'Virginia, USA',
                payRange: '$50,000 - $65,000',
                employmentType: 'Full-time',
                inspectionType: 'Building Inspection',
                link: 'https://example.com/job14',
                description: 'Enforce building codes and zoning regulations.',
                postedDate: '2 days ago',
                source: 'Government Jobs'
            },
            {
                title: 'Environmental Inspector',
                company: 'Green Earth Consulting',
                location: 'Washington, USA',
                payRange: '$55,000 - $75,000',
                employmentType: 'Full-time',
                inspectionType: 'General Inspection',
                link: 'https://example.com/job15',
                description: 'Conduct environmental compliance inspections.',
                postedDate: '3 days ago',
                source: 'Environmental Jobs'
            },
            {
                title: 'Fire Safety Inspector',
                company: 'Metro Fire Department',
                location: 'Oregon, USA',
                payRange: '$60,000 - $80,000',
                employmentType: 'Full-time',
                inspectionType: 'Building Inspection',
                link: 'https://example.com/job16',
                description: 'Inspect buildings for fire safety compliance.',
                postedDate: '4 days ago',
                source: 'Municipal Website'
            },
            {
                title: 'Notary Signing Agent',
                company: 'Document Services LLC',
                location: 'Multi-State',
                payRange: '$75 - $150 per appointment',
                employmentType: 'Contract',
                inspectionType: 'Notary Services',
                link: 'https://example.com/job17',
                description: 'Provide notary services for real estate transactions.',
                postedDate: '5 days ago',
                source: 'Notary Network'
            },
            {
                title: 'Rental Property Inspector',
                company: 'Property Management Plus',
                location: 'Colorado, USA',
                payRange: '$35 - $50 per inspection',
                employmentType: 'Contract',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job18',
                description: 'Inspect rental properties for move-in/move-out conditions.',
                postedDate: '6 days ago',
                source: 'Craigslist'
            },
            {
                title: 'Manufactured Home Inspector',
                company: 'Mobile Home Services',
                location: 'North Carolina, USA',
                payRange: '$40,000 - $60,000',
                employmentType: 'Full-time',
                inspectionType: 'Property Inspection',
                link: 'https://example.com/job19',
                description: 'Specialize in manufactured and mobile home inspections.',
                postedDate: '1 day ago',
                source: 'Indeed'
            },
            {
                title: 'Pool and Spa Inspector',
                company: 'Aquatic Safety Solutions',
                location: 'Florida, USA',
                payRange: '$45 - $70 per inspection',
                employmentType: 'Contract',
                inspectionType: 'General Inspection',
                link: 'https://example.com/job20',
                description: 'Inspect pools and spas for safety and code compliance.',
                postedDate: '2 days ago',
                source: 'Pool Industry Network'
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
            }, 8000); // 8 seconds for better reading time
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
        // Instead of showing CSV, direct to contact for more opportunities
        alert('For access to more job opportunities and our premium job matching service, please contact us at members.nestedobjects.com');
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Recent Jobs Carousel...');
    new JobCarousel();
});

window.JobCarousel = JobCarousel;
