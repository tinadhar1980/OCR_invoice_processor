// Invoice Processor - Modern JavaScript with Smooth Interactions

class InvoiceProcessor {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.fileDropArea = document.getElementById('fileDropArea');
        this.filePreview = document.getElementById('filePreview');
        this.uploadForm = document.getElementById('uploadForm');
        this.scanBtn = document.getElementById('scanBtn');
        this.processingModal = document.getElementById('processingModal');
        this.resultsSection = document.getElementById('resultsSection');
        
        this.currentFile = null;
        this.processingSteps = ['step1', 'step2', 'step3', 'step4'];
        this.currentStep = 0;
        this.currentResults = null;
        this.currentImageUrl = null;
        this.zoomLevel = 100;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.setupScrollEffects();
    }
    
    setupEventListeners() {
        // File input events
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.fileDropArea.addEventListener('click', () => this.fileInput.click());
        this.fileDropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileDropArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Form submission
        this.uploadForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Remove file button
        document.getElementById('removeFile')?.addEventListener('click', () => this.removeFile());
        
        // New scan button
        document.getElementById('newScanBtn')?.addEventListener('click', () => this.resetForm());
        
        // Copy buttons
        document.getElementById('copyJsonBtn')?.addEventListener('click', () => this.copyJson());
        
        // Download buttons
        document.getElementById('downloadJSON')?.addEventListener('click', () => this.downloadJSON());
        document.getElementById('downloadImage')?.addEventListener('click', () => this.downloadImage());
        
        // Navigation smooth scrolling
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Header scroll effect
        window.addEventListener('scroll', () => this.handleScroll());
    }
    
    setupAnimations() {
        this.animateOnLoad();
        this.setupIntersectionObserver();
    }
    
    setupScrollEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const shapes = document.querySelectorAll('.shape');
            
            shapes.forEach((shape, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrolled * speed);
                shape.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
            });
        });
    }
    
    animateOnLoad() {
        const heroElements = document.querySelectorAll('.hero-text > *');
        heroElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
        
        setTimeout(() => {
            const uploadCard = document.querySelector('.upload-card');
            if (uploadCard) {
                uploadCard.style.opacity = '0';
                uploadCard.style.transform = 'translateY(50px)';
                uploadCard.style.transition = 'all 0.8s ease';
                
                setTimeout(() => {
                    uploadCard.style.opacity = '1';
                    uploadCard.style.transform = 'translateY(0)';
                }, 100);
            }
        }, 800);
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            e.target.classList.add('active');
        }
    }
    
    handleScroll() {
        const header = document.querySelector('.header');
        const scrolled = window.pageYOffset;
        
        if (scrolled > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    }
    
    handleFileSelect(e) {
        console.log('File selected event triggered');
        const file = e.target.files[0];
        if (file) {
            console.log('File detected:', file.name, file.type, file.size);
            this.setFile(file);
        } else {
            console.log('No file selected');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.fileDropArea.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.fileDropArea.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.fileDropArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.setFile(files[0]);
        }
    }
    
    setFile(file) {
        console.log('setFile called with:', file);
        
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp', 'image/webp'];
        
        console.log('File type:', file.type);
        console.log('Allowed types:', allowedTypes);
        console.log('Type check:', allowedTypes.includes(file.type));
        
        if (!allowedTypes.includes(file.type)) {
            console.error('Invalid file type:', file.type);
            this.showNotification('Please select a valid file type (PDF, JPG, PNG, TIFF, BMP)', 'error');
            return;
        }
        
        if (file.size > 16 * 1024 * 1024) {
            console.error('File too large:', file.size);
            this.showNotification('File size must be less than 16MB', 'error');
            return;
        }
        
        console.log('File validated successfully');
        this.currentFile = file;
        
        // Create image URL for later display
        if (file.type.startsWith('image/')) {
            this.currentImageUrl = URL.createObjectURL(file);
        }
        
        this.showFilePreview(file);
        this.enableScanButton();
        
        this.fileDropArea.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.fileDropArea.style.transform = 'scale(1)';
        }, 150);
    }
    
    showFilePreview(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        
        this.fileDropArea.style.display = 'none';
        this.filePreview.style.display = 'block';
        
        this.filePreview.style.opacity = '0';
        this.filePreview.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.filePreview.style.transition = 'all 0.3s ease';
            this.filePreview.style.opacity = '1';
            this.filePreview.style.transform = 'translateY(0)';
        }, 50);
    }
    
    removeFile() {
        this.currentFile = null;
        this.fileInput.value = '';
        
        this.filePreview.style.opacity = '0';
        this.filePreview.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            this.filePreview.style.display = 'none';
            this.fileDropArea.style.display = 'block';
            this.fileDropArea.style.opacity = '0';
            this.fileDropArea.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                this.fileDropArea.style.transition = 'all 0.3s ease';
                this.fileDropArea.style.opacity = '1';
                this.fileDropArea.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
        
        this.disableScanButton();
    }
    
    enableScanButton() {
        this.scanBtn.disabled = false;
        this.scanBtn.style.transform = 'scale(1.02)';
        setTimeout(() => {
            this.scanBtn.style.transform = 'scale(1)';
        }, 200);
    }
    
    disableScanButton() {
        this.scanBtn.disabled = true;
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.currentFile) {
            this.showNotification('Please select a file first', 'error');
            return;
        }
        
        this.showProcessingModal();
        this.startProcessingAnimation();
        
        try {
            const result = await this.uploadAndProcess();
            
            // Wait for animation to complete
            await this.waitForProcessingAnimation();
            
            this.hideProcessingModal();
            this.showResults(result);
        } catch (error) {
            this.hideProcessingModal();
            this.showNotification(`Processing failed: ${error.message}`, 'error');
        }
    }
    
    async uploadAndProcess() {
        console.log('Starting upload process...');
        console.log('Current file:', this.currentFile);
        
        const formData = new FormData();
        formData.append('file', this.currentFile);
        
        console.log('Sending request to /api/process');
        
        const response = await fetch('/api/process', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Processing failed');
        }
        
        const result = await response.json();
        console.log('Success! Result:', result);
        return result;
    }
    
    showProcessingModal() {
        this.processingModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hideProcessingModal() {
        this.processingModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    startProcessingAnimation() {
        this.currentStep = 0;
        this.updateProcessingStep();
        
        const progressFill = document.getElementById('progressFill');
        const steps = ['Uploading file...', 'Performing OCR...', 'Extracting with AI...', 'Finalizing results...'];
        
        const interval = setInterval(() => {
            this.currentStep++;
            
            if (this.currentStep < this.processingSteps.length) {
                this.updateProcessingStep();
                progressFill.style.width = `${(this.currentStep / this.processingSteps.length) * 100}%`;
                
                const processingText = document.querySelector('.processing-text');
                if (processingText) {
                    processingText.textContent = steps[this.currentStep];
                }
            } else {
                clearInterval(interval);
                progressFill.style.width = '100%';
            }
        }, 1000);
        
        this.processingInterval = interval;
    }
    
    async waitForProcessingAnimation() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }
    
    updateProcessingStep() {
        this.processingSteps.forEach(stepId => {
            document.getElementById(stepId)?.classList.remove('active');
        });
        
        if (this.currentStep < this.processingSteps.length) {
            document.getElementById(this.processingSteps[this.currentStep])?.classList.add('active');
        }
    }
    
    showResults(data) {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        document.querySelector('.hero').style.display = 'none';
        this.resultsSection.style.display = 'block';
        
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            this.populateResults(data);
        }, 500);
    }
    
    populateResults(data) {
        this.currentResults = data;
        
        const invoiceData = data.invoice_data || {};
        const processingTime = data.processing_time || 0;
        
        // Populate invoice overview
        this.populateInvoiceOverview(invoiceData);
        
        // Display invoice image
        this.displayInvoiceImage();
        
        // Populate JSON viewer
        this.populateJsonViewer(invoiceData);
        
        // Update details
        document.getElementById('processingTime').textContent = `${processingTime}s`;
    }
    
    populateInvoiceOverview(data) {
        const overview = document.getElementById('invoiceOverview');
        overview.innerHTML = '';
        
        // Helper to get nested values
        const getValue = (obj, path) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };
        
        const fields = [
            { label: 'Invoice Number', key: 'invoice_number' },
            { label: 'Invoice Date', key: 'invoice_date' },
            { label: 'Due Date', key: 'due_date' },
            { label: 'PO Number', key: 'po_number' },
            { label: 'Vendor Name', key: 'vendor.name' },
            { label: 'Vendor Address', key: 'vendor.address', truncate: true },
            { label: 'Bill To', key: 'bill_to.name' },
            { label: 'Bill To Address', key: 'bill_to.address', truncate: true },
            { label: 'Subtotal', key: 'subtotal', isAmount: true },
            { label: 'Tax Amount', key: 'tax_amount', isAmount: true },
            { label: 'Tax Rate', key: 'tax_rate', isTax: true },
            { label: 'Total Amount', key: 'total_amount', isAmount: true, highlight: true }
        ];
        
        fields.forEach((field, index) => {
            let value = getValue(data, field.key);
            
            if (value === null || value === undefined || value === '') {
                value = 'N/A';
            }
            
            let displayValue = value;
            
            if (field.isAmount && value !== 'N/A') {
                displayValue = `${data.currency || '$'}${parseFloat(value).toFixed(2)}`;
            } else if (field.isTax && value !== 'N/A') {
                displayValue = `${value}%`;
            } else if (field.truncate && value !== 'N/A' && value.length > 50) {
                displayValue = value.substring(0, 47) + '...';
            }
            
            const item = document.createElement('div');
            item.className = 'invoice-detail-item';
            if (field.highlight) item.classList.add('highlight');
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            item.innerHTML = `
                <span class="detail-label">${field.label}:</span>
                <span class="detail-value ${field.isAmount ? 'amount' : ''}">${displayValue}</span>
            `;
            
            overview.appendChild(item);
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // Add line items section if available
        if (data.line_items && data.line_items.length > 0) {
            const lineItemsSection = document.createElement('div');
            lineItemsSection.className = 'line-items-section';
            lineItemsSection.style.marginTop = '1.5rem';
            lineItemsSection.innerHTML = `
                <div class="section-header-small">Line Items (${data.line_items.length})</div>
            `;
            
            data.line_items.forEach((item, idx) => {
                const lineItem = document.createElement('div');
                lineItem.className = 'line-item';
                lineItem.innerHTML = `
                    <div class="line-item-desc">${item.description || 'N/A'}</div>
                    <div class="line-item-details">
                        <span>Qty: ${item.quantity || 'N/A'}</span>
                        <span>Unit: ${data.currency || '$'}${item.unit_price ? parseFloat(item.unit_price).toFixed(2) : 'N/A'}</span>
                        <span class="line-total">Total: ${data.currency || '$'}${item.line_total ? parseFloat(item.line_total).toFixed(2) : 'N/A'}</span>
                    </div>
                `;
                lineItemsSection.appendChild(lineItem);
            });
            
            overview.appendChild(lineItemsSection);
        }
    }
    
    displayInvoiceImage() {
        const img = document.getElementById('invoiceImage');
        const container = document.getElementById('imageViewerContainer');
        
        if (this.currentImageUrl) {
            img.src = this.currentImageUrl;
            img.style.opacity = '0';
            
            img.onload = () => {
                setTimeout(() => {
                    img.style.transition = 'opacity 0.5s ease';
                    img.style.opacity = '1';
                }, 100);
            };
            
            // Set up zoom controls
            this.setupZoomControls();
        }
    }
    
    setupZoomControls() {
        const img = document.getElementById('invoiceImage');
        const container = document.getElementById('imageViewerContainer');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        
        // Reset zoom level
        this.zoomLevel = 100;
        img.style.transform = 'scale(1)';
        img.style.transformOrigin = 'center center';
        zoomLevelDisplay.textContent = '100%';
        
        // Track mouse position for cursor-based zoom
        let mouseX = 0;
        let mouseY = 0;
        
        // Update mouse position when moving over image
        img.addEventListener('mousemove', (e) => {
            const rect = img.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width) * 100;
            mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        });
        
        // Zoom function with cursor position
        const zoomAt = (delta, useMouse = false) => {
            const oldZoom = this.zoomLevel;
            
            if (delta > 0) {
                this.zoomLevel = Math.min(300, this.zoomLevel + delta);
            } else {
                this.zoomLevel = Math.max(50, this.zoomLevel + delta);
            }
            
            // Set transform origin based on mouse position if zooming with mouse
            if (useMouse && this.zoomLevel > 100) {
                img.style.transformOrigin = `${mouseX}% ${mouseY}%`;
            } else if (this.zoomLevel === 100) {
                img.style.transformOrigin = 'center center';
            }
            
            img.style.transform = `scale(${this.zoomLevel / 100})`;
            zoomLevelDisplay.textContent = `${this.zoomLevel}%`;
            
            console.log('Zoom:', this.zoomLevel, 'Origin:', img.style.transformOrigin);
        };
        
        // Zoom In button (center zoom)
        zoomInBtn?.addEventListener('click', () => {
            img.style.transformOrigin = 'center center';
            zoomAt(25, false);
        });
        
        // Zoom Out button (center zoom)
        zoomOutBtn?.addEventListener('click', () => {
            zoomAt(-25, false);
        });
        
        // Reset Zoom
        resetZoomBtn?.addEventListener('click', () => {
            this.zoomLevel = 100;
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center center';
            zoomLevelDisplay.textContent = '100%';
            container.scrollTo(0, 0);
        });
        
        // Mouse wheel zoom at cursor position
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY < 0 ? 10 : -10;
            zoomAt(delta, true);
        }, { passive: false });
        
        // Prevent default zoom on the image itself
        img.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Add drag to pan functionality
        this.setupDragToPan(container);
    }
    
    setupDragToPan(container) {
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        
        container.addEventListener('mousedown', (e) => {
            // Only enable dragging if zoomed in
            if (this.zoomLevel > 100) {
                isDragging = true;
                container.style.cursor = 'grabbing';
                startX = e.pageX - container.offsetLeft;
                startY = e.pageY - container.offsetTop;
                scrollLeft = container.scrollLeft;
                scrollTop = container.scrollTop;
            }
        });
        
        container.addEventListener('mouseleave', () => {
            isDragging = false;
            if (this.zoomLevel > 100) {
                container.style.cursor = 'crosshair';
            }
        });
        
        container.addEventListener('mouseup', () => {
            isDragging = false;
            if (this.zoomLevel > 100) {
                container.style.cursor = 'crosshair';
            } else {
                container.style.cursor = 'default';
            }
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            const walkX = (x - startX) * 1.5; // Multiply for faster scrolling
            const walkY = (y - startY) * 1.5;
            
            container.scrollLeft = scrollLeft - walkX;
            container.scrollTop = scrollTop - walkY;
        });
    }
    
    animateNumber(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOut);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    populateJsonViewer(data) {
        const viewer = document.getElementById('jsonViewer');
        const jsonString = JSON.stringify(data, null, 2);
        const highlighted = this.syntaxHighlightJson(jsonString);
        
        viewer.innerHTML = `
            <div class="json-controls">
                <button class="json-control-btn" id="expandJsonBtn">
                    <i class="fas fa-expand-alt"></i> Expand
                </button>
                <button class="json-control-btn" id="collapseJsonBtn">
                    <i class="fas fa-compress-alt"></i> Collapse
                </button>
            </div>
            <pre>${highlighted}</pre>
        `;
        
        // Add expand/collapse functionality
        document.getElementById('expandJsonBtn')?.addEventListener('click', () => {
            viewer.querySelector('pre').style.maxHeight = 'none';
        });
        
        document.getElementById('collapseJsonBtn')?.addEventListener('click', () => {
            viewer.querySelector('pre').style.maxHeight = '500px';
        });
        
        viewer.style.opacity = '0';
        setTimeout(() => {
            viewer.style.transition = 'opacity 0.5s ease';
            viewer.style.opacity = '1';
        }, 300);
    }
    
    syntaxHighlightJson(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
    
    
    copyJson() {
        if (!this.currentResults || !this.currentResults.invoice_data) {
            this.showNotification('No JSON data available', 'error');
            return;
        }
        
        const json = JSON.stringify(this.currentResults.invoice_data, null, 2);
        this.copyToClipboard(json, 'copyJsonBtn', 'JSON copied to clipboard!');
    }
    
    
    copyToClipboard(text, buttonId, message) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification(message, 'success');
            
            const btn = document.getElementById(buttonId);
            if (btn) {
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                btn.style.color = 'var(--success-color)';
                
                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                    btn.style.color = '';
                }, 2000);
            }
        }).catch(() => {
            this.showNotification('Failed to copy', 'error');
        });
    }
    
    downloadJSON() {
        if (!this.currentResults || !this.currentResults.invoice_data) {
            this.showNotification('No data available for download', 'error');
            return;
        }
        
        const json = JSON.stringify(this.currentResults.invoice_data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const filename = `invoice_${this.currentResults.invoice_data.invoice_number || 'data'}_${Date.now()}.json`;
        
        this.downloadFile(blob, filename);
        this.showNotification('JSON downloaded successfully!', 'success');
    }
    
    downloadImage() {
        if (!this.currentFile) {
            this.showNotification('No invoice image available', 'error');
            return;
        }
        
        const filename = this.currentFile.name || `invoice_${Date.now()}.png`;
        const url = this.currentImageUrl || URL.createObjectURL(this.currentFile);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('Invoice image downloaded successfully!', 'success');
    }
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    resetForm() {
        this.resultsSection.style.display = 'none';
        document.querySelector('.hero').style.display = 'block';
        
        this.removeFile();
        this.currentResults = null;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => {
            this.animateOnLoad();
        }, 500);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'error' ? 'var(--error-color)' : 
                       type === 'success' ? 'var(--success-color)' : 
                       'var(--primary-color)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: '3000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '350px'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
    
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceProcessor();
});

// Add CSS for notifications
const notificationStyles = `
.notification {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.notification-content i {
    font-size: 1.25rem;
}

.animate-in {
    animation: fadeInUp 0.6s ease-out;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

