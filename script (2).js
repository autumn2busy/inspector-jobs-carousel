// Inspector Jobs Carousel JavaScript
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
            // Using your actual Google Sheet CSV URL
            this.jobs = await this.fetchJobsFromSheet();
            this.renderJobs();
            this.hideLoading();
            this.startAutoPlay();
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.showError();
        }
    }
    
    async fetchJobsFromSheet() {
        // Your actual Google Sheet CSV URL
        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQqNb6WO02fmrX_rYdDar2WegsyyfldBXkkW0-CSpkYvOgh414NRooX22Ai79fNmEnrHu7GRWKXtiAN/pub?output=csv';
        
        try {
            const response = await fetch(SHEET_CSV_URL);
            const csvText = await response.text();
            return this.parseCSVToJobs(csvText);
        } catch (error) {
            console.warn('Could not fetch from Google Sheet, using sample data:', error);
            // Fallback to sample data if Sheet is not accessible
            return this.getSampleJobs();
        }
    }
    
    parseCSVToJobs(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const jobs = [];
        
        // Skip header and process data rows
        for (let i = 1; i < Math.min(51, lines.length); i++) { // Process up to 50 jobs
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length && values[0]) {
                const job = {};
                headers.forEach((header, index) => {
                    job[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
                });
                
                // Only include jobs with essential data
                if (job['Job Title'] && job['Company Name']) {
                    jobs.push(this.transformJobData(job));
                }
            }
        }
        
        // Filter for recent jobs and return top 15
        return jobs
            .filter(job => job.title && job.company)
            .slice(0, 15);
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
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        
        return result;
    }
    
    transformJobData(rawJob) {
        // Clean and transform the job data from your sheet
        const payRange = rawJob['Pay Range'] || rawJob['pay'] || 'Competitive';
        const link = rawJob['Link to Job Posting'] || rawJob['Job Link'] || '#';
        const description = rawJob['Description'] || 'Exciting opportunity in field inspection services.';
        
        return {
            title: rawJob['Job Title'] || 'Inspector Position',
            company: rawJob['Company Name'] || rawJob['Company name'] || 'Company',
            location: rawJob['Location'] || 'Remote',
            payRange: payRange === '' ? 'Competitive' : payRange,
            employmentType: rawJob['Employment Type'] || 'Full-time',
            inspectionType: rawJob['type of inspection'] || rawJob['Role Type'] || 'General Inspection',
            link: link === '' ? '#' : link,
            description: this.truncateText(description, 150),
            postedDate: rawJob['Posted Date'] || 'Recently posted',
            source: rawJob['Source'] || 'Job Board',
            benefits: rawJob['Benefits'] || '',
            qualifications: rawJob['Qualifications'] || ''
        };
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
                description: 'Conduct comprehensive property inspections for residential properties. Excellent opportunity for detail-oriented professionals.',
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
                description: 'Investigate insurance claims and document property damages. Travel throughout assigned territory.',
                postedDate: '1 day ago',
                source: 'ZipRecruiter',
                benefits: 'Flexible Schedule, Travel Reimbursement',
                qualifications: 'Valid drivers license required'
            },
            {
                title: 'USDA Snap Reviewer',
                company: 'Federal Inspection Services',
                location: 'Remote',
                payRange: '$35 - $45 per hour',
                employmentType: 'Part-time',
                inspectionType: 'Government Inspection',
                link: '#',
                description: 'Review and process USDA SNAP applications. Remote work opportunity with flexible scheduling.',
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
        const truncatedDescription = this.truncateText(job.description, 120);
        
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
                <span class="job-tag">${job.employmentType}</span>
                <span class="job-tag">${job.source}</span>
            </div>
            
            <div class="job-description">
                ${truncatedDescription}
            </div>
            
            <div class="job-actions">
                <a href="${job.link}" target="_blank" class="apply-btn" ${job.link === '#' ? 'onclick="return false;" style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                    Apply Now <i class="fas fa-external-link-alt"></i>
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
        this.prevBtn.addEventListener('click', () => this.previousSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        this.viewAllBtn.addEventListener('click', () => this.openFullJobList());
        
        // Pause auto-play on hover
        this.track.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.track.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Touch/swipe support
        this.addTouchSupport();
    }
    
    addTouchSupport() {
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
        this.currentJobSpan.textContent = this.currentIndex + 1;
        
        // Update navigation buttons
        this.prevBtn.disabled = this.jobs.length <= 1;
        this.nextBtn.disabled = this.jobs.length <= 1;
    }
    
    startAutoPlay() {
        if (this.jobs.length > 1) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, 6000); // Slightly slower for better reading
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
    
    showError() {
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <p>Unable to load jobs. Using sample data.</p>
            </div>
        `;
        
        // Hide error after 3 seconds and show sample jobs
        setTimeout(() => {
            this.jobs = this.getSampleJobs();
            this.renderJobs();
            this.hideLoading();
            this.startAutoPlay();
        }, 3000);
    }
    
    showNoJobs() {
        this.track.innerHTML = `
            <div class="job-card">
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-briefcase" style="font-size: 48px; color: #bdc3c7; margin-bottom: 20px;"></i>
                    <h3 style="color: #7f8c8d; margin-bottom: 10px;">No Jobs Available</h3>
                    <p style="color: #95a5a6;">Check back soon for new opportunities!</p>
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
        // Open the original Google Sheet
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1E9Uu2I9cUGQjXqJ1hFX2LShOArmgQiPhMMECaj7BYz0/edit';
        window.open(sheetUrl, '_blank');
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JobCarousel();
});

// Export for Wix integration
window.JobCarousel = JobCarousel;
