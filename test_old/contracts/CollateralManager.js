'use strict';

const { artifacts, contract } = require('hardhat');

const { assert, addSnapshotBeforeRestoreAfterEach } = require('./common');

const { toUnit, currentTime, fastForward } = require('../utils')();

const { setupAllContracts, setupContract } = require('./setup');

const { ensureOnlyExpectedMutativeFunctions } = require('./helpers');

const {
	toBytes32,
	constants: { ZERO_ADDRESS },
} = require('../..');

let CollateralState;

contract('CollateralManager', async accounts => {
	const [deployerAccount, owner, oracle, , account1] = accounts;

	const zBNB = toBytes32('zBNB');
	const zUSD = toBytes32('zUSD');
	const zBTC = toBytes32('zBTC');

	const INTERACTION_DELAY = 300;

	const oneRenBTC = 100000000;

	let ceth,
		mcstate,
		mcstateErc20,
		cerc20,
		proxy,
		renBTC,
		tokenState,
		manager,
		managerState,
		addressResolver,
		issuer,
		exchangeRates,
		feePool,
		zUSDSynth,
		zBNBSynth,
		zBTCSynth,
		synths,
		maxDebt,
		short,
		shortState,
		debtCache,
		tx,
		id;

	const getid = tx => {
		const event = tx.logs.find(log => log.event === 'LoanCreated');
		return event.args.id;
	};

	const deployEthCollateral = async ({
		mcState,
		owner,
		manager,
		resolver,
		collatKey,
		minColat,
		minSize,
	}) => {
		return setupContract({
			accounts,
			contract: 'CollateralEth',
			args: [mcState, owner, manager, resolver, collatKey, minColat, minSize],
		});
	};

	const deployErc20Collateral = async ({
		mcState,
		owner,
		manager,
		resolver,
		collatKey,
		minColat,
		minSize,
		underCon,
		decimals,
	}) => {
		return setupContract({
			accounts,
			contract: 'CollateralErc20',
			args: [mcState, owner, manager, resolver, collatKey, minColat, minSize, underCon, decimals],
		});
	};

	const deployShort = async ({ state, owner, manager, resolver, collatKey, minColat, minSize }) => {
		return setupContract({
			accounts,
			contract: 'CollateralShort',
			args: [state, owner, manager, resolver, collatKey, minColat, minSize],
		});
	};

	const issue = async (synth, issueAmount, receiver) => {
		await synth.issue(receiver, issueAmount, { from: owner });
	};

	const updateRatesWithDefaults = async () => {
		const timestamp = await currentTime();

		await exchangeRates.updateRates([zBNB], ['100'].map(toUnit), timestamp, {
			from: oracle,
		});

		const zBTC = toBytes32('zBTC');

		await exchangeRates.updateRates([zBTC], ['10000'].map(toUnit), timestamp, {
			from: oracle,
		});
	};

	const fastForwardAndUpdateRates = async seconds => {
		await fastForward(seconds);
		await updateRatesWithDefaults();
	};

	const setupManager = async () => {
		synths = ['zUSD', 'zBTC', 'zBNB', 'iBTC', 'iBNB'];
		({
			ExchangeRates: exchangeRates,
			ZassetzUSD: zUSDSynth,
			ZassetzBNB: zBNBSynth,
			ZassetzBTC: zBTCSynth,
			FeePool: feePool,
			AddressResolver: addressResolver,
			Issuer: issuer,
			DebtCache: debtCache,
			CollateralManager: manager,
			CollateralManagerState: managerState,
		} = await setupAllContracts({
			accounts,
			synths,
			contracts: [
				'Synthetix',
				'FeePool',
				'AddressResolver',
				'ExchangeRates',
				'SystemStatus',
				'Issuer',
				'DebtCache',
				'Exchanger',
				'CollateralManager',
				'CollateralManagerState',
			],
		}));

		maxDebt = toUnit(50000000);

		await managerState.setAssociatedContract(manager.address, { from: owner });

		mcstate = await CollateralState.new(owner, ZERO_ADDRESS, { from: deployerAccount });

		ceth = await deployEthCollateral({
			mcState: mcstate.address,
			owner: owner,
			manager: manager.address,
			resolver: addressResolver.address,
			collatKey: zBNB,
			minColat: toUnit(1.5),
			minSize: toUnit(1),
		});

		await mcstate.setAssociatedContract(ceth.address, { from: owner });

		mcstateErc20 = await CollateralState.new(owner, ZERO_ADDRESS, { from: deployerAccount });

		const ProxyERC20 = artifacts.require(`ProxyERC20`);
		const TokenState = artifacts.require(`TokenState`);

		// the owner is the associated contract, so we can simulate
		proxy = await ProxyERC20.new(owner, {
			from: deployerAccount,
		});
		tokenState = await TokenState.new(owner, ZERO_ADDRESS, { from: deployerAccount });

		const PublicEST8Decimals = artifacts.require('PublicEST8Decimals');

		renBTC = await PublicEST8Decimals.new(
			proxy.address,
			tokenState.address,
			'Some Token',
			'TOKEN',
			toUnit('1000'),
			owner,
			{
				from: deployerAccount,
			}
		);

		await tokenState.setAssociatedContract(owner, { from: owner });
		await tokenState.setBalanceOf(owner, toUnit('1000'), { from: owner });
		await tokenState.setAssociatedContract(renBTC.address, { from: owner });

		await proxy.setTarget(renBTC.address, { from: owner });

		// Issue ren and set allowance
		await renBTC.transfer(account1, toUnit(100), { from: owner });

		cerc20 = await deployErc20Collateral({
			mcState: mcstateErc20.address,
			owner: owner,
			manager: manager.address,
			resolver: addressResolver.address,
			collatKey: zBTC,
			minColat: toUnit(1.5),
			minSize: toUnit(0.1),
			underCon: renBTC.address,
			decimals: 8,
		});

		await mcstateErc20.setAssociatedContract(cerc20.address, { from: owner });

		shortState = await CollateralState.new(owner, ZERO_ADDRESS, { from: deployerAccount });

		short = await deployShort({
			state: shortState.address,
			owner: owner,
			manager: manager.address,
			resolver: addressResolver.address,
			collatKey: zUSD,
			minColat: toUnit(1.5),
			minSize: toUnit(0.1),
		});

		await shortState.setAssociatedContract(short.address, { from: owner });

		await addressResolver.importAddresses(
			[
				toBytes32('CollateralEth'),
				toBytes32('CollateralErc20'),
				toBytes32('CollateralManager'),
				toBytes32('CollateralShort'),
			],
			[ceth.address, cerc20.address, manager.address, short.address],
			{
				from: owner,
			}
		);

		await issuer.rebuildCache();
		await ceth.rebuildCache();
		await cerc20.rebuildCache();
		await debtCache.rebuildCache();
		await feePool.rebuildCache();
		await manager.rebuildCache();
		await short.rebuildCache();

		await manager.addCollaterals([ceth.address, cerc20.address, short.address], { from: owner });

		await ceth.addSynths(
			['ZassetzUSD', 'ZassetzBNB'].map(toBytes32),
			['zUSD', 'zBNB'].map(toBytes32),
			{ from: owner }
		);
		await cerc20.addSynths(
			['ZassetzUSD', 'ZassetzBTC'].map(toBytes32),
			['zUSD', 'zBTC'].map(toBytes32),
			{ from: owner }
		);
		await short.addSynths(
			['ZassetzBTC', 'ZassetzBNB'].map(toBytes32),
			['zBTC', 'zBNB'].map(toBytes32),
			{ from: owner }
		);

		await manager.addSynths(
			[toBytes32('ZassetzUSD'), toBytes32('ZassetzBTC'), toBytes32('ZassetzBNB')],
			[toBytes32('zUSD'), toBytes32('zBTC'), toBytes32('zBNB')],
			{
				from: owner,
			}
		);

		await manager.addShortableSynths(
			[
				[toBytes32('ZassetzBTC'), toBytes32('ZassetiBTC')],
				[toBytes32('ZassetzBNB'), toBytes32('ZassetiBNB')],
			],
			['zBTC', 'zBNB'].map(toBytes32),
			{
				from: owner,
			}
		);

		// check synths are set and currencyKeys set
		assert.isTrue(
			await manager.areSynthsAndCurrenciesSet(
				['ZassetzUSD', 'ZassetzBTC', 'ZassetzBNB'].map(toBytes32),
				['zUSD', 'zBTC', 'zBNB'].map(toBytes32)
			)
		);

		await renBTC.approve(cerc20.address, toUnit(100), { from: account1 });
		await zUSDSynth.approve(short.address, toUnit(100000), { from: account1 });
	};

	before(async () => {
		CollateralState = artifacts.require(`CollateralState`);

		await setupManager();
	});

	addSnapshotBeforeRestoreAfterEach();

	beforeEach(async () => {
		await updateRatesWithDefaults();

		await issue(zUSDSynth, toUnit(1000), owner);
		await issue(zBNBSynth, toUnit(10), owner);
		await issue(zBTCSynth, toUnit(0.1), owner);
		await debtCache.takeDebtSnapshot();
	});

	it('should set constructor params on deployment', async () => {
		assert.equal(await manager.state(), managerState.address);
		assert.equal(await manager.owner(), owner);
		assert.equal(await manager.resolver(), addressResolver.address);
		assert.bnEqual(await manager.maxDebt(), maxDebt);
	});

	it('should ensure only expected functions are mutative', async () => {
		ensureOnlyExpectedMutativeFunctions({
			abi: manager.abi,
			ignoreParents: ['Owned', 'Pausable', 'MixinResolver', 'Proxy'],
			expected: [
				'setUtilisationMultiplier',
				'setMaxDebt',
				'setBaseBorrowRate',
				'setBaseShortRate',
				'getNewLoanId',
				'addCollaterals',
				'removeCollaterals',
				'addSynths',
				'removeSynths',
				'addShortableSynths',
				'removeShortableSynths',
				'updateBorrowRates',
				'updateShortRates',
				'incrementLongs',
				'decrementLongs',
				'incrementShorts',
				'decrementShorts',
			],
		});
	});

	it('should access its dependencies via the address resolver', async () => {
		assert.equal(await addressResolver.getAddress(toBytes32('ZassetzUSD')), zUSDSynth.address);
		assert.equal(await addressResolver.getAddress(toBytes32('FeePool')), feePool.address);
		assert.equal(
			await addressResolver.getAddress(toBytes32('ExchangeRates')),
			exchangeRates.address
		);
	});

	describe('getting collaterals', async () => {
		it('should add the collaterals during construction', async () => {
			assert.isTrue(await manager.hasCollateral(ceth.address));
			assert.isTrue(await manager.hasCollateral(cerc20.address));
		});
	});

	describe('default values for totalLong and totalShort', async () => {
		it('totalLong should be 0', async () => {
			const long = await manager.totalLong();
			assert.bnEqual(long.zusdValue, toUnit('0'));
		});
		it('totalShort should be 0', async () => {
			const short = await manager.totalShort();
			assert.bnEqual(short.zusdValue, toUnit('0'));
		});
	});

	describe('should only allow opening positions up to the debt limiit', async () => {
		beforeEach(async () => {
			await issue(zUSDSynth, toUnit(15000000), account1);
			await zUSDSynth.approve(short.address, toUnit(15000000), { from: account1 });
		});

		it('should not allow opening a position that would surpass the debt limit', async () => {
			await assert.revert(
				short.open(toUnit(15000000), toUnit(6000000), zBNB, { from: account1 }),
				'Debt limit or invalid rate'
			);
		});
	});

	describe('tracking synth balances across collaterals', async () => {
		beforeEach(async () => {
			tx = await ceth.open(toUnit(100), zUSD, { value: toUnit(2), from: account1 });
			await ceth.open(toUnit(1), zBNB, { value: toUnit(2), from: account1 });
			await cerc20.open(oneRenBTC, toUnit(100), zUSD, { from: account1 });
			await cerc20.open(oneRenBTC, toUnit(0.01), zBTC, { from: account1 });
			await short.open(toUnit(200), toUnit(1), zBNB, { from: account1 });

			id = getid(tx);
		});

		it('should correctly get the total zUSD balance', async () => {
			assert.bnEqual(await manager.long(zUSD), toUnit(200));
		});

		it('should correctly get the total zBNB balance', async () => {
			assert.bnEqual(await manager.long(zBNB), toUnit(1));
		});

		it('should correctly get the total zBTC balance', async () => {
			assert.bnEqual(await manager.long(zBTC), toUnit(0.01));
		});

		it('should correctly get the total short ETTH balance', async () => {
			assert.bnEqual(await manager.short(zBNB), toUnit(1));
		});

		it('should get the total long balance in zUSD correctly', async () => {
			const total = await manager.totalLong();
			const debt = total.zusdValue;

			assert.bnEqual(debt, toUnit(400));
		});

		it('should get the total short balance in zUSD correctly', async () => {
			const total = await manager.totalShort();
			const debt = total.zusdValue;

			assert.bnEqual(debt, toUnit(100));
		});

		it('should report if a rate is invalid', async () => {
			await fastForward(await exchangeRates.rateStalePeriod());

			const long = await manager.totalLong();
			const debt = long.zusdValue;
			const invalid = long.anyRateIsInvalid;

			const short = await manager.totalShort();
			const shortDebt = short.zusdValue;
			const shortInvalid = short.anyRateIsInvalid;

			assert.bnEqual(debt, toUnit(400));
			assert.bnEqual(shortDebt, toUnit(100));
			assert.isTrue(invalid);
			assert.isTrue(shortInvalid);
		});

		it('should reduce the zUSD balance when a loan is closed', async () => {
			issue(zUSDSynth, toUnit(10), account1);
			await fastForwardAndUpdateRates(INTERACTION_DELAY);
			await ceth.close(id, { from: account1 });

			assert.bnEqual(await manager.long(zUSD), toUnit(100));
		});

		it('should reduce the total balance in zUSD when a loan is closed', async () => {
			issue(zUSDSynth, toUnit(10), account1);
			await fastForwardAndUpdateRates(INTERACTION_DELAY);
			await ceth.close(id, { from: account1 });

			const total = await manager.totalLong();
			const debt = total.zusdValue;

			assert.bnEqual(debt, toUnit(300));
		});
	});

	describe('tracking synth balances across collaterals', async () => {
		let systemDebtBefore;

		beforeEach(async () => {
			systemDebtBefore = (await debtCache.currentDebt()).debt;

			tx = await ceth.open(toUnit(100), zUSD, { value: toUnit(2), from: account1 });

			id = getid(tx);
		});

		it('should not change the system debt.', async () => {
			assert.bnEqual((await debtCache.currentDebt()).debt, systemDebtBefore);
		});
	});

	describe('setting variables', async () => {
		describe('setUtilisationMultiplier', async () => {
			describe('revert condtions', async () => {
				it('should fail if not called by the owner', async () => {
					await assert.revert(
						manager.setUtilisationMultiplier(toUnit(1), { from: account1 }),
						'Only the contract owner may perform this action'
					);
				});
				it('should fail if the minimum is 0', async () => {
					await assert.revert(
						manager.setUtilisationMultiplier(toUnit(0), { from: owner }),
						'Must be greater than 0'
					);
				});
			});
			describe('when it succeeds', async () => {
				beforeEach(async () => {
					await manager.setUtilisationMultiplier(toUnit(2), { from: owner });
				});
				it('should update the utilisation multiplier', async () => {
					assert.bnEqual(await manager.utilisationMultiplier(), toUnit(2));
				});
			});
		});

		describe('setBaseBorrowRate', async () => {
			describe('revert condtions', async () => {
				it('should fail if not called by the owner', async () => {
					await assert.revert(
						manager.setBaseBorrowRate(toUnit(1), { from: account1 }),
						'Only the contract owner may perform this action'
					);
				});
			});
			describe('when it succeeds', async () => {
				beforeEach(async () => {
					await manager.setBaseBorrowRate(toUnit(2), { from: owner });
				});
				it('should update the base interest rate', async () => {
					assert.bnEqual(await manager.baseBorrowRate(), toUnit(2));
				});
				it('should allow the base interest rate to be  0', async () => {
					await manager.setBaseBorrowRate(toUnit(0), { from: owner });
					assert.bnEqual(await manager.baseBorrowRate(), toUnit(0));
				});
			});
		});
	});

	describe('adding collateral', async () => {
		describe('revert conditions', async () => {
			it('should revert if the caller is not the owner', async () => {
				await assert.revert(
					manager.addCollaterals([ZERO_ADDRESS], { from: account1 }),
					'Only the contract owner may perform this action'
				);
			});
		});

		describe('when a new collateral is added', async () => {
			beforeEach(async () => {
				await manager.addCollaterals([ZERO_ADDRESS], { from: owner });
			});

			it('should add the collateral', async () => {
				assert.isTrue(await manager.hasCollateral(ZERO_ADDRESS));
			});
		});

		describe('retreiving collateral by address', async () => {
			it('if a collateral is in the manager, it should return true', async () => {
				assert.isTrue(await manager.hasCollateral(ceth.address));
			});

			it('if a collateral is not in the manager, it should return false', async () => {
				assert.isFalse(await manager.hasCollateral(ZERO_ADDRESS));
			});
		});
	});

	describe('removing collateral', async () => {
		describe('revert conditions', async () => {
			it('should revert if the caller is not the owner', async () => {
				await assert.revert(
					manager.removeCollaterals([zBTCSynth.address], { from: account1 }),
					'Only the contract owner may perform this action'
				);
			});
		});

		describe('when a collateral is removed', async () => {
			beforeEach(async () => {
				await manager.removeCollaterals([zBTCSynth.address], { from: owner });
			});

			it('should not have the collateral', async () => {
				assert.isFalse(await manager.hasCollateral(zBTCSynth.address));
			});
		});
	});

	describe('removing synths', async () => {
		describe('revert conditions', async () => {
			it('should revert if the caller is not the owner', async () => {
				await assert.revert(
					manager.removeSynths([toBytes32('SynthzBTC')], [toBytes32('zBTC')], { from: account1 }),
					'Only the contract owner may perform this action'
				);
			});
		});

		describe('it should remove a synth', async () => {
			beforeEach(async () => {
				await manager.removeSynths([toBytes32('SynthzBTC')], [toBytes32('zBTC')], { from: owner });
			});
		});
	});

	describe('removing shortable synths', async () => {
		describe('revert conditions', async () => {
			it('should revert if the caller is not the owner', async () => {
				await assert.revert(
					manager.removeShortableSynths([toBytes32('SynthzBTC')], { from: account1 }),
					'Only the contract owner may perform this action'
				);
			});
		});

		describe('when a shortable synth is removed', async () => {
			beforeEach(async () => {
				await manager.removeShortableSynths([toBytes32('SynthzBTC')], { from: owner });
			});

			it('should zero out the inverse mapping', async () => {
				assert.equal(
					await manager.synthToInverseSynth(toBytes32('SynthzBTC')),
					'0x0000000000000000000000000000000000000000000000000000000000000000'
				);
			});
		});
	});
});
