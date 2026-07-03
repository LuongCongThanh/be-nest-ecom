import { PrismaService } from '@common/prisma/prisma.service';
import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class ProductStockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin manual stock adjustment (INBOUND or ADJUSTMENT type).
   * Always requires a reason.
   */
  async manualAdjust(productId: string, dto: AdjustStockDto, performedById: string): Promise<void> {
    if (!dto.reason?.trim()) {
      throw new UnprocessableEntityException({ code: 'REASON_REQUIRED', message: 'reason is required for manual stock movements' });
    }

    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; stockQuantity: number }[]>`
        SELECT id, "stockQuantity" FROM products
        WHERE id = ${productId} AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      if (!rows.length) {
        throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
      }
      const newQty = rows[0].stockQuantity + dto.delta;
      if (newQty < 0) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `Adjustment would result in negative stock. Current: ${rows[0].stockQuantity}, delta: ${dto.delta}`,
        });
      }
      await tx.product.update({ where: { id: productId }, data: { stockQuantity: newQty } });
      await tx.stockMovement.create({
        data: {
          productId,
          type: dto.type,
          delta: dto.delta,
          balanceAfter: newQty,
          reason: dto.reason,
          performedById,
        },
      });
    });
  }

  /**
   * Admin stock movement history for a product.
   */
  async getStockHistory(productId: string, page = 1, limit = 20) {
    const existing = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!existing) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: { performedBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);

    return { data, total, page, limit };
  }
}
