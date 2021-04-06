import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header() {
  return (
    <a href="/" rel="noopener noreferrer">
      <PageHeader
        title="Parametric Digital Asset Risk Management"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
