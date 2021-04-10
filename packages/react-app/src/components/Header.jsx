import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header() {
  return (
      <div>
      <PageHeader
        title="Parametric Digital Asset Risk Management"
        avatar={{src: process.env.PUBLIC_URL + '/logo192.png', size: 50}}
      />
      </div>
  );
}
