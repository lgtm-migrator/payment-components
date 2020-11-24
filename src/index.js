import './components/credit-card'
import './components/credit-card-number'
import './components/credit-card-cvv'
import './components/credit-card-exp'
import './components/credit-card-account-name'
import './components/credit-card-address-1'
import './components/credit-card-address-2'
import './components/credit-card-city'
import './components/credit-card-region'
import './components/credit-card-zip'
import 'regenerator-runtime'
import './style.css'

import createPaymentFields from './field-set/payment-fields'
import { SURCHARGE, SERVICE_FEE } from './common/data'

const create = (apiKey, styles, tags, feeMode, host) => createPaymentFields(apiKey, '', styles, tags, feeMode, host)

window.paytheory = {
    createPaymentFields,
    create,
    SURCHARGE,
    SERVICE_FEE
}

export default window.paytheory
