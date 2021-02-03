import PayTheoryHostedField from '../pay-theory-hosted-field'
const NAME = 'city'
const FIELDS = [{ name: 'billing-city', label: 'Billing City', validations: null, autoComplete: 'locality' }];

class CreditCardBillingCityFrame extends PayTheoryHostedField {

  constructor() {
    super()
    this.setFields(FIELDS)
    this.field = NAME
  }

}

window.customElements.define('pay-theory-credit-card-city-tag-frame', CreditCardBillingCityFrame);
