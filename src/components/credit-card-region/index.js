import PayTheory from '../pay-theory-finix'
const NAME = 'state'
const FIELDS = [{ name: 'address.region', label: 'Billing State', validations: null, autoComplete: 'region' }];

class CreditCardBillingStateFrame extends PayTheory {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-state-tag-frame', CreditCardBillingStateFrame);
