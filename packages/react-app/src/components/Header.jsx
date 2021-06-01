import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header({networkName, networks}) {
  if(networkName){
    return (
      <div>
        <PageHeader
            title="Parametric Digital Asset Risk Management"
            subTitle={networkName ? '@' + networkName : null}
            avatar={{src: process.env.PUBLIC_URL + '/logo192.png', size: 50}}
          />
      </div>
    )
  }
  else {
    const names = [];
    for(let key in networks){
        names.push(networks[key].name);
    }
    return (
      <div>
        <PageHeader
            title="Parametric Digital Asset Risk Management"
            subTitle={"Invalid Network. Switch to " + names.join(', ')} 
            avatar={{src: process.env.PUBLIC_URL + '/logo192.png', size: 50}}
          />
      </div>
    )
  }
}
