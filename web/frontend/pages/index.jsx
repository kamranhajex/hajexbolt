import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
  Form, FormLayout, TextField, Button,
  Toast
} from "@shopify/polaris";
import {useState, useCallback, useEffect} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import {HorizontalGrid } from '@shopify/polaris';

import { BASE_URL, storeURL } from '../constants';

import { trophyImage } from "../assets";

import { ProductsCard } from "../components";
import { OrdersTable } from "../components";
import { Header } from "../components";

import { useAppQuery, useAuthenticatedFetch } from "../hooks";

const _s = storeURL();
export default function HomePage(props) {
  const [IsLoading, setIsLoading] = useState(false);
  const [ErrorMsg, setErrorMsg] = useState('');
  const [SuccessMsg, setSuccessMsg] = useState('');
  const [Errorlog, setErrorLog] = useState('');
  
  const { t } = useTranslation();

  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [ConnectedEmail, setConnectedEmail] = useState('');
  const [IsConnect, setIsConnect] = useState(false);

  useEffect(()=>{
    // console.log("ConnectedEmail", ConnectedEmail);
    // console.log('sessionStorage.getItem("token")', sessionStorage.getItem("token"));
    // let user = (sessionStorage.getItem("user")) ? JSON.parse(sessionStorage.getItem("user")) : null;
    // if(user){
    //   setConnectedEmail(user.email);
    // }
    fetch('/api/kd/isConnected?shop='+_s, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      if(response2.success){
        setIsConnect(response2.data.is_connect);
        setConnectedEmail(response2.data.email);
      }
    });
  }, [IsConnect]);

  const handleSubmit = async() => {
    setIsLoading(true);
    console.log("kd token", storeURL());
    var formData = new FormData();
    formData.append("email", Email);
    formData.append("password", Password);
    formData.append("consumer_key", "d6cd33d6ba8a62d5ff6d548d45f0df32");
    formData.append("consumer_secret", "b8ef05753bf0164f187cf1f1354ea397");
    formData.append("callback_url", "https://schedule-enrolled-assignments-surgeon.trycloudflare.com/auth/callback");
    formData.append("market_place[0][market]", "Shopify");

    // formData.append("shop", storeURL());
    console.log(BASE_URL+'plugin-login');
    fetch(BASE_URL+'plugin-login', {
      method: 'post',
      body: formData,
    })
    .then(response => response.json())
    .then((response)=>{
      setIsLoading(false);

      console.log("kd data",response);
      if(typeof response.errors !== 'undefined'){
        if(typeof response.errors.email !== 'undefined'){
          setErrorMsg(response.errors.email);
          return;
        }
        if(typeof response.errors.password !== 'undefined'){
          setErrorMsg(response.errors.password);
          return;
        }
      }
      if(response.status==false){
        setErrorMsg(response.message);
        return;
      }
      if(response.status==true){
        // create session
        var formData2 = new FormData();
        formData2.append("token", response.data.token);
        formData2.append("user", JSON.stringify(response.data.user));
        formData2.append("hajexbolt_response", JSON.stringify(response));
        formData2.append("shop", storeURL());
        fetch('/api/kd/connect?shop='+_s, {
          method: 'post',
          body: formData2,
        })
        .then(response2 => response2.json())
        .then((response2)=>{
          // sessionStorage.setItem("token", response.data.token);
          // sessionStorage.setItem("user", JSON.stringify(response.data.user));
          setSuccessMsg(response.message);
          // window.location.reload(false);
          return;
        });

      }
    })
  };

  const disconnectUser = () => {
    setIsLoading(true);
    fetch('/api/kd/disconnect?shop='+_s, {
      method: 'post',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      setIsLoading(false);
      window.location.reload(false);
      return;
    });
  }

  return (
    <Page fullWidth  >
      <TitleBar title={t("HomePage.title")} primaryAction={null} />
      <Layout>
        <HorizontalGrid gap="4" columns={2}>
          <Layout.Section>
            <Header />
          </Layout.Section>
          <Layout.Section>
            <Page  title="Connect/Disconect Your Account"> 
            {
              (IsConnect) ? (
                <Form noValidate onSubmit={disconnectUser}>
                  <FormLayout>
                    <TextField
                      value={ConnectedEmail}
                      label="Email"
                      type="email"
                      autoComplete="off"
                    />
                    <Button loading={IsLoading} destructive submit>Disconnect</Button>
                  </FormLayout>
                </Form>
              ) : (
                <Layout.Section>
                {
                  (SuccessMsg) ? (
                    <p style={{color:'green'}} >{SuccessMsg}</p>
                  ) :  null
                }
                {
                  (ErrorMsg) ? (
                    <p style={{color:'red'}} >{ErrorMsg}</p>
                  ) :  null
                }
                <Form noValidate onSubmit={handleSubmit}>
                  <FormLayout>
                    <TextField
                      value={Email}
                      onChange={(v) => { setEmail(v); console.log(v); }}
                      label="Email"
                      type="email"
                      autoComplete="off"
                    />
                    <TextField
                      value={Password}
                      onChange={(v) => { setPassword(v); console.log(v); }}
                      label="Password"
                      type="password"
                      autoComplete="off"
                    />
                    <Button loading={IsLoading} primary submit>Login</Button>
                  </FormLayout>
                </Form>
                </Layout.Section>
              )
            }
            </Page>
          </Layout.Section>  
        </HorizontalGrid>
      </Layout>
    </Page>
  );
}
