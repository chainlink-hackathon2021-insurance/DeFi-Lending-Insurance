const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { addDays } = require('../utils');

use(solidity);

describe("Liquidity Protocol Insurance App", () => {
  let insuranceContract;
  let uniswapRouterMock, liquidityProtocolMock, daiMock, tusdMock, reserveTokenMock;
  let tusdReserveMock, tusdSupplyMock;
  let owner, addr1;

  let validCoverageData;

  beforeEach(async () => {
    const DaiMock = await ethers.getContractFactory("DaiMock");
    const TUSDMock = await ethers.getContractFactory("TUSDMock");
    const ReserveTokenMock = await ethers.getContractFactory("ReserveTokenMock");
    const TUSDReserveFeedMock = await ethers.getContractFactory("MockV3Aggregator");
    const TUSDSupplyFeedMock = await ethers.getContractFactory("MockV3Aggregator");

    daiMock = await DaiMock.deploy();
    tusdMock = await TUSDMock.deploy();
    reserveTokenMock = await ReserveTokenMock.deploy();
    tusdReserveMock = await TUSDReserveFeedMock.deploy(8, '32450358663000000');
    tusdSupplyMock = await TUSDSupplyFeedMock.deploy(8,   '32326049998805076');

    const IUniswapRouterMock = await ethers.getContractFactory("IUniswapRouterMock");
    const LiquidityProtocolMock = await ethers.getContractFactory("LiquidityProtocolMock");
    const LiquidityProtocolInsurance = await ethers.getContractFactory("LiquidityProtocolInsurance");
    uniswapRouterMock = await IUniswapRouterMock.deploy(daiMock.address, tusdMock.address);
    liquidityProtocolMock = await LiquidityProtocolMock.deploy(reserveTokenMock.address);

    const liquidityProtocolImplementations = [liquidityProtocolMock.address];
    insuranceContract = await LiquidityProtocolInsurance.deploy(liquidityProtocolImplementations,
                                                                daiMock.address, 
                                                                uniswapRouterMock.address, 
                                                                tusdReserveMock.address, 
                                                                tusdSupplyMock.address);

    [owner, addr1] = await ethers.getSigners();
    validCoverageData = {
      beneficiary: addr1.address,
      startDate: Math.floor(Date.now() / 1000),
      endDate: Math.floor(addDays(Date.now(),10)/1000),
      amountInsured: 2000,
      liquidityAssetData: {
        asset: tusdMock.address,
        liquidityProtocol: liquidityProtocolMock.address,
        latestReserve: 0
      }
    };

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
   
      await insuranceContract.connect(addr1).registerInsurancePolicy(validCoverageData);
      expect(await reserveTokenMock.balanceOf(addr1.address)).to.not.equal(amountInsured);
      expect(await reserveTokenMock.balanceOf(addr1.address)).to.equal(expectedReserveTokensToReturn);
      expect(await daiMock.balanceOf(insuranceContract.address)).to.equal(expectedDai);
      const insurancePolicies = await insuranceContract.getInsurancePoliciesByBeneficiary(addr1.address);
      expect(insurancePolicies[0].coverageData.beneficiary).to.be.equal(addr1.address);

    });

  });

  describe("Payouts - Reserve (Parameter One)" , () => {

    it("Should NOT call pay function if not admin", async () => {
      
      await expect(insuranceContract.connect(addr1).checkForSignificantReserveDecreaseAndPay()).to.be.revertedWith("Ownable: caller is not the owner");

    });

    it("Should NOT payout if there is NOT a significant decrease of the liquidity pool (reserve)", async () => {
      await tusdMock.faucet(addr1.address, 2000);
      await tusdMock.connect(addr1).approve(insuranceContract.address, 2000);
      await insuranceContract.connect(addr1).registerInsurancePolicy(validCoverageData);
      
      expect(await insuranceContract.checkStatusForSignificantReserveDecrease()).to.be.false;
      const insuranceContractBalanceDaiBefore = await daiMock.balanceOf(insuranceContract.address);
      await insuranceContract.checkForSignificantReserveDecreaseAndPay();
      const insuranceContractBalanceDaiAfter = await daiMock.balanceOf(insuranceContract.address);
      expect(insuranceContractBalanceDaiBefore).to.be.equal(insuranceContractBalanceDaiAfter);
    });

    it("Should payout if there is a significant decrease of the liquidity pool (reserve)", async () => {
      await tusdMock.faucet(addr1.address, 2000);
      await tusdMock.connect(addr1).approve(insuranceContract.address, 2000);
      await insuranceContract.connect(addr1).registerInsurancePolicy(validCoverageData);
      
      const currentTUSDInLiquidityProtocolMockReserve = await liquidityProtocolMock.getReserve(tusdMock.address);
      const decreasedTUSDInReserve = Math.floor(currentTUSDInLiquidityProtocolMockReserve - (currentTUSDInLiquidityProtocolMockReserve * 0.75));
      await liquidityProtocolMock.setReserve(tusdMock.address, decreasedTUSDInReserve);

      expect(await insuranceContract.checkStatusForSignificantReserveDecrease()).to.be.true;

      //Assumption: There is a big reserve in the insurance contract
      await daiMock.faucet(insuranceContract.address, 1800);
      const insuranceContractBalanceDaiBefore = await daiMock.balanceOf(insuranceContract.address);
      await insuranceContract.checkForSignificantReserveDecreaseAndPay();
      const insuranceContractBalanceDaiAfter = await daiMock.balanceOf(insuranceContract.address);
      expect(insuranceContractBalanceDaiAfter).to.be.equal(0);
      expect(await daiMock.balanceOf(addr1.address)).to.be.equal(2000);
    });

  });

});