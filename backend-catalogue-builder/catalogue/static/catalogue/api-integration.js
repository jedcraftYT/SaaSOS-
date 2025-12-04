// API Integration for Catalogue Builder
// This file provides helper functions and Alpine.js integration for Django REST API

const API_BASE_URL = '/api';
const AUTH_BASE_URL = '/auth';

// Helper: Get JWT token from localStorage
function getToken() {
    return localStorage.getItem('access_token');
}

// Helper: Set JWT tokens
function setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}

// Helper: Clear tokens (logout)
function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

// Helper: API fetch wrapper with JWT authentication
async function apiFetch(url, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry the original request
            headers['Authorization'] = `Bearer ${getToken()}`;
            return fetch(url, { ...options, headers });
        } else {
            // Redirect to login
            window.location.href = '/login.html';
            throw new Error('Authentication required');
        }
    }
    
    return response;
}

// Helper: Refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
        const response = await fetch(`${AUTH_BASE_URL}/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    
    return false;
}

// Alpine.js Integration
document.addEventListener('alpine:init', () => {
    
    // Products Store - Connected to Django API
    Alpine.store('products', {
        items: [],
        loading: false,
        
        async fetchAll() {
            this.loading = true;
            try {
                const response = await apiFetch(`${API_BASE_URL}/products/`);
                if (response.ok) {
                    const data = await response.json();
                    this.items = data.results || data; // Handle paginated or non-paginated response
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                this.loading = false;
            }
        },
        
        async add(product) {
            try {
                const response = await apiFetch(`${API_BASE_URL}/products/`, {
                    method: 'POST',
                    body: JSON.stringify(product),
                });
                
                if (response.ok) {
                    const newProduct = await response.json();
                    this.items.push(newProduct);
                    return { success: true, product: newProduct };
                } else {
                    const error = await response.json();
                    return { success: false, error };
                }
            } catch (error) {
                console.error('Error adding product:', error);
                return { success: false, error: error.message };
            }
        },
        
        async update(id, updatedProduct) {
            try {
                const response = await apiFetch(`${API_BASE_URL}/products/${id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(updatedProduct),
                });
                
                if (response.ok) {
                    const updated = await response.json();
                    const index = this.items.findIndex(p => p.id === id);
                    if (index !== -1) {
                        this.items[index] = updated;
                    }
                    return { success: true, product: updated };
                } else {
                    const error = await response.json();
                    return { success: false, error };
                }
            } catch (error) {
                console.error('Error updating product:', error);
                return { success: false, error: error.message };
            }
        },
        
        async remove(id) {
            try {
                const response = await apiFetch(`${API_BASE_URL}/products/${id}/`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    const index = this.items.findIndex(p => p.id === id);
                    if (index !== -1) {
                        this.items.splice(index, 1);
                    }
                    return { success: true };
                } else {
                    const error = await response.json();
                    return { success: false, error };
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                return { success: false, error: error.message };
            }
        },
        
        getById(id) {
            return this.items.find(p => p.id === id);
        },
        
        async addBulk(products) {
            const results = [];
            for (const product of products) {
                const result = await this.add(product);
                results.push(result);
            }
            return results;
        }
    });
    
    // Settings Store - Connected to Django API
    Alpine.store('settings', {
        id: null,
        brand_name: '',
        brand_logo: '',
        domain_url: '',
        currency: 'INR',
        cta_style: 'cart',
        whatsapp_phone: '',
        whatsapp_message: '',
        catalogue_template: 'minimal',
        loading: false,
        
        async fetch() {
            this.loading = true;
            try {
                const response = await apiFetch(`${API_BASE_URL}/settings/`);
                if (response.ok) {
                    const data = await response.json();
                    // Handle both list response and single object
                    const settings = Array.isArray(data) ? data[0] : (data.results ? data.results[0] : data);
                    
                    if (settings) {
                        this.id = settings.id;
                        this.brand_name = settings.brand_name || '';
                        this.brand_logo = settings.brand_logo || '';
                        this.domain_url = settings.domain_url || '';
                        this.currency = settings.currency || 'INR';
                        this.cta_style = settings.cta_style || 'cart';
                        this.whatsapp_phone = settings.whatsapp_phone || '';
                        this.whatsapp_message = settings.whatsapp_message || '';
                        this.catalogue_template = settings.catalogue_template || 'minimal';
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                this.loading = false;
            }
        },
        
        async update(updates) {
            if (!this.id) {
                console.error('Settings ID not found');
                return { success: false, error: 'Settings not initialized' };
            }
            
            try {
                const response = await apiFetch(`${API_BASE_URL}/settings/${this.id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(updates),
                });
                
                if (response.ok) {
                    const updated = await response.json();
                    // Update local state
                    Object.assign(this, updated);
                    return { success: true, settings: updated };
                } else {
                    const error = await response.json();
                    return { success: false, error };
                }
            } catch (error) {
                console.error('Error updating settings:', error);
                return { success: false, error: error.message };
            }
        }
    });
});

// Helper: Get currency symbol from code
function getCurrencySymbol(code) {
    const symbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'AED': 'AED',
        'SGD': 'S$',
        'CAD': 'C$',
        'AUD': 'A$',
        'JPY': '¥',
    };
    return symbols[code] || code;
}

// Export for use in other scripts
window.catalogueAPI = {
    getToken,
    setTokens,
    clearTokens,
    apiFetch,
    refreshAccessToken,
    getCurrencySymbol,
    API_BASE_URL,
    AUTH_BASE_URL,
};
