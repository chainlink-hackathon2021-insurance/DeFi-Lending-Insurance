/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select } from "antd";
import picture from './images/registration-success.png';

export default function SmartContractDetails({address}) {
   
  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <h2>Smart Contract Details</h2>
        <ContractSteps currentStep={2} />
        <Row>
            <Col span={24} style={{textAlign:"left"}}>
                <h2>Coverage Type</h2>
                Insurance coverage pays a pre-agreed upon amount directly to your wallet immediatly upon AAVE getting hacked.
            </Col>
        </Row>
      </div>
    
  );
}
