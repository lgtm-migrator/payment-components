import common from '../common'

//relays state to the hosted fields to tokenize the instrument
const verifyRelay = (fields, message) => {
    fields.forEach((field) => {
        if (document.getElementsByName(field)[0]) {
            common.postMessageToHostedField(field, message)
        }
    });
};

const autofillHandler = (message) => {
    if (message.element === "card-autofill") {
        const cardFields = [
            "card-name-iframe",
            "card-cvv-iframe",
            "card-exp-iframe"
        ];
        verifyRelay(cardFields, message);
    }
    else if (message.element === "address-autofill") {
        const addressFields = [
            "billing-line2-iframe",
            "billing-city-iframe",
            "billing-state-iframe",
            "billing-zip-iframe"
        ];
        verifyRelay(addressFields, message);
    }
}

//Relay messages from hosted fields to the transacting element for autofill and transacting
export const relayHandler = () => message => {
    if (message.element.endsWith("autofill")) {
        common.setAutofill(true)
        autofillHandler(message)
    }
    else {
        const fieldType = common.isFieldType(message.element)
        common.postMessageToHostedField(common.hostedFieldMap[fieldType], message)
    }
};


//Send styles to hosted fields when they are set up
export const setupHandler = (styles, setupTransacting) => (message) => {
    common.postMessageToHostedField(`${message.element}-iframe`, {
        type: "pt:setup",
        style: styles.default ? styles : common.defaultStyles
    })

    if (setupTransacting[message.element]) {
        common.postMessageToHostedField(`${message.element}-iframe`, {
            type: `pt-static:elements`,
            elements: JSON.parse(JSON.stringify(setupTransacting[message.element]))
        })
    }
}

const sendConnectedMessage = (message, field) => {
    common.postMessageToHostedField(`${field}-iframe`, {
        type: `pt-static:connected`,
        hostToken: message.hostToken,
        sessionKey: message.sessionKey,
        publicKey: message.publicKey
    })
}

//Sends a message to the sibling fields letting them know that the transactional field has fetched the the host-token
export const siblingHandler = (elements) => message => {
    if (message.field === 'card-number') {
        elements.card.forEach(field => {
            if (field.type !== 'credit-card') {
                sendConnectedMessage(message, field.type)
            }
            else {
                sendConnectedMessage(message, 'card-cvv')
                sendConnectedMessage(message, 'card-exp')
            }

        })
    }
    else if (message.field === 'account-number') {
        elements.ach.forEach(field => {
            sendConnectedMessage(message, field.type)
        })
    }
    else if (message.field === 'cash-name') {
        elements.cash.forEach(field => {
            sendConnectedMessage(message, field.type)
        })
    }
}


const combinedCardStateUpdater = (element, elementArray) => {
    let result = elementArray.reduce(common.findTransactingElement, false)
    if (result.field === 'credit-card') {
        return result
    }
    else {
        return elementArray.reduce(common.findField(element), false)
    }
}

//Handles state messages and sets state on the web components
export const stateUpdater = elements => (message) => {
    let element = {}
    if (common.combinedCardTypes.includes(message.element)) {
        element = combinedCardStateUpdater(message.element, elements.card)
    }
    else {
        let ach = elements.ach.reduce(common.findField(message.element), false)
        let card = elements.card.reduce(common.findField(message.element), false)
        let cash = elements.cash.reduce(common.findField(message.element), false)
        element = ach ? ach : card ? card : cash
    }

    let state = message.state
    state.element = message.element
    element.state = state
}


export const hostedErrorHandler = message => {
    common.removeInitialize()
    common.handleError(message.error)
}
