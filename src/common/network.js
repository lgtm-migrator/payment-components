import * as data from './data'
import * as message from './message'
export const postData = async(url, apiKey, data = {}) => {
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

const isValidTransaction = (tokenized) => {

    if (tokenized) {
        throw Error('transaction already initiated')
    }
}

export const invalidate = _t => (_t.isDirty ? _t.errorMessages.length > 0 : null)

export const transactionEndpoint = (() => {

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


const generateInstrument = async(host, clientKey, apiKey) => {
    const identityToken = data.getIdentity()['tags-token']
    const identity = { identityToken }
    return await postData(
        `${host}/${clientKey}/instrument`,
        apiKey,
        identity,
    )
}

const generateIdentity = async(host, clientKey, apiKey, identity) => {
    const paymentToken = data.getToken()
    const idToken = {
        paymentToken,
        identity
    }
    return await postData(
        `${host}/${clientKey}/identity`,
        apiKey,
        idToken
    )
}

const generateToken = async(host, clientKey, apiKey, message) => {
    const bin = data.getBin()
    const payload = {
        payment: message.tokenize ? message.tokenize : message.transact,
        bin
    }

    return await postData(
        `${host}/${clientKey}/token`,
        apiKey,
        payload,
    )
}

export const generateTokenize = (cb, host, clientKey, apiKey) => {
    return async message => {

        isValidTransaction(data.getToken())

        data.setToken(true)

        let token = await generateToken(host, clientKey, apiKey, message)

        if (token.state === 'error') {
            token = {
                type: token.reason,
                state: 'FAILURE'
            }
        }
        else {
            data.setToken(token.paymentToken)
        }

        cb({
            "first_six": token.bin.first_six,
            "brand": token.bin.brand,
            "receipt_number": token.idempotency,
            "amount": token.payment.amount,
            "convenience_fee": token.payment.convenience_fee
        })
    }
}

export const generateCapture = (cb, host, clientKey, apiKey, tags = {}) => {
    return async() => {

        isValidTransaction(data.getIdentity())

        data.setIdentity(true)

        const identity = await generateIdentity(host, clientKey, apiKey, data.getBuyer())

        data.setIdentity(identity)

        tags['pt-number'] = identity.idempotencyId

        const instrumental = await generateInstrument(host, clientKey, apiKey)

        const auth = {
            instrumentToken: instrumental['tags-token'],
            tags
        }



        const payment = await postData(
            `${host}/${clientKey}/authorize`,
            apiKey,
            auth
        )

        data.removeIdentity()
        data.removeToken()
        data.removeBuyer()
        data.removeBin()



        cb({
            receipt_number: identity.idempotencyId,
            last_four: instrumental.last_four,
            brand: instrumental.brand,
            type: payment.state === 'error' ? payment.reason : payment.type,
            created_at: payment.created_at,
            amount: payment.amount,
            convenience_fee: payment.convenience_fee,
            state: payment.state === 'PENDING' ? 'APPROVED' : payment.state === 'error' ? 'FAILURE' : payment.state,
            tags: payment.tags,
        })
    }
}

const determineType = payment => payment.state === 'error' ? payment.reason : payment.type
const determineState = payment => payment.state === 'PENDING' ? 'APPROVED' : payment.state === 'error' ? 'FAILURE' : payment.state
const processToken = token => {
    if (token.state === 'error') {
        token = {
            type: token.reason,
            state: 'FAILURE'
        }
    }
    else {
        data.setToken(token.paymentToken)
    }
}

export const generateTransacted = (cb, host, clientKey, apiKey, tags = {}) => {
    return async message => {
        //{ amount: amount, token: { bin: this.bin, ...res } }

        isValidTransaction(data.getToken())

        data.setToken(true)

        processToken(await generateToken(host, clientKey, apiKey, message))



        const identity = await generateIdentity(host, clientKey, apiKey, data.getBuyer())

        data.setIdentity(identity)

        tags['pt-number'] = identity.idempotencyId

        const instrumental = await generateInstrument(host, clientKey, apiKey)

        const auth = {
            instrumentToken: instrumental['tags-token'],
            tags
        }

        const payment = await postData(
            `${host}/${clientKey}/authorize`,
            apiKey,
            auth
        )

        data.removeIdentity()
        data.removeToken()
        data.removeBuyer()
        data.removeBin()


        cb({
            receipt_number: identity.idempotencyId,
            last_four: instrumental.last_four,
            brand: instrumental.brand,
            type: determineType(payment),
            created_at: payment.created_at,
            amount: payment.amount,
            convenience_fee: payment.convenience_fee,
            state: determineState(payment),
            tags: payment.tags,
        })
    }
}

export const generateInitialization = (handleInitialized, host) => {
    return async(amount, buyerOptions = {}, confirmation = false) => {
        if (typeof amount === 'number' && Number.isInteger(amount) && amount > 0) {
            handleInitialized(amount, buyerOptions, confirmation)
        }
        else {
            return message.handleError('amount must be a positive integer')
        }
    }
}
