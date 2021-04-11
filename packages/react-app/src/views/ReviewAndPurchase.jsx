/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select, InputNumber, Divider } from "antd";
import { ethers } from "ethers";
import { parseEther, formatEther } from "@ethersproject/units";

export default function ReviewAndPurchase({setRoute, depositAmount, liquidityProtocol, writeContracts, tx, liquidityProtocolToAddressMap, tusdAddress, provider, signer}) {
    const history = useHistory();
    
    const [approved, setApproved] = useState(false);

    const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function approve(address _spender, uint256 _value) public returns (bool success)",
        "function allowance(address _owner, address _spender) public view returns (uint256 remaining)"
    ];

    return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <h1>Review and Purchase</h1>
            <ContractSteps currentStep={3} />
            <div style={{margin: "auto", width: "70%"}}>

            <Row>
                <Col span={24} style={{textAlign:"left"}}>
                    <h2>Coverage Type</h2>
                    <p>Insurance coverage pays a pre-agreed upon amount directly to your wallet immediatly upon {liquidityProtocol} getting hacked.</p>
                </Col>
            </Row>
            <Row style={{marginTop: "30px"}}> 
                <Col span={12}>
                    <p>Your Deposit Amount</p>
                    <p>{depositAmount} TUSD </p>
                    <p>Selected Platform</p>
                    <p>{liquidityProtocol}</p>
                </Col>
            <Col span={12}></Col>
            </Row>
            <Divider />

            <h2>Pay with a Percentage of your Earnings</h2>
            <p>Delayed Payment is required to connect the wallet to the Smart Contract as a Service for improved risk management. </p>
            <p>Subscription is good until cancelled</p>
        </div>
        <Row style={{marginTop: "60px"}}>
            <Col span={8}>
                <Button type="primary" onClick={()=>{setRoute("/smart-contract-details"); history.push('/smart-contract-details')}}>Back</Button>
            </Col>
            <Col span={8} offset={8}>
                <Button disabled={approved} type="danger" onClick={async ()=>{
                    const erc20Contract = new ethers.Contract(tusdAddress, erc20Abi, provider);
                    const result = await tx(erc20Contract.connect(signer).approve(writeContracts.LiquidityProtocolInsurance.address,  parseEther(depositAmount.toString())));
                    if(result){
                        setApproved(true);
                    }
                }}>Approve first!</Button>
                <Button disabled={!approved} type="primary" onClick={async ()=>{
                    const result = await tx( writeContracts.LiquidityProtocolInsurance.registerInsurancePolicy(
                        parseEther(depositAmount.toString()), 
                        liquidityProtocolToAddressMap[liquidityProtocol]
                        ));  
                    if(result){
                        setRoute("/successfully-connected"); 
                        history.push('/successfully-connected');
                    }
                }}>Next</Button>
            </Col>
        </Row>
      </div>
    
  );
}
