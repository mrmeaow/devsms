import { MimsmsProvider } from './mimsms.js';
import { SmppProvider } from './smpp.js';
import { TwilioProvider } from './twilio.js';

const providers = {
  mimsms: new MimsmsProvider(),
  twilio: new TwilioProvider(),
  smpp: new SmppProvider()
};

export function getProvider(providerName) {
  return providers[providerName];
}

export function listProviders() {
  return Object.keys(providers);
}
