import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import { IVerificationTokenRepositoryPort } from '@users/domain/repositories/verification-token.repository.port';
import { ValidateTokenDto } from '@users/dtos';

@injectable()
export class ValidateTokenUseCase
  implements IBaseUseCase<ValidateTokenDto, { isValid: boolean; userId?: string; tokenId?: string }>
{
  constructor(
    @inject(Injections.VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute(
    data: ValidateTokenDto,
  ): Promise<{ isValid: boolean; userId?: string; tokenId?: string }> {
    const verificationToken = await this.verificationTokenRepository.findByToken(data.token);

    const isInvalidToken =
      !verificationToken || verificationToken.isUsed || verificationToken.type !== data.type;

    if (isInvalidToken) {
      return { isValid: false };
    }

    const isExpired = verificationToken.expirationDate < new Date();

    if (isExpired) {
      return { isValid: false };
    }

    return {
      isValid: true,
      userId: verificationToken.userId,
      tokenId: verificationToken.id as string,
    };
  }
}
