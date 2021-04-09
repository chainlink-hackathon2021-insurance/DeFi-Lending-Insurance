/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function DebugPanel() {
  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
       <h1>Debug Panel</h1>
       <p><Link to="/debug/liquidityProtocolInsurance">LiquidityProtocolInsurance</Link></p>
       <p><Link to="/debug/liquidityProtocolMock">LiquidityProtocolMock</Link></p>
       <p><Link to="/debug/mockTUSD">TUSD Mock</Link></p>
       <p><Link to="/debug/reserveTokenMock">Reserve Token Mock</Link></p>      
      </div>
    
  );
}
