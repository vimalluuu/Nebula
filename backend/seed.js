require('dotenv').config();
const Blockchain = require('./blockchain/Blockchain');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Starting blockchain seed...\n');

// Initialize blockchain
const blockchain = new Blockchain();
console.log('✅ Blockchain initialized with genesis block\n');

// Sample tenders
const tenders = [
    {
        id: uuidv4(),
        title: 'Road Construction Project - NH 44',
        description: 'Construction of 50km highway stretch with modern infrastructure',
        budget: 25000000,
        deadline: '2026-03-15',
        requirements: 'ISO certified, 10+ years experience',
        status: 'OPEN',
        createdBy: 'gov@demo.com',
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: 'School Building Renovation',
        description: 'Complete renovation of 5 government schools',
        budget: 8000000,
        deadline: '2026-02-28',
        requirements: 'Civil engineering certification required',
        status: 'OPEN',
        createdBy: 'gov@demo.com',
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: 'Water Supply Pipeline Installation',
        description: 'Installation of water supply network for rural areas',
        budget: 15000000,
        deadline: '2026-04-10',
        requirements: 'Plumbing and civil works expertise',
        status: 'OPEN',
        createdBy: 'gov@demo.com',
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: 'Hospital Equipment Procurement',
        description: 'Purchase of medical equipment for district hospital',
        budget: 12000000,
        deadline: '2026-03-01',
        requirements: 'Medical equipment supplier certification',
        status: 'OPEN',
        createdBy: 'gov@demo.com',
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        title: 'Solar Panel Installation',
        description: 'Solar power installation for government buildings',
        budget: 18000000,
        deadline: '2026-05-20',
        requirements: 'Renewable energy certification',
        status: 'OPEN',
        createdBy: 'gov@demo.com',
        createdAt: new Date().toISOString()
    }
];

// Add tenders to blockchain
console.log('📝 Adding tenders to blockchain...');
tenders.forEach((tender, index) => {
    const block = blockchain.addBlock('TENDER', tender, 'AgenciesMSP');
    console.log(`  ✅ Tender ${index + 1}: "${tender.title}" - Block #${block.index}`);
});

console.log('\n✨ Blockchain seeded successfully!');
console.log(`📊 Total blocks: ${blockchain.getChain().length}`);
console.log(`📜 Total tenders: ${blockchain.getBlocksByType('TENDER').length}`);
console.log('\n🎯 You can now start the server and see the tenders on the public page!\n');

// Export the seeded blockchain for server to use
module.exports = blockchain;
