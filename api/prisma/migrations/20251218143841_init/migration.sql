-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyName" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'شاغرة',
    "rentAmount" TEXT NOT NULL,
    "area" TEXT,
    "rooms" TEXT,
    "bathrooms" TEXT,
    "floor" TEXT,
    "hasAC" BOOLEAN NOT NULL DEFAULT false,
    "hasKitchen" BOOLEAN NOT NULL DEFAULT false,
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "electricityMeterNumber" TEXT,
    "waterMeterNumber" TEXT,
    "parkingSpotNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appliance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Appliance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantName" TEXT NOT NULL,
    "tenantIdNo" TEXT NOT NULL,
    "tenantPhone" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "paymentNotes" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "managementFeeType" TEXT NOT NULL,
    "managementFeeValue" TEXT NOT NULL,
    "managementAgreementStatus" TEXT NOT NULL DEFAULT 'not_sent',
    "ownerApprovalDate" TEXT,
    "adminApprovalDate" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaseContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantNationalId" TEXT NOT NULL,
    "tenantPhone" TEXT NOT NULL,
    "landlordName" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "landlordPhone" TEXT NOT NULL,
    "representedBy" TEXT NOT NULL,
    "agentName" TEXT,
    "agentId" TEXT,
    "agentPhone" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "rentAmount" TEXT NOT NULL,
    "rentCycle" TEXT NOT NULL,
    "customRentCycleUnit" TEXT,
    "customRentCycleValue" TEXT,
    "securityDeposit" TEXT NOT NULL,
    "leasePurpose" TEXT NOT NULL,
    "tenantCompanyName" TEXT,
    "tenantCompanyCR" TEXT,
    "renewalNoticeDays" TEXT,
    "terms" TEXT NOT NULL,
    "contractStatus" TEXT NOT NULL DEFAULT 'active',
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending_landlord',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaseContract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaseContract_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaseContract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    CONSTRAINT "PaymentSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LeaseContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "payoutStatus" TEXT NOT NULL DEFAULT 'pending',
    "voucherNumber" TEXT,
    "leaseContractId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_leaseContractId_fkey" FOREIGN KEY ("leaseContractId") REFERENCES "LeaseContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "vendor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ownerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reminder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayoutVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNumber" TEXT NOT NULL,
    "payoutDate" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "includedTransactionIds" TEXT NOT NULL,
    "grossAmount" TEXT NOT NULL,
    "managementFee" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayoutVoucher_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "propertyId" TEXT,
    "tenantId" TEXT,
    "leaseContractId" TEXT,
    CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_leaseContractId_fkey" FOREIGN KEY ("leaseContractId") REFERENCES "LeaseContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'settings',
    "appName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "contractTemplate" TEXT NOT NULL,
    "statementTemplate" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_tenantIdNo_key" ON "Tenant"("tenantIdNo");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_nationalId_key" ON "Owner"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_userId_key" ON "Owner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
