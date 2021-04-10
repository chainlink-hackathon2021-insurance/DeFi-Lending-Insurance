/* eslint-disable jsx-a11y/accessible-emoji */

import { Button, Card, Space } from "antd";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function DebugPanel({writeContracts, readContracts, tx, tusdAddress}) {

  async function triggerMockReserveHack(){
    const currentReserve = await readContracts.LiquidityProtocolMock.getReserve(tusdAddress);
    const decreasedTUSDInReserve = Math.floor(currentReserve - (currentReserve * 0.75));
    tx(writeContracts.LiquidityProtocolMock.setReserve(tusdAddress, decreasedTUSDInReserve));
  }

  async function triggerCheckMockReserveStatus() {
    tx(writeContracts.LiquidityProtocolInsurance.checkForSignificantReserveDecreaseAndPay());
  }

  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
       <h1>Debug Panel</h1>       
        <Space direction="horizontal">
          <Card title="Contract Debug panels" style={{ width: 300 }}>
            <p><Link to="/debug/liquidityProtocolInsurance">LiquidityProtocolInsurance</Link></p>
            <p><Link to="/debug/liquidityProtocolMock">LiquidityProtocolMock</Link></p>
            <p><Link to="/debug/reserveTokenMock">Reserve Token Mock</Link></p>      
            <p><Link to="/debug/mockTUSD">TUSD Mock (only local)</Link></p>
          </Card>
          <Card title="Reserve" style={{ width: 300, textAlign: 'left' }}>
            <p><Button type="danger" style={{ width: "238px"}} onClick={async ()=> { triggerMockReserveHack();}}>Trigger Mock Reserve Hack</Button></p>
            <p><Button type="primary" style={{ width: "238px"}} onClick={async ()=> { triggerCheckMockReserveStatus();}} >Trigger Reserve Status Check</Button></p>
          </Card>
          <Card title="PoS / PoR" style={{ width: 300, textAlign: 'left' }}>
            <p><Button type="danger" style={{ width: "238px"}}>PoR: Point to custom endpoint</Button></p>
            <p><Button type="danger" style={{ width: "238px"}}>PoS: Point to custom endpoint</Button></p>
            <p><Button type="primary" style={{ width: "238px"}}>PoR: Reset endpoint</Button></p>
            <p><Button type="primary" style={{ width: "238px"}}>PoS: Reset endpoint</Button></p>
            <p><Button type="primary" style={{ width: "238px"}}>Check PoS/PoR status</Button></p>
          </Card>
        </Space>
      </div>
    
  );
}
