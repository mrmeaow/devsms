import { nanoid } from 'nanoid';
import { SmsProvider } from './base.js';
import { mapTwilioStatus } from '../status-map.js';

export class TwilioProvider extends SmsProvider {
  name = 'twilio';

  async send(requestBody) {
    const providerResponse = {
      sid: `SM${nanoid(32)}`,
      status: 'queued',
      numSegments: 1,
      mediaUrls: []
    };

    return this.normalize(requestBody, providerResponse);
  }

  normalize(body, response) {
    return {
      id: nanoid(),
      provider: this.name,
      provider_message_id: response.sid,
      direction: 'outbound',
      sender: body.From,
      recipient: body.To,
      body: body.Body,
      status: mapTwilioStatus(response.status),
      parts: Number(response.numSegments) || 1,
      retention_policy: body.retention_policy ?? 'audit',
      meta: response
    };
  }
}
