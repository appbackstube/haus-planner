import type { MaterialAuswahl } from '../types';

export function hatOffeneAngaben(material: MaterialAuswahl | undefined, fields: readonly (readonly string[])[]): boolean {
  return fields.some(([field]) => !material?.angaben?.[field]?.trim());
}
