/* global localStorage */
import common from './common'

export default async(
    apiKey,
    clientKey,
    amount,
    styles = common.defaultStyles,
    tags = common.defaultTags,
    host = common.transactionEndpoint
) => {
    let identity = false

    let setReady = false

    let readyNumber = false
    let readyName = true
    let readyCVV = true
    let readyExpiration = true
    let readyZip = true

    let validName = true
    let validNumber = false
    let validCVV = false
    let validExpiration = false
    let validZip = true

    let formed = false

    let isValid = false
    let isReady = false

    let processedElements = []
    let transactingElement

    const handleInialized = () => {
        if (transactingElement.frame) {
            transactingElement.frame.transact = true
        }
        else {
            transactingElement.transact = true
        }
    }

    const establishElements = (forming, elements) => {
        processedElements = common.processElements(formed, elements, styles)
        transactingElement = common.processedElements.reduce(common.findTransactingElement)
    }

    const mount = async(
        elements = {
            'account-name': common.fields.CREDIT_CARD_NAME,
            number: common.fields.CREDIT_CARD_NUMBER,
            cvv: common.fields.CREDIT_CARD_CVV,
            expiration: common.fields.CREDIT_CARD_EXPIRATION,
            zip: common.fields.CREDIT_CARD_ZIP,
        },
    ) => {
        if (formed) {
            establishElements(formed, elements)
            return
        }
        else {
            const handleState = state => {
                let errors = []

                processedElements.forEach(element => {

                    const [, stated, invalidElement] = common.stateMapping(element.type)

                    if (element.frame.field === element.type) {
                        element.frame.valid = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                        if (invalidElement) {
                            errors.push(stated.errorMessages[0])
                            element.frame.error = stated.errorMessages[0]
                        }
                        else {
                            element.frame.error = false
                        }
                    }
                })
            }

            const handleFormed = finalForm => {
                establishElements(finalForm, elements)
            }

            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const initTransaction = common.generateInitialization(handleInialized, host, clientKey, apiKey)

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            let calling = false

            let processed = false

            if (!message.type.endsWith('-ready')) { return }

            if (!setReady) {
                processedElements.forEach(element => {
                    switch (element.type) {
                    case 'name':
                        {
                            readyName = false
                            setReady = true
                            break
                        }
                    case 'cvv':
                        {
                            readyCVV = false
                            setReady = true
                            break
                        }
                    case 'number':
                        {
                            readyNumber = false
                            setReady = true
                            break
                        }
                    case 'expiration':
                        {
                            readyExpiration = false
                            setReady = true
                            break
                        }
                    case 'zip':
                        {
                            readyZip = false
                            setReady = true
                            break
                        }
                    default:
                        {
                            break
                        }
                    }
                })
            }

            const readyType = message.type.split('-')[0]

            if (!processedElements.map(element => element.type).includes(`${readyType}`)) { return }

            switch (readyType) {
            case 'name':
                {
                    readyName = message.ready
                    calling = true
                    break
                }
            case 'cvv':
                {
                    readyCVV = message.ready
                    calling = true
                    break
                }
            case 'number':
                {
                    readyNumber = message.ready
                    calling = true
                    break
                }
            case 'expiration':
                {
                    readyExpiration = message.ready
                    calling = true
                    break
                }
            case 'zip':
                {
                    readyZip = message.ready
                    calling = true
                    break
                }
            default:
                {
                    break
                }
            }
            const readying = (readyCVV && readyNumber && readyExpiration && readyName && readyZip)
            if (isReady !== readying) {
                isReady = readying
                if (calling) {
                    cb(isReady)
                }
            }
        })

    const validObserver = cb => common.handleMessage(
        message => {
            const validType = message.type.split('-')[0]
            return message.type.endsWith('-valid') && processedElements.map(element => element.type).includes(`${validType}`)
        },
        message => {
            const validType = message.type.split('-')[0]
            let calling = false

            switch (validType) {
            case 'name':
                {
                    validName = message.valid
                    calling = true
                    break
                }
            case 'cvv':
                {
                    validCVV = message.valid
                    calling = true
                    break
                }
            case 'number':
                {
                    validNumber = message.valid
                    calling = true
                    break
                }
            case 'expiration':
                {
                    validExpiration = message.valid
                    calling = true
                    break
                }
            case 'zip':
                {
                    validZip = message.valid
                    calling = true
                    break
                }
            default:
                {
                    break
                }
            }

            const validating = (validCVV && validNumber && validExpiration && validZip && validName)

            if (isValid !== validating) {
                isValid = validating
                if (calling) {
                    cb(isValid)
                }
            }
        })

    return {
        mount,

        initTransaction,

        readyObserver,

        transactedObserver: common.transactedObserver(host, clientKey, apiKey, amount),

        errorObserver: common.errorObserver,

        validObserver,
    }
}
