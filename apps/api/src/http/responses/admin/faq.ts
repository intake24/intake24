import type { FAQEntry } from '@intake24/common/types/http/admin';
import type { FAQ } from '@intake24/db';

export function faqResponse(faq: FAQ): FAQEntry {
  const { owner } = faq;

  return {
    ...faq.get(),
    owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : undefined,
  };
}
