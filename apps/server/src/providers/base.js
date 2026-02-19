/**
 * @typedef {Object} NormalizedSms
 * @property {string} id
 * @property {string} provider
 * @property {string=} provider_message_id
 * @property {'outbound'|'inbound'} direction
 * @property {string=} sender
 * @property {string} recipient
 * @property {string} body
 * @property {'queued'|'sent'|'delivered'|'failed'|'expired'} status
 * @property {string=} encoding
 * @property {number=} parts
 * @property {number=} cost
 * @property {string=} currency
 * @property {string=} campaign_id
 * @property {string=} transaction_type
 * @property {'ephemeral'|'audit'|'permanent'} retention_policy
 * @property {Record<string, any>} meta
 */

export class SmsProvider {
  name = 'unknown';

  normalize(_requestBody, _providerResponse) {
    throw new Error('normalize() not implemented');
  }

  async send(_requestBody) {
    throw new Error('send() not implemented');
  }
}
