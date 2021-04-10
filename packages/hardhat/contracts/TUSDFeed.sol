// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TUSDFeed is AggregatorV3Interface, ChainlinkClient, Ownable {
    
    string private tusdFeedEndpoint; 
    address private admin;

    struct Round{ 
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
        bool requesting;
    }
    
    uint8 public override decimals;
    uint256 private fee;
    uint256 public override version;
    
    address private oracle;
    bytes32 private jobId;
    
    string private path;
    string public override description;
    
    
    Round[] private rounds;
    Round currentRound;
    
    constructor(string memory _path, uint8 _decimals, uint256 _version, string memory _description) {
        setPublicChainlinkToken();
        oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        jobId = "29fa9aa13bf1468788b7cc4a500a45b8";
        fee = 0.1 * 10 ** 18; // 0.1 LINK
        tusdFeedEndpoint = "https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD";
        path = _path;
        decimals = _decimals;
        version = _version;
        description = _description;
    }

    function requestValue() public returns (bytes32 _requestId) {
        bytes32 requestId;
        if(!currentRound.requesting){
            Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillValue.selector);
            Chainlink.add(request, "get", tusdFeedEndpoint);
            Chainlink.add(request, "path", path); 
            int timesAmount = 10**8;
            Chainlink.addInt(request, "times", timesAmount); 
            
            currentRound.requesting = true;
            currentRound.startedAt = block.timestamp; 
            requestId = sendChainlinkRequestTo(oracle, request, fee);
        }
        return requestId;
        
    }
    
    function fulfillValue(bytes32 _requestId, uint256 _value) public recordChainlinkFulfillment(_requestId) {
        currentRound.answer = int256(_value);
        currentRound.updatedAt = block.timestamp;
        currentRound.answeredInRound = uint80(rounds.length);
        currentRound.requesting = false;
        rounds.push(currentRound);
    }

    function getRoundData(uint80 _roundId)
    override
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ){
        Round memory round = rounds[roundId];
        return (_roundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }
    function latestRoundData()
    override
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ){
        Round memory round = rounds[rounds.length-1];
        return (uint80(rounds.length-1), round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }
    
    function setTUSDFeedEndpoint(string memory _tusdFeedEndpoint) external onlyOwner {
        tusdFeedEndpoint = _tusdFeedEndpoint;
    }
    
    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
    
    function setJobId(bytes32 _jobId) external onlyOwner {
        jobId = _jobId;
    }
    
    function setFee(uint256 _fee) external onlyOwner{
        fee = _fee;
    }
    
}