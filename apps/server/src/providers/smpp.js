import { nanoid } from 'nanoid';
import { SmsProvider } from './base.js';
import { mapSmppStatus } from '../status-map.js';

export class SmppProvider extends SmsProvider {
  name = 'smpp';

  async send(requestBody) {
    const providerResponse = {
      pduId: `0x${Math.floor(Math.random() * 65535).toString(16)}`,
      esmClass: 0,
      dlrCode: 0
    };

    return this.normalize(requestBody, providerResponse);
  }

  normalize(body, response) {
    return {
      id: nanoid(),
      provider: this.name,
      provider_message_id: response.pduId,
      direction: 'outbound',
      sender: body.source_addr,
      recipient: body.destination_addr,
      body: body.short_message,
      status: mapSmppStatus(response.dlrCode),
      encoding: body.data_coding === 8 ? 'UCS2' : 'GSM7',
      retention_policy: body.retention_policy ?? 'audit',
      meta: { ...body, pdu: response }
    };
  }
}
