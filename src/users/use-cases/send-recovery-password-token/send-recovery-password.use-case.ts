import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { EntityAlreadyExistsError } from '@shared/errors/entity-already-exists.error';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';
import { IEmailProviderPort } from '@shared/gateways/email-provider.port';
import { Injections } from '@shared/types/injections';
import { generateSixDigitToken } from '@shared/utils/generate-random-token';

import { VerificationTokenType } from '@users/domain/entities/verification-token.entity';
import { IUserRepositoryPort } from '@users/domain/repositories/user.repository.port';
import { IVerificationTokenRepositoryPort } from '@users/domain/repositories/verification-token.repository.port';
import { SendRecoveryPasswordTokenDto } from '@users/dtos';

@injectable()
export class SendRecoveryPasswordTokenUseCase
  implements IBaseUseCase<SendRecoveryPasswordTokenDto, void>
{
  public constructor(
    @inject(Injections.USER_REPOSITORY)
    private readonly userRepository: IUserRepositoryPort,
    @inject(Injections.VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
    @inject(Injections.EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProviderPort,
  ) {}

  async execute(data: SendRecoveryPasswordTokenDto): Promise<void> {
    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      throw new EntityNotFoundError('User');
    }

    const userVerificationToken = await this.verificationTokenRepository.findByUserId(
      user.id as string,
      VerificationTokenType.PASSWORD_RESET,
    );

    if (userVerificationToken) {
      throw new EntityAlreadyExistsError('Verification token');
    }

    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
    const oneHourExpirationDate = new Date(Date.now() + 1000 * 60 * 60);

    const token = await this.verificationTokenRepository.create({
      userId: user.id as string,
      isUsed: false,
      type: VerificationTokenType.PASSWORD_RESET,
      expirationDate: oneHourExpirationDate,
      token: generateSixDigitToken(),
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/token=${token.token}`;

    await this.emailProvider.sendEmail({
      to: user.email,
      subject: 'Redefinição de senha Zentavo',
      body: `
        <h1>Redefinição de senha</h1>
        <p>Olá ${user.name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Para redefinir sua senha, por favor clique no link abaixo:</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>O link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, por favor ignore este e-mail.</p>
        <p>Atenciosamente,</p>
        <p>Zencash Team</p>
      `,
    });
  }
}
