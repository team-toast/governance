# Compound Governance

A user interface for Compound's new governance model. Learn more about [Compound governance](https://medium.com/compound-finance/compound-governance-5531f524cf68).

### Getting Started

Simply clone/fork the repo and run the following commands:

```
npm install
npm run start
```

### Launching Contracts

Governance Remix deployment steps:

1. Double check parameters in https://docs.google.com/spreadsheets/d/1pDTcSFJLU0nd_v4ggWH-UAm8mazq4jAaNE2XZMHXtpw/edit#gid=0

2. Deploy the govDeployer contract in remix (Double check Arbitrum FRY address).

3. Deploy governorAlpha.
   The parameters are the contract addresses created by the newly deployed govDeployer in remix. The
   address parameters are public variables but can also be found in the event emitted during deployment of govDeployer.
   The guardian (address 0x7040E1373d281Ec5d6972B3546EAbf2E3Db81E56), votingPeriod (uint 19786) and
   votingDelay (0) paramaters are in the sheet.

4. Run initializeGovernance on govDeployer with the newly deployed governorAlpha address as its parameter.

5. Verify the contract code of governorAlpha on Arbiscan.

6. Execute \_\_acceptAdmin function of governorAlpha using the guardian multisig.

### User Interface

The user interface has to be configured using the format specified in the app-config.json file.
The project depends on the following environment variables:

-   INFURA_URL_TESTNET: Infura rinkeby rpc

-   RIVET_URL: Rivet mainnet rpc

-   REACT_APP_CONFIG_FILE: Config file for the UI.

## Contracts

### LEVR

-   Deployer: 0xd509508063e0942100aceF39B1587E0309FE1736
-   gLEVR: 0xCD5E6585EB92d31da1A9373960F7275c1C866CbA
-   Forwarder: 0xE930864ED3B28445688c02F69e35A3D6CE3BCd14
-   Governator: 0x33dcDd29eBCf54Fe0AA9D53Ff81447348C8B97fa
-   Timelock: 0xC06A4B9ecD217dd2023Ad68fA771CC1B7ac7bD55
-   GovernorAlpha: 0xcEd97234EeB709FD7866ed99F31B1452391Ef6aa

### Foundry

-   gFry: 0x633a3d2091dc7982597a0f635d23ba5eb1223f48
-   Forwarder: 0xEae75E41C2Ae87551d7C4EB413Ec84Fd1958cA1a
-   Governator: 0xaEf9D396d0DEa863AFd0812526C14743bcabB38b
-   Timelock: 0xcBbb9d5804E6005108268BA464c3eB6Ca1bf7c6E
-   GovernorAlpha: 0xa9f0501b1e9B795F3597571B1B2634278d0fD843
