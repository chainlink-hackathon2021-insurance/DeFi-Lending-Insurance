import React, { useCallback, useEffect, useState } from "react";
import { HashRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import {  StaticJsonRpcProvider, JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import "./App.css";
import { Row, Col, Button, Menu, Switch as SwitchD, Layout } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { useExchangePrice, useGasPrice, useUserProvider, useContractLoader, useBalance, useOnBlock } from "./hooks";
import { Header, Account, Faucet, Contract, ThemeSwitch } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { Dashboard, DebugPanel, RegistrationSuccess, ReviewAndPurchase, SmartContractDetails, SuccessfullyConnected, Home } from "./views"
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
const {   Footer } = Layout;

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/


/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS['localhost']; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true



// 🛰 providers
if(DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
const scaffoldEthProvider = new StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544");
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if(DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);


// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;


function App(props) {

  const mainnetProvider = (scaffoldEthProvider && scaffoldEthProvider._network) ? scaffoldEthProvider : mainnetInfura
  if(DEBUG) console.log("🌎 mainnetProvider",mainnetProvider)

  const [injectedProvider, setInjectedProvider] = useState(null);
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork,mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork,"fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  if(DEBUG) console.log("👩‍💼 selected address:",address)

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId
  if(DEBUG) console.log("🏠 localChainId",localChainId)

  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId
  if(DEBUG) console.log("🕵🏻‍♂️ selectedChainId:",selectedChainId)

    // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
      console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`)
  })
  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice)

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice)

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);
  if(DEBUG) console.log("💵 yourLocalBalance",yourLocalBalance?formatEther(yourLocalBalance):"...")

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  if(DEBUG) console.log("💵 yourMainnetBalance",yourMainnetBalance?formatEther(yourMainnetBalance):"...")

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider)
  if(DEBUG) console.log("🔐 writeContracts",writeContracts)

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname)
  }, [setRoute]);

  let faucetHint = ""
  const faucetAvailable = localProvider && localProvider.connection && localProvider.connection.url && localProvider.connection.url.indexOf(window.location.hostname)>=0 && !process.env.REACT_APP_PROVIDER && price > 1;

  const [ faucetClicked, setFaucetClicked ] = useState( false );
  if(!faucetClicked&&localProvider&&localProvider._network&&localProvider._network.chainId==31337&&yourLocalBalance&&formatEther(yourLocalBalance)<=0){
    faucetHint = (
      <div style={{padding:16}}>
        <Button type={"primary"} onClick={()=>{
          faucetTx({
            to: address,
            value: parseEther("0.01"),
          });
          setFaucetClicked(true)
        }}>
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    )
  }

  /* APPLICATION SPECIFIC STATES START HERE */
  const [liquidityProtocolToAddressMap, setLiquidityProtocolToAddressMap] = useState({});
  const [ mockPoRPoSAddresses, setMockPoRPoSAddresses ] = useState({});
  const [ realPoRPoSAddresses, setRealPoRPoSAddresses ] = useState({});
  
  const [tusdAddress, setTusdAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if(!writeContracts) { return; }
    if(targetNetwork.name === "localhost"){
      setLiquidityProtocolToAddressMap({
        "AAVE":  writeContracts.LiquidityProtocolMock.address,
        "Mock" : writeContracts.LiquidityProtocolMock.address,
      });
      setMockPoRPoSAddresses({
        "reserve" : writeContracts.MockTUSDReserveFeed.address,
        "supply" : writeContracts.MockTUSDSupplyFeed.address
      });
      setRealPoRPoSAddresses({
        "reserve" : writeContracts.MockTUSDReserveFeed.address,
        "supply" : writeContracts.MockTUSDSupplyFeed.address
      });
      setTusdAddress(writeContracts.TUSDMock.address);
    }
    else if(targetNetwork.name === "kovan"){
      setLiquidityProtocolToAddressMap({
        "AAVE":  writeContracts.AaveLiquidityProtocol.address,
        "Mock" : writeContracts.LiquidityProtocolMock.address,
      });
      setMockPoRPoSAddresses({
        "reserve" : writeContracts.MockTUSDReserveFeed.address,
        "supply" : writeContracts.MockTUSDSupplyFeed.address
      });
      setRealPoRPoSAddresses({
        "reserve" : "0xdD6Dbd1861971455C20d5bd00DeA4DDE704f3554",
        "supply" : "0xC3749f644c988Dc9AA9461D6Cb1d8A5E1d452D99"
      });
      setTusdAddress("0x016750AC630F711882812f24Dba6c95b9D35856d");
    }
  }, [writeContracts]);

  useEffect(() => {
    if(!writeContracts) { return; }
    const detectAdmin = async () => {
        const admin = await writeContracts.LiquidityProtocolInsurance.owner();    
        if(address === admin){
          setIsAdmin(true);
        }
    }
    detectAdmin();
  }, [writeContracts]);
   
  const [ depositAmount, setDepositAmount ] = useState(100);
  const [ liquidityProtocol, setLiquidityProtocol ] = useState("AAVE");
  /* APPLICATION SPECIFIC STATES END HERE */
  return (
    <div className="App">
      <Layout>
        {/* ✏️ Edit the header and change the title to your project name */}
        <Header networkName={userProvider.connection.url !== "unknown:" ? NETWORK(selectedChainId) : null} />
        <HashRouter>

          <Menu style={{ textAlign:"center" }} selectedKeys={[route]} mode="horizontal">
            <Menu.Item key="/">
              <Link onClick={()=>{setRoute("/")}} to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="/github">
              <a href="https://github.com/chainlink-hackathon2021-insurance" target="_blank">GitHub</a>
            </Menu.Item>
            <Menu.Item key="/devpost">
              <a href="https://devpost.com/software/parametric-digital-asset-risk-management" target="_blank">Devpost</a>
            </Menu.Item>
            <Menu.Item key="/registration-success">
              <Link onClick={()=>{setRoute("/registration-success")}} to="/registration-success">Start Now</Link>
            </Menu.Item>
            <Menu.Item key="/dashboard">
              <Link onClick={()=>{setRoute("/dashboard")}} to="/dashboard">Dashboard</Link>
            </Menu.Item>
          </Menu>

          <Switch>
            <Route exact path="/">
              <Home 
                setRoute={setRoute}
              />
            </Route>
            <Route exact path="/debug">
              <DebugPanel
                tx={tx}
                writeContracts={writeContracts}
                tusdAddress={tusdAddress}
                provider={userProvider}
                mockPoRPoSAddresses={mockPoRPoSAddresses}
                realPoRPoSAddresses={realPoRPoSAddresses}
              />
            </Route>
            <Route exact path="/debug/liquidityProtocolInsurance">
              <Contract
                name="LiquidityProtocolInsurance"
                signer={userProvider.getSigner()}
                provider={userProvider}
                address={address}
                blockExplorer={blockExplorer}
              />
            </Route>
            <Route path="/debug/mockTUSD">
              <Contract
                  name="TUSDMock"
                  signer={userProvider.getSigner()}
                  provider={userProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />  
            </Route>
            <Route path="/debug/liquidityProtocolMock">
              <Contract
                  name="LiquidityProtocolMock"
                  signer={userProvider.getSigner()}
                  provider={userProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />  
            </Route>
            <Route path="/debug/ReserveTokenMock">
              <Contract
                  name="ReserveTokenMock"
                  signer={userProvider.getSigner()}
                  provider={userProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />  
            </Route>

            <Route path="/registration-success">
              <RegistrationSuccess 
                provider={userProvider}
                address={address} 
                setRoute={setRoute}
                liquidityProtocol={liquidityProtocol}
                setLiquidityProtocol={setLiquidityProtocol}
                />
            </Route>
            <Route path="/smart-contract-details">
              <SmartContractDetails 
                depositAmount={depositAmount}
                liquidityProtocol={liquidityProtocol}
                setDepositAmount={setDepositAmount}
                setRoute={setRoute} />
            </Route>
            <Route path="/review-and-purchase">
              <ReviewAndPurchase
                liquidityProtocol={liquidityProtocol}
                depositAmount={depositAmount}
                liquidityProtocolToAddressMap={liquidityProtocolToAddressMap}
                writeContracts={writeContracts}
                tx={tx}
                tusdAddress={tusdAddress}
                setRoute={setRoute}
                signer={userProvider.getSigner()}
                provider={userProvider}
                />
            </Route>
            <Route path="/successfully-connected">
              <SuccessfullyConnected />
            </Route>

            <Route path="/dashboard">
              <Dashboard
                writeContracts={writeContracts}
                provider={userProvider}
                signer={userProvider.getSigner()}
                address={address}
                tx={tx}
              />
            </Route>

          </Switch>
       

        <ThemeSwitch />


        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "absolute", textAlign: "right", right: 0, top: 0, padding: 10 }}>
          <Account
            address={address}
            localProvider={localProvider}
            userProvider={userProvider}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
          {faucetHint}
        </div>

        {userProvider.connection.url !== "unknown:" &&
        <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>

          <Row align="middle" gutter={[4, 4]}>
            <Col span={24}>
              {

                /*  if the local provider has a signer, let's show the faucet:  */
                faucetAvailable ? (
                  <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider}/>
                ) : (
                  ""
                )
              }
            </Col>
          </Row>
        </div>
      }
      
      <Footer style={{ textAlign: 'center' }}>
        {isAdmin &&    
          <Link to="/debug">Debug Panel</Link>
        }
            
      </Footer>
      </HashRouter>
    </Layout>
    </div>
  );
}


/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

 window.ethereum && window.ethereum.on('chainChanged', chainId => {
  setTimeout(() => {
    window.location.reload();
  }, 1);
})

export default App;
