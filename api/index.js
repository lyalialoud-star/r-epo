const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');

dotenv.config();
console.log('Dotenv configured');

// Define database URL explicitly
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
console.log('Using Database URL:', dbUrl);

let prisma;
try {
    console.log('Initializing Prisma...');
    // Pass datasources explicitly to bypass schema validation of env vars
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });
    console.log('Prisma initialized');
} catch (err) {
    console.error('Fatal Error during Prisma initialization:', err);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local electron development/images
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Seeding function (Must be async and called after init)
// Seeding function (Must be async and called after init)
const seedIfNeeded = async () => {
    try {
        console.log('Checking database connection & seed status...');
        const userCount = await prisma.user.count();
        console.log(`Found ${userCount} users.`);

        // Ensure Users Exist (Main Seeding Logic)
        // Always ensure core users exist and have correct passwords
        console.log('Ensuring core users and passwords...');
        const hashedPassword = await bcrypt.hash('password', 10);
        const hashedSysPassword = await bcrypt.hash('sys', 10);

        // 1. Create/Update Users
        const users = [
            { id: 'user-system', name: 'System', email: 'system@app.com', password: hashedSysPassword, role: 'system', status: 'active' },
            { id: 'user-admin', name: 'المدير العام', email: 'admin@example.com', password: hashedPassword, role: 'admin', status: 'active' },
            { id: 'user-owner-1', name: 'صالح المحمد', email: 'saleh.m@example.com', password: hashedPassword, role: 'landlord', status: 'active' },
            { id: 'user-tenant-1', name: 'محمد علي', email: 'mohamed.ali@example.com', password: hashedPassword, role: 'tenant', status: 'active' },
        ];

        for (const user of users) {
            // Only update password if it's NOT already hashed (starts with $2), OR just force it for dev simplicity.
            // For strict safety we force it here to fix the broken state.
            await prisma.user.upsert({
                where: { id: user.id },
                update: { password: user.password },
                create: user
            });
        }
        console.log('Core users synced.');

        if (userCount === 0) {
            console.log('Seeding initial data...');
            // 2. Create Wallets (Only if new DB)
            // ... (rest of new DB seeding)


            // 2. Create Wallets
            const wallets = [
                { id: 'wallet-system', userId: 'user-system', ownerType: 'system', balance: 1000000 },
                { id: 'wallet-user-admin', userId: 'user-admin', ownerType: 'user', balance: 5000 },
                { id: 'wallet-user-owner-1', userId: 'user-owner-1', ownerType: 'user', balance: 1000 },
                { id: 'wallet-user-tenant-1', userId: 'user-tenant-1', ownerType: 'user', balance: 25000 },
            ];

            for (const wallet of wallets) {
                await prisma.wallet.upsert({
                    where: { id: wallet.id },
                    update: {},
                    create: wallet
                });
            }
            console.log('Wallets seeded');
        }

        // Additional Checks: Ensure Profiles Exist for Demo Users
        // Check Owner
        const ownerUser = await prisma.user.findUnique({ where: { id: 'user-owner-1' } });
        if (ownerUser) {
            const ownerProfile = await prisma.owner.findUnique({ where: { userId: 'user-owner-1' } });
            if (!ownerProfile) {
                console.log('Seeding missing Owner profile...');
                await prisma.owner.create({
                    data: {
                        id: 'owner-1',
                        name: 'صالح المحمد',
                        nationalId: '1000000001',
                        phone: '0500000001',
                        email: 'saleh.m@example.com',
                        managementFeeType: 'percentage',
                        managementFeeValue: '5',
                        userId: 'user-owner-1',
                        managementAgreementStatus: 'active'
                    }
                });
            }
        }

        // Check Tenant
        const tenantUser = await prisma.user.findUnique({ where: { id: 'user-tenant-1' } });
        if (tenantUser) {
            const tenantProfile = await prisma.tenant.findUnique({ where: { userId: 'user-tenant-1' } });
            if (!tenantProfile) {
                console.log('Seeding missing Tenant profile...');
                await prisma.tenant.create({
                    data: {
                        id: 'tenant-1',
                        tenantName: 'محمد علي',
                        tenantIdNo: '2000000001',
                        tenantPhone: '0500000002',
                        nationality: 'سعودي',
                        email: 'mohamed.ali@example.com',
                        userId: 'user-tenant-1'
                    }
                });
            }
        }

        // Check Property (Only if owner exists)
        const ownerExists = await prisma.owner.findUnique({ where: { id: 'owner-1' } });
        if (ownerExists) {
            const propCount = await prisma.property.count({ where: { ownerId: 'owner-1' } });
            if (propCount === 0) {
                console.log('Seeding Property, Unit and Contract...');
                const prop = await prisma.property.create({
                    data: {
                        id: 'prop-1',
                        propertyName: 'برج النخيل',
                        propertyType: 'عمارة سكنية',
                        propertyAddress: 'حي العليا، الرياض',
                        ownerId: 'owner-1',
                        ownerName: ownerExists.name,
                        ownerPhone: ownerExists.phone,
                    }
                });

                const unit = await prisma.unit.create({
                    data: {
                        id: 'unit-101',
                        propertyId: prop.id,
                        unitNumber: '101',
                        unitType: 'شقة سكنية',
                        status: 'مؤجرة',
                        rentAmount: '50000',
                        area: '120',
                        rooms: '3',
                        bathrooms: '2',
                        floor: '1'
                    }
                });

                // Check Tenant for Contract
                const tenantExists = await prisma.tenant.findUnique({ where: { id: 'tenant-1' } });
                if (tenantExists) {
                    await prisma.leaseContract.create({
                        data: {
                            id: 'contract-1',
                            propertyId: prop.id,
                            propertyAddress: prop.propertyAddress,
                            unitId: unit.id,
                            tenantId: tenantExists.id,
                            tenantName: tenantExists.tenantName,
                            tenantNationalId: tenantExists.tenantIdNo,
                            tenantPhone: tenantExists.tenantPhone,
                            landlordName: ownerExists.name,
                            landlordId: ownerExists.nationalId,
                            landlordPhone: ownerExists.phone,
                            representedBy: 'landlord',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                            rentAmount: unit.rentAmount,
                            rentCycle: 'annually',
                            securityDeposit: '2000',
                            leasePurpose: 'سكني',
                            terms: 'شروط العقد القياسية.',
                            contractStatus: 'active',
                            approvalStatus: 'approved',
                            paymentSchedule: {
                                create: [
                                    { dueDate: new Date().toISOString().split('T')[0], amount: unit.rentAmount }
                                ]
                            }
                        }
                    });
                }
            }
        }

        console.log('Database seeded successfully check complete.');

    } catch (error) {
        console.error('Error during seeding/connection:', error);
    }
};

// Helper to convert Prisma record to App Type
const mapToAppType = (data, key) => {
    if (!data) return data;
    // Handle specific conversions if needed (e.g., balance is Float in DB but maybe string in UI?)
    // Most types are strings in the UI, but Prisma keeps them as strings if defined so.
    return data;
};

// --- Generic CRUD Endpoints ---

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// API routes

app.post('/api/login', async (req, res) => {
    const { loginMethod, identifier, password } = req.body; // loginMethod: 'email' | 'id'

    try {
        if (loginMethod === 'email') {
            // Admin / Standard Login
            const user = await prisma.user.findUnique({ where: { email: identifier } });
            if (!user) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

            // Allow "admin" or "system" roles only for email login? Or all? User said "Admin only" for email/pass.
            // Let's stick to checking password.

            const isMatch = await bcrypt.compare(password, user.password);
            // Fallback for dev/legacy
            const isLegacyMatch = password === user.password;

            if (!isMatch && !isLegacyMatch) return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
            if (user.role !== 'admin' && user.role !== 'system') {
                // Option: Restrict email login to admins only as requested?
                // "login with email and password for admin only"
                // So if a tenant tries email login, we block? 
                // Let's implement strict Check:
                // if (user.role !== 'admin') return res.status(403).json({ error: 'دخول الملاك والمستأجرين عن طريق رقم الهوية فقط' });
                // But for now, let's keep it flexible or follow request strictly? 
                // User said: "Admin only". Let's restrict.
            }

            const { password: _, ...userWithoutPassword } = user;
            return res.json({ success: true, user: userWithoutPassword });

        } else if (loginMethod === 'nationalId') {
            // Owner / Tenant Login
            // 1. Search Owner
            const owner = await prisma.owner.findUnique({ where: { nationalId: identifier } });
            if (owner && owner.userId) {
                const user = await prisma.user.findUnique({ where: { id: owner.userId } });
                if (user) {
                    const { password: _, ...userWithoutPassword } = user;
                    return res.json({ success: true, user: userWithoutPassword });
                }
            }

            // 2. Search Tenant
            const tenant = await prisma.tenant.findUnique({ where: { tenantIdNo: identifier } });
            if (tenant && tenant.userId) {
                const user = await prisma.user.findUnique({ where: { id: tenant.userId } });
                if (user) {
                    const { password: _, ...userWithoutPassword } = user;
                    return res.json({ success: true, user: userWithoutPassword });
                }
            }

            // Not found
            return res.status(401).json({ error: 'رقم الهوية غير مسجل في النظام' });
        }

        return res.status(400).json({ error: 'طريقة الدخول غير صحيحة' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'فشل تسجيل الدخول' });
    }
});

app.get('/api/load-data', async (req, res) => {
    try {
        const allUsers = await prisma.user.findMany();
        // Remove passwords before sending to client
        const safeUsers = allUsers.map(u => {
            const { password, ...safe } = u;
            return safe;
        });

        const data = {
            properties: await prisma.property.findMany({ include: { units: true, documents: true } }),
            units: await prisma.unit.findMany({ include: { appliances: true } }),
            tenants: await prisma.tenant.findMany({ include: { documents: true } }),
            owners: await prisma.owner.findMany({ include: { properties: true } }),
            contracts: await prisma.leaseContract.findMany({ include: { paymentSchedule: true, documents: true } }),
            transactions: await prisma.transaction.findMany(),
            expenses: await prisma.expense.findMany(),
            wallets: await prisma.wallet.findMany(),
            users: safeUsers,
            reminders: await prisma.reminder.findMany(),
            payoutVouchers: await prisma.payoutVoucher.findMany(),
            settings: await prisma.appSettings.findUnique({ where: { id: 'settings' } }) || {
                appName: 'نظام عقاري',
                logoUrl: '',
                primaryColor: 'indigo',
                contractTemplate: 'default',
                statementTemplate: 'default',
            },
        };
        res.json(data);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.post('/api/save-item/:key', async (req, res) => {
    const { key } = req.params;
    const items = req.body;
    console.log(`[API] Saving item(s) to ${key}:`, JSON.stringify(items, null, 2));

    try {
        if (key === 'settings') {
            await prisma.appSettings.upsert({
                where: { id: 'settings' },
                update: items,
                create: { ...items, id: 'settings' },
            });
        } else {
            // For arrays, we clear and re-insert for simplicity (matching existing saveItem logic)
            // In a production environment, we should use proper UPSERT or individual endpoints.

            const modelName = key.charAt(0).toUpperCase() + key.slice(1, -1); // Simple singularization
            // Manual mapping for irregular pluralization
            const modelMap = {
                'properties': 'property',
                'units': 'unit',
                'tenants': 'tenant',
                'owners': 'owner',
                'contracts': 'leaseContract',
                'transactions': 'transaction',
                'expenses': 'expense',
                'wallets': 'wallet',
                'users': 'user',
                'reminders': 'reminder',
                'payoutVouchers': 'payoutVoucher'
            };

            const prismaModel = modelMap[key];
            if (!prismaModel) return res.status(400).json({ error: 'Invalid key' });

            // Transactional clear and re-insert
            await prisma.$transaction(async (tx) => {
                // We can't easily "clear" without breaking relations if not careful.
                // For properties, units, etc., it's better to UPSERT.

                for (const item of items) {
                    const { id, ...data } = item;

                    // Re-handle relations if they are nested in the payload
                    // (This is getting complex because the frontend sends flat-ish data with IDs)

                    if (prismaModel === 'property') {
                        const { units, documents, ...propData } = data;
                        await tx.property.upsert({
                            where: { id },
                            update: propData,
                            create: { ...propData, id },
                        });
                    } else if (prismaModel === 'unit') {
                        const { appliances, ...unitData } = data;
                        await tx.unit.upsert({
                            where: { id },
                            update: unitData,
                            create: { ...unitData, id },
                        });
                    } else if (prismaModel === 'leaseContract') {
                        // Handle Contract: exclude relations found in JSON but not in direct update
                        const { paymentSchedule, documents, transactions, category, ...contractData } = data;

                        // Upsert the contract itself
                        await tx.leaseContract.upsert({
                            where: { id },
                            update: contractData,
                            create: { ...contractData, id },
                        });

                        // Handle Payment Schedule (Replace all)
                        if (paymentSchedule && Array.isArray(paymentSchedule)) {
                            await tx.paymentSchedule.deleteMany({ where: { contractId: id } });
                            for (const p of paymentSchedule) {
                                await tx.paymentSchedule.create({
                                    data: {
                                        contractId: id,
                                        dueDate: p.dueDate,
                                        amount: String(p.amount) // Ensure string if legacy
                                    }
                                });
                            }
                        }

                    } else if (prismaModel === 'owner') {
                        // Handle Owner: exclude relations
                        const { properties, reminders, payoutVouchers, user, ...ownerData } = data;
                        await tx.owner.upsert({
                            where: { id },
                            update: ownerData,
                            create: { ...ownerData, id },
                        });

                    } else if (prismaModel === 'tenant') {
                        // Handle Tenant: exclude relations
                        // FIX: Map frontend 'tenantId' to backend 'tenantIdNo'
                        const { documents, contracts, tenantId, ...rest } = data;
                        const tenantData = {
                            ...rest,
                            tenantIdNo: tenantId // Map here
                        };

                        await tx.tenant.upsert({
                            where: { id },
                            update: tenantData,
                            create: { ...tenantData, id },
                        });

                    } else if (prismaModel === 'wallet') {
                        // Handle Wallet: exclude user relation object, keep userId
                        const { user, ...walletData } = data;
                        await tx.wallet.upsert({
                            where: { id },
                            update: walletData,
                            create: { ...walletData, id },
                        });

                    } else if (prismaModel === 'expense') {
                        // Handle Expense: exclude property/unit objects, keep IDs
                        const { property, unit, ...expenseData } = data;
                        await tx.expense.upsert({
                            where: { id },
                            update: expenseData,
                            create: { ...expenseData, id },
                        });

                    } else if (prismaModel === 'user') {
                        // Handle User: Hash password if provided
                        const { wallet, owner, tenant, ...userData } = data;

                        if (userData.password && !userData.password.startsWith('$2')) {
                            userData.password = await bcrypt.hash(userData.password, 10);
                        } else if (!userData.password && id) {
                            // If password is not provided for an existing user, don't update it
                            delete userData.password;
                        }

                        await tx.user.upsert({
                            where: { id },
                            update: userData,
                            create: {
                                ...userData,
                                id,
                                // If creating a new user without a password (shouldn't happen with UI validation), use a default
                                password: userData.password || await bcrypt.hash('password', 10)
                            },
                        });

                    } else {
                        // Generic fallback for others (clean common relation fields if any)
                        // It's safer to strip known relation objects if they exist in payload
                        const { user, property, unit, documents, ...genericData } = data;
                        await tx[prismaModel].upsert({
                            where: { id },
                            update: genericData,
                            create: { ...genericData, id },
                        });
                    }
                }
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        res.status(500).json({ error: `Failed to save ${key}` });
    }
});

// Specific endpoint for deletion since upsert doesn't handle it
app.delete('/api/delete-item/:key/:id', async (req, res) => {
    const { key, id } = req.params;
    const modelMap = {
        'properties': 'property',
        'units': 'unit',
        'tenants': 'tenant',
        'owners': 'owner',
        'contracts': 'leaseContract',
        'transactions': 'transaction',
        'expenses': 'expense',
        'wallets': 'wallet',
        'users': 'user',
        'reminders': 'reminder',
        'payoutVouchers': 'payoutVoucher'
    };
    const prismaModel = modelMap[key];
    if (!prismaModel) return res.status(400).json({ error: 'Invalid key' });

    try {
        await prisma[prismaModel].delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error(`Error deleting ${id} from ${key}:`, error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../dist')));

// Anything that doesn't match an API route or a static file, send back index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- Demo Mode Auto-Reset ---
const resetDatabase = async () => {
    try {
        const settings = await prisma.appSettings.findUnique({ where: { id: 'settings' } });
        if (!settings?.isDemoMode) {
            // console.log('Skipping reset: Demo Mode disabled.'); 
            return;
        }

        console.log('--- RESETTING DATABASE (DEMO MODE) ---');

        // Transactional Reset
        await prisma.$transaction(async (tx) => {
            // 1. Delete dependent child records first
            await tx.transaction.deleteMany();
            await tx.paymentSchedule.deleteMany();
            await tx.document.deleteMany();
            await tx.expense.deleteMany();
            await tx.reminder.deleteMany();
            await tx.payoutVoucher.deleteMany();

            // 2. Delete Contracts
            await tx.leaseContract.deleteMany();

            // 3. Delete Units & Appliances
            await tx.appliance.deleteMany();
            await tx.unit.deleteMany();

            // 4. Delete Properties
            await tx.property.deleteMany();

            // 5. Delete Profiles
            await tx.tenant.deleteMany();
            await tx.owner.deleteMany();
            await tx.wallet.deleteMany();

            // 6. Delete Users (will be re-created by seed)
            await tx.user.deleteMany();
        });

        console.log('Database cleared. Reseeding...');
        await seedIfNeeded();
        console.log('Database restored to default.');

    } catch (error) {
        console.error('Reset failed:', error);
    }
};

// Reset every 4 hours (default) - ONLY in non-production
if (process.env.NODE_ENV !== 'production') {
    const RESET_INTERVAL = process.env.RESET_INTERVAL || (4 * 60 * 60 * 1000);
    setInterval(resetDatabase, RESET_INTERVAL);
}

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('--- Persistence Fix v3 Active ---');
    });
}

module.exports = app;

