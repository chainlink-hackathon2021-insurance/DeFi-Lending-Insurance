/* eslint-disable jsx-a11y/accessible-emoji */

import { useContractReader } from "../hooks";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Table, Space, Button } from "antd";
import { parseEther, formatEther } from "@ethersproject/units";

const { Column, ColumnGroup } = Table;

export default function Dashboard({writeContracts, provider, address, tx, signer}) {
    
    const insuranceContractAbi = [
        "function getReserveTokenBalance() external view returns(uint256)",
        "function getReserveTokenAddress() external view returns(address)",
        "function withdraw() external onlyOwner returns (uint256)", 
        "function isPolicyActive() public view returns(bool)",
        "function getReserveTokenDenomination() external view returns(string memory)"
    ];

    const contractAddresses = useContractReader(writeContracts, "LiquidityProtocolInsurance", "getInsurancePolicyAddresses");
    
    const [dataSource, setDataSource]  = useState([]);
    
    useEffect(() => {
        const fetchData = async () => {
            const records = await fetchRecords();    
            setDataSource(records);
        }
        fetchData();
      }, [contractAddresses]);

    async function fetchRecords(){
        let records = [];
        for(let contractIndex in contractAddresses){
            let contractAddress = contractAddresses[contractIndex];
            let tempContractIn = new ethers.Contract(contractAddress, insuranceContractAbi, provider);
            let tokenBalance = await tempContractIn.getReserveTokenBalance();
            let policyActive = await tempContractIn.isPolicyActive();
            let denomination = await tempContractIn.getReserveTokenDenomination();
            records.push({ 
                key: contractIndex,
                address: contractAddress,
                balance: formatEther(tokenBalance.toString()), 
                active: policyActive.toString(), 
                denomination: denomination
            });
            
        }
        console.log("The records");
        console.log(records);
        return records;
    }
  
      
    return (
        <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
            <h1>Dashboard</h1>
           
            <Table dataSource={dataSource}>
                <Column title="Address" dataIndex="address" key="address" />
                <Column title="Current Balance" dataIndex="balance" key="balance" />
                <Column title="Denomination" dataIndex="denomination" key="denomination" />
                <Column title="Active" dataIndex="active" key="active" />
                <Column
                    title="Action"
                    key="action"
                    render={(text, record) => (
                        <Space size="middle">
                        { record.active === "true" ? 
                            <Button type="primary" onClick={()=>{
                                tx(writeContracts.LiquidityProtocolInsurance.withdraw(record.address));
                            }}>Withdraw</Button>
                        : null }
                        </Space>
                    )}
                />
            </Table>

        </div>
    
  );
}
