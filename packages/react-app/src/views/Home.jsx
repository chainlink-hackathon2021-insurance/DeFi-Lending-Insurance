/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select } from "antd";

export default function Home({setRoute}) {
    const history = useHistory();

  return (
      <>
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <Row style={{marginTop: "60px"}}>
            <Col span={12}>
                <img src="https://ipfs.io/ipfs/QmcEmU5LgyCXiRaaKuNYmbHbrypPEZxWJJm8HoaLT5Bmbu" />
            </Col>
            <Col span={12} style={{textAlign: 'left'}}>
                <h4>PROTECTION</h4>
                <h1>Protect your assets from unnecessary risk.</h1>
                <p>Mitigate inherent user risk when interacting with Decentralized Finance (DeFi) protocols.</p>
            </Col>
        </Row>
      </div>
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
      <Row style={{marginTop: "60px"}}>
          <Col span={12}>
              <h1>Mitigate inherent user risk when interacting with Decentralized Finance (DeFi) protocols.</h1>
              <Row style={{marginTop: "60px"}}>
                <Col span={12}>
                    <p>DeFi is an emerging market composed of interoperable protocols.</p>
                </Col>
                <Col span={12}>
                    <p>DeFi protocols are rapidly expanding their Total Value Locked (TVL).</p>
                    <p>Rapid protocol expansion leads to rapid expansion of user risk.</p>
                </Col>
            </Row>
          </Col>
          <Col span={12}>
            <img src="https://ipfs.io/ipfs/QmWDiATD2mbMDfyzTW3xMv5cwbvoEvWzoc2ribNBfCnMEi" />
          </Col>
      </Row>
    </div>
    <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <Row style={{marginTop: "60px"}}>
            <Col span={12}>
                <img src="https://ipfs.io/ipfs/QmW1A1pcFN2QtRdrPAV15j6VZgAFPmzhbyrasZvqxdg1rH" />
            </Col>
            <Col span={12}>
                <h4>PARAMETRIC RISK MANAGEMENT</h4>
                <h1>DeFi exposes users to theoretically unlimited risk.</h1>
                <p>User risk is at an all time high. Manage your risk today!</p>
            </Col>
        </Row>
      </div>
    </>
  );
}
