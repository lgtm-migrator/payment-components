import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers'
import sinon from 'sinon';

import * as common from './common'
import createCreditCard from '../src/field-set/combined'

describe('createCreditCard', () => {
    let error;

    beforeEach(() => {
        error = undefined;
        window.onerror = (e) => error = e;
    });

    it('renders finix iframes', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;
    });

    it('renders finix iframes with custom element id', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card-custom" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card-custom');

        await expect(ccTag).to.be.ok;

        await creditCard.mount('pay-theory-credit-card-custom');

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-custom-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;
    });

    it('cannot render finix frames', async() => {

        const fixed = await fixture(html ` <div id="not-the-div-youre-looking-for" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500)

        const wrongDiv = await document.getElementById('not-the-div-youre-looking-for');

        await expect(wrongDiv).to.be.ok;

        await creditCard.mount()

        await aTimeout(200)

        await expect(error).to.be.ok;
    });

    it('initTransaction sets transact to true', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.transact).to.not.be;

        await creditCard.initTransaction()

        await expect(ccTagFrame.transact).to.be;
    });

    it('readyObserver triggers on ready message from mount', async() => {
        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        let ready;

        const readied = () => ready = true;

        await creditCard.readyObserver(readied);

        await aTimeout(100);

        await expect(ready).to.not.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        await expect(ready).to.be.ok;
    });

    it('transactedObserver runs on tokenized message', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await aTimeout(200);

        const spy = sinon.spy()

        await creditCard.transactedObserver(spy)

        await assert(spy.notCalled)

        window.postMessage({
                type: 'tokenized',
                tokenized: {
                    data: {
                        id: 'testId'
                    }
                },
            },
            window.location.origin,
        );

        await aTimeout(300)

        await assert(spy.calledWith(common.MOCK_TRANSACT))
    });

    it('errorObserver triggers on error message', async() => {

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        let testError;

        const errored = () => testError = true;

        await creditCard.errorObserver(errored);

        expect(testError).to.not.be.ok;

        window.postMessage({
                type: 'error',
                error: 'test',
            },
            window.location.origin,
        );

        await aTimeout(100);

        expect(testError).to.be.ok;
    })

    it('validObserver triggers on valid message', async() => {

        const creditCard = await createCreditCard(common.api, common.client, 2500);

        const spy = sinon.spy();

        await creditCard.validObserver(spy);

        assert(spy.notCalled)

        window.postMessage({
                type: 'credit-card-valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.called)
    })
});
