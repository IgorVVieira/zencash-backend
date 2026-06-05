import { inject, injectable } from 'tsyringe';

import { HttpStatus } from '@shared/http-status.enum';
import { Injections } from '@shared/types/injections';

import { CreateFixedBillUseCase } from '@fixed-bills/use-cases/create-fixed-bill/create-fixed-bill.use-case';
import { DeleteFixedBillUseCase } from '@fixed-bills/use-cases/delete-fixed-bill/delete-fixed-bill.use-case';
import { GenerateOccurrencesUseCase } from '@fixed-bills/use-cases/generate-occurrences/generate-occurrences.use-case';
import { ListFixedBillsUseCase } from '@fixed-bills/use-cases/list-fixed-bills/list-fixed-bills.use-case';
import { ListOccurrencesUseCase } from '@fixed-bills/use-cases/list-occurrences/list-occurrences.use-case';
import { UpdateFixedBillUseCase } from '@fixed-bills/use-cases/update-fixed-bill/update-fixed-bill.use-case';
import { UpdateOccurrenceUseCase } from '@fixed-bills/use-cases/update-occurrence/update-occurrence.use-case';
import { Request, Response } from 'express';

@injectable()
export class FixedBillController {
  /* eslint-disable-next-line max-params */
  constructor(
    @inject(Injections.CREATE_FIXED_BILL_USE_CASE)
    private readonly createFixedBillUseCase: CreateFixedBillUseCase,
    @inject(Injections.LIST_FIXED_BILLS_USE_CASE)
    private readonly listFixedBillsUseCase: ListFixedBillsUseCase,
    @inject(Injections.UPDATE_FIXED_BILL_USE_CASE)
    private readonly updateFixedBillUseCase: UpdateFixedBillUseCase,
    @inject(Injections.DELETE_FIXED_BILL_USE_CASE)
    private readonly deleteFixedBillUseCase: DeleteFixedBillUseCase,
    @inject(Injections.LIST_OCCURRENCES_USE_CASE)
    private readonly listOccurrencesUseCase: ListOccurrencesUseCase,
    @inject(Injections.UPDATE_OCCURRENCE_USE_CASE)
    private readonly updateOccurrenceUseCase: UpdateOccurrenceUseCase,
    @inject(Injections.GENERATE_OCCURRENCES_USE_CASE)
    private readonly generateOccurrencesUseCase: GenerateOccurrencesUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const bill = await this.createFixedBillUseCase.execute({
      ...req.body,
      userId: req.userId,
    });
    return res.status(HttpStatus.CREATED).json(bill);
  }

  async list(req: Request, res: Response): Promise<Response> {
    const bills = await this.listFixedBillsUseCase.execute({ userId: req.userId });
    return res.status(HttpStatus.OK).json(bills);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const bill = await this.updateFixedBillUseCase.execute({
      ...req.body,
      id: req.params.id,
      userId: req.userId,
    });
    return res.status(HttpStatus.OK).json(bill);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    await this.deleteFixedBillUseCase.execute({ id: req.params.id as string, userId: req.userId });
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  async listOccurrences(req: Request, res: Response): Promise<Response> {
    const occurrences = await this.listOccurrencesUseCase.execute({
      userId: req.userId,
      month: Number(req.query['month'] as string),
      year: Number(req.query['year'] as string),
    });
    return res.status(HttpStatus.OK).json(occurrences);
  }

  async updateOccurrence(req: Request, res: Response): Promise<Response> {
    const occurrence = await this.updateOccurrenceUseCase.execute({
      ...req.body,
      id: req.params.id,
      userId: req.userId,
    });
    return res.status(HttpStatus.OK).json(occurrence);
  }

  async generateOccurrences(req: Request, res: Response): Promise<Response> {
    await this.generateOccurrencesUseCase.execute({
      userId: req.userId,
      year: Number(req.body.year),
    });
    return res.status(HttpStatus.OK).json({ message: 'Occurrences generated' });
  }
}
