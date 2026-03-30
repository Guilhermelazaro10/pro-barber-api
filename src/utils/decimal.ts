import type { Prisma } from '@prisma/client';

type DecimalValue = Prisma.Decimal | number | string;

export const decimalToNumber = (value: DecimalValue) => Number(value);

export const roundCurrency = (value: number) => Number(value.toFixed(2));
