import { DataSource, EntityManager, QueryRunner } from 'typeorm';

const QUERY_RUNNER_SYMBOL = Symbol('__transaction_query_runner__');

type IsolationLevel =
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SERIALIZABLE';

type PropagationType =
  | 'REQUIRED'
  | 'REQUIRES_NEW'
  | 'NESTED'
  | 'SUPPORTS'
  | 'NOT_SUPPORTED';

interface TransactionalOptions {
  isolationLevel?: IsolationLevel;
  propagation?: PropagationType;
  timeout?: number;
}

interface TransactionContext {
  queryRunner: QueryRunner;
  savepointCounter: number;
}

interface InstanceWithDataSource {
  dataSource?: DataSource;
  [QUERY_RUNNER_SYMBOL]?: TransactionContext;
}

export function Transactional(
  options: TransactionalOptions = {},
): MethodDecorator {
  const {
    isolationLevel = 'READ COMMITTED',
    propagation = 'REQUIRED',
    timeout,
  } = options;

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (
      this: InstanceWithDataSource,
      ...args: unknown[]
    ): Promise<unknown> {
      validateDataSource(this, target);

      const existingContext = this[QUERY_RUNNER_SYMBOL];
      const hasActiveTransaction =
        existingContext?.queryRunner.isTransactionActive;

      switch (propagation) {
        case 'REQUIRED':
          return hasActiveTransaction
            ? executeInExistingTransaction(this, originalMethod, args)
            : executeInNewTransaction(
                this,
                originalMethod,
                args,
                isolationLevel,
                timeout,
              );

        case 'REQUIRES_NEW':
          return executeInNewTransaction(
            this,
            originalMethod,
            args,
            isolationLevel,
            timeout,
          );

        case 'NESTED':
          return hasActiveTransaction
            ? executeInSavepoint(this, originalMethod, args)
            : executeInNewTransaction(
                this,
                originalMethod,
                args,
                isolationLevel,
                timeout,
              );

        case 'SUPPORTS':
          return originalMethod.apply(this, args);

        case 'NOT_SUPPORTED':
          return executeWithoutTransaction(this, originalMethod, args);

        default:
          throw new Error(`Unknown propagation type: ${propagation}`);
      }
    };

    return descriptor;
  };
}

async function executeInNewTransaction(
  instance: InstanceWithDataSource,
  method: Function,
  args: unknown[],
  isolationLevel: IsolationLevel,
  timeout?: number,
): Promise<unknown> {
  const dataSource = instance.dataSource!;
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction(isolationLevel);

  const previousContext = instance[QUERY_RUNNER_SYMBOL];
  instance[QUERY_RUNNER_SYMBOL] = {
    queryRunner,
    savepointCounter: 0,
  };

  try {
    const result = timeout
      ? await executeWithTimeout(method, instance, args, timeout)
      : await method.apply(instance, args);

    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
    }

    return result;
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await safeRelease(queryRunner);
    instance[QUERY_RUNNER_SYMBOL] = previousContext;
  }
}

async function executeInExistingTransaction(
  instance: InstanceWithDataSource,
  method: Function,
  args: unknown[],
): Promise<unknown> {
  return method.apply(instance, args);
}

async function executeInSavepoint(
  instance: InstanceWithDataSource,
  method: Function,
  args: unknown[],
): Promise<unknown> {
  const context = instance[QUERY_RUNNER_SYMBOL];
  if (!context) {
    throw new Error('No transaction context found for nested transaction');
  }

  const { queryRunner } = context;
  const savepointName = `sp_${++context.savepointCounter}_${Date.now()}`;

  await queryRunner.query(`SAVEPOINT ${savepointName}`);

  try {
    const result = await method.apply(instance, args);
    await queryRunner.query(`RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    }
    throw error;
  }
}

async function executeWithoutTransaction(
  instance: InstanceWithDataSource,
  method: Function,
  args: unknown[],
): Promise<unknown> {
  const previousContext = instance[QUERY_RUNNER_SYMBOL];
  instance[QUERY_RUNNER_SYMBOL] = undefined;

  try {
    return await method.apply(instance, args);
  } finally {
    instance[QUERY_RUNNER_SYMBOL] = previousContext;
  }
}

async function executeWithTimeout(
  method: Function,
  instance: InstanceWithDataSource,
  args: unknown[],
  timeout: number,
): Promise<unknown> {
  return Promise.race([
    method.apply(instance, args),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Transaction timeout after ${timeout}ms`)),
        timeout,
      ),
    ),
  ]);
}

function validateDataSource(
  instance: InstanceWithDataSource,
  target: object,
): asserts instance is Required<InstanceWithDataSource> {
  if (!instance.dataSource) {
    throw new Error(
      `DataSource not found in class ${target.constructor.name}. ` +
        `Ensure DataSource is injected with @InjectDataSource()`,
    );
  }

  if (!(instance.dataSource instanceof DataSource)) {
    throw new Error(
      `Invalid DataSource type in class ${target.constructor.name}`,
    );
  }
}

async function safeRelease(queryRunner: QueryRunner): Promise<void> {
  try {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('Error releasing query runner:', error);
  }
}

export function getTransactionManager(instance: any): EntityManager {
  const context = instance[QUERY_RUNNER_SYMBOL];

  if (context?.queryRunner.isTransactionActive) {
    return context.queryRunner.manager;
  }

  if (!instance.dataSource) {
    throw new Error('DataSource not found in instance');
  }

  return instance.dataSource.manager;
}

export function isInTransaction(instance: InstanceWithDataSource): boolean {
  return !!instance[QUERY_RUNNER_SYMBOL]?.queryRunner.isTransactionActive;
}

export function getCurrentQueryRunner(
  instance: InstanceWithDataSource,
): QueryRunner | undefined {
  return instance[QUERY_RUNNER_SYMBOL]?.queryRunner;
}
