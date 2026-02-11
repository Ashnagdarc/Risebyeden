-- CreateIndex
CREATE INDEX "Advisor_status_createdAt_idx" ON "Advisor"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "ClientProperty_userId_idx" ON "ClientProperty"("userId");

-- CreateIndex
CREATE INDEX "ClientProperty_propertyId_idx" ON "ClientProperty"("propertyId");

-- CreateIndex
CREATE INDEX "ConsultationRequest_userId_createdAt_idx" ON "ConsultationRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_status_createdAt_idx" ON "ConsultationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_advisorId_idx" ON "ConsultationRequest"("advisorId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_propertyId_idx" ON "Document"("propertyId");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_propertyId_type_idx" ON "Document"("propertyId", "type");

-- CreateIndex
CREATE INDEX "InterestRequest_status_createdAt_idx" ON "InterestRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InterestRequest_userId_createdAt_idx" ON "InterestRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InterestRequest_propertyId_idx" ON "InterestRequest"("propertyId");

-- CreateIndex
CREATE INDEX "InviteRequest_status_createdAt_idx" ON "InviteRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InviteRequest_email_idx" ON "InviteRequest"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PriceUpdate_effectiveDate_idx" ON "PriceUpdate"("effectiveDate");

-- CreateIndex
CREATE INDEX "Property_status_createdAt_idx" ON "Property"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_propertyId_idx" ON "Transaction"("propertyId");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_status_createdAt_idx" ON "User"("role", "status", "createdAt");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
