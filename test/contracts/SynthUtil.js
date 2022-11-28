'use strict';

const { contract } = require('hardhat');
const { assert, addSnapshotBeforeRestoreAfterEach } = require('./common');
const { toBytes32 } = require('../..');
const { toUnit, currentTime } = require('../utils')();
const { setExchangeFeeRateForSynths } = require('./helpers');

const { setupAllContracts } = require('./setup');

contract('SynthUtil', accounts => {
	const [, ownerAccount, oracle, account2] = accounts;
	let synthUtil, zUSDContract, synthetix, exchangeRates, timestamp, systemSettings, debtCache;

	const [zUSD, zBTC, iBTC] = ['zUSD', 'zBTC', 'iBTC'].map(toBytes32);
	const synthKeys = [zUSD, zBTC, iBTC];
	const synthPrices = [toUnit('1'), toUnit('5000'), toUnit('5000')];

	before(async () => {
		({
			SynthUtil: synthUtil,
			ZassetzUSD: zUSDContract,
			Synthetix: synthetix,
			ExchangeRates: exchangeRates,
			SystemSettings: systemSettings,
			DebtCache: debtCache,
		} = await setupAllContracts({
			accounts,
			synths: ['zUSD', 'zBTC', 'iBTC'],
			contracts: [
				'SynthUtil',
				'Synthetix',
				'Exchanger',
				'ExchangeRates',
				'ExchangeState',
				'FeePoolState',
				'FeePoolEternalStorage',
				'SystemSettings',
				'DebtCache',
				'Issuer',
				'CollateralManager',
				'RewardEscrowV2', // required for issuer._collateral to read collateral
			],
		}));
	});

	addSnapshotBeforeRestoreAfterEach();

	beforeEach(async () => {
		timestamp = await currentTime();
		await exchangeRates.updateRates([zBTC, iBTC], ['5000', '5000'].map(toUnit), timestamp, {
			from: oracle,
		});
		await debtCache.takeDebtSnapshot();

		// set a 0% default exchange fee rate for test purpose
		const exchangeFeeRate = toUnit('0');
		await setExchangeFeeRateForSynths({
			owner: ownerAccount,
			systemSettings,
			synthKeys,
			exchangeFeeRates: synthKeys.map(() => exchangeFeeRate),
		});
	});

	describe('given an instance', () => {
		const zUSDMinted = toUnit('10000');
		const amountToExchange = toUnit('50');
		const zUSDAmount = toUnit('100');
		beforeEach(async () => {
			await synthetix.issueSynths(zUSDMinted, {
				from: ownerAccount,
			});
			await zUSDContract.transfer(account2, zUSDAmount, { from: ownerAccount });
			await synthetix.exchange(zUSD, amountToExchange, zBTC, { from: account2 });
		});
		describe('totalSynthsInKey', () => {
			it('should return the total balance of synths into the specified currency key', async () => {
				assert.bnEqual(await synthUtil.totalSynthsInKey(account2, zUSD), zUSDAmount);
			});
		});
		describe('synthsBalances', () => {
			it('should return the balance and its value in zUSD for every synth in the wallet', async () => {
				const effectiveValue = await exchangeRates.effectiveValue(zUSD, amountToExchange, zBTC);
				assert.deepEqual(await synthUtil.synthsBalances(account2), [
					[zUSD, zBTC, iBTC],
					[toUnit('50'), effectiveValue, 0],
					[toUnit('50'), toUnit('50'), 0],
				]);
			});
		});
		describe('synthsRates', () => {
			it('should return the correct synth rates', async () => {
				assert.deepEqual(await synthUtil.synthsRates(), [synthKeys, synthPrices]);
			});
		});
		describe('synthsTotalSupplies', () => {
			it('should return the correct synth total supplies', async () => {
				const effectiveValue = await exchangeRates.effectiveValue(zUSD, amountToExchange, zBTC);
				assert.deepEqual(await synthUtil.synthsTotalSupplies(), [
					synthKeys,
					[zUSDMinted.sub(amountToExchange), effectiveValue, 0],
					[zUSDMinted.sub(amountToExchange), amountToExchange, 0],
				]);
			});
		});
	});
});
