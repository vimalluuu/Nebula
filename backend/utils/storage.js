const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../storage');
const VENDORS_FILE = path.join(STORAGE_DIR, 'vendors.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Initialize vendors file if it doesn't exist
if (!fs.existsSync(VENDORS_FILE)) {
    fs.writeFileSync(VENDORS_FILE, JSON.stringify([], null, 2));
}

const readVendors = () => {
    try {
        const data = fs.readFileSync(VENDORS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading vendors:', error);
        return [];
    }
};

const writeVendors = (vendors) => {
    try {
        fs.writeFileSync(VENDORS_FILE, JSON.stringify(vendors, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing vendors:', error);
        return false;
    }
};

const addVendor = (vendor) => {
    const vendors = readVendors();
    vendors.push(vendor);
    return writeVendors(vendors);
};

const findVendorByEmail = (email) => {
    const vendors = readVendors();
    return vendors.find(v => v.email === email);
};

const updateVendor = (email, updates) => {
    const vendors = readVendors();
    const index = vendors.findIndex(v => v.email === email);
    if (index !== -1) {
        vendors[index] = { ...vendors[index], ...updates };
        return writeVendors(vendors);
    }
    return false;
};

module.exports = {
    readVendors,
    writeVendors,
    addVendor,
    findVendorByEmail,
    updateVendor
};
