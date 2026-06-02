import { inject, injectable } from 'tsyringe';

import { HttpStatus } from '@shared/http-status.enum';
import { Injections } from '@shared/types/injections';

import { TransactionType } from '@transactions/domain/entities/transaction.entity';
import { DashboardUseCase } from '@transactions/use-cases/dashboard/dashboard.use-case';
import { Request, Response } from 'express';

@injectable()
export class DashboardController {
  constructor(
    @inject(Injections.DASHBOARD_USE_CASE) private readonly dashboardUseCase: DashboardUseCase,
  ) {}

  async listByPaymentMethod(request: Request, response: Response): Promise<Response> {
    const transactions = await this.dashboardUseCase.listByPaymentMethod({
      month: +request.params.month,
      year: +request.params.year,
      userId: request.userId,
    });

    return response.status(HttpStatus.OK).json(transactions);
  }

  async listByCategory(request: Request, response: Response): Promise<Response> {
    const { month, year, transactionType } = request.params;

    const categories = await this.dashboardUseCase.listByCategory({
      month: +month,
      year: +year,
      transactionType: transactionType as TransactionType,
      userId: request.userId,
    });

    return response.status(HttpStatus.OK).json(categories);
  }

  async listByLastSixMonths(request: Request, response: Response): Promise<Response> {
    const data = await this.dashboardUseCase.listByLastSixMonths({
      userId: request.userId,
      month: +request.params.month,
      year: +request.params.year,
    });

    return response.status(HttpStatus.OK).json(data);
  }

  async getFixedBillsSummary(req: Request, res: Response): Promise<Response> {
    const { month, year } = req.params;
    const summary = await this.dashboardUseCase.getFixedBillsSummary({
      userId: req.userId,
      month: Number(month),
      year: Number(year),
    });
    return res.status(HttpStatus.OK).json(summary);
  }
}
