'use strict';

const fs = require('fs');

const async = require('async');

const ethers = require('ethers');

const { gray, green } = require('chalk');

const {
	ensureDeploymentPath,
	ensureNetwork,
	getDeploymentPathForNetwork,
	loadConnections,
	loadAndCheckRequiredSources,
} = require('../util');

const { performTransactionalStep } = require('../command-utils/transact');

const { getUsers } = require('../../..');
const Deployer = require('../Deployer');

const migrateDebtShares = async ({
	network,
	deploymentPath,
	privateKey,
	useOvm,
	useFork,
	maxFeePerGas,
	maxPriorityFeePerGas,
	providerUrl,
	etherscanAddressCsv,
	threshold,
	batchSize,
}) => {
	ensureNetwork(network);
	deploymentPath = deploymentPath || getDeploymentPathForNetwork({ network, useOvm });
	ensureDeploymentPath(deploymentPath);

	const { providerUrl: envProviderUrl, privateKey: envPrivateKey } = loadConnections({
		network,
		useFork,
		useOvm,
	});

	const { deployment, ownerActions, ownerActionsFile, deploymentFile } = loadAndCheckRequiredSources({
		deploymentPath,
		network,
	});

	if (!providerUrl) {
		if (!envProviderUrl) {
			throw new Error('Missing .env key of PROVIDER_URL. Please add and retry.');
		}

		providerUrl = envProviderUrl;
	}

	// if not specified, or in a local network, override the private key passed as a CLI option, with the one specified in .env
	if (network !== 'local' && !privateKey && !useFork) {
		privateKey = envPrivateKey;
	}

    console.log(gray(`Using account with public key ${providerUrl}`));

	const provider = new ethers.providers.JsonRpcProvider(providerUrl);

	let signer;
	if (!privateKey) {
		const account = getUsers({ network, user: 'owner', useOvm }).address;
		signer = provider.getSigner(account);
		signer.address = await signer.getAddress();
	} else {
		signer = new ethers.Wallet(privateKey, provider);
	}

	console.log(gray(`Using account with public key ${signer.address}`));

	const deployer = new Deployer({
		// compiled,
		config: {},
		configFile: null, // null configFile so it doesn't overwrite config.json
		deployment,
		deploymentFile,
		maxFeePerGas,
		maxPriorityFeePerGas,
		network,
		privateKey,
		providerUrl,
		useFork,
		// dryRun,
		useOvm,
	});

	// get synthetix system contract
	const previousSynthetix = deployer.getExistingContract({ contract: 'Synthetix' }); 
	// console.log(previousSynthetix);
	// const { address: synthetixAddress } = deployment.targets['ProxySynthetix'];

	const { abi: synthetixABI } = deployment.sources[deployment.targets['Synthetix'].source];
	const Synthetix = new ethers.Contract(previousSynthetix.address, synthetixABI, provider);

	const { address: debtSharesAddress } = deployment.targets['SynthetixDebtShare'];
	const { abi: debtSharesABI } = deployment.sources[
		deployment.targets['SynthetixDebtShare'].source
	];
	const SynthetixDebtShare = new ethers.Contract(debtSharesAddress, debtSharesABI, signer);

	// Instantiate MultiCall contract
	const multiCallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11'; // L1 + L2 address
	const multiCallABI = [
		{
			inputs: [
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'aggregate',
			outputs: [
				{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' },
				{ internalType: 'bytes[]', name: 'returnData', type: 'bytes[]' },
			],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			inputs: [
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bool', name: 'allowFailure', type: 'bool' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call3[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'aggregate3',
			outputs: [
				{
					components: [
						{ internalType: 'bool', name: 'success', type: 'bool' },
						{ internalType: 'bytes', name: 'returnData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Result[]',
					name: 'returnData',
					type: 'tuple[]',
				},
			],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			inputs: [
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bool', name: 'allowFailure', type: 'bool' },
						{ internalType: 'uint256', name: 'value', type: 'uint256' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call3Value[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'aggregate3Value',
			outputs: [
				{
					components: [
						{ internalType: 'bool', name: 'success', type: 'bool' },
						{ internalType: 'bytes', name: 'returnData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Result[]',
					name: 'returnData',
					type: 'tuple[]',
				},
			],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			inputs: [
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'blockAndAggregate',
			outputs: [
				{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' },
				{ internalType: 'bytes32', name: 'blockHash', type: 'bytes32' },
				{
					components: [
						{ internalType: 'bool', name: 'success', type: 'bool' },
						{ internalType: 'bytes', name: 'returnData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Result[]',
					name: 'returnData',
					type: 'tuple[]',
				},
			],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getBasefee',
			outputs: [{ internalType: 'uint256', name: 'basefee', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' }],
			name: 'getBlockHash',
			outputs: [{ internalType: 'bytes32', name: 'blockHash', type: 'bytes32' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getBlockNumber',
			outputs: [{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getChainId',
			outputs: [{ internalType: 'uint256', name: 'chainid', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getCurrentBlockCoinbase',
			outputs: [{ internalType: 'address', name: 'coinbase', type: 'address' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getCurrentBlockDifficulty',
			outputs: [{ internalType: 'uint256', name: 'difficulty', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getCurrentBlockGasLimit',
			outputs: [{ internalType: 'uint256', name: 'gaslimit', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getCurrentBlockTimestamp',
			outputs: [{ internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
			name: 'getEthBalance',
			outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'getLastBlockHash',
			outputs: [{ internalType: 'bytes32', name: 'blockHash', type: 'bytes32' }],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [
				{ internalType: 'bool', name: 'requireSuccess', type: 'bool' },
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'tryAggregate',
			outputs: [
				{
					components: [
						{ internalType: 'bool', name: 'success', type: 'bool' },
						{ internalType: 'bytes', name: 'returnData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Result[]',
					name: 'returnData',
					type: 'tuple[]',
				},
			],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			inputs: [
				{ internalType: 'bool', name: 'requireSuccess', type: 'bool' },
				{
					components: [
						{ internalType: 'address', name: 'target', type: 'address' },
						{ internalType: 'bytes', name: 'callData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Call[]',
					name: 'calls',
					type: 'tuple[]',
				},
			],
			name: 'tryBlockAndAggregate',
			outputs: [
				{ internalType: 'uint256', name: 'blockNumber', type: 'uint256' },
				{ internalType: 'bytes32', name: 'blockHash', type: 'bytes32' },
				{
					components: [
						{ internalType: 'bool', name: 'success', type: 'bool' },
						{ internalType: 'bytes', name: 'returnData', type: 'bytes' },
					],
					internalType: 'struct Multicall3.Result[]',
					name: 'returnData',
					type: 'tuple[]',
				},
			],
			stateMutability: 'payable',
			type: 'function',
		},
	];
	const MultiCall = new ethers.Contract(multiCallAddress, multiCallABI, signer);

	// get a list of addresses
	const addrs = fs.readFileSync(etherscanAddressCsv).toString('utf8');

	const lines = addrs.split('\n');

	const addressCollateralAmounts = [];

	const zUSD = ethers.utils.formatBytes32String('zUSD');

	let totalDebtAccounted = ethers.BigNumber.from(0);
	let totalDebtForgiven = ethers.BigNumber.from(0);

	// const filteredAddresses = [];

	// Filter out unwanted text
	// const unFilteredAddresses = lines
	// 	.slice(1)
	// 	.filter((l) => l)
	// 	.map((l) => JSON.parse(l.split(',')[0]));

		// const unFilteredAddresses = line.split(',')[0];

	// let unFilteredAddresses = JSON.parse(fs.readFileSync('./subgraph-users.json'));
	let unFilteredAddresses = JSON.parse(fs.readFileSync('./positiveDebtBalances-users.json'));
	



	// Check for accounts with debt shares and add them to the `filteredAddresses` list.
	await readMulticall(
		unFilteredAddresses,
		(a) => Synthetix.populateTransaction.debtBalanceOf(a, zUSD),
		(a, r) => {
			const output = ethers.utils.defaultAbiCoder.decode(['uint256'], r.returnData);
			const debtBalanceOf = output[0];
			console.log(`User ${a} has ${debtBalanceOf} collateral`);


			if (debtBalanceOf.gt(ethers.utils.parseEther(threshold))) {
				addressCollateralAmounts.push({ address: a, debtBalanceOf: debtBalanceOf});
				totalDebtAccounted = totalDebtAccounted.add(debtBalanceOf);
				// filteredAddresses.push(a);
			} else {
				totalDebtForgiven = totalDebtForgiven.add(debtBalanceOf);
			}
		},
		0,
		25
	);

	// console.log('filteredAddresses updating entries for ', filteredAddresses.length, 'addresses');

	// // Update liquidator rewards entries for all stakers.
	// await readMulticall(
	// 	filteredAddresses,
	// 	(a) => SynthetixDebtShare.populateTransaction.importAddresses(a),
	// 	(a, r) => {},
	// 	1, // 0 = READ; 1 = WRITE;
	// 	150 // L1 max size = ~200; L2 max size = ~150;
	// );

	// Multicall function definition
	async function readMulticall(items, call, onResult, write = 0, batch = 500) {
		const results = [];
		for (let i = 0; i < items.length; i += batch) {
			console.log('call', i, 'of', items.length);

			const calls = [];

			for (let j = i; j < Math.min(i + batch, items.length); j++) {
				const populatedCall = await call(items[j]);
				calls.push({
					target: populatedCall.to,
					callData: populatedCall.data,
					allowFailure: false,
				});
			}

			// console.log(calls);

			const values = await MultiCall.callStatic.aggregate3(calls);

			let succeeded = 0;

			for (let j = i; j < Math.min(i + batch, items.length); j++) {
				await onResult(items[j], values[j - i]);

				if (values[j - i].success) succeeded++;
			}

			if (write && succeeded / values.length >= write) {
				const gasUsage = await MultiCall.estimateGas.aggregate3(calls);
				const tx = await MultiCall.aggregate3(calls, {
					gasLimit: gasUsage,
				});
				console.log('submitted tx:', tx.hash);
				await tx.wait();
			}
		}

		return results;
	}


	// await async.eachOfLimit(lines, 50, async (line, i) => {
	// 	if (line === '') return;

	// 	const address = line.split(',')[0];

	// 	if (i % 100 === 0) {
	// 		console.log('scanning address', i, 'of', lines.length);
	// 	}
        
	// 	try {
    //         const debtBalanceOf = await Synthetix.debtBalanceOf(address, zUSD);
    //         console.log('debtBalanceOf' + address + '\t' + debtBalanceOf.toString());
            
	// 		if (debtBalanceOf.gt(ethers.utils.parseEther(threshold))) {
    //             // console.log('debtBalanceOf' + address + debtBalanceOf.toString());
	// 			addressCollateralAmounts.push({ address, debtBalanceOf });
	// 			totalDebtAccounted = totalDebtAccounted.add(debtBalanceOf);
	// 		} else {
	// 			totalDebtForgiven = totalDebtForgiven.add(debtBalanceOf);
	// 		}
	// 	} catch (err) {
	// 		console.log('had error for address', address, err);
	// 	}
	// });

	console.log(
		'recorded',
		addressCollateralAmounts.length,
		'addresses with debt totalling',
		ethers.utils.formatEther(totalDebtAccounted),
		'forgiving',
		ethers.utils.formatEther(totalDebtForgiven)
	);

	for (let i = 0; i < addressCollateralAmounts.length; i += Number(batchSize)) {
		const batch = addressCollateralAmounts.slice(i, i + Number(batchSize));

		const addrs = batch.map(a => a.address);
		const amounts = batch.map(a => a.debtBalanceOf);

		console.log('write action for import of addresses', i, 'through', i + Number(batchSize));

		await performTransactionalStep({
			contract: 'SynthetixDebtShare',
			// encodeABI: network === 'mainnet',
			// maxFeePerGas,
			// maxPriorityFeePerGas:  //ethers.utils.parseUnits('5', 'gwei'),
			ownerActions,
			ownerActionsFile,
			signer,
			target: SynthetixDebtShare,
			write: 'importAddresses',
			writeArg: [addrs, amounts], // explicitly pass array of args so array not splat as params
		});
	}

	console.log(green('Debt Migration completed successfully'));
};

module.exports = {
	migrateDebtShares,
	cmd: program =>
		program
			.command('migrate-debt-shares')
			.description('Migrate to Debt Shares from debtLedger')
			.option('-g, --max-fee-per-gas <value>', 'Maximum base gas fee price in GWEI')
			.option('--max-priority-fee-per-gas <value>', 'Priority gas fee price in GWEI', '2')
			.option('-n, --network <value>', 'The network to run off.', x => x.toLowerCase(), 'kovan')
			.option(
				'-k, --use-fork',
				'Perform the deployment on a forked chain running on localhost (see fork command).',
				false
			)
			.option('-y, --yes', 'Dont prompt, just reply yes.')
			.option('-z, --use-ovm', 'Target deployment for the OVM (Optimism).')
			.option(
				'-p, --provider-url <value>',
				'Ethereum network provider URL. If default, will use PROVIDER_URL found in the .env file.'
			)
			.option('--etherscan-address-csv <file>', 'CSV of all addresses to scan', 'snx-addrs.csv')
			.option(
				'--threshold <amount>',
				'Forgive debt amounts for holders who have less than the given threshold of debt',
				'0'
			)
			.option('--batch-size <value>', 'Number of addresses per import transaction', 200)
			.action(migrateDebtShares),
};