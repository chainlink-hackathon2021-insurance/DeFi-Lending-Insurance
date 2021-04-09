/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select, InputNumber, Divider } from "antd";
import picture from './images/registration-success.png';

export default function ReviewAndPurchase({setRoute, depositAmount, liquidityProtocol, writeContracts, tx, liquidityProtocolToAddressMap}) {
    const history = useHistory();
  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <h2>Review and Purchase</h2>
            <ContractSteps currentStep={3} />
            <div style={{margin: "auto", width: "70%"}}>

            <Row>
                <Col span={24} style={{textAlign:"left"}}>
                    <h2>Coverage Type</h2>
                    <p>Insurance coverage pays a pre-agreed upon amount directly to your wallet immediatly upon AAVE getting hacked.</p>
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
                <Button type="primary" onClick={()=>{
                     tx( writeContracts.LiquidityProtocolInsurance.registerInsurancePolicy(
                        Math.floor(Date.now() / 1000), 
                        Math.floor(Date.now() / 1000),
                        depositAmount, 
                        liquidityProtocolToAddressMap[liquidityProtocol]
                        ));                    
                }}>Next</Button>
            </Col>
        </Row>
      </div>
    
  );
}
