import { injectable } from 'tsyringe';

import { logger } from '@shared/utils/logger';
import { realToCents } from '@shared/utils/number.utils';

import {
  TransactionMethod,
  TransactionType,
} from '@transactions/domain/entities/transaction.entity';
import {
  OfxStatement,
  OfxStatementType,
  Statement,
} from '@transactions/domain/types/statement.type';
import { IOfxStatementParser } from '@transactions/ports/ofx-statement-parser.interface';
import { parse as parseOFX } from 'ofx-js';

@injectable()
export class OfxStatementParserGateway implements IOfxStatementParser {
  private readonly skipedDescriptions = ['Aplicação RDB', 'Resgate RDB'];

  async parse(ofxData: string): Promise<Statement[]> {
    try {
      const ofxParsed = await parseOFX(ofxData);

      if (!ofxParsed?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
        return [];
      }

      return ofxParsed.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN.filter(
        (statement: OfxStatement) => !this.skipedDescriptions.includes(statement.MEMO),
      ).map((statement: OfxStatement) => ({
        externalId: statement.FITID?.split(':')[0],
        date: this.parseOfxDate(statement.DTPOSTED),
        description: statement.MEMO,
        amount: realToCents(+Number(statement.TRNAMT)),
        type:
          statement.TRNTYPE === OfxStatementType.DEBIT
            ? TransactionType.CASH_OUT
            : TransactionType.CASH_IN,
        method: this.getMethod(statement.MEMO),
      }));
    } catch (error) {
      logger.error({ message: 'Error parsing OFX file', error });
      throw new Error('Error parsing OFX file');
    }
  }

  private getMethod(description: string): TransactionMethod {
    const lowerDescription = description.toLowerCase();

    const patterns: [string | RegExp, TransactionMethod][] = [
      [/pix/, TransactionMethod.PIX],
      [/d[ée]bito/, TransactionMethod.DEBIT],
      [/pagamento\s+de\s+fatura/, TransactionMethod.CARD_PAYMENT],
      [/transfer[eê]ncia\s+recebida/, TransactionMethod.PIX],
      [/cr[ée]dito\s+em\s+conta/, TransactionMethod.CASH_BACK],
    ];

    for (const [pattern, method] of patterns) {
      if (
        typeof pattern === 'string'
          ? lowerDescription.includes(pattern)
          : pattern.test(lowerDescription)
      ) {
        return method;
      }
    }

    return TransactionMethod.DEBIT;
  }

  private parseOfxDate(ofxDate: string): Date {
    const main = ofxDate.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);

    if (!main) {
      throw new Error(`Data OFX inválida: ${ofxDate}`);
    }

    const [, year, month, day, hour, minute, second] = main.map(Number);

    // Pega offset, ex: -3
    const offsetMatch = ofxDate.match(/\[([+-]?\d+)/);
    const offset = offsetMatch ? Number(offsetMatch[1]) : 0;

    // Cria a data como se fosse no UTC
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Ajusta o offset do OFX (ex: -3)
    // offset * 60 * 60 * 1000 = ms
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
    const offsetInMilliseconds = offset * 60 * 60 * 1000;

    return new Date(date.getTime() - offsetInMilliseconds);
  }
}
