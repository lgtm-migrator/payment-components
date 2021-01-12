import common from '../common'

export default async(
    apiKey,
    legacy, // this used to be client id, left in place to preserve backwards compatibility
    styles = common.defaultStyles,
    tags = common.defaultTags,
    fee_mode = common.defaultFeeMode,
    host = common.transactionEndpoint
) => {
    const validTypes = {
        'credit-card': false,
        'number': false,
        'exp': false,
        'cvv': false,
        'account-name': true,
        'address-1': true,
        'address-2': true,
        'city': true,
        'state': true,
        'zip': true,
        'account-number': false,
        'bank-code': false,
        'ach-name': false,
        'account-type': false
    }

    const isCallingType = type => Object.keys(validTypes).includes(type)

    const hasValidCard = types =>
        (types['credit-card'] || (types.number && types.cvv && types.exp))

    const hasValidStreetAddress = types =>
        (types['address-1'] && types['address-2'])

    const hasValidAddress = types =>
        (hasValidStreetAddress(types) && types.city && types.state && types.zip)

    const hasValidDetails = types =>
        (types['account-name'] && hasValidAddress(types))

    const hasValidAccount = types =>
        (types['account-number'] && types['account-type'] && types['ach-name'] && types['bank-code'])

    const findCardNumberError = processedElements => {
        let error = false
        if (processedElements.reduce(common.findExp, false) === false) {
            error = 'missing credit card expiration field required for payments'
        }

        if (processedElements.reduce(common.findCVV, false) === false) {
            error = 'missing credit card CVV field required for payments'
        }

        if (document.getElementById(`pay-theory-credit-card`)) {
            error = 'credit card element is not allowed when using credit card number'
        }
        return error
    }

    const findCombinedCardError = processedElements => {
        let error = false
        if (processedElements.reduce(common.findExp, false)) {
            error = 'expiration is not allowed when using combined credit card'
        }

        if (processedElements.reduce(common.findCVV, false)) {
            error = 'cvv is not allowed when using combined credit card'
        }

        if (document.getElementById(`pay-theory-credit-card-number`)) {
            error = 'credit card number is not allowed when using combined credit card'
        }
        return error
    }

    const findAchError = (processedElements) => {
        let error = false
        if (processedElements.length === 0) {
            return error
        }

        if (processedElements.reduce(common.findAccountName, false) === false) {
            error = 'missing ACH account name field required for payments'
        }

        if (processedElements.reduce(common.findAccountNumber, false) === false) {
            error = 'missing ACH account number field required for payments'
        }

        if (processedElements.reduce(common.findAccountType, false) === false) {
            error = 'missing ACH account type field required for payments'
        }

        if (processedElements.reduce(common.findBankCode, false) === false) {
            error = 'missing ACH bank code field required for payments'
        }

        return error
    }

    const findCardError = (transacting, processedElements) => {
        let error = false
        if (processedElements.length === 0) {
            return error
        }

        if (transacting === false) {
            error = 'missing credit card entry field required for payments'
        }
        else if (transacting.id === 'pay-theory-credit-card-number-tag-frame') {
            error = findCardNumberError(processedElements)
        }
        else {
            error = findCombinedCardError(processedElements)
        }
        return error
    }



    let formed = false

    let isValid = false

    let processedCardElements = []
    let processedACHElements = []

    let transacting = {}

    let isReady = false

    let achInitialized = false
    let ccInitialized = false

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const establishElements = (elements) => {
        return common.processElements(elements, styles)
    }

    const isValidFrame = invalidElement => typeof invalidElement === 'undefined' ?
        invalidElement :
        !invalidElement

    const handleElement = (element, errors, invalidElement, stated) => {
        if (invalidElement) {
            errors.push(stated.errorMessages[0])
            element.frame.error = stated.errorMessages[0]
        }
        else {
            element.frame.error = false
        }
    }

    const stateHandler = elements => state => {
        let errors = []
        elements.forEach(element => {
            const [, stated, invalidElement] = common.stateMapping(element.type, state)

            if (stated.isDirty) {
                element.frame.valid = isValidFrame(invalidElement)

                handleElement(element, errors, invalidElement, stated)
            }

        })
    }

    //fetches token for pt-hosted fields
    const token = await common.getData(`${common.transactionEndpoint}/pt-token`, apiKey)

    //sends styles to hosted fields when they are set up
    const setupHandler = (message) => {
        console.log(apiKey, 'api')
        document.getElementById(`${message.element}-iframe`).contentWindow.postMessage({
                type: "pt:setup",
                style: styles.default ? styles : common.defaultStyles
            },
            common.hostedFieldsEndpoint,
        );
    }

    //relays state to the hosted fields to tokenize the instrument
    const relayHandler = message => {
        document.getElementById(`account-number-iframe`).contentWindow.postMessage(message,
            common.hostedFieldsEndpoint,
        );
    }


    common.handleHostedFieldMessage(common.hostedReadyTypeMessage, setupHandler)
    common.handleHostedFieldMessage(common.relayTypeMessage, relayHandler)

    const mount = async(
        elements = {
            'credit-card': common.fields.CREDIT_CARD,
            'number': common.fields.CREDIT_CARD_NUMBER,
            'exp': common.fields.CREDIT_CARD_EXP,
            'cvv': common.fields.CREDIT_CARD_CVV,
            'account-name': common.fields.CREDIT_CARD_NAME,
            'address-1': common.fields.CREDIT_CARD_ADDRESS1,
            'address-2': common.fields.CREDIT_CARD_ADDRESS2,
            city: common.fields.CREDIT_CARD_CITY,
            state: common.fields.CREDIT_CARD_STATE,
            zip: common.fields.CREDIT_CARD_ZIP,
            'account-number': common.achFields.ACCOUNT_NUMBER,
            'ach-name': common.achFields.ACCOUNT_NAME,
            'bank-code': common.achFields.BANK_CODE,
            'account-type': common.achFields.ACCOUNT_TYPE,
        },
    ) => {
        const achElements = {
            'account-number': elements['account-number'],
            'account-name': elements['ach-name'],
            'bank-code': elements['bank-code'],
            'account-type': elements['account-type'],
        }

        const cardElements = {
            'credit-card': elements['credit-card'],
            'number': elements.number,
            'exp': elements.exp,
            'cvv': elements.cvv,
            'account-name': elements['account-name'],
            'address-1': elements['address-1'],
            'address-2': elements['address-2'],
            city: elements.city,
            state: elements.state,
            zip: elements.zip,
        }

        processedCardElements = establishElements(cardElements)
        processedACHElements = common.processAchElements(achElements, styles, token['pt-token'])
        transacting.card = processedCardElements.reduce(common.findTransactingElement, false)
        transacting.ach = processedACHElements.reduce(common.findAccountNumber, false)

        if (processedACHElements.length === 0 && processedCardElements.length === 0) {
            return common.handleError('There are no PayTheory fields')
        }

        if (processedCardElements.length > 0) {
            ccInitialized = true
            const handleState = stateHandler(processedCardElements)
            const handleFormed = finalForm => {
                let error = findCardError(transacting.card, processedCardElements)
                if (error) {
                    return common.handleError(error)
                }

                processedCardElements.forEach(processed => {
                    processed.frame.form = finalForm
                })

                if (achInitialized || processedACHElements.length === 0) {
                    window.postMessage({
                            type: `pay-theory:ready`,
                            ready: true
                        },
                        window.location.origin,
                    )
                }
            }

            if (!formed) {
                common.appendFinix(formed, handleState, handleFormed)
            }
        }

        if (processedACHElements.length > 0) {
            achInitialized = true
            let error = findAchError(processedACHElements)
            if (error) {
                return common.handleError(error)
            }

            processedACHElements.forEach(processed => {
                processed.frame.form = true
            })

            const instrumentHandler = message => {
                common.setInstrument(message.instrument)
                transacting.ach.instrument = message.instrument
            }

            const stateUpdater = (message) => {
                let element
                switch (message.element) {
                case 'account-name':
                    {
                        element = processedACHElements.reduce(common.findAccountName, false)
                        break
                    }
                case 'account-number':
                    {
                        element = processedACHElements.reduce(common.findAccountNumber, false)
                        break
                    }
                case 'account-type':
                    {
                        element = processedACHElements.reduce(common.findAccountType, false)
                        break
                    }
                case 'bank-code':
                    {
                        element = processedACHElements.reduce(common.findBankCode, false)
                        break
                    }
                }
                element.state = message.state
            }

            common.handleHostedFieldMessage(common.stateTypeMessage, stateUpdater)
            common.handleHostedFieldMessage(common.instrumentTypeMessage, instrumentHandler)

            if (ccInitialized || processedCardElements.length === 0) {
                window.postMessage({
                        type: `pay-theory:ready`,
                        ready: true
                    },
                    window.location.origin,
                )
            }
        }
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)

        if (common.isHidden(transacting.card) === false && (isValid === 'card' || isValid === 'both')) {
            const framed = transacting.card.frame ? transacting.card.frame : transacting.card
            common.setTransactingElement(framed)
            framed[action] = amount
        }

        if (common.isHidden(transacting.ach) === false && (isValid === 'ach' || isValid === 'both')) {
            const framed = transacting.ach.frame ? transacting.ach.frame : transacting.ach
            common.setTransactingElement(framed)
            framed.amount = amount
            framed.action = action
        }
    }

    const initTransaction = common.generateInitialization(handleInitialized)

    const confirm = () => {

        let transactor = {}

        if (common.getTransactingElement() === 'pay-theory-ach-account-number-tag-frame') {
            transactor = transacting.card.frame ? transacting.card.frame : transacting.card
        }
        else if (common.getTransactingElement()) {
            transactor = transacting.ach.frame ? transacting.ach.frame : transacting.ach
        }

        transactor.capture = true

    }

    const cancel = () => {
        if (common.getTransactingElement() === 'pay-theory-ach-account-number-tag-frame') {
            let transactor = transacting.ach.frame ? transacting.ach.frame : transacting.ach
            common.removeIdentity()
            common.removeToken()
            common.removeTransactingElement()
            transactor.instrument = 'cancel'
        }
        else if (common.getTransactingElement()) {
            let transactor = transacting.card.frame ? transacting.card.frame : transacting.card
            transactor['tokenize'] = false
            common.removeIdentity()
            common.removeToken()
            common.removeTransactingElement()
        }
    }

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (message.type === 'pay-theory:ready' & !isReady && common.getReady() === null) {
                common.setReady(true)
                isReady = message.ready
                cb(message.ready)
            }
        })

    const validObserver = cb => common.handleMessage(
        message => {
            if (typeof message.type === 'string') {
                const validType = message.type.split(':')[1]
                return message.type.endsWith(':valid') && (processedCardElements.map(element => element.type).includes(`${validType}`) || processedACHElements.map(element => element.type).includes(`${validType}`))
            }
            return false
        },
        message => {
            const field = message.type.split(':')[1]
            const type = field === 'account-name' && message.hosted ? 'ach-name' : field

            let validating = false



            if (typeof validTypes[type] !== 'undefined') {

                validTypes[type] = message.valid

                const validatingCard = hasValidCard(validTypes)

                const validatingDetails = hasValidDetails(validTypes)

                const validAch = hasValidAccount(validTypes)

                validating = (validatingCard && validatingDetails && validAch) ? 'both' : (validatingCard && validatingDetails) ? 'card' : validAch ? 'ach' : false

                if (isCallingType(type) && isValid !== validating) {
                    isValid = validating
                    cb(isValid)
                }
            }
        })
    return common.generateReturn(mount, initTransaction, confirm, cancel, readyObserver, validObserver, { host, apiKey, fee_mode }, tags)
}
