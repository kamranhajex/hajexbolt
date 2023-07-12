import {
  Page,
  Layout,
  SkeletonBodyText, Text, CalloutCard, Divider, FormLayout, TextField, Select, Button, Icon, ButtonGroup
} from "@shopify/polaris";
import {CirclePlusMinor, DeleteMajor, MobileCancelMajor, CircleMinusMinor} from '@shopify/polaris-icons';
import {useState, useCallback, useEffect, View} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import {HorizontalGrid} from '@shopify/polaris';
import { Header } from "../components";

import { KdStyles } from '../constants';
import { trophyImage } from "../assets";


import { BASE_URL, storeURL } from '../constants';

const _s = storeURL();

export default function ProductPackings() {
  const { t } = useTranslation();

  const [IsLoading, setIsLoading] = useState(true);
  
  const [IsSavingInformation, setIsSavingInformation] = useState(false);

  const [ErrorMsg, setErrorMsg] = useState('');
  const [SuccessMsg, setSuccessMsg] = useState('');

  const [IsConnect, setIsConnect] = useState(false);
  const [IsConnectError, setIsConnectError] = useState(false);
  const [Product, setProduct] = useState(false);
  const [ProductId, setProductId] = useState(window.location.href.match(/[?&]id=(\d+)/)[1]);
 
  console.log("kd ProductId", ProductId);
  const [DimensionType, setDimensionType] = useState('Imperial');
  const [PackageDimensions, setPackageDimensions] = useState([
    {width: '', height: '', length: '', weight: ''},
  ]);

  const DimensionTypes = [
    {label: 'Imperial', value: 'Imperial'},
    {label: 'Metric', value: 'Metric'},
  ];
  
  const handleSubmit = useCallback(() => {
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
    fetch('/api/kd/product/'+ProductId+'?shop='+_s, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      if(response2.success){
        setIsConnect(response2.data.is_connect);
        if(!response2.data.is_connect){
          setIsConnectError("Please connect your account to use the App.")
        }else{
          setProduct(response2.data.product);
          
        }
      }
    });
  }, []);  

  const removeItem = (index) => {
    setPackageDimensions([
      ...PackageDimensions.slice(0, index),
      ...PackageDimensions.slice(index+1, PackageDimensions.length),
    ]);
    return true;
  }

  const saveInformation = () => {
    var error = false;
    for(let i=0; i<PackageDimensions.length; i++){
      let row = PackageDimensions[i];
      if(!row.width || !row.height || !row.length || !row.weight){
        // one field from current row is empty give error and break loop
        error = `One or more field(s) at row ${i+1} is empty.`;
        break;
      }
    }
    if(error){
      alert(error);
      return false;
    }

    // setIsSavingInformation(true);
    var formData = new FormData();
    formData.append("PackageDimensions", JSON.stringify(PackageDimensions));
    fetch('/api/kd/saveProductDimensions?shop='+_s, {
      method: 'post',
      body: formData,
    })
    .then(response => response.json())
    .then((response)=>{
      setIsSavingInformation(false);
      // window.location.reload();
    }); // END fetch

  }

  function validateNumber(value) {
    if(!value){
      return true
    }
    // Regular expression pattern to match valid numbers
    var numberPattern = /^[-+]?[0-9]+(\.[0-9]+)?$/;

    // Check if the value matches the number pattern
    return numberPattern.test(value);
  }

    return (
      <Page fullWidth >
        <TitleBar title={t("HomePage.title")} primaryAction={null} />
        <Layout>
          <HorizontalGrid columns={['oneThird', 'twoThirds']} >
            <Layout.Section>
              <Header />
            </Layout.Section>  
            <Layout.Section >
              <Page 
                backAction={{content: 'Settings', url: '/Products'}}
                title={Product?.title}>
                {
                  (!Product) ? (
                    <SkeletonBodyText />
                  ) : (
                    <Layout.Section >

                      <Text variant="headingMd" as="h6"  >
                        Package Shipping Detail
                      </Text>
                      <Divider  />
                      
                      <div style={{marginBottom:30}}> </div>

                      <FormLayout style={{marginTop:20}} containerStyle={{marginTop:20}} >
                        <Select
                          label="Dimension Type"
                          options={DimensionTypes}
                          onChange={(value)=>{
                            setDimensionType(value)
                          }}
                          value={DimensionType}
                        />

                        <Text variant="headingSm" as="p"  >
                          Package Dimensions
                        </Text>
                        {
                          PackageDimensions?.map((row, index) => {return(
                            <FormLayout.Group key={index} condensed>
                              <TextField value={PackageDimensions[index].width} placeholder="Width" autoComplete="off" 
                                onChange={(v)=>{
                                  console.log(v)
                                  if(validateNumber(v)){
                                    let markers = [...PackageDimensions];
                                    markers[index].width = v;
                                    setPackageDimensions(markers);
                                    return true;
                                  }else{
                                    return false;
                                  }
                                }}
                              />
                              <TextField value={PackageDimensions[index].height} placeholder="Height" autoComplete="off" 
                                onChange={(v)=>{
                                  console.log(v)
                                  if(validateNumber(v)){
                                    let markers = [...PackageDimensions];
                                    markers[index].height = v;
                                    setPackageDimensions(markers);
                                    return true;
                                  }else{
                                    return false;
                                  }
                                }}
                              />
                              <TextField value={PackageDimensions[index].length} placeholder="Length" autoComplete="off" 
                                onChange={(v)=>{
                                  console.log(v)
                                  if(validateNumber(v)){
                                    let markers = [...PackageDimensions];
                                    markers[index].length = v;
                                    setPackageDimensions(markers);
                                    return true;
                                  }else{
                                    return false;
                                  }
                                }}
                              />
                              <TextField value={PackageDimensions[index].weight} placeholder="Weight" autoComplete="off" 
                                onChange={(v)=>{
                                  console.log(v)
                                  if(validateNumber(v)){
                                    let markers = [...PackageDimensions];
                                    markers[index].weight = v;
                                    setPackageDimensions(markers);
                                    return true;
                                  }else{
                                    return false;
                                  }
                                }}
                              />
                              {
                                (PackageDimensions?.length>1) ? (
                                  <Button 
                                  onClick={()=>{removeItem(index);}}
                                  >
                                    {/* <Icon
                                      source={DeleteMajor}
                                      color="base"
                                      size={"sm"}
                                    /> */}
                                    <Icon
                                      source={CircleMinusMinor}
                                      color="red"
                                    />
                                  </Button>
                                ) : null
                              }
                              
                            </FormLayout.Group>
                          )})
                        }
                        <ButtonGroup >
                          <Button onClick={()=>{
                            setPackageDimensions([...PackageDimensions, {width: '', height: '', length: '', weight: ''}]);
                          }} alignment="right" secondary >More</Button>
                          <Button loading={IsSavingInformation} onClick={()=>{
                            saveInformation();
                          }} alignment="right" primary >Save</Button>
                        </ButtonGroup>


                      </FormLayout>
                    </Layout.Section>
                  )
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
