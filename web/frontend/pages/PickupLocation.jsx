import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
  Form, FormLayout, TextField, Button, Autocomplete, Icon
} from "@shopify/polaris";
import {SearchMinor} from '@shopify/polaris-icons';

import {useState, useCallback, useEffect} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import {HorizontalGrid} from '@shopify/polaris';


import { trophyImage } from "../assets";

import { ProductsCard } from "../components";
import { OrdersTable } from "../components";
import { Header } from "../components";
import { BASE_URL, storeURL } from '../constants';

const _s = storeURL();
export default function PickupLocation() {
  const { t } = useTranslation();

  const [IsLoading, setIsLoading] = useState(false);
  const [ErrorMsg, setErrorMsg] = useState('');
  const [SuccessMsg, setSuccessMsg] = useState('');

  const [FullAddress, setFullAddress] = useState(sessionStorage.getItem("PLFullAddress"));
  const [Country, setCountry] = useState("Canada");
  const [CountryText, setCountryText] = useState('');
  
  const [State, setState] = useState(sessionStorage.getItem("PLState"));
  const [StateText, setStateText] = useState('');
  
  const [City, setCity] = useState(sessionStorage.getItem("PLCity"));
  const [ZipCode, setZipCode] = useState(sessionStorage.getItem("PLZipCode"));
  const [Company, setCompany] = useState(sessionStorage.getItem("PLCompany"));
  const [Attention, setAttention] = useState(sessionStorage.getItem("PLAttention"));
  const [Phone, setPhone] = useState(sessionStorage.getItem("PLPhone"));
  const [Email, setEmail] = useState(sessionStorage.getItem("PLEmail"));
  const [IsConnect, setIsConnect] = useState(false);
  const [IsConnectError, setIsConnectError] = useState('');

  const [Countries, setCountries] = useState([]);
  const [CountriesFilter, setCountriesFilter] = useState([]);
  const [IsLoadingCountries, setIsLoadingCountries] = useState(false);

  const [States, setStates] = useState([]);
  const [StatesFilter, setStatesFilter] = useState([]);
  const [IsLoadingStates, setIsLoadingStates] = useState(false);


  const handleSubmit = useCallback(() => {
    // console.log("FullAddress", FullAddress)
    // sessionStorage.setItem('PLFullAddress', (FullAddress) ? FullAddress : '');
    // sessionStorage.setItem('PLCountry', (Country) ? Country : '');
    // sessionStorage.setItem('PLState', (State) ? State : '');
    // sessionStorage.setItem('PLCity', (City) ? City : '');
    // sessionStorage.setItem('PLZipCode', (ZipCode) ? ZipCode : '');
    // sessionStorage.setItem('PLCompany', (Company) ? Company : '');
    // sessionStorage.setItem('PLAttention', (Attention) ? Attention : '');
    // sessionStorage.setItem('PLPhone', (Phone) ? Phone : '');
    // sessionStorage.setItem('PLEmail', (Email) ? Email : '');
    setIsLoading(true);
    var formData2 = new FormData();
    formData2.append("full_address", (FullAddress) ? FullAddress : '');
    formData2.append("country", (Country) ? Country : '');
    formData2.append("state", (State) ? State : '');
    formData2.append("city", (City) ? City : '');
    formData2.append("zipcode", (ZipCode) ? ZipCode : '');
    formData2.append("company", (Company) ? Company : '');
    formData2.append("attention", (Attention) ? Attention : '');
    formData2.append("phone", (Phone) ? Phone : '');
    formData2.append("email", (Email) ? Email : '');
    formData2.append("shop", _s);
    
    fetch('/api/kd/savePickupLocation', {
      method: 'post',
      body: formData2,
    })
    .then(response => response.json())
    .then((response)=>{
      setIsLoading(false);
      // sessionStorage.setItem("token", response.data.token);
      // sessionStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccessMsg(response.msg);
      //window.location.reload(false);
      //return;
    }); // END fetch

  });

  useEffect(()=>{
    // console.log("ConnectedEmail", ConnectedEmail);
    // console.log('sessionStorage.getItem("token")', sessionStorage.getItem("token"));
    // let user = (sessionStorage.getItem("user")) ? JSON.parse(sessionStorage.getItem("user")) : null;
    // if(user){
    //   setConnectedEmail(user.email);
    // }
    setIsLoadingCountries(true);
    fetch('/api/kd/countries', {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      setIsLoadingCountries(false);
      if(response2.success){
        setIsConnect(response2.data.is_connect);
        if(!response2.data.is_connect){
          setIsConnectError("Please connect your account to use the App.")
        }else{
          setCountries(response2.data.countries);
          setCountriesFilter(response2.data.countries);
        }
      }
    });

    fetch('/api/kd/isConnected?shop='+_s, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      if(response2.success){
        setIsConnect(response2.data.is_connect);
        if(!response2.data.is_connect){
          setIsConnectError("Please connect your account to use the App.")
        }else{
          setFullAddress(response2.data.full_address);
          setCountry(response2.data.country);
          setCountryText(response2.data.country);
          setState(response2.data.state);
          setStateText(response2.data.state);
          setCity(response2.data.city);
          setZipCode(response2.data.zipcode);
          setCompany(response2.data.company);
          setAttention(response2.data.attention);
          setPhone(response2.data.phone);
          setEmail(response2.data.email);
        }
      }
    });
  }, [IsConnect]);  

  const textField = (
    <Autocomplete.TextField
      onChange={(value)=>{
        setCountryText(value);
        if (value === '') {
          setCountriesFilter(Countries);
          return;
        }
  
        const filterRegex = new RegExp(value, 'i');
        const resultOptions = CountriesFilter.filter((option) =>
          option.label.match(filterRegex),
        );
        setCountriesFilter(resultOptions);
        
    
      }}
      label="Country"
      value={CountryText}
      prefix={<Icon source={SearchMinor} color="base" />}
      placeholder="Search Country"
      autoComplete="off"
    />
  );

  const textFieldState = (
    <Autocomplete.TextField
      onChange={(value)=>{
        setStateText(value);
        if (value === '') {
          setStatesFilter(States);
          return;
        }
  
        const filterRegex = new RegExp(value, 'i');
        const resultOptions = StatesFilter.filter((option) =>
          option.label.match(filterRegex),
        );
        setStatesFilter(resultOptions);
        
      }}
      label="State"
      value={StateText}
      prefix={<Icon source={SearchMinor} color="base" />}
      placeholder="Search State"
      autoComplete="off"
    />
  );

  const fetchStates = (value) => {
    setCountry(value)
    setCountryText(value);

    setStates([]);
    setStatesFilter([]);

    setState("");
    setStateText("");

    setIsLoadingStates(true);
  }

  useEffect(()=>{
    fetch(`/api/kd/states?country_name=${Country}`, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      setIsLoadingStates(false);
      if(response2.success){
        setIsConnect(response2.data.is_connect);
        if(!response2.data.is_connect){
          setIsConnectError("Please connect your account to use the App.")
        }else{
          setStates(response2.data.countries);
          setStatesFilter(response2.data.countries);
        }
      }
    });
  }, [CountryText]);  


  return (
    <Page fullWidth>
      <Layout>
        <HorizontalGrid gap="4" columns={2}>
          <Layout.Section>
            <Header />
          </Layout.Section>  
          <Layout.Section>
            <Page  title="Pickup Location"> 
            {
              (IsConnect) ? (
                <Form noValidate onSubmit={handleSubmit}>
                  <FormLayout>
                    <TextField

                      value={FullAddress}
                      onChange={(v) => {
                        setFullAddress(v);
                      }}
                      label="Full Address"
                      type="text"
                      autoComplete="off"
                    />
                    {/* <TextField
                      value={Country}
                      onChange={(v) => {
                        setCountry(v);
                      }}
                      label="Country"
                      type="text"
                      autoComplete="off"
                    /> */}

                    {console.log("kd Country", Country)}
                    <Autocomplete
                      loading={IsLoadingCountries}
                      options={CountriesFilter}
                      selected={(typeof Country == 'undefined' || !Country) ? "" : Country}
                      onSelect={(value)=>{
                        // fetch states
                        fetchStates(value);

                      }}
                      textField={textField}
                      autocomplete="off"
                    />

                    <Autocomplete
                      loading={IsLoadingStates}
                      options={StatesFilter}
                      selected={(typeof State == 'undefined' || !State) ? "" : State}
                      onSelect={(value)=>{
                        setState(value)
                        setStateText(value);
                      }}
                      textField={textFieldState}
                      autocomplete="off"
                    />


                    {/* <TextField
                      value={State}
                      onChange={(v) => {
                        setState(v);
                      }}
                      label="State/Province"
                      type="text"
                      autoComplete="off"
                    /> */}
                    <TextField
                      value={City}
                      onChange={(v) => {
                        setCity(v);
                      }}
                      label="City/Town"
                      type="text"
                      autoComplete="off"
                    />
                    <TextField
                      value={ZipCode}
                      onChange={(v) => {
                        setZipCode(v);
                      }}
                      label="Zip/Postal Code"
                      type="text"
                      autoComplete="off"
                    />
                    <TextField
                      value={Company}
                      onChange={(v) => {
                        setCompany(v);
                      }}
                      label="Company"
                      type="text"
                      autoComplete="off"
                    />
                    <TextField
                      value={Attention}
                      onChange={(v) => {
                        setAttention(v);
                      }}
                      label="Attention"
                      type="text"
                      autoComplete="off"
                    />
                    <TextField
                      value={Phone}
                      onChange={(v) => {
                        setPhone(v);
                      }}
                      label="Phone"
                      type="tel"
                      autoComplete="off"
                    />
                    <TextField
                      value={Email}
                      onChange={(v) => {
                        setEmail(v);
                      }}
                      label="Email"
                      type="email"
                      autoComplete="off"
                    />
    
                    {
                      (SuccessMsg) ? (
                        <p style={{color:'green'}} >{SuccessMsg}</p>
                      ) :  null
                    }
    
    
                    <Button loading={IsLoading} primary submit>Save Changes</Button>
                  </FormLayout>
                </Form>
              ) : null
            }

            {
              (IsConnectError) ? (
                <p style={{color:'red'}} >{IsConnectError}</p>
              ) : null
            }
            </Page> 
          </Layout.Section>  
        </HorizontalGrid>
      </Layout>
    </Page>
  );
}
