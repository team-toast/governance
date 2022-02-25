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

2. Deploy govDeployer in remix (Double check Arbitrum FRY address).

3. Deploy governorAlpha. The parameters are the contract addresses provided by the already launched govDeployer in remix. The guardian (address 0x7040E1373d281Ec5d6972B3546EAbf2E3Db81E56), votingPeriod (uint 19786) and votingDelay (0) paramaters are in the sheet.

4. Run initializeGovernance on govDeployer with the newly deployed governorAlpha address as parameter.

5. Verify the contract code of governorAlpha on Arbiscan.

6. Execute \_\_acceptAdmin of governorAlpha using the guardian multisig.
