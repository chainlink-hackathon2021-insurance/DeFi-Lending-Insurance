const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Liquidity Protocol Insurance App", () => {
  let insuranceContract;
  let uniswapRouterMock, liquidityProtocolMock, daiMock, tusdMock, reserveTokenMock;
  let owner, addr1;

  beforeEach(async () => {
    const DaiMock = await ethers.getContractFactory("DaiMock");
    const TUSDMock = await ethers.getContractFactory("TUSDMock");
    const ReserveTokenMock = await ethers.getContractFactory("ReserveTokenMock");

    daiMock = await DaiMock.deploy();
    tusdMock = await TUSDMock.deploy();
    reserveTokenMock = await ReserveTokenMock.deploy();
    
    const IUniswapRouterMock = await ethers.getContractFactory("IUniswapRouterMock");
    const LiquidityProtocolMock = await ethers.getContractFactory("LiquidityProtocolMock");
    const LiquidityProtocolInsurance = await ethers.getContractFactory("LiquidityProtocolInsurance");
    uniswapRouterMock = await IUniswapRouterMock.deploy(daiMock.address, tusdMock.address);
    liquidityProtocolMock = await LiquidityProtocolMock.deploy(reserveTokenMock.address);

    const liquidityProtocolImplementations = [liquidityProtocolMock.address];
    insuranceContract = await LiquidityProtocolInsurance.deploy(liquidityProtocolImplementations, daiMock.address, uniswapRouterMock.address);

    [owner, addr1] = await ethers.getSigners();
  })

  describe("Register insurance policy", () => {

    it("Should NOT create insurance policy if the liquidity protocol is not whitelisted", async () => {
          
      const invalidCoverageData = {
        beneficiary: addr1.address,
        startDate: Math.floor(Date.now() / 1000),
        endDate: Math.floor(Date.now()/1000) + 50,
        amountInsured: 2000,
        liquidityAssetData: {
          asset: tusdMock.address,
          liquidityProtocol: uniswapRouterMock.address,
          latestReserve: 0
        }
      };

      await expect(insuranceContract.connect(addr1).registerInsurancePolicy(invalidCoverageData))
        .to.be.revertedWith("Liquidity Protocol address not found in the whitelist");
    });

    it("Should create and register an insurance policy", async () => {
      const amountInsured = 2000;
      const expectedReserveTokensToReturn = amountInsured * 0.9;
      const expectedDai = amountInsured * 0.1;
      await tusdMock.faucet(addr1.address, 2000);
      await tusdMock.connect(addr1).approve(insuranceContract.address, 2000);
      const validCoverageData = {
        beneficiary: addr1.address,
        startDate: Math.floor(Date.now() / 1000),
        endDate: Math.floor(Date.now()/1000) + 50,
        amountInsured: 2000,
        liquidityAssetData: {
          asset: tusdMock.address,
          liquidityProtocol: liquidityProtocolMock.address,
          latestReserve: 0
        }
      };
      await insuranceContract.connect(addr1).registerInsurancePolicy(validCoverageData);
      expect(await reserveTokenMock.balanceOf(addr1.address)).to.not.equal(amountInsured);
      expect(await reserveTokenMock.balanceOf(addr1.address)).to.equal(expectedReserveTokensToReturn);
      expect(await daiMock.balanceOf(insuranceContract.address)).to.equal(expectedDai);
      const insurancePolicies = await insuranceContract.getInsurancePoliciesByBeneficiary(addr1.address);
      expect(insurancePolicies[0].coverageData.beneficiary).to.be.equal(addr1.address);

    });

  });

});