// Database State Structure
let store = {
    items: [],            // Catalog of item variants
    sales: [],            // Sales records
    purchase_orders: [],   // Purchase orders
    adjustments: [],      // Manual inventory adjustments (waste/audit corrections)
    suppliers: [],        // Suppliers registry
    customers: [],        // Business customer registry
    stock_orders: [],     // Low-stock ordering workflow ledger
    preorders: [],        // Customer pre-order ledger
    queries: [],          // Customer stock queries log
    business_profile: {}  // Business contact details
};

// LocalStorage Namespace
const STORAGE_KEY = 'saiGayatriStore_v3';

// Chart instances
let trendChartInstance = null;
let categoryChartInstance = null;

// Initial Seeding Data
const DEFAULT_SUPPLIERS = [];

const DEFAULT_ITEMS = [];

const DEFAULT_PROFILE = {
    name: "Sai Gayatri Industries",
    tagline: "",
    address: "",
    contact: ""
};

const DEFAULT_CUSTOMERS = [
    {
        id: "cust_1",
        customerType: "Existing Customer",
        name: "Anand Kumar",
        mobile: "9876543210",
        gstNumber: "36ABCDE1234F1Z5",
        address: "Banjara Hills, Hyderabad",
        email: "anand.kumar@gmail.com"
    },
    {
        id: "cust_2",
        customerType: "New Customer",
        name: "Ritika Rao",
        mobile: "9988776655",
        gstNumber: "",
        address: "Begumpet, Hyderabad",
        email: "ritika.rao@gmail.com"
    }
];

// Seed database with relative dates so that dashboard graphs look perfect
function seedDemoData(force = false) {
    if (!force && localStorage.getItem(STORAGE_KEY)) {
        return; // Already has data
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const getPastDateStr = (daysAgo) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    store.business_profile = { ...DEFAULT_PROFILE };
    store.suppliers = [ ...DEFAULT_SUPPLIERS ];
    store.customers = [ ...DEFAULT_CUSTOMERS ];
    store.items = [ ...DEFAULT_ITEMS ];
    store.stock_orders = [];
    store.preorders = [
        {
            id: "pre_1",
            date: getPastDateStr(14),
            customerName: "Anand Kumar",
            customerMobile: "9876543210",
            itemKey: "Plates_12 inch Buffet_250 GSM",
            qty: 120,
            unitPrice: 2.50,
            totalAmount: 300,
            deliveryDate: getPastDateStr(3),
            notes: "Deep plate, venue delivery",
            status: "Pending"
        },
        {
            id: "pre_2",
            date: getPastDateStr(5),
            customerName: "Ritika Rao",
            customerMobile: "9988776655",
            itemKey: "Plates_14 inch Buffet_300 GSM",
            qty: 90,
            unitPrice: 3.20,
            totalAmount: 288,
            deliveryDate: getPastDateStr(1),
            notes: "Wedding function booking",
            status: "Delivered"
        }
    ];
    store.queries = [
        {
            id: "q_1",
            date: getPastDateStr(10),
            customerName: "Ramesh Babu",
            customerMobile: "9440123456",
            itemKey: "Plates_8 inch Breakfast_180 GSM",
            qty: 600,
            notes: "Need stock for festival season",
            status: "Open"
        },
        {
            id: "q_2",
            date: getPastDateStr(2),
            customerName: "Kavya Nair",
            customerMobile: "9123456780",
            itemKey: "Plates_6 inch Chat_120 GSM",
            qty: 300,
            notes: "Urgent quantity confirmation",
            status: "Resolved"
        }
    ];

    // Generate historical purchase orders
    store.purchase_orders = [
        { id: "po1", date: getPastDateStr(25), itemKey: "Plates_12 inch Buffet_250 GSM", plateDieIn: "Diamond Deep", qty: 5000, costPrice: 1.80, totalAmount: 9000, supplier: "Balaji Paper Board Mills", paymentStatus: "Paid", status: "Stocked", notes: "First batch of July" },
        { id: "po2", date: getPastDateStr(20), itemKey: "Plates_14 inch Buffet_300 GSM", plateDieIn: "Wrinkle Regular", qty: 3000, costPrice: 2.35, totalAmount: 7050, supplier: "Balaji Paper Board Mills", paymentStatus: "Paid", status: "Stocked", notes: "Bulk sheet order" },
        { id: "po3", date: getPastDateStr(15), itemKey: "Materials_Silver Paper Roll_80 kg", plateDieIn: "Lamination Cores", qty: 10, costPrice: 1350.00, totalAmount: 13500, supplier: "Deccan Laminates & Foils", paymentStatus: "Partial", status: "Stocked", notes: "Lamination raw rolls" },
        { id: "po4", date: getPastDateStr(8), itemKey: "Plates_8 inch Breakfast_180 GSM", plateDieIn: "Leaf Spec", qty: 10000, costPrice: 0.70, totalAmount: 7000, supplier: "Balaji Paper Board Mills", paymentStatus: "Paid", status: "Stocked", notes: "Festival season stock up" },
        { id: "po5", date: getPastDateStr(3), itemKey: "Materials_Gold Paper Roll_90 kg", plateDieIn: "Lamination Cores", qty: 8, costPrice: 1600.00, totalAmount: 12800, supplier: "Deccan Laminates & Foils", paymentStatus: "Pending", status: "Ordered", notes: "Urgent gold rolls purchase" },
        { id: "po6", date: getPastDateStr(1), itemKey: "Plates_12 inch Buffet_250 GSM", plateDieIn: "Diamond Deep", qty: 3000, costPrice: 1.85, totalAmount: 5550, supplier: "Sree Krishna Die Works", paymentStatus: "Pending", status: "Received", notes: "Die correction test order" }
    ];

    // Generate historical sales
    store.sales = [
        { id: "s1", date: getPastDateStr(24), itemKey: "Plates_12 inch Buffet_250 GSM", qty: 1500, costPrice: 1.80, sellingPrice: 2.45, totalCost: 2700, totalRevenue: 3675, profit: 975, notes: "Sri Venkateswara Catering, Hyd" },
        { id: "s2", date: getPastDateStr(22), itemKey: "Plates_14 inch Buffet_300 GSM", qty: 800, costPrice: 2.40, sellingPrice: 3.20, totalCost: 1920, totalRevenue: 2560, profit: 640, notes: "Metro Traders Wholesale" },
        { id: "s3", date: getPastDateStr(18), itemKey: "Plates_8 inch Breakfast_180 GSM", qty: 3000, costPrice: 0.75, sellingPrice: 1.10, totalCost: 2250, totalRevenue: 3300, profit: 1050, notes: "Ganesh Kirana Shop" },
        { id: "s4", date: getPastDateStr(14), itemKey: "Plates_6 inch Chat_120 GSM", qty: 4500, costPrice: 0.35, sellingPrice: 0.55, totalCost: 1575, totalRevenue: 2475, profit: 900, notes: "Chat Bhandar Association" },
        { id: "s5", date: getPastDateStr(10), itemKey: "Materials_Silver Paper Roll_80 kg", qty: 3, costPrice: 1400.00, sellingPrice: 1750.00, totalCost: 4200, totalRevenue: 5250, profit: 1050, notes: "External factory sale" },
        { id: "s6", date: getPastDateStr(7), itemKey: "Plates_12 inch Buffet_250 GSM", qty: 2200, costPrice: 1.80, sellingPrice: 2.50, totalCost: 3960, totalRevenue: 5500, profit: 1540, notes: "Raju Decorators & Suppliers" },
        { id: "s7", date: getPastDateStr(5), itemKey: "Plates_14 inch Buffet_300 GSM", qty: 1200, costPrice: 2.40, sellingPrice: 3.15, totalCost: 2880, totalRevenue: 3780, profit: 900, notes: "Venkata Sai Caterers" },
        { id: "s8", date: getPastDateStr(3), itemKey: "Plates_8 inch Breakfast_180 GSM", qty: 4000, costPrice: 0.70, sellingPrice: 1.10, totalCost: 2800, totalRevenue: 4400, profit: 1600, notes: "Daily cash party booking" },
        { id: "s9", date: getPastDateStr(1), itemKey: "Plates_6 inch Chat_120 GSM", qty: 5000, costPrice: 0.35, sellingPrice: 0.52, totalCost: 1750, totalRevenue: 2600, profit: 850, notes: "Gopal Chat Stall" },
        { id: "s10", date: todayStr, itemKey: "Plates_12 inch Buffet_250 GSM", qty: 1000, costPrice: 1.85, sellingPrice: 2.50, totalCost: 1850, totalRevenue: 2500, profit: 650, notes: "Srinivasa Tiffin Center" },
        { id: "s11", date: todayStr, itemKey: "Plates_14 inch Buffet_300 GSM", qty: 500, costPrice: 2.40, sellingPrice: 3.20, totalCost: 1200, totalRevenue: 1600, profit: 400, notes: "Sri Sai catering service" }
    ];

    // Generate manual adjustments
    store.adjustments = [
        { id: "adj1", date: getPastDateStr(12), itemKey: "Plates_8 inch Breakfast_180 GSM", qty: -150, type: "Stock Out", reason: "Rain damage in warehouse" },
        { id: "adj2", date: getPastDateStr(2), itemKey: "Plates_6 inch Chat_120 GSM", qty: 100, type: "Stock In", reason: "Audit count correction adjustment" }
    ];

    saveData();
}

// Save & Load helpers
function normalizeStore() {
    const defaults = {
        items: [],
        sales: [],
        purchase_orders: [],
        adjustments: [],
        suppliers: [],
        customers: [],
        stock_orders: [],
        preorders: [],
        queries: [],
        business_profile: { ...DEFAULT_PROFILE }
    };

    if (!store || typeof store !== 'object') {
        store = { ...defaults };
    }

    Object.keys(defaults).forEach((key) => {
        if (!(key in store)) {
            store[key] = Array.isArray(defaults[key]) ? [...defaults[key]] : { ...defaults[key] };
        }

        if (Array.isArray(defaults[key]) && !Array.isArray(store[key])) {
            store[key] = [...defaults[key]];
        }
    });

    if (!store.business_profile || typeof store.business_profile !== 'object') {
        store.business_profile = { ...DEFAULT_PROFILE };
    }

    // Auto-sequence order numbers ES000001, ES000002... for sales & preorders
    let counter = 1;
    (store.sales || []).forEach((sale) => {
        if (!sale.orderNo) {
            sale.orderNo = 'ES' + String(counter++).padStart(6, '0');
        } else {
            const num = parseInt(sale.orderNo.replace('ES', ''), 10);
            if (!isNaN(num) && num >= counter) counter = num + 1;
        }
    });

    (store.preorders || []).forEach((po) => {
        if (!po.orderNo) {
            po.orderNo = 'ES' + String(counter++).padStart(6, '0');
        } else {
            const num = parseInt(po.orderNo.replace('ES', ''), 10);
            if (!isNaN(num) && num >= counter) counter = num + 1;
        }
    });
}

function generateOrderNumber() {
    let maxNum = 0;
    const allRecords = [...(store.sales || []), ...(store.preorders || [])];
    allRecords.forEach(r => {
        if (r.orderNo && r.orderNo.startsWith('ES')) {
            const num = parseInt(r.orderNo.replace('ES', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });
    const nextNum = maxNum + 1;
    return 'ES' + String(nextNum).padStart(6, '0');
}

function saveData() {
    normalizeStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            store = JSON.parse(data);
        } catch (error) {
            console.warn('Invalid saved store. Resetting local data.', error);
            store = {
                items: [],
                sales: [],
                purchase_orders: [],
                adjustments: [],
                suppliers: [],
                customers: [],
                stock_orders: [],
                preorders: [],
                queries: [],
                business_profile: { ...DEFAULT_PROFILE }
            };
        }
    } else {
        // Start completely empty (clean slate)
        store = {
            items: [],
            sales: [],
            purchase_orders: [],
            adjustments: [],
            suppliers: [],
            customers: [],
            stock_orders: [],
            preorders: [],
            queries: [],
            business_profile: { ...DEFAULT_PROFILE }
        };
        saveData();
    }

    normalizeStore();
}

function clearAllData() {
    if (confirm("Are you sure you want to delete ALL data in the database? This will permanently wipe all products, sales, purchase orders, manual adjustments, and registered suppliers!")) {
        store = {
            items: [],
            sales: [],
            purchase_orders: [],
            adjustments: [],
            suppliers: [],
            customers: [],
            stock_orders: [],
            preorders: [],
            queries: [],
            business_profile: { ...DEFAULT_PROFILE }
        };
        saveData();
        updateUI();
        showToast("All data deleted, database cleared!");
    }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupForms();
    setupTheme();
    
    // Set default dates for forms
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sale-date').value = today;
    document.getElementById('po-date').value = today;
    document.getElementById('preorder-date').value = today;
    document.getElementById('preorder-delivery').value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('query-date').value = today;
    document.getElementById('filter-sales-start').value = today;
    document.getElementById('filter-sales-end').value = today;

    // Display current date formatted nicely
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerHTML = `<i class="ph ph-calendar"></i> ${new Date().toLocaleDateString(undefined, dateOptions)}`;

    updateUI();
    switchSubTab('preorders');
});

function setupNavigation() {
    const handleNav = (targetId, filters = {}) => {
        document.querySelectorAll('.view').forEach(view => {
            if (view.id === `view-${targetId}`) {
                view.classList.add('active');
                view.classList.remove('hidden');
            } else {
                view.classList.remove('active');
                view.classList.add('hidden');
            }
        });

        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const pageTitles = {
            'dashboard': 'Dashboard Overview',
            'sales': 'Sales Data Log & Entry',
            'preorders': 'Customer Orders & Booking',
            'customers': 'Customers & User Accounts Ledger',
            'stock': 'Stock Inventory Tracker',
            'orders': 'Purchase Order Manager',
            'stock-orders': 'Smart Stock Ordering Tool',
            'queries': 'Customer Queries & Quotations',
            'reports': 'Reports & Business Insights',
            'settings': 'Business Profile & Settings'
        };
        document.getElementById('page-title').textContent = pageTitles[targetId] || 'Business Manager';

        if (targetId === 'customers') {
            onCustomerSearchChange();
        }

        if (targetId === 'queries') {
            switchTab('preorders');
            switchSubTab('queries');
            return;
        }

        if (targetId === 'stock' && filters.filterLowStock) {
            document.getElementById('filter-stock-low').checked = true;
            onStockFilterChange();
        } else if (targetId === 'stock' && !filters.filterLowStock) {
            document.getElementById('filter-stock-low').checked = false;
            onStockFilterChange();
        }

        if (targetId === 'orders' && filters.filterPending) {
            document.getElementById('filter-po-status').value = 'Ordered';
            onPoFilterChange();
        } else if (targetId === 'orders' && !filters.filterPending) {
            document.getElementById('filter-po-status').value = 'all';
            onPoFilterChange();
        }

        if (targetId === 'preorders') {
            switchSubTab(window.currentSubTab || 'preorders');
        }

        if (targetId === 'stock-orders') {
            renderStockOrdersView(computeInventory());
        }

        if (targetId === 'dashboard') {
            setTimeout(renderCharts, 50);
        }
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            handleNav(target);
        });
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            handleNav(target);
        });
    });

    window.switchTab = handleNav;
    window.switchSubTab = switchSubTab;
    switchSubTab('preorders');
}

function switchSubTab(tabName) {
    const panels = {
        preorders: document.getElementById('subpanel-preorders'),
        queries: document.getElementById('subpanel-queries')
    };

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;
        const isActive = name === tabName;
        panel.classList.toggle('hidden', !isActive);
        panel.classList.toggle('active', isActive);
    });

    const buttons = {
        preorders: document.getElementById('subtab-preorders-btn'),
        queries: document.getElementById('subtab-queries-btn')
    };

    Object.entries(buttons).forEach(([name, button]) => {
        if (!button) return;
        const isActive = name === tabName;
        button.classList.toggle('btn-primary', isActive);
        button.classList.toggle('btn-outline', !isActive);
        button.classList.toggle('active', isActive);
    });

    if (typeof window !== 'undefined') {
        window.currentSubTab = tabName;
    }
}

// Dark / Light Theme logic
function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    const applyTheme = (isLight) => {
        document.body.classList.toggle('light-theme', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        if (themeIcon) {
            themeIcon.className = isLight ? 'ph ph-moon' : 'ph ph-sun';
        }

        if (themeText) {
            themeText.textContent = isLight ? 'Dark Mode' : 'Light Mode';
        }

        if (typeof renderCharts === 'function') {
            renderCharts();
        }
    };

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = !document.body.classList.contains('light-theme');
            applyTheme(isLight);
        });
    }

    const savedTheme = localStorage.getItem('theme');
    const shouldUseLight = savedTheme === 'light';
    applyTheme(shouldUseLight);
}

// Master Recalculator: Core Relational Integrity Engine
// Computes Stock Levels dynamically from Purchases, Sales, Manual Adjustments, and Catalog defaults
function computeInventory() {
    // 1. Reset metrics and compile items dictionary
    const itemsMap = {};
    store.items.forEach(item => {
        itemsMap[item.key] = {
            ...item,
            purchased: 0,
            used: 0,
            adjustments: 0,
            closingStock: item.openingStock,
            stockValue: 0
        };
    });

    // 2. Sum Received or Stocked Purchase Orders
    store.purchase_orders.forEach(po => {
        if (itemsMap[po.itemKey] && (po.status === 'Received' || po.status === 'Stocked')) {
            itemsMap[po.itemKey].purchased += parseFloat(po.qty);
            // Dynamic cost updates: set current unit cost to last PO unit cost
            itemsMap[po.itemKey].costPrice = parseFloat(po.costPrice);
        }
    });

    // 3. Sum Sales / Consumption
    store.sales.forEach(sale => {
        if (itemsMap[sale.itemKey]) {
            itemsMap[sale.itemKey].used += parseFloat(sale.qty);
        }
    });

    // 4. Sum Manual Adjustments (waste, periodic audits)
    store.adjustments.forEach(adj => {
        if (itemsMap[adj.itemKey]) {
            itemsMap[adj.itemKey].adjustments += parseFloat(adj.qty);
        }
    });

    // 5. Final calculation loops
    const processedItems = Object.values(itemsMap).map(item => {
        const closing = item.openingStock + item.purchased - item.used + item.adjustments;
        const val = closing * item.costPrice;
        
        let status = 'OK';
        if (closing <= 0) {
            status = 'Out of Stock';
        } else if (closing <= item.reorderLevel) {
            status = 'Low Stock';
        }

        return {
            ...item,
            closingStock: closing,
            stockValue: val,
            status: status
        };
    });

    // Sync back modified costPrice or parameters to master database to maintain consistency
    store.items = processedItems.map(item => {
        // extract pure fields to match structure
        return {
            key: item.key,
            category: item.category,
            size: item.size,
            gsm: item.gsm,
            unit: item.unit,
            openingStock: item.openingStock,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            reorderLevel: item.reorderLevel,
            notes: item.notes
        };
    });
    saveData();

    return processedItems;
}

// Update Entire UI Dashboard, Forms, Lists, Filters
function updateUI() {
    // 1. Calculate dynamic inventory lists
    const liveInventory = computeInventory();

    // 2. Populate Dropdowns in forms & filters
    populateDropdowns(liveInventory);

    // 3. Render Profile Info
    renderProfileInfo();

    // 4. Refresh Dashboard Widgets
    renderDashboardStats(liveInventory);

    // 5. Build Alert Banners
    renderAlertBanners(liveInventory);

    // 6. Render Screen 2 (Sales Log Table)
    renderSalesView(liveInventory);

    // 7. Render Screen 3 (Stock Tracker Table)
    renderStockView(liveInventory);

    // 8. Render Screen 4 (Purchase Orders Table)
    renderPurchaseOrdersView(liveInventory);

    // 9. Render Screen 5 (Smart Stock Ordering)
    renderStockOrdersView(liveInventory);

    // 10. Render Screen 6 (Pre-Orders & Customer Queries)
    renderPreOrdersTable();
    renderQueriesTable();

    // 11. Generate Charts
    renderCharts();
}

// Business Profile display handler
function renderProfileInfo() {
    const p = store.business_profile || DEFAULT_PROFILE;
    const name = p.name || 'Sai Gayatri Industries';
    const tagline = p.tagline || 'Paper Plates, Buffet Plates & Raw Materials Manufacturing';
    const address = p.address || 'Plot No. 42, Industrial Area, Phase-I, Hyderabad, TS, 500051';
    const contact = p.contact || 'Email: contact@saigayatri.com | Ph: +91 98765 43210';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

    setText('display-biz-name', name);
    setText('display-biz-tagline', tagline);
    setText('display-biz-address', address);
    setText('display-biz-contact', contact);

    setVal('profile-name', name);
    setVal('profile-tagline', tagline);
    setVal('profile-address', address);
    setVal('profile-contact', contact);

    setVal('settings-biz-name', name);
    setVal('settings-biz-tagline', tagline);
    setVal('settings-biz-address', address);
    setVal('settings-biz-contact', contact);
}

// Dropdowns compiler
function populateDropdowns(liveInventory) {
    const saleSelect = document.getElementById('sale-item');
    const poSelect = document.getElementById('po-item');
    const supplierSelect = document.getElementById('po-supplier');
    const preorderSelect = document.getElementById('preorder-item');
    const querySelect = document.getElementById('query-item');

    // Save previous selections if any
    const prevSaleVal = saleSelect ? saleSelect.value : '';
    const prevPoVal = poSelect ? poSelect.value : '';
    const prevSupplierVal = supplierSelect ? supplierSelect.value : '';
    const prevPreorderVal = preorderSelect ? preorderSelect.value : '';
    const prevQueryVal = querySelect ? querySelect.value : '';

    // Reset dropdowns
    if (saleSelect) saleSelect.innerHTML = '<option value="" disabled selected>Choose a category + size + GSM...</option>';
    if (poSelect) poSelect.innerHTML = '<option value="" disabled selected>Choose a category + size + GSM...</option>';
    if (supplierSelect) supplierSelect.innerHTML = '<option value="" disabled selected>Choose Supplier...</option>';
    if (preorderSelect) preorderSelect.innerHTML = '<option value="" disabled selected>Choose a category + size + GSM...</option>';
    if (querySelect) querySelect.innerHTML = '<option value="" disabled selected>Choose a category + size + GSM...</option>';

    // Build Product dropdown options
    liveInventory.forEach(item => {
        const optionText = `${item.category} (${item.size} | ${item.gsm})`;
        
        if (saleSelect) saleSelect.add(new Option(optionText, item.key));
        if (poSelect) poSelect.add(new Option(optionText, item.key));
        if (preorderSelect) preorderSelect.add(new Option(optionText, item.key));
        if (querySelect) querySelect.add(new Option(optionText, item.key));
    });

    // Build Suppliers options
    store.suppliers.forEach(sup => {
        if (supplierSelect) supplierSelect.add(new Option(sup.name, sup.name));
    });

    // Restore selections
    if (saleSelect && [...saleSelect.options].some(o => o.value === prevSaleVal)) saleSelect.value = prevSaleVal;
    if (poSelect && [...poSelect.options].some(o => o.value === prevPoVal)) poSelect.value = prevPoVal;
    if (supplierSelect && [...supplierSelect.options].some(o => o.value === prevSupplierVal)) supplierSelect.value = prevSupplierVal;
    if (preorderSelect && [...preorderSelect.options].some(o => o.value === prevPreorderVal)) preorderSelect.value = prevPreorderVal;
    if (querySelect && [...querySelect.options].some(o => o.value === prevQueryVal)) querySelect.value = prevQueryVal;

    // Sync categories & sizes filter options
    syncFilters(liveInventory);
}

// Sync filters dropdown lists in Sales/Stock/PO
function syncFilters(liveInventory) {
    const categories = [...new Set(liveInventory.map(i => i.category))].sort();
    const sizes = [...new Set(liveInventory.map(i => i.size))].sort();
    const gsms = [...new Set(liveInventory.map(i => i.gsm))].sort();
    const suppliers = store.suppliers.map(s => s.name).sort();
    
    // Compile PO months
    const poMonths = [...new Set(store.purchase_orders.map(po => {
        if (!po.date) return '';
        return po.date.substring(0, 7); // YYYY-MM
    }))].filter(m => m !== '').sort().reverse();

    // 1. Sales filters
    const salesCatFilter = document.getElementById('filter-sales-category');
    const prevSalesCat = salesCatFilter.value;
    salesCatFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(c => salesCatFilter.add(new Option(c, c)));
    if ([...salesCatFilter.options].some(o => o.value === prevSalesCat)) salesCatFilter.value = prevSalesCat;

    // 2. Stock filters
    const stockCatFilter = document.getElementById('filter-stock-category');
    const stockSizeFilter = document.getElementById('filter-stock-size');
    const stockGsmFilter = document.getElementById('filter-stock-gsm');
    
    const prevStockCat = stockCatFilter.value;
    const prevStockSize = stockSizeFilter.value;
    const prevStockGsm = stockGsmFilter.value;

    stockCatFilter.innerHTML = '<option value="all">All Categories</option>';
    stockSizeFilter.innerHTML = '<option value="all">All Sizes</option>';
    stockGsmFilter.innerHTML = '<option value="all">All GSMs</option>';

    categories.forEach(c => stockCatFilter.add(new Option(c, c)));
    sizes.forEach(s => stockSizeFilter.add(new Option(s, s)));
    gsms.forEach(g => stockGsmFilter.add(new Option(g, g)));

    if ([...stockCatFilter.options].some(o => o.value === prevStockCat)) stockCatFilter.value = prevStockCat;
    if ([...stockSizeFilter.options].some(o => o.value === prevStockSize)) stockSizeFilter.value = prevStockSize;
    if ([...stockGsmFilter.options].some(o => o.value === prevStockGsm)) stockGsmFilter.value = prevStockGsm;

    // 3. PO filters
    const poMonthFilter = document.getElementById('filter-po-month');
    const poSupplierFilter = document.getElementById('filter-po-supplier');
    
    const prevPoMonth = poMonthFilter.value;
    const prevPoSupplier = poSupplierFilter.value;

    poMonthFilter.innerHTML = '<option value="all">All Months</option>';
    poSupplierFilter.innerHTML = '<option value="all">All Suppliers</option>';

    poMonths.forEach(m => {
        const dateObj = new Date(m + "-02"); // Add offset to prevent timezone offset shift
        const label = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
        poMonthFilter.add(new Option(label, m));
    });
    suppliers.forEach(s => poSupplierFilter.add(new Option(s, s)));

    if ([...poMonthFilter.options].some(o => o.value === prevPoMonth)) poMonthFilter.value = prevPoMonth;
    if ([...poSupplierFilter.options].some(o => o.value === prevPoSupplier)) poSupplierFilter.value = prevPoSupplier;
}

// KPI widget renderers
function renderDashboardStats(liveInventory) {
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    const setElem = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    // 1. Total Sales
    const totalSalesRev = (store.sales || []).reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    setElem('kpi-total-sales', `₹${totalSalesRev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setElem('kpi-total-sales-count', `${(store.sales || []).length} sales logged`);

    // 2. Total Orders
    const totalOrdersCount = (store.sales || []).length + (store.preorders || []).length;
    const preordersVal = (store.preorders || []).reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    setElem('kpi-total-orders', totalOrdersCount.toLocaleString());
    setElem('kpi-total-orders-val', `₹${(totalSalesRev + preordersVal).toLocaleString('en-IN')} total order value`);

    // 3. Paid, Pending, & Credit
    let paidSum = 0;
    let pendingSum = 0;
    let pendingCount = 0;

    (store.sales || []).forEach(s => {
        const rev = Number(s.totalRevenue) || 0;
        if (s.paymentStatus === 'Paid' || !s.paymentStatus) {
            paidSum += rev;
        } else if (s.paymentStatus === 'Credit') {
            pendingSum += rev;
            pendingCount++;
        } else if (s.paymentStatus === 'Partial') {
            paidSum += rev * 0.5;
            pendingSum += rev * 0.5;
            pendingCount++;
        }
    });

    (store.preorders || []).forEach(p => {
        const amt = Number(p.totalAmount) || 0;
        if (p.paymentStatus === 'Paid') {
            paidSum += amt;
        } else {
            pendingSum += amt;
            pendingCount++;
        }
    });

    setElem('kpi-pending-payments', `₹${pendingSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setElem('kpi-pending-count', `${pendingCount} pending receivables`);
    setElem('kpi-paid-amount', `₹${paidSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setElem('kpi-outstanding-credit', `₹${pendingSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

    // 4. Current Stock Units
    const totalStockUnits = liveInventory.reduce((sum, item) => sum + (Number(item.closingStock) || 0), 0);
    setElem('kpi-current-stock', `${totalStockUnits.toLocaleString()} units`);
    setElem('kpi-stock-items', `${liveInventory.length} product variants`);

    // 5. Low Stock Alerts
    const lowStockCount = liveInventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;
    const alertWidgetBadge = document.getElementById('kpi-alerts-badge');
    setElem('kpi-low-stock-count', lowStockCount);
    setElem('kpi-low-stock-sub', `${lowStockCount} items below threshold`);

    if (alertWidgetBadge) {
        if (lowStockCount > 0) {
            alertWidgetBadge.className = 'kpi-badge alert-badge animate-zoom';
            alertWidgetBadge.innerHTML = `<i class="ph ph-warning"></i> Reorder (${lowStockCount})`;
        } else {
            alertWidgetBadge.className = 'kpi-badge sales-badge';
            alertWidgetBadge.innerHTML = `<i class="ph ph-check"></i> Healthy`;
        }
    }

    // 6. Today's & Month's Sales
    const todaySales = (store.sales || []).filter(s => s.date === todayStr);
    const todayVal = todaySales.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    const todayQty = todaySales.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);

    setElem('kpi-today-sales', `₹${todayVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setElem('kpi-today-qty', `${todayQty.toLocaleString()} units sold today`);

    const monthSales = (store.sales || []).filter(s => s.date && s.date.substring(0, 7) === monthStr);
    const monthVal = monthSales.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    const monthQty = monthSales.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);

    setElem('kpi-month-sales', `₹${monthVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setElem('kpi-month-qty', `${monthQty.toLocaleString()} units this month`);
}

// Alert Warning Banners (Low Stock alert at the top of content workspace)
function renderAlertBanners(liveInventory) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';

    const lowStockList = liveInventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
    if (lowStockList.length === 0) return;

    const banner = document.createElement('div');
    banner.className = `alert-banner ${lowStockList.some(i => i.closingStock <= 0) ? 'alert-danger' : ''}`;
    
    const countText = lowStockList.length === 1 
        ? `<strong>Alert:</strong> 1 item is low on stock (${lowStockList[0].category} - ${lowStockList[0].size} has only ${lowStockList[0].closingStock} ${lowStockList[0].unit})`
        : `<strong>Warning:</strong> ${lowStockList.length} items have crossed their reorder threshold limit.`;

    banner.innerHTML = `
        <div class="alert-banner-text">
            <i class="ph ph-warning-diamond"></i>
            <span>${countText}</span>
        </div>
        <div class="btn-group-row">
            <button class="btn btn-outline btn-xs" onclick="switchTab('stock', {filterLowStock: true})">View List</button>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()"><i class="ph ph-x"></i></button>
        </div>
    `;
    container.appendChild(banner);
}

// ==================== SCREEN 2: SALES LOG ====================
let salesSortKey = 'date';
let salesSortAsc = false;

function sortSalesTable(key) {
    if (salesSortKey === key) {
        salesSortAsc = !salesSortAsc;
    } else {
        salesSortKey = key;
        salesSortAsc = false;
    }
    updateUI();
}

function onSalesFilterChange() {
    const dateRange = document.getElementById('filter-sales-date').value;
    const customRangeBox = document.getElementById('custom-sales-date-range');
    
    if (dateRange === 'custom') {
        customRangeBox.classList.remove('hidden');
    } else {
        customRangeBox.classList.add('hidden');
    }

    // Trigger local tables re-render
    const liveInventory = computeInventory();
    renderSalesView(liveInventory);
}

function renderSalesView(liveInventory) {
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = '';

    const dateRange = document.getElementById('filter-sales-date').value;
    const catFilter = document.getElementById('filter-sales-category').value;
    const searchVal = document.getElementById('filter-sales-search').value.toLowerCase().trim();
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Filter sales list
    let filteredSales = store.sales.filter(s => {
        // 1. Date Range checks
        if (dateRange === 'today') {
            if (s.date !== todayStr) return false;
        } else if (dateRange === 'week') {
            const saleDate = new Date(s.date);
            const diffTime = Math.abs(today - saleDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 7) return false;
        } else if (dateRange === 'month') {
            if (s.date.substring(0, 7) !== todayStr.substring(0, 7)) return false;
        } else if (dateRange === 'custom') {
            const start = document.getElementById('filter-sales-start').value;
            const end = document.getElementById('filter-sales-end').value;
            if (start && s.date < start) return false;
            if (end && s.date > end) return false;
        }

        // 2. Category checks
        const itemObj = store.items.find(i => i.key === s.itemKey);
        if (catFilter !== 'all') {
            if (!itemObj || itemObj.category !== catFilter) return false;
        }

        // 3. Search notes
        if (searchVal) {
            const notesMatch = s.notes && s.notes.toLowerCase().includes(searchVal);
            const nameMatch = itemObj && `${itemObj.category} ${itemObj.size} ${itemObj.gsm}`.toLowerCase().includes(searchVal);
            if (!notesMatch && !nameMatch) return false;
        }

        return true;
    });

    // Sort list
    filteredSales.sort((a, b) => {
        let valA = a[salesSortKey];
        let valB = b[salesSortKey];

        if (salesSortKey === 'date') {
            valA = new Date(a.date);
            valB = new Date(b.date);
        }

        if (valA < valB) return salesSortAsc ? -1 : 1;
        if (valA > valB) return salesSortAsc ? 1 : -1;
        return 0;
    });

    // Running totals variables
    let totalQty = 0;
    let totalCost = 0;
    let totalRev = 0;
    let totalProfit = 0;

    if (filteredSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="empty-state">No sales recorded matching filter options. Use form above to record.</td></tr>`;
    } else {
        filteredSales.forEach(s => {
            const item = store.items.find(i => i.key === s.itemKey) || { category: "Unknown", size: "", gsm: "" };
            
            totalQty += s.qty;
            totalCost += s.totalCost;
            totalRev += s.totalRevenue;
            totalProfit += s.profit;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.date}</strong></td>
                <td>${item.category}</td>
                <td><span class="badge-status badge-ordered">${item.size}</span></td>
                <td>${item.gsm}</td>
                <td><strong>${s.qty.toLocaleString()}</strong></td>
                <td>₹${s.costPrice.toFixed(2)}</td>
                <td>₹${s.sellingPrice.toFixed(2)}</td>
                <td>₹${s.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td><strong class="accent-blue">₹${s.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td><strong class="accent-green">₹${s.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td><span class="text-xs text-secondary">${s.notes || '-'}</span></td>
                <td class="actions-col">
                    <div class="btn-group-row">
                        <button class="btn btn-variant btn-xs" onclick="openSalesReceipt('${s.id}')"><i class="ph ph-printer"></i> Bill</button>
                        <button class="btn btn-danger btn-xs" onclick="deleteSale('${s.id}')"><i class="ph ph-trash"></i> Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Set totals row values
    document.getElementById('sales-total-qty').textContent = totalQty.toLocaleString();
    document.getElementById('sales-total-cost').textContent = `₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('sales-total-revenue').textContent = `₹${totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('sales-total-profit').textContent = `₹${totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// Sales Form Autocomplete suggestion & calculation bindings
function onSaleProductChange() {
    const itemKey = document.getElementById('sale-item').value;
    const item = store.items.find(i => i.key === itemKey);
    
    if (item) {
        document.getElementById('sale-cost-price').value = item.costPrice;
        document.getElementById('sale-selling-price').value = item.sellingPrice;
        document.getElementById('sale-cost-price-hint').textContent = `Default: ₹${item.costPrice.toFixed(2)} (Last Cost)`;
        document.getElementById('sale-selling-price-hint').textContent = `Default: ₹${item.sellingPrice.toFixed(2)} (Retail)`;
    }
    calcSaleFormTotals();
}

function calcSaleFormTotals() {
    const qty = parseInt(document.getElementById('sale-qty').value) || 0;
    const cost = parseFloat(document.getElementById('sale-cost-price').value) || 0;
    const sell = parseFloat(document.getElementById('sale-selling-price').value) || 0;

    const totalCost = qty * cost;
    const totalRevenue = qty * sell;
    const profit = totalRevenue - totalCost;

    document.getElementById('sale-preview-cost').textContent = `₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('sale-preview-revenue').textContent = `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('sale-preview-profit').textContent = `₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function resetSaleForm() {
    document.getElementById('sale-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sale-date').value = today;
    document.getElementById('sale-customer-type').value = 'Walk-in Customer';
    document.getElementById('save-customer-details').value = 'No';
    document.getElementById('sale-payment-method').value = 'Cash';
    document.getElementById('sale-payment-status').value = 'Paid';
    document.getElementById('sale-cost-price-hint').textContent = `Suggested from stock`;
    document.getElementById('sale-selling-price-hint').textContent = `Retail price`;
    toggleCustomerDetailFields();
    calcSaleFormTotals();
}

function deleteSale(id) {
    if (confirm("Are you sure you want to delete this sales record? This will revert inventory quantities!")) {
        store.sales = store.sales.filter(s => s.id !== id);
        saveData();
        updateUI();
        showToast("Sale deleted, stock levels restored.");
    }
}

// ==================== SCREEN 3: STOCK TRACKER ====================
function onStockFilterChange() {
    const liveInventory = computeInventory();
    renderStockView(liveInventory);
}

function renderStockView(liveInventory) {
    const inlineFormCard = document.getElementById('inline-product-form-card');
    const welcomeBanner = document.getElementById('stock-empty-welcome-banner');

    if (liveInventory.length === 0) {
        if (inlineFormCard) inlineFormCard.style.display = "block";
        if (welcomeBanner) welcomeBanner.style.display = "flex";
    } else {
        if (welcomeBanner) welcomeBanner.style.display = "none";
    }

    const tbody = document.querySelector('#stock-table tbody');
    tbody.innerHTML = '';

    const catFilter = document.getElementById('filter-stock-category').value;
    const sizeFilter = document.getElementById('filter-stock-size').value;
    const gsmFilter = document.getElementById('filter-stock-gsm').value;
    const lowFilter = document.getElementById('filter-stock-low').checked;

    let filtered = liveInventory.filter(i => {
        if (catFilter !== 'all' && i.category !== catFilter) return false;
        if (sizeFilter !== 'all' && i.size !== sizeFilter) return false;
        if (gsmFilter !== 'all' && i.gsm !== gsmFilter) return false;
        if (lowFilter && !(i.status === 'Low Stock' || i.status === 'Out of Stock')) return false;
        return true;
    });

    // Pinned low-stock items to top if lowFilter is false
    if (!lowFilter) {
        filtered.sort((a, b) => {
            const priority = { 'Out of Stock': 0, 'Low Stock': 1, 'OK': 2 };
            return priority[a.status] - priority[b.status];
        });
    }

    let grandValuation = 0;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" class="empty-state">No inventory stock records matched filter filters.</td></tr>`;
    } else {
        filtered.forEach(item => {
            grandValuation += item.stockValue;
            
            let badgeClass = 'badge-ok';
            if (item.status === 'Out of Stock') badgeClass = 'badge-empty';
            else if (item.status === 'Low Stock') badgeClass = 'badge-low';

            const tr = document.createElement('tr');
            if (item.status === 'Low Stock' || item.status === 'Out of Stock') {
                tr.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
            }

            tr.innerHTML = `
                <td><strong>${item.category}</strong></td>
                <td><span class="badge-status badge-ordered">${item.size}</span></td>
                <td>${item.gsm}</td>
                <td>${item.unit}</td>
                <td>${item.openingStock.toLocaleString()}</td>
                <td class="accent-purple"><strong>+${item.purchased.toLocaleString()}</strong></td>
                <td class="accent-orange"><strong>-${item.used.toLocaleString()}</strong></td>
                <td>${item.adjustments >= 0 ? '+' : ''}${item.adjustments.toLocaleString()}</td>
                <td><strong class="accent-blue">${item.closingStock.toLocaleString()}</strong></td>
                <td>₹${item.costPrice.toFixed(2)}</td>
                <td><strong>₹${item.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td>${item.reorderLevel.toLocaleString()}</td>
                <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
                <td>
                    <div class="btn-group-row">
                        <button class="btn btn-outline btn-xs" onclick="openEditStockModal('${item.key}')"><i class="ph ph-gear"></i> Parameters</button>
                        <button class="btn btn-variant btn-xs" onclick="openAdjustModal('${item.key}')"><i class="ph ph-git-pull-request"></i> Adjust</button>
                        <button class="btn btn-danger btn-xs" onclick="deleteCatalogItem('${item.key}')"><i class="ph ph-trash"></i> Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('stock-total-closing').textContent = filtered.reduce((sum, i) => sum + i.closingStock, 0).toLocaleString();
    document.getElementById('stock-grand-value').textContent = `₹${grandValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ==================== SCREEN 4: PURCHASE ORDERS ====================
function onPoFilterChange() {
    const liveInventory = computeInventory();
    renderPurchaseOrdersView(liveInventory);
}

function renderPurchaseOrdersView(liveInventory) {
    const tbody = document.querySelector('#po-table tbody');
    tbody.innerHTML = '';

    const monthFilter = document.getElementById('filter-po-month').value;
    const supplierFilter = document.getElementById('filter-po-supplier').value;
    const paymentFilter = document.getElementById('filter-po-payment').value;
    const statusFilter = document.getElementById('filter-po-status').value;

    let filteredPOs = store.purchase_orders.filter(po => {
        if (monthFilter !== 'all' && (!po.date || po.date.substring(0, 7) !== monthFilter)) return false;
        if (supplierFilter !== 'all' && po.supplier !== supplierFilter) return false;
        if (paymentFilter !== 'all' && po.paymentStatus !== paymentFilter) return false;
        
        if (statusFilter !== 'all') {
            if (statusFilter === 'Received') {
                if (po.status !== 'Received' && po.status !== 'Stocked') return false;
            } else {
                if (po.status !== 'Ordered') return false;
            }
        }
        return true;
    });

    // Sort chronologically descending
    filteredPOs.sort((a,b) => new Date(b.date) - new Date(a.date));

    let totalQty = 0;
    let totalAmt = 0;
    let pendingAmt = 0;

    if (filteredPOs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="empty-state">No Purchase Orders found. Log a PO using the form.</td></tr>`;
    } else {
        filteredPOs.forEach(po => {
            const item = store.items.find(i => i.key === po.itemKey) || { category: "Unknown", size: "", gsm: "" };
            const monthLabel = po.date ? po.date.substring(0, 7) : '-';

            totalQty += po.qty;
            totalAmt += po.totalAmount;

            if (po.paymentStatus === 'Pending') {
                pendingAmt += po.totalAmount;
            } else if (po.paymentStatus === 'Partial') {
                pendingAmt += (po.totalAmount * 0.5); // Estimate 50% outstanding for partial
            }

            let payBadge = 'badge-pending';
            if (po.paymentStatus === 'Paid') payBadge = 'badge-paid';
            else if (po.paymentStatus === 'Partial') payBadge = 'badge-partial';

            let statusBadge = 'badge-ordered';
            if (po.status === 'Received') statusBadge = 'badge-received';
            else if (po.status === 'Stocked') statusBadge = 'badge-stocked';

            // Action Quick arrival buttons
            let quickArrivalBtn = '';
            if (po.status === 'Ordered') {
                quickArrivalBtn = `<button class="btn btn-primary btn-xs" onclick="markPoReceived('${po.id}')"><i class="ph ph-box-arrow-down"></i> Receive</button>`;
            } else if (po.status === 'Received') {
                quickArrivalBtn = `<button class="btn btn-variant btn-xs" onclick="markPoStocked('${po.id}')"><i class="ph ph-warehouse"></i> Stock</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${po.date || '-'}</strong></td>
                <td>${monthLabel}</td>
                <td>${item.category}</td>
                <td><span class="badge-status badge-ordered">${item.size}</span></td>
                <td>${item.gsm}</td>
                <td><strong>${po.supplier}</strong></td>
                <td>${po.qty.toLocaleString()}</td>
                <td>₹${po.costPrice.toFixed(2)}</td>
                <td><strong class="accent-purple">₹${po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td><span class="text-xs">${po.plateDieIn || '-'}</span></td>
                <td><span class="badge-status ${payBadge}">${po.paymentStatus}</span></td>
                <td><span class="badge-status ${statusBadge}">${po.status}</span></td>
                <td>
                    <div class="btn-group-row">
                        ${quickArrivalBtn}
                        <button class="btn btn-outline btn-xs" onclick="openEditPoStatus('${po.id}')"><i class="ph ph-pencil"></i></button>
                        <button class="btn btn-danger btn-xs" onclick="deletePo('${po.id}')"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('po-total-qty').textContent = totalQty.toLocaleString();
    document.getElementById('po-total-amount').textContent = `₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('po-pending-payments').textContent = `Estimated Outstanding: ₹${pendingAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Build Supplier summaries accounts cards
    renderSupplierAccounts();
}

function renderSupplierAccounts() {
    const container = document.getElementById('supplier-accounts-summary');
    container.innerHTML = '';

    const supplierTotals = {};
    store.suppliers.forEach(s => {
        supplierTotals[s.name] = { name: s.name, purchased: 0, paid: 0, pending: 0 };
    });

    store.purchase_orders.forEach(po => {
        if (!supplierTotals[po.supplier]) {
            supplierTotals[po.supplier] = { name: po.supplier, purchased: 0, paid: 0, pending: 0 };
        }
        
        const tot = po.totalAmount;
        supplierTotals[po.supplier].purchased += tot;

        if (po.paymentStatus === 'Paid') {
            supplierTotals[po.supplier].paid += tot;
        } else if (po.paymentStatus === 'Pending') {
            supplierTotals[po.supplier].pending += tot;
        } else {
            // Partial
            supplierTotals[po.supplier].paid += (tot * 0.5);
            supplierTotals[po.supplier].pending += (tot * 0.5);
        }
    });

    const list = Object.values(supplierTotals);
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">No suppliers registered.</div>';
        return;
    }

    list.forEach(sup => {
        const card = document.createElement('div');
        card.className = 'supplier-summary-card glass shadow-card';
        card.innerHTML = `
            <div class="supplier-card-header">
                <span class="supplier-name">${sup.name}</span>
                <i class="ph ph-factory text-secondary"></i>
            </div>
            <div class="supplier-row-data">
                <span class="lbl">Total Order Purchases</span>
                <span class="val">₹${sup.purchased.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div class="supplier-row-data">
                <span class="lbl">Total Paid Out</span>
                <span class="val accent-green">₹${sup.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div class="supplier-row-data">
                <span class="lbl">Outstanding Balance</span>
                <span class="val ${sup.pending > 0 ? 'accent-orange' : ''}">₹${sup.pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function onPreOrderProductChange() {
    const select = document.getElementById('preorder-item');
    const priceInput = document.getElementById('preorder-price');
    if (!select || !priceInput) return;

    const item = store.items.find(i => i.key === select.value);
    if (item && (!priceInput.value || Number(priceInput.value) === 0)) {
        priceInput.value = Number(item.sellingPrice || 0).toFixed(2);
    }

    calcPreOrderFormTotal();
}

function calcPreOrderFormTotal() {
    const qty = parseInt(document.getElementById('preorder-qty').value) || 0;
    const price = parseFloat(document.getElementById('preorder-price').value) || 0;
    const total = qty * price;
    document.getElementById('preorder-preview-total').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function resetPreOrderForm() {
    const form = document.getElementById('preorder-form');
    if (form) form.reset();

    const today = new Date().toISOString().split('T')[0];
    const delivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById('preorder-date').value = today;
    document.getElementById('preorder-delivery').value = delivery;
    calcPreOrderFormTotal();
}

function renderPreOrdersTable() {
    const tbody = document.querySelector('#preorders-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const statusFilter = document.getElementById('filter-preorder-status')?.value || 'all';
    const searchText = (document.getElementById('filter-preorder-search')?.value || '').toLowerCase().trim();

    let filtered = [...(store.preorders || [])];
    filtered = filtered.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (!searchText) return true;

        const item = store.items.find(i => i.key === order.itemKey) || {};
        const haystack = [
            order.customerName,
            order.customerMobile,
            item.category,
            item.size,
            item.gsm,
            order.notes
        ].join(' ').toLowerCase();

        return haystack.includes(searchText);
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No pre-order bookings found for the selected status.</td></tr>';
        return;
    }

    filtered.forEach(order => {
        const item = store.items.find(i => i.key === order.itemKey) || { category: 'Unknown', size: '', gsm: '' };
        const row = document.createElement('tr');

        let statusClass = 'badge-ordered';
        if (order.status === 'Delivered') statusClass = 'badge-paid';
        if (order.status === 'Cancelled') statusClass = 'badge-danger';

        row.innerHTML = `
            <td><strong>${order.date || '-'}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.customerMobile}</td>
            <td>${item.category} ${item.size} ${item.gsm}</td>
            <td>${order.qty}</td>
            <td>₹${Number(order.unitPrice || 0).toFixed(2)}</td>
            <td><strong class="accent-purple">₹${Number(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            <td>${order.deliveryDate || '-'}</td>
            <td><span class="badge-status ${statusClass}">${order.status}</span></td>
            <td>
                <div class="btn-group-row">
                    <button class="btn btn-variant btn-xs" onclick="openReceiptForOrder('${order.id}')"><i class="ph ph-printer"></i> Bill</button>
                    <button class="btn btn-variant btn-xs" onclick="updatePreOrderStatus('${order.id}', 'Delivered')"><i class="ph ph-check"></i> Deliver</button>
                    <button class="btn btn-outline btn-xs" onclick="updatePreOrderStatus('${order.id}', 'Cancelled')"><i class="ph ph-x"></i> Cancel</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePreOrderStatus(id, status) {
    const order = (store.preorders || []).find(p => p.id === id);
    if (!order) return;
    const previousStatus = order.status;
    order.status = status;
    // If status changed to Delivered, create a sale entry to reflect stock deduction
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
        const item = store.items.find(i => i.key === order.itemKey);
        if (item) {
            const sale = {
                id: "sale_" + Date.now(),
                date: new Date().toISOString().split('T')[0],
                itemKey: order.itemKey,
                qty: order.qty,
                costPrice: item.costPrice,
                sellingPrice: Number(order.unitPrice || item.sellingPrice || 0),
                totalCost: order.qty * (item.costPrice || 0),
                totalRevenue: order.qty * Number(order.unitPrice || item.sellingPrice || 0),
                profit: order.qty * (Number(order.unitPrice || item.sellingPrice || 0) - (item.costPrice || 0)),
                notes: `Pre-order ${order.id} delivered for ${order.customerName}`,
                customerType: 'Pre-Order Customer',
                customerName: order.customerName || 'Walk-in Customer',
                customerMobile: order.customerMobile || 'N/A',
                gstNumber: '',
                address: '',
                email: '',
                paymentMethod: 'Cash',
                paymentStatus: 'Paid',
                printReceipt: false,
                savePdf: false
            };
            store.sales.unshift(sale);
        }
    }
    saveData();
    updateUI();
    showToast(`Pre-order marked as ${status}.`);
}


function renderQueriesTable() {
    const tbody = document.querySelector('#queries-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchText = (document.getElementById('filter-query-search')?.value || '').toLowerCase().trim();
    let filtered = [...(store.queries || [])];

    filtered = filtered.filter(query => {
        if (!searchText) return true;
        const item = store.items.find(i => i.key === query.itemKey) || {};
        const haystack = [
            query.customerName,
            query.customerMobile,
            item.category,
            item.size,
            item.gsm,
            query.notes
        ].join(' ').toLowerCase();
        return haystack.includes(searchText);
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No customer queries logged yet.</td></tr>';
        return;
    }

    filtered.forEach(query => {
        const item = store.items.find(i => i.key === query.itemKey) || { category: 'Unknown', size: '', gsm: '' };
        const liveStock = computeInventory().find(i => i.key === query.itemKey);
        const stockQty = liveStock ? liveStock.closingStock : 0;
        let stockStatus = 'Available';
        let statusClass = 'badge-paid';

        if (stockQty <= 0) {
            stockStatus = 'Out of Stock';
            statusClass = 'badge-empty';
        } else if (stockQty < query.qty) {
            stockStatus = `Only ${stockQty} available`;
            statusClass = 'badge-low';
        }

        const qStatus = query.status || 'New';
        let stageBadgeClass = 'badge-new';
        if (qStatus === 'Contacted') stageBadgeClass = 'badge-contacted';
        else if (qStatus === 'Quoted') stageBadgeClass = 'badge-quoted';
        else if (qStatus === 'Confirmed') stageBadgeClass = 'badge-confirmed';
        else if (qStatus === 'Completed' || qStatus === 'Resolved') stageBadgeClass = 'badge-completed';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${query.date || '-'}</strong></td>
            <td>${query.customerName}</td>
            <td>${query.customerMobile}</td>
            <td>${item.category} ${item.size} ${item.gsm}</td>
            <td>${query.qty}</td>
            <td><span class="badge-status ${statusClass}">${stockStatus}</span></td>
            <td>${query.notes || '-'}</td>
            <td>
                <select class="select-xs" onchange="updateQueryStatus('${query.id}', this.value)">
                    <option value="New" ${qStatus === 'New' ? 'selected' : ''}>New</option>
                    <option value="Contacted" ${qStatus === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="Quoted" ${qStatus === 'Quoted' ? 'selected' : ''}>Quoted</option>
                    <option value="Confirmed" ${qStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Completed" ${qStatus === 'Completed' || qStatus === 'Resolved' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
            <td>
                <div class="btn-group-row">
                    <button class="btn btn-variant btn-xs" onclick="openQueryQuote('${query.id}')"><i class="ph ph-printer"></i> Quote</button>
                    <button class="btn btn-danger btn-xs" onclick="deleteQuery('${query.id}')"><i class="ph ph-trash"></i> Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateQueryStatus(id, newStatus) {
    const q = (store.queries || []).find(item => item.id === id);
    if (q) {
        q.status = newStatus;
        saveData();
        updateUI();
        showToast(`Query status set to ${newStatus}.`);
    }
}

function markQueryResolved(id) {
    const query = (store.queries || []).find(q => q.id === id);
    if (!query) return;
    query.status = 'Resolved';
    saveData();
    updateUI();
    showToast('Customer query marked as resolved.');
}

function lookupCustomerByMobile() {
    const mobile = document.getElementById('sale-customer-mobile')?.value?.trim() || '';
    if (!mobile) return;

    const customer = (store.customers || []).find(c => c.mobile === mobile);
    if (!customer) return;

    document.getElementById('sale-customer-type').value = customer.customerType || 'Existing Customer';
    document.getElementById('sale-customer-name').value = customer.name || '';
    document.getElementById('sale-customer-gst').value = customer.gstNumber || '';
    document.getElementById('sale-customer-email').value = customer.email || '';
    document.getElementById('sale-customer-address').value = customer.address || '';
    document.getElementById('save-customer-details').value = 'Yes';
    toggleCustomerDetailFields();
}

function toggleCustomerDetailFields() {
    const saveChoice = document.getElementById('save-customer-details')?.value || 'No';
    const showCustomerFields = saveChoice === 'Yes' || document.getElementById('sale-customer-type')?.value !== 'Walk-in Customer';
    const detailBlock = document.getElementById('customer-detail-block');
    const addressBlock = document.getElementById('customer-address-block');

    if (detailBlock) detailBlock.style.display = showCustomerFields ? 'flex' : 'none';
    if (addressBlock) addressBlock.style.display = showCustomerFields ? 'flex' : 'none';
}

function renderStockOrdersView(liveInventory) {
    const tbody = document.querySelector('#stock-orders-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const recommendations = liveInventory.filter(item => item.status !== 'OK');
    if (recommendations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No stock ordering recommendations right now. Inventory is in a healthy range.</td></tr>';
        return;
    }

    recommendations.forEach(item => {
        const defaultSupplier = store.suppliers && store.suppliers.length > 0 ? store.suppliers[0].name : 'Supplier Needed';
        const recommendedQty = Math.max(1, Math.ceil((item.reorderLevel || 100) + Math.max(0, (item.reorderLevel || 100) - item.closingStock)));

        const orderRow = (store.stock_orders || []).find(po => po.itemKey === item.key && po.status !== 'Received');
        const existingOrder = orderRow || {
            id: 'so_' + Date.now() + Math.random(),
            itemKey: item.key,
            qty: recommendedQty,
            supplier: defaultSupplier,
            status: 'Pending',
            expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        const row = document.createElement('tr');
        let badgeClass = 'badge-low';
        if (item.status === 'Out of Stock') badgeClass = 'badge-empty';

        row.innerHTML = `
            <td><strong>${item.category}</strong></td>
            <td>${item.size}</td>
            <td>${item.gsm}</td>
            <td>${item.closingStock.toLocaleString()}</td>
            <td>${item.reorderLevel.toLocaleString()}</td>
            <td><strong>${existingOrder.qty.toLocaleString()}</strong></td>
            <td>${existingOrder.supplier || defaultSupplier}</td>
            <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
            <td>${existingOrder.expectedDeliveryDate || '-'}</td>
            <td>
                <div class="btn-group-row">
                    <button class="btn btn-primary btn-xs" onclick="createStockOrder('${item.key}')"><i class="ph ph-plus"></i> Order</button>
                    <button class="btn btn-variant btn-xs" onclick="updateStockOrderStatus('${existingOrder.id}', 'Ordered')"><i class="ph ph-truck"></i> Ordered</button>
                    <button class="btn btn-variant btn-xs" onclick="updateStockOrderStatus('${existingOrder.id}', 'Received')"><i class="ph ph-check"></i> Received</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function createStockOrder(itemKey) {
    const item = store.items.find(i => i.key === itemKey);
    if (!item) return;

    const recommendedQty = Math.max(1, Math.ceil((item.reorderLevel || 100) + Math.max(0, (item.reorderLevel || 100) - item.closingStock)));
    const userQty = Number(prompt(`Recommended quantity for ${item.category}:`, String(recommendedQty)) || recommendedQty);
    const supplier = store.suppliers && store.suppliers.length > 0 ? store.suppliers[0].name : 'Supplier Needed';
    const expectedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newOrder = {
        id: 'so_' + Date.now(),
        itemKey: item.key,
        productName: `${item.category} (${item.size} | ${item.gsm})`,
        qty: Math.max(1, userQty),
        supplier,
        expectedDeliveryDate,
        status: 'Ordered',
        orderedDate: new Date().toISOString().split('T')[0]
    };

    store.stock_orders.unshift(newOrder);
    saveData();
    updateUI();
    showToast('Stock order created and queued for supplier follow-up.');
}

function updateStockOrderStatus(id, status) {
    const order = (store.stock_orders || []).find(po => po.id === id);
    if (!order) return;
    order.status = status;
    if (status === 'Received') {
        const item = store.items.find(i => i.key === order.itemKey);
        if (item) {
            item.openingStock = (item.openingStock || 0) + Number(order.qty || 0);
        }
    }
    saveData();
    updateUI();
    showToast(`Stock order marked as ${status}.`);
}

function openSalesReceipt(saleId) {
    const sale = (store.sales || []).find(s => s.id === saleId);
    if (!sale) return;

    const item = store.items.find(i => i.key === sale.itemKey) || { category: 'Custom Item', size: '', gsm: '' };
    const description = `${item.category} ${item.size} ${item.gsm}`.trim();
    const tbody = document.getElementById('receipt-items-table').querySelector('tbody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" class="grid-input" value="${description}"></td>
            <td style="text-align: center;"><input type="number" class="grid-input" value="${Number(sale.qty) || 0}" min="1" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${Number(sale.sellingPrice || 0).toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${Number(sale.totalRevenue || 0).toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
        </tr>
    `;

    document.getElementById('receipt-brand-name').value = 'SAI GAYATRI INDUSTRIES';
    document.getElementById('receipt-brand-details').value = 'Plot No. 42, Industrial Area, Hyderabad | Ph: +91 98765 43210';
    document.getElementById('receipt-doc-type').value = 'SALES INVOICE';
    document.getElementById('receipt-number').value = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    document.getElementById('receipt-date').value = sale.date || new Date().toISOString().split('T')[0];
    document.getElementById('receipt-cust-name').value = sale.notes || 'Walk-in Customer';
    document.getElementById('receipt-cust-mobile').value = 'N/A';
    document.getElementById('receipt-terms').value = `Sale Date: ${sale.date}\nInvoice Ref: ${sale.id}\nNotes: ${sale.notes || 'No additional notes'}`;
    document.getElementById('receipt-freight-val').value = '0.00';
    openModal('modal-receipt');
    recalcReceiptGrandTotal();
}

function openReceiptForOrder(orderId) {
    const order = (store.preorders || []).find(p => p.id === orderId);
    if (!order) return;

    const item = store.items.find(i => i.key === order.itemKey) || { category: 'Custom Item', size: '', gsm: '' };
    const description = `${item.category} ${item.size} ${item.gsm}`.trim();
    const today = new Date().toISOString().split('T')[0];

    const tbody = document.getElementById('receipt-items-table').querySelector('tbody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" class="grid-input" value="${description}"></td>
            <td style="text-align: center;"><input type="number" class="grid-input" value="${order.qty}" min="1" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${Number(order.unitPrice || 0).toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${Number(order.totalAmount || 0).toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
        </tr>
    `;

    document.getElementById('receipt-brand-name').value = 'SAI GAYATRI INDUSTRIES';
    document.getElementById('receipt-brand-details').value = 'Plot No. 42, Industrial Area, Hyderabad | Ph: +91 98765 43210';
    document.getElementById('receipt-doc-type').value = 'ORDER BOOKING SLIP';
    document.getElementById('receipt-number').value = `SG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    document.getElementById('receipt-date').value = today;
    document.getElementById('receipt-cust-name').value = order.customerName;
    document.getElementById('receipt-cust-mobile').value = order.customerMobile;
    document.getElementById('receipt-terms').value = `Booking Date: ${order.date}\nExpected Delivery: ${order.deliveryDate || 'TBD'}\nNotes: ${order.notes || 'No additional notes'}`;
    document.getElementById('receipt-freight-val').value = '0.00';
    openModal('modal-receipt');
    recalcReceiptGrandTotal();
}

function openQueryQuote(queryId) {
    const query = (store.queries || []).find(q => q.id === queryId);
    if (!query) return;

    const item = store.items.find(i => i.key === query.itemKey) || { category: 'Custom Item', size: '', gsm: '' };
    const description = `${item.category} ${item.size} ${item.gsm}`.trim();
    const sellingPrice = Number(item.sellingPrice || 0);
    const total = sellingPrice * (Number(query.qty) || 1);

    const tbody = document.getElementById('receipt-items-table').querySelector('tbody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" class="grid-input" value="${description}"></td>
            <td style="text-align: center;"><input type="number" class="grid-input" value="${Number(query.qty) || 1}" min="1" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${sellingPrice.toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
            <td style="text-align: right;"><input type="number" class="grid-input" value="${total.toFixed(2)}" step="0.01" min="0" oninput="recalcReceiptGrandTotal()"></td>
        </tr>
    `;

    document.getElementById('receipt-brand-name').value = 'SAI GAYATRI INDUSTRIES';
    document.getElementById('receipt-brand-details').value = 'Quote / Stock Availability Confirmation';
    document.getElementById('receipt-doc-type').value = 'PRICE QUOTATION';
    document.getElementById('receipt-number').value = `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    document.getElementById('receipt-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('receipt-cust-name').value = query.customerName;
    document.getElementById('receipt-cust-mobile').value = query.customerMobile;
    document.getElementById('receipt-terms').value = `${query.notes || 'No additional notes'}\nLive stock status reviewed against current inventory.`;
    document.getElementById('receipt-freight-val').value = '0.00';
    openModal('modal-receipt');
    recalcReceiptGrandTotal();
}

function recalcReceiptGrandTotal() {
    const tbody = document.querySelector('#receipt-items-table tbody');
    if (!tbody) return;

    let subtotal = 0;
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
        const inputs = row.querySelectorAll('input.grid-input');
        const qty = parseFloat(inputs[1]?.value || 0);
        const price = parseFloat(inputs[2]?.value || 0);
        const total = parseFloat(inputs[3]?.value || (qty * price));
        if (!isNaN(qty) && !isNaN(price)) {
            subtotal += total;
        }
    });

    const freight = parseFloat(document.getElementById('receipt-freight-val')?.value || 0);
    const total = subtotal + freight;
    document.getElementById('receipt-subtotal-val').textContent = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('receipt-grandtotal-val').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function printReceiptDocument() {
    const rows = Array.from(document.querySelectorAll('#receipt-items-table tbody tr'));
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input.grid-input');
        if (inputs[3]) {
            const qty = parseFloat(inputs[1]?.value || 0);
            const price = parseFloat(inputs[2]?.value || 0);
            if (!isNaN(qty) && !isNaN(price)) {
                inputs[3].value = (qty * price).toFixed(2);
            }
        }
    });

    recalcReceiptGrandTotal();
    window.print();
}

function deleteQuery(id) {
    if (!confirm('Delete this customer query log entry?')) return;
    store.queries = (store.queries || []).filter(q => q.id !== id);
    saveData();
    updateUI();
    showToast('Customer query deleted.');
}

function calcPoFormTotal() {
    const qty = parseInt(document.getElementById('po-qty').value) || 0;
    const cost = parseFloat(document.getElementById('po-cost-price').value) || 0;
    const total = qty * cost;
    document.getElementById('po-preview-total').textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function resetPoForm() {
    document.getElementById('po-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('po-date').value = today;
    calcPoFormTotal();
}

function markPoReceived(id) {
    const po = store.purchase_orders.find(p => p.id === id);
    if (po) {
        po.status = 'Received';
        saveData();
        updateUI();
        showToast(`PO Marked Received. Stock added to inventory.`);
    }
}

function markPoStocked(id) {
    const po = store.purchase_orders.find(p => p.id === id);
    if (po) {
        po.status = 'Stocked';
        saveData();
        updateUI();
        showToast(`PO Marked Stocked.`);
    }
}

function deletePo(id) {
    if (confirm("Are you sure you want to delete this purchase order? If it was Received/Stocked, the quantities will be deducted from stock!")) {
        store.purchase_orders = store.purchase_orders.filter(p => p.id !== id);
        saveData();
        updateUI();
        showToast("Purchase order deleted, stock levels adjusted.");
    }
}

// Dialog helper triggers
function openEditPoStatus(id) {
    const po = store.purchase_orders.find(p => p.id === id);
    if (po) {
        const pay = prompt("Edit Payment Status (Paid, Pending, Partial):", po.paymentStatus);
        const status = prompt("Edit Order Status (Ordered, Received, Stocked):", po.status);
        
        if (pay !== null && ['Paid', 'Pending', 'Partial'].includes(pay)) {
            po.paymentStatus = pay;
        }
        if (status !== null && ['Ordered', 'Received', 'Stocked'].includes(status)) {
            po.status = status;
        }
        
        saveData();
        updateUI();
        showToast("PO parameters updated.");
    }
}

// ==================== FORMS AND SUBMIT HANDLERS ====================
function setupForms() {
    const saleCustomerType = document.getElementById('sale-customer-type');
    const saveCustomerDetailsSelect = document.getElementById('save-customer-details');
    if (saleCustomerType) saleCustomerType.addEventListener('change', toggleCustomerDetailFields);
    if (saveCustomerDetailsSelect) saveCustomerDetailsSelect.addEventListener('change', toggleCustomerDetailFields);

    const saleForm = document.getElementById('sale-form');
    if (saleForm) {
        saleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemKey = document.getElementById('sale-item').value;
            const date = document.getElementById('sale-date').value;
            const qty = parseInt(document.getElementById('sale-qty').value);
            const costPrice = parseFloat(document.getElementById('sale-cost-price').value);
            const sellingPrice = parseFloat(document.getElementById('sale-selling-price').value);
            const notes = document.getElementById('sale-notes').value;
            const customerType = document.getElementById('sale-customer-type').value;
            const customerMobile = document.getElementById('sale-customer-mobile').value.trim();
            const saveCustomerDetails = document.getElementById('save-customer-details').value === 'Yes';
            const customerName = document.getElementById('sale-customer-name').value.trim();
            const gstNumber = document.getElementById('sale-customer-gst').value.trim();
            const email = document.getElementById('sale-customer-email').value.trim();
            const address = document.getElementById('sale-customer-address').value.trim();
            const paymentMethod = document.getElementById('sale-payment-method').value;
            const paymentStatus = document.getElementById('sale-payment-status').value;
            const printReceipt = document.getElementById('sale-print-receipt').checked;
            const savePdf = document.getElementById('sale-save-pdf').checked;

            const liveInventory = computeInventory();
            const stockItem = liveInventory.find(i => i.key === itemKey);

            if (!stockItem) {
                if (!confirm("This product variant is not registered in Stock Tracker catalog. Create item card now?")) {
                    return;
                }
                const splitKey = itemKey.split('_');
                const cat = splitKey[0] || 'Custom Category';
                const size = splitKey[1] || 'Default';
                const gsm = splitKey[2] || 'Default';
                store.items.push({
                    key: itemKey, category: cat, size, gsm, unit: 'pcs',
                    openingStock: 0, costPrice, sellingPrice, reorderLevel: 500
                });
            } else if (qty > stockItem.closingStock) {
                if (!confirm(`Warning: Only ${stockItem.closingStock.toLocaleString()} ${stockItem.unit} available in stock. Record sale of ${qty.toLocaleString()} units anyway?`)) {
                    return;
                }
            }

            if (saveCustomerDetails && (!customerName || !customerMobile)) {
                alert('Customer name and mobile are required when saving customer details.');
                return;
            }

            if (saveCustomerDetails) {
                const existingCustomer = (store.customers || []).find(c => c.mobile === customerMobile);
                if (existingCustomer) {
                    existingCustomer.customerType = customerType;
                    existingCustomer.name = customerName;
                    existingCustomer.mobile = customerMobile;
                    existingCustomer.gstNumber = gstNumber;
                    existingCustomer.address = address;
                    existingCustomer.email = email;
                } else {
                    store.customers.push({
                        id: 'cust_' + Date.now(),
                        customerType,
                        name: customerName,
                        mobile: customerMobile,
                        gstNumber,
                        address,
                        email
                    });
                }
            }

            const totalCost = qty * costPrice;
            const totalRevenue = qty * sellingPrice;
            const profit = totalRevenue - totalCost;

            const orderNo = generateOrderNumber();
            const newSale = {
                id: "sale_" + Date.now(),
                orderNo,
                date,
                itemKey,
                qty,
                costPrice,
                sellingPrice,
                totalCost,
                totalRevenue,
                profit,
                notes,
                customerType,
                customerName: customerName || 'WALKIN USER',
                customerMobile: customerMobile || 'N/A',
                gstNumber,
                address,
                email,
                paymentMethod,
                paymentStatus,
                printReceipt,
                savePdf
            };

            store.sales.unshift(newSale);
            saveData();
            updateUI();
            resetSaleForm();
            showToast('Sale recorded and stock balance deducted!');
        });
    }

    const poForm = document.getElementById('po-form');
    if (poForm) {
        poForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemKey = document.getElementById('po-item').value;
            const date = document.getElementById('po-date').value;
            const qty = parseInt(document.getElementById('po-qty').value);
            const costPrice = parseFloat(document.getElementById('po-cost-price').value);
            const supplier = document.getElementById('po-supplier').value;
            const plateDieIn = document.getElementById('po-die').value;
            const paymentStatus = document.getElementById('po-payment').value;
            const status = document.getElementById('po-status').value;
            const notes = document.getElementById('po-notes').value;

            const totalAmount = qty * costPrice;
            const newPo = {
                id: 'po_' + Date.now(),
                date,
                itemKey,
                qty,
                costPrice,
                totalAmount,
                supplier,
                plateDieIn,
                paymentStatus,
                status,
                notes
            };

            store.purchase_orders.unshift(newPo);

            if (status === 'Received' || status === 'Stocked') {
                const targetItem = store.items.find(i => i.key === itemKey);
                if (targetItem) {
                    targetItem.costPrice = costPrice;
                }
            }

            saveData();
            updateUI();
            resetPoForm();
            showToast('Purchase order recorded successfully!');
        });
    }

    const profileEditForm = document.getElementById('profile-edit-form');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            store.business_profile = {
                name: document.getElementById('profile-name').value,
                tagline: document.getElementById('profile-tagline').value,
                address: document.getElementById('profile-address').value,
                contact: document.getElementById('profile-contact').value
            };
            saveData();
            updateUI();
            closeModal('modal-profile');
            showToast('Business profile updated!');
        });
    }

    const newItemForm = document.getElementById('new-item-form');
    if (newItemForm) {
        newItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cat = document.getElementById('new-item-category').value.trim();
            const size = document.getElementById('new-item-size').value.trim();
            const gsm = document.getElementById('new-item-gsm').value.trim();
            const unit = document.getElementById('new-item-unit').value;
            const opening = parseInt(document.getElementById('new-item-opening').value) || 0;
            const cost = parseFloat(document.getElementById('new-item-cost').value) || 0;
            const sell = parseFloat(document.getElementById('new-item-selling').value) || 0;
            const reorder = parseInt(document.getElementById('new-item-reorder').value) || 0;
            const notes = document.getElementById('new-item-notes').value;

            const compoundKey = `${cat}_${size}_${gsm}`;
            if (store.items.some(i => i.key === compoundKey)) {
                alert('A product variant with this Category + Size + GSM already exists in the registry!');
                return;
            }

            const newItem = {
                key: compoundKey,
                category: cat,
                size,
                gsm,
                unit,
                openingStock: opening,
                costPrice: cost,
                sellingPrice: sell,
                reorderLevel: reorder,
                notes
            };

            store.items.push(newItem);
            saveData();
            updateUI();
            closeModal('modal-new-item');
            newItemForm.reset();
            showToast('New product variant registered!');
        });
    }

    const newSupplierForm = document.getElementById('new-supplier-form');
    if (newSupplierForm) {
        newSupplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('new-supplier-name').value.trim();
            const contact = document.getElementById('new-supplier-contact').value.trim();

            if (store.suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
                alert('A supplier with this name is already registered!');
                return;
            }

            store.suppliers.push({ name, contact });
            saveData();
            updateUI();
            closeModal('modal-new-supplier');
            newSupplierForm.reset();
            showToast('New supplier registered!');
        });
    }

    const adjustForm = document.getElementById('adjust-form');
    if (adjustForm) {
        adjustForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemKey = document.getElementById('adjust-item-key').value;
            const type = document.getElementById('adjust-type').value;
            let qty = parseInt(document.getElementById('adjust-qty').value);
            const reason = document.getElementById('adjust-reason').value;

            if (type === 'Stock Out') {
                qty = -qty;
            }

            const newAdj = {
                id: 'adj_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                itemKey,
                qty,
                type,
                reason
            };

            store.adjustments.push(newAdj);
            saveData();
            updateUI();
            closeModal('modal-adjust');
            adjustForm.reset();
            showToast('Manual stock adjustment posted.');
        });
    }

    const editStockForm = document.getElementById('edit-stock-form');
    if (editStockForm) {
        editStockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldKey = document.getElementById('edit-stock-item-key').value;
            const newCat = document.getElementById('edit-stock-category').value.trim();
            const newSize = document.getElementById('edit-stock-size').value.trim();
            const newGsm = document.getElementById('edit-stock-gsm').value.trim();
            const newUnit = document.getElementById('edit-stock-unit').value;
            const opening = parseInt(document.getElementById('edit-stock-opening').value);
            const cost = parseFloat(document.getElementById('edit-stock-cost').value);
            const sell = parseFloat(document.getElementById('edit-stock-selling').value);
            const reorder = parseInt(document.getElementById('edit-stock-reorder').value);

            const newKey = `${newCat}_${newSize}_${newGsm}`;

            if (oldKey !== newKey && store.items.some(i => i.key === newKey)) {
                alert('A product variant with this Category + Size + GSM already exists! Please choose unique parameters.');
                return;
            }

            const target = store.items.find(i => i.key === oldKey);
            if (target) {
                if (oldKey !== newKey) {
                    store.sales.forEach(s => {
                        if (s.itemKey === oldKey) s.itemKey = newKey;
                    });
                    store.purchase_orders.forEach(po => {
                        if (po.itemKey === oldKey) po.itemKey = newKey;
                    });
                    store.adjustments.forEach(adj => {
                        if (adj.itemKey === oldKey) adj.itemKey = newKey;
                    });
                }

                target.key = newKey;
                target.category = newCat;
                target.size = newSize;
                target.gsm = newGsm;
                target.unit = newUnit;
                target.openingStock = opening;
                target.costPrice = cost;
                target.sellingPrice = sell;
                target.reorderLevel = reorder;
            }

            saveData();
            updateUI();
            closeModal('modal-edit-stock');
            showToast('Product settings applied successfully!');
        });
    }

    const stockNewItemForm = document.getElementById('stock-new-item-form');
    if (stockNewItemForm) {
        stockNewItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cat = document.getElementById('stock-new-item-category').value.trim();
            const size = document.getElementById('stock-new-item-size').value.trim();
            const gsm = document.getElementById('stock-new-item-gsm').value.trim();
            const unit = document.getElementById('stock-new-item-unit').value;
            const opening = parseInt(document.getElementById('stock-new-item-opening').value) || 0;
            const cost = parseFloat(document.getElementById('stock-new-item-cost').value) || 0;
            const sell = parseFloat(document.getElementById('stock-new-item-selling').value) || 0;
            const reorder = parseInt(document.getElementById('stock-new-item-reorder').value) || 0;
            const notes = document.getElementById('stock-new-item-notes').value.trim();

            const compoundKey = `${cat}_${size}_${gsm}`;
            if (store.items.some(i => i.key === compoundKey)) {
                alert('A product variant with this Category + Size + GSM already exists in the registry!');
                return;
            }

            const newItem = {
                key: compoundKey,
                category: cat,
                size,
                gsm,
                unit,
                openingStock: opening,
                costPrice: cost,
                sellingPrice: sell,
                reorderLevel: reorder,
                notes
            };

            store.items.push(newItem);
            saveData();
            updateUI();
            stockNewItemForm.reset();
            toggleInlineProductForm(false);
            showToast('New product variant added to inventory!');
        });
    }

    const preorderForm = document.getElementById('preorder-form');
    if (preorderForm) {
        preorderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const customerName = document.getElementById('preorder-cust-name').value.trim();
            const customerMobile = document.getElementById('preorder-cust-mobile').value.trim();
            const itemKey = document.getElementById('preorder-item').value;
            const date = document.getElementById('preorder-date').value;
            const qty = parseInt(document.getElementById('preorder-qty').value) || 0;
            const unitPrice = parseFloat(document.getElementById('preorder-price').value) || 0;
            const deliveryDate = document.getElementById('preorder-delivery').value;
            const notes = document.getElementById('preorder-notes').value.trim();

            if (!customerName || !customerMobile || !itemKey || !date || !deliveryDate || qty <= 0 || unitPrice <= 0) {
                alert('Please complete all required pre-order fields.');
                return;
            }

            const orderNo = generateOrderNumber();
            const newOrder = {
                id: 'pre_' + Date.now(),
                orderNo,
                date,
                customerName,
                customerMobile,
                itemKey,
                qty,
                unitPrice,
                totalAmount: qty * unitPrice,
                deliveryDate,
                notes,
                status: 'Pending',
                paymentStatus: 'Pending'
            };

            store.preorders.unshift(newOrder);
            saveData();
            updateUI();
            resetPreOrderForm();
            showToast('Pre-order recorded successfully.');
        });
    }

    const queryForm = document.getElementById('query-form');
    if (queryForm) {
        queryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const customerName = document.getElementById('query-cust-name').value.trim();
            const customerMobile = document.getElementById('query-cust-mobile').value.trim();
            const itemKey = document.getElementById('query-item').value;
            const date = document.getElementById('query-date').value;
            const qty = parseInt(document.getElementById('query-qty').value) || 0;
            const notes = document.getElementById('query-notes').value.trim();

            if (!customerName || !customerMobile || !itemKey || !date || qty <= 0) {
                alert('Please complete all required customer query fields.');
                return;
            }

            const newQuery = {
                id: 'q_' + Date.now(),
                date,
                customerName,
                customerMobile,
                itemKey,
                qty,
                notes,
                status: 'New'
            };

            store.queries.unshift(newQuery);
            saveData();
            updateUI();
            queryForm.reset();
            showToast('Customer query recorded successfully.');
        });
    }
}

// Modal Handlers
function openModal(id) {
    document.getElementById(id).style.display = "flex";
    
    // Set field states if specific modals
    if (id === 'modal-profile') {
        const p = store.business_profile || DEFAULT_PROFILE;
        document.getElementById('profile-name').value = p.name || '';
        document.getElementById('profile-tagline').value = p.tagline || '';
        document.getElementById('profile-address').value = p.address || '';
        document.getElementById('profile-contact').value = p.contact || '';
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function openAdjustModal(key) {
    const item = store.items.find(i => i.key === key);
    if (item) {
        document.getElementById('adjust-item-key').value = key;
        document.getElementById('adjust-item-label').textContent = `${item.category} – ${item.size} (${item.gsm})`;
        openModal('modal-adjust');
    }
}

function openEditStockModal(key) {
    const item = store.items.find(i => i.key === key);
    if (item) {
        document.getElementById('edit-stock-item-key').value = key;
        document.getElementById('edit-stock-category').value = item.category;
        document.getElementById('edit-stock-size').value = item.size;
        document.getElementById('edit-stock-gsm').value = item.gsm;
        document.getElementById('edit-stock-unit').value = item.unit;
        document.getElementById('edit-stock-opening').value = item.openingStock;
        document.getElementById('edit-stock-cost').value = item.costPrice;
        document.getElementById('edit-stock-selling').value = item.sellingPrice;
        document.getElementById('edit-stock-reorder').value = item.reorderLevel;
        openModal('modal-edit-stock');
    }
}

// Toast indicator helper
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== ANALYTICS & CHARTS ====================
function renderCharts() {
    // Detect active view (only render charts if dashboard is visible)
    const dashboardView = document.getElementById('view-dashboard');
    if (dashboardView.classList.contains('hidden')) return;

    // Fetch theme settings for chart stylings
    const isLight = document.body.classList.contains('light-theme');
    const textColour = isLight ? '#0f172a' : '#9ca3af';
    const gridColour = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)';

    // Cleanup previous Chart.js instances to prevent rendering overlay glitch
    if (trendChartInstance) trendChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();

    const canvasTrend = document.getElementById('trendChart');
    const canvasCategory = document.getElementById('categoryChart');
    if (!canvasTrend || !canvasCategory) return;

    // --- 1. TREND CHART (Revenue & Profit Last 7 / 30 Days) ---
    const daysRange = parseInt(document.getElementById('trend-timeframe').value) || 30;
    const labels = [];
    const revenueData = [];
    const profitData = [];

    // Compile date strings array chronologically
    for (let i = daysRange - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toISOString().split('T')[0]);
    }

    labels.forEach(dateStr => {
        const salesOnDate = store.sales.filter(s => s.date === dateStr);
        const dailyRev = salesOnDate.reduce((sum, s) => sum + s.totalRevenue, 0);
        const dailyProfit = salesOnDate.reduce((sum, s) => sum + s.profit, 0);

        revenueData.push(dailyRev);
        profitData.push(dailyProfit);
    });

    // Formatting date labels to show "Jul 20" instead of "2026-07-20"
    const formattedLabels = labels.map(l => {
        const parts = l.split('-');
        if (parts.length !== 3) return l;
        const d = new Date(l);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    trendChartInstance = new Chart(canvasTrend.getContext('2d'), {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#0d9488', // Teal
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3
                },
                {
                    label: 'Profit (₹)',
                    data: profitData,
                    borderColor: '#6366f1', // Indigo
                    backgroundColor: 'rgba(99, 102, 241, 0.06)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColour, font: { family: 'Outfit', weight: '600' } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColour },
                    ticks: { color: textColour, font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: gridColour },
                    ticks: { color: textColour, font: { family: 'Outfit' } }
                }
            }
        }
    });

    // --- 2. CATEGORY CHART (Stock value distribution) ---
    const liveInventory = computeInventory();
    const catMap = {};
    liveInventory.forEach(item => {
        if (!catMap[item.category]) catMap[item.category] = 0;
        catMap[item.category] += item.stockValue;
    });

    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);

    categoryChartInstance = new Chart(canvasCategory.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: catLabels,
            datasets: [{
                data: catValues,
                backgroundColor: [
                    '#0d9488', // Teal
                    '#6366f1', // Indigo
                    '#10b981', // Emerald
                    '#f59e0b', // Amber
                    '#ec4899', // Pink
                    '#06b6d4'  // Cyan
                ],
                borderWidth: isLight ? 1 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColour, font: { family: 'Outfit', weight: '600' } }
                }
            }
        }
    });
}

// ==================== EXPORT TO EXCEL (SheetJS Engine) ====================
// Exports structured flat data tables directly matching the required Power BI structure
function exportTableToExcel(type) {
    const workbook = XLSX.utils.book_new();
    let sheetData = [];
    let filename = '';

    const liveInventory = computeInventory();

    if (type === 'sales') {
        filename = `SaiGayatri_Sales_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetData = store.sales.map(s => {
            const item = store.items.find(i => i.key === s.itemKey) || {};
            return {
                "Date": s.date,
                "Item Category": item.category || "Unknown",
                "Item Size": item.size || "Unknown",
                "GSM / Weight": item.gsm || "Unknown",
                "Quantity Sold": s.qty,
                "Cost Price per Unit (₹)": s.costPrice,
                "Selling Price per Unit (₹)": s.sellingPrice,
                "Total Cost (₹)": s.totalCost,
                "Total Revenue (₹)": s.totalRevenue,
                "Profit (₹)": s.profit,
                "Notes": s.notes || ''
            };
        });
        
    } else if (type === 'stock') {
        filename = `SaiGayatri_Stock_Valuation_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetData = liveInventory.map(item => {
            return {
                "Item Category": item.category,
                "Item Size": item.size,
                "GSM / Weight": item.gsm,
                "Unit": item.unit,
                "Opening Stock": item.openingStock,
                "Purchased (This Period)": item.purchased,
                "Used / Consumed": item.used,
                "Manual Adjustments": item.adjustments,
                "Closing Stock": item.closingStock,
                "Cost per Unit (₹)": item.costPrice,
                "Stock Value (₹)": item.stockValue,
                "Reorder Level": item.reorderLevel,
                "Status": item.status,
                "Notes": item.notes || ''
            };
        });
        
    } else if (type === 'purchase') {
        filename = `SaiGayatri_Purchase_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
        sheetData = store.purchase_orders.map(po => {
            const item = store.items.find(i => i.key === po.itemKey) || {};
            return {
                "Month": po.date ? po.date.substring(0, 7) : '',
                "Date": po.date || '',
                "Item Category": item.category || "Unknown",
                "Item Size": item.size || "Unknown",
                "GSM / Weight": item.gsm || "Unknown",
                "Quantity Purchased": po.qty,
                "Cost per Unit (₹)": po.costPrice,
                "Total Amount (₹)": po.totalAmount,
                "Supplier Name": po.supplier,
                "Plate Die In": po.plateDieIn || '',
                "Payment Status": po.paymentStatus,
                "Order Status": po.status,
                "Notes": po.notes || ''
            };
        });
    }

    if (sheetData.length === 0) {
        alert("There is no data available in this ledger to export to Excel!");
        return;
    }

    // SheetJS operations
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type.toUpperCase()} Data`);
    
    // Trigger download
    XLSX.writeFile(workbook, filename);
    showToast(`Excel File successfully exported for Power BI import!`);
}

// Toggle inline product registration card
function toggleInlineProductForm(forceState) {
    const card = document.getElementById('inline-product-form-card');
    if (!card) return;
    if (forceState !== undefined) {
        card.style.display = forceState ? "block" : "none";
    } else {
        card.style.display = card.style.display === "none" ? "block" : "none";
    }
}

// Delete item from catalog registry (cascade delete transactions)
function deleteCatalogItem(key) {
    const salesCount = store.sales.filter(s => s.itemKey === key).length;
    const poCount = store.purchase_orders.filter(po => po.itemKey === key).length;
    
    if (salesCount > 0 || poCount > 0) {
        if (!confirm(`Warning: This product has ${salesCount} sales records and ${poCount} purchase orders. Deleting this product will delete all associated transactions. Proceed?`)) {
            return;
        }
        store.sales = store.sales.filter(s => s.itemKey !== key);
        store.purchase_orders = store.purchase_orders.filter(po => po.itemKey !== key);
    } else {
        if (!confirm("Are you sure you want to delete this product from the catalog?")) {
            return;
        }
    }
    
    store.items = store.items.filter(i => i.key !== key);
    store.adjustments = store.adjustments.filter(a => a.itemKey !== key);
    saveData();
    updateUI();
}

// Export SQL Database Backup Script
function exportSqlBackup() {
    let sql = `-- Sai Gayatri Industries - Database Backup SQL Script\n`;
    sql += `-- Generated on: \${new Date().toLocaleString()}\n`;
    sql += `-- Compatible with SQLite, MySQL, PostgreSQL\n\n`;

    // 1. Items Table Setup & Inserts
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table structure for table \`items\`\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS items (\n`;
    sql += `  item_key VARCHAR(255) PRIMARY KEY,\n`;
    sql += `  category VARCHAR(255),\n`;
    sql += `  item_size VARCHAR(100),\n`;
    sql += `  gsm VARCHAR(100),\n`;
    sql += `  unit VARCHAR(50),\n`;
    sql += `  opening_stock INT DEFAULT 0,\n`;
    sql += `  cost_price DECIMAL(10,2) DEFAULT 0.00,\n`;
    sql += `  selling_price DECIMAL(10,2) DEFAULT 0.00,\n`;
    sql += `  reorder_level INT DEFAULT 500,\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    if (store.items.length > 0) {
        sql += `INSERT INTO items (item_key, category, item_size, gsm, unit, opening_stock, cost_price, selling_price, reorder_level, notes) VALUES\n`;
        const values = store.items.map(item => {
            const escapedKey = item.key.replace(/'/g, "''");
            const escapedCat = item.category.replace(/'/g, "''");
            const escapedSize = item.size.replace(/'/g, "''");
            const escapedGsm = item.gsm.replace(/'/g, "''");
            const escapedUnit = item.unit.replace(/'/g, "''");
            const escapedNotes = (item.notes || '').replace(/'/g, "''");
            return `('\${escapedKey}', '\${escapedCat}', '\${escapedSize}', '\${escapedGsm}', '\${escapedUnit}', \${item.openingStock}, \${item.costPrice}, \${item.sellingPrice}, \${item.reorderLevel}, '\${escapedNotes}')`;
        });
        sql += values.join(',\n') + ';\n\n';
    }

    // 2. Sales Table Setup & Inserts
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table structure for table \`sales\`\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS sales (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  sale_date DATE,\n`;
    sql += `  item_key VARCHAR(255),\n`;
    sql += `  qty INT,\n`;
    sql += `  cost_price DECIMAL(10,2),\n`;
    sql += `  selling_price DECIMAL(10,2),\n`;
    sql += `  total_cost DECIMAL(12,2),\n`;
    sql += `  total_revenue DECIMAL(12,2),\n`;
    sql += `  profit DECIMAL(12,2),\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    if (store.sales.length > 0) {
        sql += `INSERT INTO sales (id, sale_date, item_key, qty, cost_price, selling_price, total_cost, total_revenue, profit, notes) VALUES\n`;
        const values = store.sales.map(s => {
            const escapedId = s.id.replace(/'/g, "''");
            const escapedKey = s.itemKey.replace(/'/g, "''");
            const escapedNotes = (s.notes || '').replace(/'/g, "''");
            return `('\${escapedId}', '\${s.date}', '\${escapedKey}', \${s.qty}, \${s.costPrice}, \${s.sellingPrice}, \${s.totalCost}, \${s.totalRevenue}, \${s.profit}, '\${escapedNotes}')`;
        });
        sql += values.join(',\n') + ';\n\n';
    }

    // 3. Purchase Orders Table Setup & Inserts
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table structure for table \`purchase_orders\`\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS purchase_orders (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  po_date DATE,\n`;
    sql += `  item_key VARCHAR(255),\n`;
    sql += `  qty INT,\n`;
    sql += `  cost_price DECIMAL(10,2),\n`;
    sql += `  total_amount DECIMAL(12,2),\n`;
    sql += `  supplier VARCHAR(255),\n`;
    sql += `  plate_die_in VARCHAR(255),\n`;
    sql += `  payment_status VARCHAR(50),\n`;
    sql += `  order_status VARCHAR(50),\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    if (store.purchase_orders.length > 0) {
        sql += `INSERT INTO purchase_orders (id, po_date, item_key, qty, cost_price, total_amount, supplier, plate_die_in, payment_status, order_status, notes) VALUES\n`;
        const values = store.purchase_orders.map(po => {
            const escapedId = po.id.replace(/'/g, "''");
            const escapedKey = po.itemKey.replace(/'/g, "''");
            const escapedSup = po.supplier.replace(/'/g, "''");
            const escapedDie = (po.plateDieIn || '').replace(/'/g, "''");
            const escapedPay = po.paymentStatus.replace(/'/g, "''");
            const escapedStatus = po.status.replace(/'/g, "''");
            const escapedNotes = (po.notes || '').replace(/'/g, "''");
            return `('\${escapedId}', '\${po.date}', '\${escapedKey}', \${po.qty}, \${po.costPrice}, \${po.totalAmount}, '\${escapedSup}', '\${escapedDie}', '\${escapedPay}', '\${escapedStatus}', '\${escapedNotes}')`;
        });
        sql += values.join(',\n') + ';\n\n';
    }

    // 4. Adjustments Table Setup & Inserts
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table structure for table \`adjustments\`\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS adjustments (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  adj_date DATE,\n`;
    sql += `  item_key VARCHAR(255),\n`;
    sql += `  qty INT,\n`;
    sql += `  adjustment_type VARCHAR(50),\n`;
    sql += `  reason TEXT\n`;
    sql += `);\n\n`;

    if (store.adjustments.length > 0) {
        sql += `INSERT INTO adjustments (id, adj_date, item_key, qty, adjustment_type, reason) VALUES\n`;
        const values = store.adjustments.map(adj => {
            const escapedId = adj.id.replace(/'/g, "''");
            const escapedKey = adj.itemKey.replace(/'/g, "''");
            const escapedType = adj.type.replace(/'/g, "''");
            const escapedReason = adj.reason.replace(/'/g, "''");
            return `('\${escapedId}', '\${adj.date}', '\${escapedKey}', \${adj.qty}, '\${escapedType}', '\${escapedReason}')`;
        });
        sql += values.join(',\n') + ';\n\n';
    }

    // 5. Suppliers Table Setup & Inserts
    sql += `-- -----------------------------------------------------\n`;
    sql += `-- Table structure for table \`suppliers\`\n`;
    sql += `-- -----------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS suppliers (\n`;
    sql += `  supplier_name VARCHAR(255) PRIMARY KEY,\n`;
    sql += `  contact VARCHAR(255)\n`;
    sql += `);\n\n`;

    if (store.suppliers.length > 0) {
        sql += `INSERT INTO suppliers (supplier_name, contact) VALUES\n`;
        const values = store.suppliers.map(sup => {
            const escapedName = sup.name.replace(/'/g, "''");
            const escapedContact = (sup.contact || '').replace(/'/g, "''");
            return `('\${escapedName}', '\${escapedContact}')`;
        });
        sql += values.join(',\n') + ';\n\n';
    }

    // Trigger File Download
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaiGayatri_Database_Backup_\${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SQL database backup script downloaded successfully!");
}

// Expose exports globally
window.exportTableToExcel = exportTableToExcel;
window.clearAllData = clearAllData;
window.exportSqlBackup = exportSqlBackup;
window.openModal = openModal;
window.closeModal = closeModal;
window.openAdjustModal = openAdjustModal;
window.openEditStockModal = openEditStockModal;
window.calcPoFormTotal = calcPoFormTotal;
window.calcSaleFormTotals = calcSaleFormTotals;
window.onSaleProductChange = onSaleProductChange;
window.onSalesFilterChange = onSalesFilterChange;
window.onStockFilterChange = onStockFilterChange;
window.onPoFilterChange = onPoFilterChange;
window.deleteSale = deleteSale;
window.deletePo = deletePo;
window.markPoReceived = markPoReceived;
window.markPoStocked = markPoStocked;
window.openEditPoStatus = openEditPoStatus;
window.sortSalesTable = sortSalesTable;
window.resetSaleForm = resetSaleForm;
window.resetPoForm = resetPoForm;
window.toggleInlineProductForm = toggleInlineProductForm;
window.deleteCatalogItem = deleteCatalogItem;
window.switchSubTab = switchSubTab;
window.onPreOrderProductChange = onPreOrderProductChange;
window.calcPreOrderFormTotal = calcPreOrderFormTotal;
window.resetPreOrderForm = resetPreOrderForm;
window.renderPreOrdersTable = renderPreOrdersTable;
window.updatePreOrderStatus = updatePreOrderStatus;
window.renderQueriesTable = renderQueriesTable;
window.markQueryResolved = markQueryResolved;
window.openSalesReceipt = openSalesReceipt;
window.openReceiptForOrder = openReceiptForOrder;
window.openQueryQuote = openQueryQuote;
window.recalcReceiptGrandTotal = recalcReceiptGrandTotal;
window.printReceiptDocument = printReceiptDocument;
window.deleteQuery = deleteQuery;

// ==================== QUICK BUTTON HANDLERS ====================
function quickNewSale() {
    switchTab('sales');
    const itemSelect = document.getElementById('sale-item');
    if (itemSelect) itemSelect.focus();
}

function quickNewOrder() {
    switchTab('preorders');
    switchSubTab('preorders');
    const custInput = document.getElementById('preorder-cust-name');
    if (custInput) custInput.focus();
}

function quickAddStock() {
    switchTab('orders');
    const poSelect = document.getElementById('po-item');
    if (poSelect) poSelect.focus();
}

function quickSearchUser() {
    switchTab('customers');
    const searchInput = document.getElementById('customer-search-input');
    if (searchInput) searchInput.focus();
}

// ==================== CUSTOMERS & USERS LEDGER MODULE ====================
function onCustomerSearchChange() {
    const query = (document.getElementById('customer-search-input')?.value || '').trim();
    renderCustomerLedger(query);
}

function renderCustomerLedger(query) {
    const summaryCard = document.getElementById('customer-summary-card');
    const tbody = document.querySelector('#customer-ledger-table tbody');
    if (!tbody) return;

    if (!query) {
        if (summaryCard) summaryCard.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Type a customer name, phone number, customer ID, or order number (e.g. "WALKIN USER" or "ES000005") to view account details.</td></tr>';
        return;
    }

    const q = query.toLowerCase();

    // 1. Gather all matching records from Sales & Preorders
    const salesMatches = (store.sales || []).filter(s => {
        const item = store.items.find(i => i.key === s.itemKey) || {};
        const haystack = [
            s.orderNo,
            s.customerName,
            s.customerMobile,
            s.customerType,
            s.notes,
            item.category,
            item.size,
            item.gsm
        ].join(' ').toLowerCase();
        return haystack.includes(q);
    });

    const preordersMatches = (store.preorders || []).filter(p => {
        const item = store.items.find(i => i.key === p.itemKey) || {};
        const haystack = [
            p.orderNo,
            p.customerName,
            p.customerMobile,
            p.notes,
            item.category,
            item.size,
            item.gsm
        ].join(' ').toLowerCase();
        return haystack.includes(q);
    });

    const totalOrdersCount = salesMatches.length + preordersMatches.length;

    let totalQty = 0;
    let totalPurchases = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;

    const rowsData = [];

    salesMatches.forEach(s => {
        const item = store.items.find(i => i.key === s.itemKey) || { category: 'Item', size: '', gsm: '' };
        const qty = Number(s.qty) || 0;
        const rev = Number(s.totalRevenue) || 0;
        const status = s.paymentStatus || 'Paid';

        totalQty += qty;
        totalPurchases += rev;

        if (status === 'Paid') {
            paidAmount += rev;
        } else if (status === 'Credit') {
            outstandingAmount += rev;
        } else if (status === 'Partial') {
            paidAmount += rev * 0.5;
            outstandingAmount += rev * 0.5;
        }

        rowsData.push({
            id: s.id,
            orderNo: s.orderNo || 'ES000000',
            date: s.date || '-',
            customerName: s.customerName || 'Customer',
            customerMobile: s.customerMobile || 'N/A',
            productDesc: `${item.category} ${item.size} (${item.gsm})`.trim(),
            qty,
            amount: rev,
            paymentStatus: status,
            type: 'sale'
        });
    });

    preordersMatches.forEach(p => {
        const item = store.items.find(i => i.key === p.itemKey) || { category: 'Pre-order Item', size: '', gsm: '' };
        const qty = Number(p.qty) || 0;
        const amt = Number(p.totalAmount) || 0;
        const status = p.paymentStatus || 'Pending';

        totalQty += qty;
        totalPurchases += amt;

        if (status === 'Paid') {
            paidAmount += amt;
        } else {
            outstandingAmount += amt;
        }

        rowsData.push({
            id: p.id,
            orderNo: p.orderNo || 'ES000000',
            date: p.date || '-',
            customerName: p.customerName || 'Customer',
            customerMobile: p.customerMobile || 'N/A',
            productDesc: `${item.category} ${item.size} (${item.gsm})`.trim(),
            qty,
            amount: amt,
            paymentStatus: status,
            type: 'preorder'
        });
    });

    // Update Customer Profile Summary Header
    if (summaryCard) {
        summaryCard.style.display = 'block';
        const displayCustName = rowsData.length > 0 ? rowsData[0].customerName : query;
        const displayMobile = rowsData.length > 0 ? rowsData[0].customerMobile : 'N/A';

        document.getElementById('cust-profile-name').textContent = displayCustName;
        document.getElementById('cust-profile-sub').textContent = `Mobile: ${displayMobile} | Search query: "${query}"`;
        document.getElementById('cust-stat-orders').textContent = totalOrdersCount;
        document.getElementById('cust-stat-qty').textContent = `${totalQty.toLocaleString()} units`;
        document.getElementById('cust-stat-purchases').textContent = `₹${totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('cust-stat-paid').textContent = `₹${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('cust-stat-outstanding').textContent = `₹${outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    tbody.innerHTML = '';
    if (rowsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No order transactions found matching query "${query}".</td></tr>`;
        return;
    }

    rowsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    rowsData.forEach(row => {
        let badgeClass = 'badge-paid';
        if (row.paymentStatus === 'Credit' || row.paymentStatus === 'Pending') badgeClass = 'badge-credit';
        else if (row.paymentStatus === 'Partial') badgeClass = 'badge-partial';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge-status badge-ordered" onclick="openOrderLookup('${row.orderNo}')" style="cursor:pointer;" title="Click for Order Lookup">${row.orderNo}</span></td>
            <td><strong>${row.date}</strong></td>
            <td>${row.productDesc}</td>
            <td>${row.qty.toLocaleString()}</td>
            <td><strong>₹${row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            <td><span class="badge-status ${badgeClass}">${row.paymentStatus}</span></td>
            <td>
                <div class="btn-group-row">
                    <button class="btn btn-primary btn-xs" onclick="openOrderLookup('${row.orderNo}')"><i class="ph ph-eye"></i> Lookup</button>
                    <button class="btn btn-variant btn-xs" onclick="${row.type === 'sale' ? `openSalesReceipt('${row.id}')` : `openReceiptForOrder('${row.id}')`}"><i class="ph ph-printer"></i> Receipt</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function exportCustomerLedgerToExcel() {
    exportTableToExcel('customer-ledger-table');
}

// ==================== ORDER NUMBER LOOKUP & MODAL ====================
let currentLookupRecord = null;

function searchOrderFromHeader() {
    const input = document.getElementById('header-order-search-input');
    const q = (input?.value || '').trim();
    if (!q) return;

    if (q.toUpperCase().startsWith('ES')) {
        openOrderLookup(q.toUpperCase());
    } else {
        switchTab('customers');
        const custSearchInput = document.getElementById('customer-search-input');
        if (custSearchInput) {
            custSearchInput.value = q;
            onCustomerSearchChange();
        }
    }
}

function openOrderLookup(orderNo) {
    const targetNo = (orderNo || '').toUpperCase().trim();
    
    let sale = (store.sales || []).find(s => s.orderNo && s.orderNo.toUpperCase() === targetNo);
    let isSale = true;

    if (!sale) {
        sale = (store.preorders || []).find(p => p.orderNo && p.orderNo.toUpperCase() === targetNo);
        isSale = false;
    }

    if (!sale) {
        sale = (store.sales || []).find(s => s.id === orderNo);
        if (!sale) sale = (store.preorders || []).find(p => p.id === orderNo);
    }

    if (!sale) {
        alert(`Order number "${orderNo}" not found in sales or pre-orders log.`);
        return;
    }

    currentLookupRecord = { ...sale, isSale };

    const item = store.items.find(i => i.key === sale.itemKey) || { category: 'Paper Plate', size: '14 in', gsm: 'Standard' };

    document.getElementById('ol-order-no').textContent = sale.orderNo || 'ES000001';
    document.getElementById('ol-customer-name').textContent = sale.customerName || sale.notes || 'WALKIN USER';
    document.getElementById('ol-customer-mobile').textContent = sale.customerMobile || 'N/A';
    document.getElementById('ol-date').textContent = sale.date || new Date().toISOString().split('T')[0];
    document.getElementById('ol-product').textContent = item.category || 'Paper Plate';
    document.getElementById('ol-size').textContent = item.size || '14 in';
    document.getElementById('ol-qty').textContent = (sale.qty || 0).toLocaleString();
    
    const price = isSale ? sale.sellingPrice : sale.unitPrice;
    const total = isSale ? sale.totalRevenue : sale.totalAmount;
    
    document.getElementById('ol-price').textContent = `₹${Number(price || 0).toFixed(2)}`;
    document.getElementById('ol-total').textContent = `₹${Number(total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const payStatus = sale.paymentStatus || (isSale ? 'Paid' : 'Pending');
    const payBadge = document.getElementById('ol-payment-badge');
    payBadge.textContent = payStatus;
    
    if (payStatus === 'Paid') payBadge.className = 'badge-status badge-paid';
    else if (payStatus === 'Credit' || payStatus === 'Pending') payBadge.className = 'badge-status badge-credit';
    else payBadge.className = 'badge-status badge-partial';

    document.getElementById('ol-notes-text').textContent = sale.notes || 'No additional notes provided.';

    openModal('modal-order-lookup');
}

function printReceiptFromLookup() {
    if (!currentLookupRecord) return;
    closeModal('modal-order-lookup');
    if (currentLookupRecord.isSale) {
        openSalesReceipt(currentLookupRecord.id);
    } else {
        openReceiptForOrder(currentLookupRecord.id);
    }
}

function downloadPdfFromLookup() {
    printReceiptFromLookup();
}

function editOrderFromLookup() {
    if (!currentLookupRecord) return;
    const newStatus = prompt("Edit Payment Status (Paid, Credit, Partial, Pending):", currentLookupRecord.paymentStatus || 'Paid');
    if (newStatus && ['Paid', 'Credit', 'Partial', 'Pending'].includes(newStatus)) {
        if (currentLookupRecord.isSale) {
            const s = store.sales.find(item => item.id === currentLookupRecord.id);
            if (s) s.paymentStatus = newStatus;
        } else {
            const p = store.preorders.find(item => item.id === currentLookupRecord.id);
            if (p) p.paymentStatus = newStatus;
        }
        saveData();
        updateUI();
        openOrderLookup(currentLookupRecord.orderNo);
        showToast(`Order ${currentLookupRecord.orderNo} updated.`);
    }
}

function cancelOrderFromLookup() {
    if (!currentLookupRecord) return;
    if (confirm(`Are you sure you want to return/cancel Order ${currentLookupRecord.orderNo}?`)) {
        if (currentLookupRecord.isSale) {
            store.sales = store.sales.filter(s => s.id !== currentLookupRecord.id);
        } else {
            store.preorders = store.preorders.filter(p => p.id !== currentLookupRecord.id);
        }
        saveData();
        updateUI();
        closeModal('modal-order-lookup');
        showToast(`Order ${currentLookupRecord.orderNo} cancelled.`);
    }
}

window.quickNewSale = quickNewSale;
window.quickNewOrder = quickNewOrder;
window.quickAddStock = quickAddStock;
window.quickSearchUser = quickSearchUser;
window.onCustomerSearchChange = onCustomerSearchChange;
window.renderCustomerLedger = renderCustomerLedger;
window.exportCustomerLedgerToExcel = exportCustomerLedgerToExcel;
window.searchOrderFromHeader = searchOrderFromHeader;
window.openOrderLookup = openOrderLookup;
window.printReceiptFromLookup = printReceiptFromLookup;
window.downloadPdfFromLookup = downloadPdfFromLookup;
window.editOrderFromLookup = editOrderFromLookup;
window.cancelOrderFromLookup = cancelOrderFromLookup;
window.updateQueryStatus = updateQueryStatus;
