import { useGtm } from '@gtm-support/vue-gtm';
import { useSurvey } from '@intake24/survey/stores';
import type { GtmEventParams } from '@intake24/ui/tracking';

export function sendGtmEvent(params: GtmEventParams): void {
  try {
    const survey = useSurvey();
    const defaults = {
      uxSessionId: survey.data.uxSessionId,
      uxUserId: survey.user?.userId || '',
      noninteraction: false,
    };
    useGtm()?.trackEvent({ ...defaults, ...params });
  }
  catch (e) {
    console.error('Error sending GTM event:', e);
  }
}
