import { nanoid } from 'nanoid';
import { SmsProvider } from './base.js';
import { mapMimsmsStatus } from '../status-map.js';

export class MimsmsProvider extends SmsProvider {
  name = 'mimsms';

  async send(requestBody) {
    const providerResponse = {
      trxnId: `MIM-${nanoid(10)}`,
      status: 'Success'
    };

    return this.normalize(requestBody, providerResponse);
  }

  normalize(body, response) {
    return {
      id: nanoid(),
      provider: this.name,
      provider_message_id: response.trxnId,
      direction: 'outbound',
      sender: body.SenderName,
      recipient: body.MobileNumber,
      body: body.Message,
      status: mapMimsmsStatus(response.status),
      campaign_id: body.CampaignId ?? null,
      transaction_type: body.TransactionType ?? null,
      retention_policy: body.retention_policy ?? 'audit',
      meta: { ...body, ...response }
    };
  }
}
