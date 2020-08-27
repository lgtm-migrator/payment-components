const fields = {
    CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
    CREDIT_CARD_CVV: 'pay-theory-credit-card-cvv',
    CREDIT_CARD_EXPIRATION: 'pay-theory-credit-card-expiration',
    CREDIT_CARD_NUMBER: 'pay-theory-credit-card-number',
    CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

const fieldTypes = ['cvv', 'account-name', 'expiration', 'number', 'zip']

const stateMap = {
    'account-name': 'name',
    'cvv': 'security_code',
    'expiration': 'expiration_date',
    'zip': 'address.postal_code'
}

const postData = async(url, apiKey, data = {}) => {
    const options = {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
    }
    /* global fetch */
    const response = await fetch(url, options)
    return await response.json()
}

const addFrame = (
    form,
    container,
    element,
    styles,
    frameType = 'pay-theory-credit-card-tag-frame',
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.form = form
    tagFrame.setAttribute('ready', true)
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}



const processElement = (form, element, styles) => {
    if (typeof element !== 'string') throw new Error('invalid element')
    const container = document.getElementById(element)
    if (container) {
        const contained = document.getElementById(`${element}-tag-frame`)
        if (contained === null) {
            const framed = addFrame(form, container, element, styles)
            return framed
        }
        else {
            throw new Error(`${element} is already mounted`)
        }
    }
    else {
        throw new Error(`${element} is not available in dom`)
    }
}

const processElements = (form, elements, styles) => {
    let processed = []
    fieldTypes.forEach(type => {
        if (elements[type] && typeof elements[type] !== 'string') throw new Error('invalid element')
        const container = document.getElementById(elements[type])
        if (container) {
            const contained = document.getElementById(`${elements[type]}-tag-frame`)
            if (contained === null) {
                const frame = addFrame(form, container, elements[type], styles, `pay-theory-credit-card-${type}-tag-frame`)
                processed.push({ type: type, frame: frame })
            }
            else {
                throw new Error(`${elements[type]} is already mounted`)
            }
        }
        else {
            /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
            console.warn(`${elements[type]} is not available in dom`)
        }

    })
    return processed
}

const invalidate = _t => (_t.isDirty ? _t.errorMessages.length > 0 : undefined)

const transactionEndpoint = (() => {

    switch (process.env.BUILD_ENV) {
    case 'prod':
        {
            return `https://tags.api.paytheory.com`
        }
    case 'stage':
        {
            return `https://demo.tags.api.paytheorystudy.com`
        }
    default:
        {
            return `https://dev.tags.api.paytheorystudy.com`
        }
    }
})()

export {
    postData,
    addFrame,
    processElement,
    processElements,
    invalidate,
    transactionEndpoint,
    fields,
    fieldTypes,
    stateMap
}
