/**
 * File Service Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { fileService } from './file.service';
import { prisma } from '@electrovault/database';
import { FileType, UserRole } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../lib/errors';
import * as minioLib from '../lib/minio';

// Mock MinIO functions
vi.mock('../lib/minio', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getPresignedUrl: vi.fn(),
  BUCKET_NAME: 'electrovault-files',
  ensureBucketExists: vi.fn(),
  fileExists: vi.fn(),
  getFileMetadata: vi.fn(),
}));

describe('FileService', () => {
  let testUserId: string;
  let testComponentId: string;
  let testPartId: string;

  beforeAll(async () => {
    // Erstelle Test-User
    const user = await prisma.user.create({
      data: {
        externalId: 'test-file-user-' + Date.now(),
        email: `file-test-${Date.now()}@example.com`,
        username: `filetest${Date.now()}`,
        role: UserRole.CONTRIBUTOR,
      },
    });
    testUserId = user.id;

    // Erstelle Test-Category
    const category = await prisma.categoryTaxonomy.create({
      data: {
        name: { en: 'Test Category' },
        slug: `test-file-category-${Date.now()}`,
        level: 1,
      },
    });

    // Erstelle Test-Component
    const component = await prisma.coreComponent.create({
      data: {
        name: { en: 'Test Component for Files' },
        slug: `test-file-component-${Date.now()}`,
        categoryId: category.id,
        createdById: testUserId,
      },
    });
    testComponentId = component.id;

    // Erstelle Test-Manufacturer
    const manufacturer = await prisma.manufacturerMaster.create({
      data: {
        name: 'Test Manufacturer',
        slug: `test-file-mfg-${Date.now()}`,
        createdById: testUserId,
      },
    });

    // Erstelle Test-Part
    const part = await prisma.manufacturerPart.create({
      data: {
        mpn: `TEST-FILE-${Date.now()}`,
        coreComponentId: testComponentId,
        manufacturerId: manufacturer.id,
        createdById: testUserId,
      },
    });
    testPartId = part.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.fileAttachment.deleteMany({
      where: { uploadedById: testUserId },
    });
    await prisma.manufacturerPart.deleteMany({
      where: { createdById: testUserId },
    });
    await prisma.coreComponent.deleteMany({
      where: { createdById: testUserId },
    });
    await prisma.categoryTaxonomy.deleteMany({
      where: { slug: { contains: 'test-file-category' } },
    });
    await prisma.manufacturerMaster.deleteMany({
      where: { slug: { contains: 'test-file-mfg' } },
    });
    await prisma.user.deleteMany({
      where: { externalId: { startsWith: 'test-file-user' } },
    });
  });

  describe('uploadDatasheet', () => {
    it('should upload a valid PDF datasheet', async () => {
      // Mock MinIO upload
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('fake-pdf-content');
      const filename = 'test-datasheet.pdf';
      const mimeType = 'application/pdf';

      const result = await fileService.uploadDatasheet(
        buffer,
        filename,
        mimeType,
        testUserId,
        { partId: testPartId }
      );

      expect(result).toBeDefined();
      expect(result.originalName).toBe(filename);
      expect(result.mimeType).toBe(mimeType);
      expect(result.fileType).toBe(FileType.DATASHEET);
      expect(result.partId).toBe(testPartId);
      expect(result.uploadedById).toBe(testUserId);
      expect(result.size).toBe(buffer.length);
    });

    it('should reject non-PDF files', async () => {
      const buffer = Buffer.from('fake-image-content');
      const filename = 'test-image.jpg';
      const mimeType = 'image/jpeg';

      await expect(
        fileService.uploadDatasheet(buffer, filename, mimeType, testUserId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should reject files exceeding size limit', async () => {
      const buffer = Buffer.alloc(51 * 1024 * 1024); // 51 MB
      const filename = 'large-datasheet.pdf';
      const mimeType = 'application/pdf';

      await expect(
        fileService.uploadDatasheet(buffer, filename, mimeType, testUserId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should reject files attached to both component and part', async () => {
      const buffer = Buffer.from('fake-pdf-content');
      const filename = 'test-datasheet.pdf';
      const mimeType = 'application/pdf';

      await expect(
        fileService.uploadDatasheet(buffer, filename, mimeType, testUserId, {
          componentId: testComponentId,
          partId: testPartId,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('uploadImage', () => {
    it('should upload a valid JPG image', async () => {
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('fake-jpg-content');
      const filename = 'test-image.jpg';
      const mimeType = 'image/jpeg';

      const result = await fileService.uploadImage(
        buffer,
        filename,
        mimeType,
        testUserId,
        { componentId: testComponentId }
      );

      expect(result).toBeDefined();
      expect(result.fileType).toBe(FileType.IMAGE);
      expect(result.componentId).toBe(testComponentId);
    });

    it('should reject non-image files', async () => {
      const buffer = Buffer.from('fake-pdf-content');
      const filename = 'test-document.pdf';
      const mimeType = 'application/pdf';

      await expect(
        fileService.uploadImage(buffer, filename, mimeType, testUserId)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate a presigned URL', async () => {
      // Erstelle ein Test-File
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('test-content');
      const file = await fileService.uploadDatasheet(
        buffer,
        'test.pdf',
        'application/pdf',
        testUserId
      );

      // Mock getPresignedUrl
      const mockUrl = 'https://minio.example.com/presigned-url';
      vi.mocked(minioLib.getPresignedUrl).mockResolvedValue(mockUrl);

      const url = await fileService.getDownloadUrl(file.id);

      expect(url).toBe(mockUrl);
      expect(minioLib.getPresignedUrl).toHaveBeenCalledWith(
        file.bucketPath,
        24 * 60 * 60
      );
    });

    it('should throw NotFoundError for non-existent file', async () => {
      await expect(
        fileService.getDownloadUrl('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteFile', () => {
    it('should allow owner to delete file', async () => {
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('test-content');
      const file = await fileService.uploadDatasheet(
        buffer,
        'test-delete.pdf',
        'application/pdf',
        testUserId
      );

      await fileService.deleteFile(file.id, testUserId, UserRole.CONTRIBUTOR);

      const deletedFile = await prisma.fileAttachment.findUnique({
        where: { id: file.id },
      });

      expect(deletedFile?.deletedAt).toBeTruthy();
    });

    it('should allow moderator to delete file', async () => {
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('test-content');
      const file = await fileService.uploadDatasheet(
        buffer,
        'test-delete-mod.pdf',
        'application/pdf',
        testUserId
      );

      // Andere User-ID, aber Moderator-Rolle
      const otherUserId = 'other-user-id';
      await fileService.deleteFile(file.id, otherUserId, UserRole.MODERATOR);

      const deletedFile = await prisma.fileAttachment.findUnique({
        where: { id: file.id },
      });

      expect(deletedFile?.deletedAt).toBeTruthy();
    });

    it('should reject non-owner non-moderator deletion', async () => {
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      const buffer = Buffer.from('test-content');
      const file = await fileService.uploadDatasheet(
        buffer,
        'test-delete-forbidden.pdf',
        'application/pdf',
        testUserId
      );

      // Andere User-ID, keine Moderator-Rolle
      const otherUserId = 'other-user-id';
      await expect(
        fileService.deleteFile(file.id, otherUserId, UserRole.VIEWER)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getFilesByPart', () => {
    it('should return all files for a part', async () => {
      vi.mocked(minioLib.uploadFile).mockResolvedValue({
        etag: 'test-etag',
        versionId: null,
      });

      // Upload 2 Files für das Part
      await fileService.uploadDatasheet(
        Buffer.from('test1'),
        'test1.pdf',
        'application/pdf',
        testUserId,
        { partId: testPartId }
      );

      await fileService.uploadImage(
        Buffer.from('test2'),
        'test2.jpg',
        'image/jpeg',
        testUserId,
        { partId: testPartId }
      );

      const files = await fileService.getFilesByPart(testPartId);

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files.every((f) => f.partId === testPartId)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return file statistics', async () => {
      const stats = await fileService.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.byFileType).toHaveProperty('DATASHEET');
      expect(stats.byFileType).toHaveProperty('IMAGE');
      expect(stats.byFileType).toHaveProperty('PINOUT');
      expect(stats.byFileType).toHaveProperty('OTHER');
    });
  });
});
