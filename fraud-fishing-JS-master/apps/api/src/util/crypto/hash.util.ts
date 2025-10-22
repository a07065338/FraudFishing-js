/* eslint-disable prettier/prettier */
import { createHash, randomBytes } from 'node:crypto';

export function sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
}

export function generateSalt(): string {
    return randomBytes(16).toString('hex');
}