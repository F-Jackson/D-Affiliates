import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async makeStatsPayment(userId: string) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const now = new Date();
    if (user.nextPayment && user.nextPayment > now) {
      this.logger.log(
        `Stats payment for ${userId} is already scheduled for ${user.nextPayment}`,
      );
      return;
    }

    // Total earnings from all affiliates
    const totalEarnings = user.affiliateds.reduce((sum, aff) => {
      return sum + aff.transactions.reduce((s, t) => s + t.amount, 0);
    }, 0);

    // Total withdrawn and pending
    const totalWithdrawn = user.transfers
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingWithdrawals = user.transfers
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Active affiliates (created 3+ months ago)
    const threeMonthsAgo = new Date(Date.now() - 60 * 60 * 1000 * 24 * 30 * 3);
    const affiliatesToCalculate = user.affiliateds.filter((aff) => {
      return aff.createdAt <= threeMonthsAgo;
    });

    const numberOfAffiliates = affiliatesToCalculate.length;

    // Transaction IDs already used in previous withdrawals
    const usedTransactionIds = user.transfers
      .flatMap((t) => t.usedTransactionIds || [])
      .filter((id) => id);

    // Unused transactions (available for withdrawal)
    const notUsedTransactions = affiliatesToCalculate
      .flatMap((aff) => aff.transactions)
      .filter((t) => !usedTransactionIds.includes(t.id));

    // Period earnings (unused and completed transactions)
    const totalEarningsPeriod = notUsedTransactions
      .filter((t) => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total unused transactions
    const totalTransactionsPeriod = notUsedTransactions.length;

    if (!user.stats) {
      user.stats = {};
    }

    user.stats = {
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
      numberOfAffiliates,
      totalEarningsLastMonth: totalEarningsPeriod,
      totalTransactionsLastMonth: totalTransactionsPeriod,
      usedTransactionIds: [...notUsedTransactions.map((t) => t.id)],
    };

    await user.save();
  }

  async confirmContract(
    userId: string,
    code: string,
    paymentStr: string,
    contractId: string,
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId is required');
    }

    if (!code || code.trim().length === 0) {
      throw new BadRequestException('code is required');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      if (user.transfers.length === 0) {
        throw new NotFoundException('Nenhum contrato pendente encontrado');
      }

      const contract = user.contracts.find((c) => c.contractId === contractId);
      if (!contract) {
        throw new NotFoundException(
          `Contrato ${contractId} não encontrado para o usuário ${userId}`,
        );
      }

      if (contract.status !== 'pending') {
        throw new BadRequestException(
          `Contrato ${contractId} não está pendente`,
        );
      }

      if (contract.secretCode !== code) {
        throw new UnauthorizedException('Código de confirmação inválido');
      }

      contract.status = 'confirmed';
      contract.confirmedAt = new Date();

      const newTransfer = {
        amount: contract.amount,
        status: 'pending' as const,
        usedTransactionIds: contract.transcationsIds,
        createdAt: new Date(),
        paymentStr,
      };

      user.transfers.push(newTransfer);

      const savedUser = await user.save();
      this.logger.log(`Contrato confirmado para ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar contrato para ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  async adminConfirmContract(
    userId: string,
    contractId: string,
    plataform: string,
    taxAmount: number,
  ) {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('userId é obrigatório');
    }

    try {
      const user = await this.userModel.findOne({ userId });
      if (!user) {
        throw new NotFoundException(`Usuário ${userId} não encontrado`);
      }

      const contract = user.contracts.find((c) => c.contractId === contractId);
      if (!contract) {
        throw new NotFoundException(
          `Contrato ${contractId} não encontrado para o usuário ${userId}`,
        );
      }

      if (contract.status !== 'pending') {
        throw new BadRequestException(
          `Contrato ${contractId} não está pendente`,
        );
      }

      contract.plataform = plataform;
      contract.taxAmount = taxAmount;

      const savedUser = await user.save();
      this.logger.log(`Contrato confirmado para ${userId} pelo admin`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar contrato para ${userId} pelo admin:`,
        error.message,
      );
      throw error;
    }
  }

  async adminChangeTransfer(
    userId: string,
    transferId: string,
    newStatus: {
      failedReason: string;
      success?: {
        paymentProofUrl: string;
        internalPaymentProofUrl?: string;
        completedDate: Date;
      };
      detail?: string;
    },
  ) {
    const user = await this.userModel.findOne({ userId });
    if (!user) {
      throw new NotFoundException(`Usuário ${userId} não encontrado`);
    }

    const transfer = user.transfers.find(
      (t) => t._id?.toString() === transferId,
    );
    if (!transfer) {
      throw new NotFoundException(
        `Transferência ${transferId} não encontrada para o usuário ${userId}`,
      );
    }

    if (newStatus.success) {
      transfer.status = 'completed';
      transfer.paymentProofUrl = newStatus.success.paymentProofUrl;
      transfer.internalPaymentProofUrl =
        newStatus.success.internalPaymentProofUrl;
      transfer.completedDate = newStatus.success.completedDate;
    } else {
      transfer.status = 'failed';
      transfer.failureReason = newStatus.failedReason;
    }

    await user.save();
    this.logger.log(
      `Transferência ${transferId} atualizada para o usuário ${userId}`,
    );
  }
}
