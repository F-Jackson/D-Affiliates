import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1767496157566 implements MigrationInterface {
    name = 'Init1767496157566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "affiliates_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalEarnings" text, "totalWithdrawn" text, "pendingWithdrawals" text, "numberOfAffiliates" text, "totalEarningsLastMonth" text, "totalTransactionsLastMonth" text, "usedTransactionIds" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb3973471acef9ce92dc81721bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "affiliates_transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" text NOT NULL, "status" text NOT NULL, "paymentStr" text, "paymentProofUrl" text, "internalPaymentProofUrl" text, "failureReason" text, "completedDate" text, "details" text, "usedTransactionIds" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_a0cb1c0d39897bf837ee68d0321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "affiliates_contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contractId" text NOT NULL, "status" text NOT NULL, "confirmedAt" text, "amount" text NOT NULL, "secretCode" text NOT NULL, "plataform" text, "taxAmount" text, "transcationsIds" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_2245470eb2418ed9c817c0150b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "affiliates_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" text NOT NULL, "date" text NOT NULL, "paymentProofUrl" text, "productName" text NOT NULL, "commissionRate" text NOT NULL, "direction" text NOT NULL, "transactionId" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "affiliatedId" uuid, CONSTRAINT "UQ_a6b91253387d882825e1a529ede" UNIQUE ("transactionId"), CONSTRAINT "PK_41b15cf1dc24890cc95e1e52bd6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "affiliates_affiliated" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_688b0a5b57b748d451c8b5621f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "affiliates_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" text NOT NULL, "affiliateCode" text NOT NULL, "status" text NOT NULL, "transferSyncStatus" text NOT NULL, "nextPayment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "statsId" uuid, CONSTRAINT "UQ_67f376a5e3c1298cc05e13ecaa6" UNIQUE ("affiliateCode"), CONSTRAINT "REL_964b8c1e9cac45753bdd0baf4e" UNIQUE ("statsId"), CONSTRAINT "PK_269b2bb6797b6f1bf3f2475d709" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "affiliates_transfers" ADD CONSTRAINT "FK_08949a3978ac7c012bb6e4d2f12" FOREIGN KEY ("userId") REFERENCES "affiliates_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliates_contracts" ADD CONSTRAINT "FK_3d995db5ce3ce5db5f392fbd773" FOREIGN KEY ("userId") REFERENCES "affiliates_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliates_transactions" ADD CONSTRAINT "FK_c8415bf9a5067f3fc88fad5cb0e" FOREIGN KEY ("affiliatedId") REFERENCES "affiliates_affiliated"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliates_affiliated" ADD CONSTRAINT "FK_e3ca9fbe2af6d6fd77472857cb8" FOREIGN KEY ("userId") REFERENCES "affiliates_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliates_users" ADD CONSTRAINT "FK_964b8c1e9cac45753bdd0baf4e7" FOREIGN KEY ("statsId") REFERENCES "affiliates_stats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "affiliates_users" DROP CONSTRAINT "FK_964b8c1e9cac45753bdd0baf4e7"`);
        await queryRunner.query(`ALTER TABLE "affiliates_affiliated" DROP CONSTRAINT "FK_e3ca9fbe2af6d6fd77472857cb8"`);
        await queryRunner.query(`ALTER TABLE "affiliates_transactions" DROP CONSTRAINT "FK_c8415bf9a5067f3fc88fad5cb0e"`);
        await queryRunner.query(`ALTER TABLE "affiliates_contracts" DROP CONSTRAINT "FK_3d995db5ce3ce5db5f392fbd773"`);
        await queryRunner.query(`ALTER TABLE "affiliates_transfers" DROP CONSTRAINT "FK_08949a3978ac7c012bb6e4d2f12"`);
        await queryRunner.query(`DROP TABLE "affiliates_users"`);
        await queryRunner.query(`DROP TABLE "affiliates_affiliated"`);
        await queryRunner.query(`DROP TABLE "affiliates_transactions"`);
        await queryRunner.query(`DROP TABLE "affiliates_contracts"`);
        await queryRunner.query(`DROP TABLE "affiliates_transfers"`);
        await queryRunner.query(`DROP TABLE "affiliates_stats"`);
    }

}
