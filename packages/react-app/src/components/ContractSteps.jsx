import React from "react";
import { Steps } from "antd";

export default function ContractSteps({currentStep}){
    const { Step } = Steps;

    return (
        <Steps progressDot current={currentStep}>
            <Step title="Tutorial" />
            <Step title="Account Setup" />
            <Step title="Smart Contract Details" />
            <Step title="Review and Purchase" />
            <Step title="Smart Contract Connected" />
        </Steps>
    )
}