# DeFi Lending Insurance

[![Build Status](https://travis-ci.org/chainlink-hackathon2021-insurance/DeFi-Lending-Insurance.svg?branch=main)](https://travis-ci.org/chainlink-hackathon2021-insurance/DeFi-Lending-Insurance)

Project scaffolded with: [Scaffold ETH by Austin Griffith](https://github.com/austintgriffith/scaffold-eth)

Test URL (Kovan): https://ipfs.io/ipfs/QmRvzCpa6GrqKvkDFXPRtXBzRTrBg8Zj2Fb9Nwed93TPh8

## Requirements

- Node 12

## Installation

```bash
yarn install
```

## Test Smart Contract

```bash
yarn test
```

## Run Locally

The project comes with a set of "mock" contracts that are configured during local deployment. These mock contracts correspond to:

- TUSD Reserve Feed
- TUSD Supply Feed
- TUSD ERC20 Token

The project also comes with a Mock Protocol that defines it's own Mock Reserve Token (think of it as an equivalent to aTokens, cTokens and yTokens). Before deploying make sure that the `defaultNetwork` variable in the `hardhat.config.js` of the hardhat package is set to `localhost` and the `targetNetwork` variable in the `App.jsx` file of the react-app package is set to `NETWORKS['localhost']`.

Follow the next steps to run the project locally:

Run the local Hardhat Network:

```bash
yarn chain
```

Deploy contracts to local Hardhat Network:

```bash
yarn deploy
```

Run the frontend:

```bash
yarn start
```

## Run in Kovan Testnet

The deployment script for Kovan sets the addresses in that network of the following contracts:

- TUSD Reserve Feed
- TUSD Supply Feed
- TUSD ERC20 Token
- AAVE Lending Protocol
- AAVE Data Provider

The mock feeds are also deployed to simulate PoR/PoS mismatch.

Before deploying make sure that the `defaultNetwork` variable in the `hardhat.config.js` of the hardhat package is set to `kovan` and the `targetNetwork` variable in the `App.jsx` file of the react-app package is set to `NETWORKS['kovan']`.

Follow the next steps to run the project locally:

Generate a deployment account:

```bash
yarn generate
```

Send some Kovan ETH to that account.

Deploy contracts to Kovan:

```bash
yarn deploy
```

Run the frontend:

```bash
yarn start
```

Deploy to IPFS:

```bash
yarn ipfs
```

## Debug Panel

Deployer accounts will have an access to a Debug Panel where they can trigger certain events. They can also manipulate the smart contracts deployed directly through this UI.

The link to the Debug Panel is located at the website's footer.

## Uniswap Branch

There is a `uniswap` branch that is still WIP. The idea of this branch is to modify the workflow in case of a TUSD PoR/PoS event. The contract will convert the user's TUSD to WETH in this case. 


