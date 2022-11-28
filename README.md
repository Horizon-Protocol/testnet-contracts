# Horizon Protocol

Please note that this repository is under development.

Horizon Protocol is a crypto-backed synthetic asset platform.

It is a multi-token system, powered by HZN, the Horizon Protocol Token. HZN holders can stake HZN to issue Hassets, on-chain Horizon assets via the [Genesis dApp](https://genesis.horizonprotocol.com).
Hassets can be traded using upcoming [Exchange](https://exchange.horizonprotocol.com).

Horizon uses a proxy system so that upgrades will not be disruptive to the functionality of the contract. This smooths user interaction, since new functionality will become available without any interruption in their experience. It is also transparent to the community at large, since each upgrade is accompanied by events announcing those upgrades.

Prices are committed on chain by a trusted oracle. Moving to a decentralised oracle is phased in with the first phase completed for all forex prices using [BandProtocol](https://cosmoscan.io/).

## DApps

- [Genesis](https://mintr.horizonprotocol.com)
- [Exchange](https://exchange.horizonprotocol.com)

---

## Repo Guide

### Branching

A note on the branches used in this repo.

- `master` represents the contracts live on `mainnet` and all testnets.

When a new version of the contracts makes its way through all testnets, it eventually becomes promoted in `master`, with [semver](https://semver.org/) reflecting contract changes in the `major` or `minor` portion of the version (depending on backwards compatibility). `patch` changes are simply for changes to the JavaScript interface.

### Solidity API

All interfaces are available via the path [`Horizon-Smart-Contract/Horizon-Smart-Contract/contracts/interfaces`](./contracts/interfaces/).

:zap: In your code, the key is to use `IAddressResolver` which can be tied to the immutable proxy. You can then fetch `Horizon`, `FeePool`, `Depot`, et al via `IAddressResolver.getAddress(bytes32 name)` where `name` is the `bytes32` version of the contract name (case-sensitive). Or you can fetch any zasset using `IAddressResolver.getSynth(bytes32 zasset)` where `zasset` is the `bytes32` name of the zasset (e.g. `iETH`, `zUSD`, `zDEFI`).

E.g.

`npm install @horizon-protocol/smart-contract`

then you can write Solidity as below (using a compiler that links named imports via `node_modules`):

```solidity
pragma solidity 0.5.16;

import 'Horizon-Smart-Contract/contracts/interfaces/IAddressResolver.sol';
import 'Horizon-Smart-Contract/contracts/interfaces/IHorizon.sol';

contract MyContract {
  // This should be instantiated with our ReadProxyAddressResolver
  // it's a ReadProxy that won't change, so safe to code it here without a setter
  // see https://docs.synthetix.io/addresses for addresses in mainnet and testnets
  IAddressResolver public horizonResolver;

  constructor(IAddressResolver _hznResolver) public {
    horizonResolver = _snxResolver;
  }

  function horizonIssue() external {
    Ihorizon horizon = horizonResolver.getAddress('Horizon');
    require(horizon != address(0), 'Horizon is missing from Horizon resolver');

    // Issue for msg.sender = address(MyContract)
    horizon.issueMaxSynths();
  }

  function horizonIssueOnBehalf(address user) external {
    IHorizon horizon = horizonResolver.getAddress('Horizon');
    require(horizon != address(0), 'Horizon is missing from Horizon resolver');

    // Note: this will fail if `DelegateApprovals.approveIssueOnBehalf(address(MyContract))` has
    // not yet been invoked by the `user`
    horizon.issueMaxSynthsOnBehalf(user);
  }
}
```

### Node.js API

- `getAST({ source, match = /^contracts\// })` Returns the Abstract Syntax Tree (AST) for all compiled sources. Optionally add `source` to restrict to a single contract source, and set `match` to an empty regex if you'd like all source ASTs including third party contracts.
- `getPathToNetwork({ network, file = '' })` Returns the path to the folder (or file within the folder) for the given network.
- `getSource({ network })` Return `abi` and `bytecode` for a contract `source`.
- `getSuspensionReasons({ code })` Return mapping of `SystemStatus` suspension codes to string reasons.
- `getStakingRewards({ network })` Return the list of staking reward contracts available.
- `getZassets({ network })` Return the list of zassets for a network.
- `getTarget({ network })` Return the information about a contract's `address` and `source` file. The contract names are those specified in doc web.
- `getTokens({ network })` Return the list of tokens (zassets and `HZN`) used in the system, along with their addresses.
- `getUsers({ network })` Return the list of user accounts within the Horizon protocol (e.g. `owner`, `fee`, etc).
- `getVersions({ network, byContract = false })` Return the list of deployed versions to the network keyed by tagged version. If `byContract` is `true`, it keys by `contract` name.
- `networks` Return the list of supported networks.
- `toBytes32` Convert any string to a `bytes32` value.

#### Via code

```javascript
const hzn = require('horizon');

hzn.getAST();
/*
{ 'contracts/AddressResolver.sol':
   { imports:
      [ 'contracts/Owned.sol',
        'contracts/interfaces/IAddressResolver.sol',
        'contracts/interfaces/IHorizon.sol' ],
     contracts: { AddressResolver: [Object] },
     interfaces: {},
     libraries: {} },
  'contracts/Owned.sol':
   { imports: [],
     contracts: { Owned: [Object] },
     interfaces: {},
     libraries: {} },
*/

hzn.getAST({ source: 'Horizon.sol' });
/*
{ imports:
   [ 'contracts/ExternStateToken.sol',
     'contracts/MixinResolver.sol',
     'contracts/interfaces/IHorizon.sol',
     'contracts/TokenState.sol',
     'contracts/interfaces/ISynth.sol',
     'contracts/interfaces/IERC20.sol',
     'contracts/interfaces/ISystemStatus.sol',
     'contracts/interfaces/IExchanger.sol',
     'contracts/interfaces/IEtherCollateral.sol',
     'contracts/interfaces/IIssuer.sol',
     'contracts/interfaces/IHorizonState.sol',
     'contracts/interfaces/IExchangeRates.sol',
     'contracts/SupplySchedule.sol',
     'contracts/interfaces/IRewardEscrow.sol',
     'contracts/interfaces/IHasBalance.sol',
     'contracts/interfaces/IRewardsDistribution.sol' ],
  contracts:
   { Horizon:
      { functions: [Array],
        events: [Array],
        variables: [Array],
        modifiers: [Array],
        structs: [],
        inherits: [Array] } },
  interfaces: {},
  libraries: {} }
*/

// Get the path to the network
hzn.getPathToNetwork({ network: 'mainnet' });
//'.../Horizon-Smart-Contract/publish/deployed/mainnet'

// retrieve an object detailing the contract ABI and bytecode
hzn.getSource({ network: 'testnet', contract: 'Proxy' });
/*
{
  bytecode: '0..0',
  abi: [ ... ]
}
*/

hzn.getSuspensionReasons();
/*
{
	1: 'System Upgrade',
	2: 'Market Closure',
	3: 'Circuit breaker',
	99: 'Emergency',
};
*/

// retrieve the array of zassets used
hzn.getSynths({ network: 'testnet' }).map(({ name }) => name);
// ['zUSD', 'zEUR', ...]

// retrieve an object detailing the contract deployed to the given network.
hzn.getTarget({ network: 'testnet', contract: 'ProxyHorizon' });
/*
{
	name: 'ProxyHorizon',
  address: '0x322A3346bf24363f451164d96A5b5cd5A7F4c337',
  source: 'Proxy',
  link: 'https://testnet.bscscan.com/address/0x322A3346bf24363f451164d96A5b5cd5A7F4c337',
  timestamp: '2019-03-06T23:05:43.914Z',
  txn: '',
	network: 'local'
}
*/

// retrieve the list of system user addresses
hzn.getUsers({ network: 'mainnet' });
/*
[ { name: 'owner',
    address: '0xEb3107117FEAd7de89Cd14D463D340A2E6917769' },
  { name: 'deployer',
    address: '0xDe910777C787903F78C89e7a0bf7F4C435cBB1Fe' },
  { name: 'marketClosure',
    address: '0xC105Ea57Eb434Fbe44690d7Dec2702e4a2FBFCf7' },
  { name: 'oracle',
    address: '0xaC1ED4Fabbd5204E02950D68b6FC8c446AC95362' },
  { name: 'fee',
    address: '0xfeEFEEfeefEeFeefEEFEEfEeFeefEEFeeFEEFEeF' },
  { name: 'zero',
    address: '0x0000000000000000000000000000000000000000' } ]
*/

hzn.getVersions();
/*
{ 'v2.21.12-107':
   { tag: 'v2.21.12-107',
     fulltag: 'v2.21.12-107',
     release: 'Hadar',
     network: 'kovan',
     date: '2020-05-08T12:52:06-04:00',
     commit: '19997724bc7eaceb902c523a6742e0bd74fc75cb',
		 contracts: { ReadProxyAddressResolver: [Object] }
		}
}
*/

hzn.networks;
// [ 'local', 'kovan', 'rinkeby', 'ropsten', 'mainnet' ]

hzn.toBytes32('zUSD');
// '0x7355534400000000000000000000000000000000000000000000000000000000'
```

#### As a CLI tool

Same as above but as a CLI tool that outputs JSON, using names without the `get` prefixes:

```bash
$ npx horizon ast contracts/Synth.sol
{
  "imports": [
    "contracts/Owned.sol",
    "contracts/ExternStateToken.sol",
    "contracts/MixinResolver.sol",
    "contracts/interfaces/ISynth.sol",
    "contracts/interfaces/IERC20.sol",
    "contracts/interfaces/ISystemStatus.sol",
    "contracts/interfaces/IFeePool.sol",
    "contracts/interfaces/IHorizon.sol",
    "contracts/interfaces/IExchanger.sol",
    "contracts/interfaces/IIssue"
    # ...
  ]
}

$ npx horizon bytes32 zUSD
0x7355534400000000000000000000000000000000000000000000000000000000

$ npx horizon networks
[ 'local', 'testnet', 'mainnet' ]

$ npx horizon source --network testnet --contract Proxy
{
  "bytecode": "0..0",
  "abi": [ ... ]
}

$ npx horizon suspension-reason --code 2
Market Closure

$ npx horizon zassets --network testnet --key name
["zUSD", "zEUR", ... ]

$ npx horizon target --network testnet --contract ProxyHorizon
{
  "name": "ProxyHorizon",
  "address": "0x322A3346bf24363f451164d96A5b5cd5A7F4c337",
  "source": "Proxy",
  "link": "https://testnet.bscscan.com/address/0x322A3346bf24363f451164d96A5b5cd5A7F4c337",
  "timestamp": "2019-03-06T23:05:43.914Z",
  "network": "testnet"
}

$ npx horizon users --network mainnet --user oracle
{
  "name": "oracle",
  "address": "0xaC1ED4Fabbd5204E02950D68b6FC8c446AC95362"
}

$ npx horizon versions
{
  "v2.0-19": {
    "tag": "v2.0-19",
    "fulltag": "v2.0-19",
    "release": "",
    "network": "mainnet",
    "date": "2019-03-11T18:17:52-04:00",
    "commit": "eeb271f4fdd2e615f9dba90503f42b2cb9f9716e",
    "contracts": {
      "Depot": {
        "address": "0x172E09691DfBbC035E37c73B62095caa16Ee2388",
        "status": "replaced",
        "replaced_in": "v2.18.1"
      },
      "ExchangeRates": {
        "address": "0x73b172756BD5DDf0110Ba8D7b88816Eb639Eb21c",
        "status": "replaced",
        "replaced_in": "v2.1.11"
      },

      # ...

    }
  }
}

$ npx horizon versions --by-contract
{
  "Depot": [
    {
      "address": "0x172E09691DfBbC035E37c73B62095caa16Ee2388",
      "status": "replaced",
      "replaced_in": "v2.18.1"
    },
    {
      "address": "0xE1f64079aDa6Ef07b03982Ca34f1dD7152AA3b86",
      "status": "current"
    }
  ],
  "ExchangeRates": [
    {
      "address": "0x73b172756BD5DDf0110Ba8D7b88816Eb639Eb21c",
      "status": "replaced",
      "replaced_in": "v2.1.11"
    },

    # ...
  ],

  # ...
}
```
