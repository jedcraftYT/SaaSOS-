// Updated Alpine.js app() function with Django API integration
// Replace the existing app() function in index.html with this version

function app() {
    return {
        currentStep: 0,
        steps: [
            { title: 'Add Products', description: 'Add products to your catalogue' },
            { title: 'Manage Products', description: 'Edit and manage your products' },
            { title: 'Bulk Upload', description: 'Upload products via Excel' },
            { title: 'Brand Settings', description: 'Configure your brand details' },
            { title: 'Catalogue Preview', description: 'Preview your catalogue' },
            { title: 'Download & QR', description: 'Export and share your catalogue' }
        ],
        
        // Edit Modal State
        editModal: {
            show: false,
            product: null
        },
        
        editForm: {
            id: null,
            name: '',
            description: '',
            price: '',
            category: '',
            sku: '',
            images: []
        },
        
        // Product Form
        productForm: {
            name: '',
            description: '',
            price: '',
            category: '',
            sku: '',
            images: []
        },
        
        // Toast Notification
        toast: {
            show: false,
            message: '',
            type: 'success'
        },
        
        // Excel Upload
        excelData: [],
        isDragging: false,
        
        // QR Code
        qrGenerated: false,
        qrUrl: '',
        qrSrc: '',
        
        // Currency Options
        currencyOptions: [
            { symbol: 'USD', name: 'USD' },
            { symbol: 'EUR', name: 'EUR' },
            { symbol: 'GBP', name: 'GBP' },
            { symbol: 'INR', name: 'INR' },
            { symbol: 'AED', name: 'AED' },
            { symbol: 'SGD', name: 'SGD' },
            { symbol: 'CAD', name: 'CAD' }
        ],
        
        // Template Options
        templateOptions: [
            { value: 'minimal', name: 'Minimal Grid' },
            { value: 'elegant', name: 'Elegant Cards' },
            { value: 'bold', name: 'Bold Price Template' },
            { value: 'compact', name: 'Compact List Template' }
        ],
        
        // Initialize - Fetch data from API
        async init() {
            console.log('App initializing...');
            
            // Fetch products and settings from API
            await Promise.all([
                this.$store.products.fetchAll(),
                this.$store.settings.fetch()
            ]);
            
            // Set QR URL from settings
            this.qrUrl = this.$store.settings.domain_url;
            
            console.log('App initialized');
            console.log('Products:', this.$store.products.items.length);
            console.log('Settings:', this.$store.settings);
        },
        
        // Show Toast
        showToast(message, type = 'success') {
            this.toast.message = message;
            this.toast.type = type;
            this.toast.show = true;
            
            setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        },
        
        // Handle Image Upload
        handleImageUpload(event) {
            const files = Array.from(event.target.files);
            
            if (this.productForm.images.length + files.length > 5) {
                this.showToast('Maximum 5 images allowed', 'error');
                return;
            }
            
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    this.showToast('Image size should be less than 5MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.productForm.images.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        },
        
        // Remove Image
        removeImage(index) {
            this.productForm.images.splice(index, 1);
        },
        
        // Add Product - API Integration
        async addProduct() {
            if (!this.productForm.name || !this.productForm.price) {
                this.showToast('Please fill in required fields', 'error');
                return;
            }
            
            const result = await this.$store.products.add({
                name: this.productForm.name,
                description: this.productForm.description,
                price: parseFloat(this.productForm.price),
                category: this.productForm.category,
                sku: this.productForm.sku,
                images: [...this.productForm.images]
            });
            
            if (result.success) {
                this.showToast('Product added successfully!');
                this.resetForm();
            } else {
                const errorMsg = result.error?.sku ? result.error.sku[0] : 'Failed to add product';
                this.showToast(errorMsg, 'error');
            }
        },
        
        // Reset Form
        resetForm() {
            this.productForm = {
                name: '',
                description: '',
                price: '',
                category: '',
                sku: '',
                images: []
            };
        },
        
        // Handle Excel Upload
        handleExcelUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            this.processExcelFile(file);
        },
        
        // Handle Excel Drop
        handleExcelDrop(event) {
            this.isDragging = false;
            const file = event.dataTransfer.files[0];
            
            if (!file) return;
            
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                this.showToast('Please upload an Excel file', 'error');
                return;
            }
            
            this.processExcelFile(file);
        },
        
        // Process Excel File using SheetJS
        processExcelFile(file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    // Map Excel columns to product fields
                    this.excelData = jsonData.map(row => ({
                        name: row.name || row.Name || row.product_name || '',
                        description: row.description || row.Description || '',
                        price: parseFloat(row.price || row.Price || 0),
                        category: row.category || row.Category || '',
                        sku: row.sku || row.SKU || '',
                        images: []
                    }));
                    
                    this.showToast(`${this.excelData.length} products loaded from Excel`);
                } catch (error) {
                    console.error('Excel processing error:', error);
                    this.showToast('Error processing Excel file', 'error');
                }
            };
            
            reader.readAsArrayBuffer(file);
        },
        
        // Merge Bulk Products - API Integration
        async mergeBulkProducts() {
            if (this.excelData.length === 0) {
                this.showToast('No data to merge', 'error');
                return;
            }
            
            this.showToast('Uploading products...');
            const results = await this.$store.products.addBulk(this.excelData);
            
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            
            if (failCount > 0) {
                this.showToast(`${successCount} products added, ${failCount} failed`, 'error');
            } else {
                this.showToast(`${successCount} products added to catalogue`);
            }
            
            this.excelData = [];
        },
        
        // Handle Logo Upload
        handleLogoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                this.showToast('Logo size should be less than 2MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const result = await this.$store.settings.update({
                    brand_logo: e.target.result
                });
                
                if (result.success) {
                    this.showToast('Logo uploaded successfully');
                } else {
                    this.showToast('Failed to upload logo', 'error');
                }
            };
            reader.readAsDataURL(file);
        },
        
        // Update Settings - API Integration
        async updateSettings(field, value) {
            const result = await this.$store.settings.update({ [field]: value });
            
            if (!result.success) {
                this.showToast('Failed to update settings', 'error');
            }
        },
        
        // Generate QR Code
        generateQR() {
            const url = this.qrUrl || this.$store.settings.domain_url || 'https://example.com';
            
            if (!url) {
                this.showToast('Please enter a URL', 'error');
                return;
            }
            
            try {
                const encodedUrl = encodeURIComponent(url);
                this.qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodedUrl}`;
                this.qrGenerated = true;
                this.showToast('QR code generated successfully');
            } catch (error) {
                this.showToast('Error generating QR code', 'error');
                console.error('QR Code Exception:', error);
            }
        },
        
        // Download QR Code
        async downloadQR() {
            if (!this.qrSrc) {
                this.showToast('Please generate QR code first', 'error');
                return;
            }
            
            try {
                const response = await fetch(this.qrSrc);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'catalogue-qr-code.png';
                link.href = url;
                link.click();
                window.URL.revokeObjectURL(url);
                this.showToast('QR code downloaded');
            } catch (error) {
                this.showToast('Error downloading QR code', 'error');
                console.error(error);
            }
        },
        
        // Download PDF
        async downloadPDF() {
            try {
                const element = document.getElementById('printArea');
                
                if (!element) {
                    this.showToast('Print area not found', 'error');
                    return;
                }
                
                this.showToast('Generating PDF...');
                
                const opt = {
                    margin: 10,
                    filename: `${this.$store.settings.brand_name.replace(/\s+/g, '-') || 'Catalogue'}-Catalogue.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        letterRendering: true
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait' 
                    },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };
                
                const printClone = element.cloneNode(true);
                
                try {
                    const phone = this.$store.settings.whatsapp_phone || '';
                    if (phone) {
                        const footerEl = document.createElement('div');
                        footerEl.style.textAlign = 'center';
                        footerEl.style.fontSize = '10px';
                        footerEl.style.marginTop = '8px';
                        footerEl.style.color = '#6b7280';
                        footerEl.textContent = `Order on WhatsApp: https://wa.me/${phone}`;
                        printClone.appendChild(footerEl);
                    }
                } catch (err) {
                    console.warn('Could not append WhatsApp footer to PDF', err);
                }

                await html2pdf().set(opt).from(printClone).save();
                
                setTimeout(() => {
                    this.showToast('PDF catalogue downloaded successfully!');
                }, 1000);
            } catch (error) {
                this.showToast('Error generating PDF', 'error');
                console.error('PDF Generation Error:', error);
            }
        },
        
        // Open Edit Modal
        openEditModal(productId) {
            const product = this.$store.products.getById(productId);
            if (product) {
                this.editForm = {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    sku: product.sku,
                    images: [...product.images]
                };
                this.editModal.show = true;
            }
        },
        
        // Close Edit Modal
        closeEditModal() {
            this.editModal.show = false;
            this.editForm = {
                id: null,
                name: '',
                description: '',
                price: '',
                category: '',
                sku: '',
                images: []
            };
        },
        
        // Save Edited Product - API Integration
        async saveEditedProduct() {
            if (!this.editForm.name || !this.editForm.price) {
                this.showToast('Please fill in required fields', 'error');
                return;
            }
            
            const result = await this.$store.products.update(this.editForm.id, {
                name: this.editForm.name,
                description: this.editForm.description,
                price: parseFloat(this.editForm.price),
                category: this.editForm.category,
                sku: this.editForm.sku,
                images: [...this.editForm.images]
            });
            
            if (result.success) {
                this.showToast('Product updated successfully!');
                this.closeEditModal();
            } else {
                const errorMsg = result.error?.sku ? result.error.sku[0] : 'Failed to update product';
                this.showToast(errorMsg, 'error');
            }
        },
        
        // Delete Product - API Integration
        async deleteProduct(productId) {
            if (confirm('Are you sure you want to delete this product?')) {
                const result = await this.$store.products.remove(productId);
                
                if (result.success) {
                    this.showToast('Product deleted successfully!');
                } else {
                    this.showToast('Failed to delete product', 'error');
                }
            }
        },
        
        // Handle Edit Form Image Upload
        handleEditImageUpload(event) {
            const files = Array.from(event.target.files);
            
            if (this.editForm.images.length + files.length > 5) {
                this.showToast('Maximum 5 images allowed', 'error');
                return;
            }
            
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    this.showToast('Image size should be less than 5MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.editForm.images.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        },
        
        // Remove Edit Form Image
        removeEditImage(index) {
            this.editForm.images.splice(index, 1);
        }
    }
}
