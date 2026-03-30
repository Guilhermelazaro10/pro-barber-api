import type { Prisma } from '@prisma/client';

type DecimalInput = Prisma.Decimal | number | string;

export const decimalToNumber = (value: DecimalInput) => Number(value);

export const roundCurrency = (value: number) => Number(value.toFixed(2));
