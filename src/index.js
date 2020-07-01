import './components/credit-card'
import './components/account-name'
import 'regenerator-runtime'
async function postData(url = '', apiKey, data = {}) {
    const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    }
    /* global fetch */
    const response = await fetch(url, options)
    return await response.json()
}

let createdCC = false
let initialized = false
let createdAccountName = false

const transactionEndpoint = process.env.TRANSACTION_ENDPOINT
    ? process.env.TRANSACTION_ENDPOINT
    : 'https://aron.tags.api.paytheorystudy.com'

let identity = false

let initializedAmount = 0

const initialize = async (
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {}
    },
    buyerOptions = {}
) => {
    initialized = true
    initializedAmount = amount

    identity = await postData(
        `${transactionEndpoint}/${clientKey}/identity`,
        apiKey,
        {
            styles,
            buyer: buyerOptions
        }
    )
}

const createCreditCard = async (
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {}
    },
    buyerOptions = {}
) => {
    if (createdCC || !identity) {
        return false
    } else {
        createdCC = true
    }

    identity = await postData(
        `${transactionEndpoint}/${clientKey}/identity`,
        apiKey,
        buyerOptions
    )

    return {
        mount: (element = 'paytheory-credit-card') => {
            const container = document.getElementById(element)
            if (container) {
                if (!document.getElementById('tag-frame')) {
                    const script = document.createElement('script')
                    // eslint-disable-next-line scanjs-rules/assign_to_src
                    script.src = 'https://forms.finixpymnts.com/finix.js'
                    script.addEventListener('load', function () {
                        const tagFrame = document.createElement(
                            'paytheory-credit-card-tag-frame'
                        )
                        tagFrame.setAttribute('ready', true)
                        container.appendChild(tagFrame)
                        window.postMessage(
                            {
                                type: 'styles',
                                styles
                            },
                            window.location.origin
                        )
                    })
                    document.getElementsByTagName('head')[0].appendChild(script)
                }
            } else {
                console.error(element, 'is not available in dom')
            }
        },

        readyObserver: (readyCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data

                if (message.type === 'ready') {
                    readyCallback(message.ready)
                }
            })
        },
        transactedObserver: (transactedCallback) => {
            window.addEventListener('message', async (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'tokenized') {
                    const instrument = await postData(
                        `${transactionEndpoint}/${clientKey}/instrument`,
                        apiKey,
                        {
                            token: message.tokenized.data.id,
                            type: 'TOKEN',
                            identity: identity.id
                        }
                    )

                    const authorization = await postData(
                        `${transactionEndpoint}/${clientKey}/authorize`,
                        apiKey,
                        {
                            source: instrument.id,
                            amount,
                            currency: 'USD'
                        }
                    )

                    transactedCallback({
                        last_four: instrument.last_four,
                        brand: instrument.brand,
                        ...authorization
                    })
                }
            })
        },
        errorObserver: (errorCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'error') {
                    errorCallback(message.error)
                }
            })
        },
        validObserver: (validCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'valid') {
                    validCallback(message.valid)
                }
            })
        }
    }
}

const createAccountName = async (
    apiKey,
    clientKey,
    styles = {
        default: {},
        success: {},
        error: {}
    }
) => {
    if (createdAccountName | !initialized) {
        return false
    } else {
        createdAccountName = true
    }

    return {
        mount: (element = 'paytheory-account-name') => {
            const container = document.getElementById(element)
            if (container) {
                if (!document.getElementById('paytheory-account-name-field')) {
                    const tagFrame = document.createElement(
                        'paytheory-account-name-tag-frame'
                    )
                    tagFrame.setAttribute('ready', true)
                    container.appendChild(tagFrame)
                    window.postMessage(
                        {
                            type: 'styles',
                            styles: styles
                        },
                        window.location.origin
                    )
                } else {
                    console.warn(
                        'element already exists',
                        'paytheory-account-name'
                    )
                }
            } else {
                console.error(element, 'is not available in dom')
            }
        },

        readyObserver: (readyCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data

                if (message.type === 'ready') {
                    readyCallback(message.ready)
                }
            })
        },
        transactedObserver: (transactedCallback) => {
            window.addEventListener('message', async (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'tokenized') {
                    const instrument = await postData(
                        `${transactionEndpoint}/${clientKey}/instrument`,
                        apiKey,
                        {
                            token: message.tokenized.data.id,
                            type: 'TOKEN',
                            identity: identity.id
                        }
                    )

                    const authorization = await postData(
                        `${transactionEndpoint}/${clientKey}/authorize`,
                        apiKey,
                        {
                            source: instrument.id,
                            amount: initializedAmount,
                            currency: 'USD'
                        }
                    )

                    transactedCallback({
                        last_four: instrument.last_four,
                        brand: instrument.brand,
                        ...authorization
                    })
                }
            })
        },
        errorObserver: (errorCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'error') {
                    errorCallback(message.error)
                }
            })
        },
        validObserver: (validCallback) => {
            window.addEventListener('message', (event) => {
                if (![window.location.origin].includes(event.origin)) return
                const message =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data
                if (message.type === 'valid') {
                    validCallback(message.valid)
                }
            })
        }
    }
}

const initTransaction = () => {
    if (createdAccountName | !initialized) return false

    window.postMessage(
        {
            type: 'transact',
            transact: true
        },
        window.location.origin
    )
}

export default {
    createCreditCard: createCreditCard,
    initTransaction: initTransaction,
    initialize: initialize
}
;(async () => {
    const an = await createAccountName()
    an.mount()
})()
