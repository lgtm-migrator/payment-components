# Pay Theory Web SDK

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d446eeab0c444274bfa00aceca3f0875)](https://www.codacy.com/gh/pay-theory/payment-components?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pay-theory/payment-components&amp;utm_campaign=Badge_Grade) [![Known Vulnerabilities](https://snyk.io/test/github/pay-theory/payment-components/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pay-theory/payment-components?targetFile=package.json) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![NPM](https://img.shields.io/npm/v/@paytheory/payment-components.svg)](https://www.npmjs.com/package/@paytheory/payment-components)

## Install

```bash
npm install --save @paytheory/payment-components@beta
```

## Import

```javascript
import '@paytheory/payment-components@beta'
```

or

```html
<script src="https://stage.sdk.paytheorystudy.com"></script>
```

either way the SDK will be exposed as

```javascript
window.paytheory
```

## Usage

There are two approaches for you to choose from for your implementation.

### Credit Card Element

[codesandbox credit card element example](https://codesandbox.io/s/payment-example-combined-1i61g?file=/public/index.html)

The credit card element provides a single form entry combining:

-   credit card number
-   credit card CVV security code
-   credit card expiration date
-   credit card zip code

Requires a container for the credit card input:

```html
<form>
...
<div id="pay-theory-credit-card" />
...
</form>
```

### Credit Card Fields Elements

[codesandbox credit card fields example](https://codesandbox.io/s/payment-examples-split-pvtfi?file=/public/index.html)

The credit card fields elements provide distinct entries for:

-   credit card account name
-   credit card number
-   credit card CVV security code
-   credit card expiration date
-   credit card zip code

These entries can be placed wherever you prefer.

Requires a container for each of the inputs:

```html
<form>
...
<div id="pay-theory-credit-card-account-name" />
<div id="pay-theory-credit-card-number" />
<div id="pay-theory-credit-card-cvv" />
<div id="pay-theory-credit-card-expiration" />
<div id="pay-theory-credit-card-zip" />
...
</form>
```

## Handle state with callbacks

Mount to create the credit card field(s) and establish callbacks:

```javascript

// API KEY and CLIENT ID are required
const API_KEY = 'your-api-key'
const CLIENT_ID = 'your-client-id'

// optionally define custom styles for the input elements
const STYLES = {
    default: {
        color: 'black',
        fontSize: '14px'
    },
    success: {
        color: '#5cb85c',
        fontSize: '14px'
    },
    error: {
        color: '#d9534f',
        fontSize: '14px'
    }
}

// optionally provide custom tags to help track purchases
const TAGS = { YOUR_TAG_KEY: 'YOUR_TAG_VALUE' }

// create a place to store the credit card
let myCreditCard
const USE_SINGLE_FIELD = true

(async() => {
    /*
    * initialize the SDK (can also be called as a promise)
    *
    * if providing tags but no styles, provide an empty object
    * as a placeholder
    */
    let myCreditCardConstructor

    if (USE_SINGLE_FIELD) {
        // for single field call createCreditCard
        myCreditCardConstructor = window.paytheory.createCreditCard
    } else {
        // for multiple fields call createCreditCardFields
        myCreditCardConstructor = window.paytheory.createCreditCardFields
    }

    myCreditCard = await myCreditCardConstructor(
        API_KEY,
        CLIENT_ID,
        AMOUNT,
        STYLES,
        TAGS)

    // mount the hosted fields into the container
    myCreditCard.mount()

    // handle callbacks
    myCreditCard.readyObserver(ready => {
        // ready is a boolean indictor
        // fires when SDK is loaded and ready
    })

    myCreditCard.transactedObserver(transactionResult => {
        // results of the transaction
        // fires once when transaction is completed
    })

    myCreditCard.validObserver(valid => {
        // valid is a boolean indictor
        // fires every time the valid state of the hosted field changes
    })

    myCreditCard.errorObserver(error => {
        // error is false or a message
        // fires every time the error state/message changes
    })

})()

```

## Initiate the transaction

When ready submit the transaction using the saved credit card:

```javascript
// optionally provide details about the buyer
const BUYER_OPTIONS = {
    "first_name": "Some",
    "last_name": "Body",
    "email": "somebody@gmail.com",
    "phone": "3335554444",
    "personal_address": {
        "city": "Somewhere",
        "country": "USA",
        "region": "OH",
        "line1": "123 Street St",
        "line2": "Apartment 17",
        "postal_code": "12345"
    }

// begin the transaction authorization using saved credit card entry
myCreditCard.initTransaction(BUYER_OPTIONS)
```

## Completion response

Upon completion of authorization and capture, the following details are returned:

```json
{
    "last_four":"4242",
    "brand":"VISA",
    "type":"DEBIT",
    "receipt_number":"pt-test-000002",
    "state":"APPROVED"
}
```

## Polyfill and IE 11

To enable IE 11 support you must include the following in your HTML head:

```html
<head>
    <!--
        you can find the latest versions of these at the following links
        https://cdnjs.com/libraries/webcomponentsjs
        https://cdnjs.com/libraries/core-js
    -->

    <!-- begin polyfill -->
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/core-js/3.6.5/minified.js"
      integrity="sha512-il4gs09hawMRQdgVPe9NUODC2gBmQ3lX15lMK1y/WWAkfRRd94yET47NgghJZBSJcPW6ZrqyIziQIT6dI7I3KA=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.4.4/webcomponents-bundle.js"
      integrity="sha512-bZ7i/n59i3BPUaM+5s7WiMcE3tlVqk9HV4GrpcFfWWhsCYtZa+0MZ4LXl2zhjBsmNGmOOVbjk8WvSNa4wdxYNg=="
      crossorigin="anonymous"
    ></script>
    <!-- end polyfill -->

    <script src="https://stage.sdk.paytheorystudy.com"></script>

</head>
```

## License

MIT © [pay theory](https://github.com/pay-theory)
