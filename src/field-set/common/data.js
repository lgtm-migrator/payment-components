export const IDENTITY = 'pt-identity'

export const defaultStyles = {
    default: {},
    success: {},
    error: {},
}

export const defaultTags = {}

export const fields = {
    CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
    CREDIT_CARD: 'pay-theory-credit-card',
    CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

export const fieldTypes = ['account-name', 'credit-card', 'zip']

export const stateMap = {
    'account-name': 'name',
    'credit-card': 'security_code|expiration_date|number',
    'zip': 'address.postal_code'
}
