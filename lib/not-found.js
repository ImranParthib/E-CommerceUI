import { notFound } from 'next/navigation';

export function handleNotFound(condition) {
    if (condition) {
        notFound();
    }
}