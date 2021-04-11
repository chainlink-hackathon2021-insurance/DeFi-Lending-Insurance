/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ContractSteps } from "../components";
import { Row, Col, Button, Form, Select } from "antd";

export default function RegistrationSuccess({address, setRoute, liquidityProtocol, setLiquidityProtocol, provider}) {
    const history = useHistory();

    const { Option } = Select;

    const layout = {
        labelCol: {
          span: 8,
        },
        wrapperCol: {
          span: 16,
        },
      };
      const tailLayout = {
        wrapperCol: {
          offset: 8,
          span: 16,
        },
      };
      
  return (
      <div style={{border:"1px solid #cccccc", padding:16, width:"80%", margin:"auto",marginTop:64}}>
        <h1>Registration Success</h1>
        <ContractSteps currentStep={1} />
        <Row style={{marginTop: "60px"}}>
            <Col span={12}>
                <img src="https://ipfs.io/ipfs/QmPQCR3DxgJytoNRwKdudz6bnJbwhp4hRneXgnTb5dj817" />
            </Col>
            <Col span={12}>
                <h3>Connected Platforms</h3>
                {provider.connection.url !== "unknown:" ? 
                <Form
                    style={{textAlign: "left"}}
                    {...layout}
                    layout="vertical"
                    name="basic"
                    initialValues={{
                        remember: true,
                    }}
                    >
                    <Form.Item
                        label="Address"
                        name="address"
                        
                    >

                        {address}
                    </Form.Item>

                    <Form.Item
                        label="Selected Platform"
                        name="platform"
                    >
                         <Select onChange={(val) => {setLiquidityProtocol(val)}} defaultValue={liquidityProtocol ? liquidityProtocol : "aave" }>
                            <Option value="Aave">Aave</Option>
                            <Option value="Mock">Mock</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Selected Product"
                        name="product"
                    >
                         <Select defaultValue="TUSD" disabled>
                            <Option value="TUSD">TUSD</Option>
                        </Select>
                    </Form.Item>
                </Form>
                : (
                    <p>Please connect your wallet using the Connect button before proceeding.</p>
                )}
            </Col>
        </Row>
        <Row style={{marginTop: "60px"}}>
            <Col span={8}>
                <Button type="primary">Back</Button>
            </Col>
            {provider.connection.url !== "unknown:" &&
                <Col span={8} offset={8}>
                    <Button type="primary" onClick={()=>{setRoute("/smart-contract-details"); history.push('/smart-contract-details')}}>Next</Button>
                </Col>
            }
        </Row>
      </div>
    
  );
}
