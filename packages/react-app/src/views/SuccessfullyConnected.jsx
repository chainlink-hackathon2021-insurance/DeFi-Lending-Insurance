/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select, InputNumber, Divider } from "antd";


export default function SuccessfullyConnected() {
    const history = useHistory();
  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <h1>Smart Contract Connected</h1>
            <ContractSteps currentStep={4} />
            <img src="https://ipfs.io/ipfs/QmVFKEynyFEYC5y26ZmLHJkqEX9k33r7jQDdTUhmJcTACN" style={{marginTop: "30px"}} />
            <p style={{marginTop: "30px"}}>Please visit the dashboard to manage your policy.</p>
      </div>
    
  );
}
