import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Text,
  Form, FormLayout, TextField, Button, LegacyCard, DataTable, IndexTable, useIndexResourceState,
  Modal, SkeletonBodyText, Select, ButtonGroup, Icon,
  Pagination, Thumbnail, Badge
} from "@shopify/polaris";
import {CirclePlusMinor, DeleteMajor, MobileCancelMajor, CircleMinusMinor} from '@shopify/polaris-icons';
import {useState, useCallback, useEffect} from 'react';
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import {HorizontalGrid} from '@shopify/polaris';

import { Header } from "../components";
import { BASE_URL, storeURL, noImageSRC } from '../constants';
const ShopifyApp = window['ShopifyApp'];

import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge/utilities";

const _s = storeURL();
export default function Products() {
  // const app = createApp({
  //   apiKey: "d6cd33d6ba8a62d5ff6d548d45f0df32",
  // });
  // const sessionToken = await getSessionToken(app);
  // console.log("kd sessionToken",sessionToken);

  const { t } = useTranslation();

  const [IsLoading, setIsLoading] = useState(false);
  const [ErrorMsg, setErrorMsg] = useState('');
  const [SuccessMsg, setSuccessMsg] = useState('');

  const [IsConnect, setIsConnect] = useState(false);
  const [IsConnectError, setIsConnectError] = useState(false);
  const [Products, setProducts] = useState([]);
  const [Product, setProduct] = useState('');
  const [Page_, setPage_] = useState('products');

  const [ActiveModal, setActiveModal] = useState(false);
  const [IsActiveModalLoading, setIsActiveModalLoading] = useState(false);
  const [ProductId, setProductId] = useState(0);

  const [ProductVariations, setProductVariations] = useState([]);
  const [ProductVariation, setProductVariation] = useState("'0'");

  const [DimensionType, setDimensionType] = useState('Imperial');
  const DimensionTypes = [
    {label: 'Imperial', value: 'Imperial'},
    {label: 'Metric', value: 'Metric'},
  ];

  console.log("kd current", ShopifyApp);

  const [HasPrevious, setHasPrevious] = useState(false);
  const [HasNext, setHasNext] = useState(false);

  const [PreviousId, setPreviousId] = useState(0);  
  const [NextId, setNextId] = useState(0);
  
  const [SinceIds, setSinceIds] = useState([]);
  const [EndCursor, setEndCursor] = useState('');
  const [StartCursor, setStartCursor] = useState('');

  const [IsSavingInformation, setIsSavingInformation] = useState(false);

  const [PackageDimensions, setPackageDimensions] = useState([
    // {id: 0, width: '', height: '', length: '', weight: ''},
  ]);

  // console.log("storeURL()", storeURL());
  const fetchProducts = (_p={}) => {
    var _url = `/api/kd/products?shop=${_s}`;
    if(typeof _p.EndCursor !== 'undefined'){
      _url += `&endCursor=${EndCursor}`;
    }
    if(typeof _p.StartCursor !== 'undefined'){
      _url += `&startCursor=${StartCursor}`;
    }
    fetch(_url, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2)=>{
      setIsConnect(true);
      if(typeof response2.data != 'undefined'){
        if(typeof response2.data.products != 'undefined'){
          console.log("response2.data.products.pageInfo.endCursor", response2.data.products.pageInfo.endCursor)
          if(typeof response2.data.products.pageInfo != 'undefined'){
            if(typeof response2.data.products.pageInfo.endCursor != 'undefined'){
              if(response2.data.products.pageInfo.hasNextPage){
                setEndCursor(response2.data.products.pageInfo.endCursor);
              }else{
                setEndCursor('');
              }
            }else{
              setEndCursor('');
            }
            if(typeof response2.data.products.pageInfo.startCursor != 'undefined'){
              if(response2.data.products.pageInfo.hasPreviousPage){
                setStartCursor(response2.data.products.pageInfo.startCursor);
              }else{
                setStartCursor('');
              }
            }else{
              setStartCursor('');
            }
          }

          if(typeof response2.data.products.edges != 'undefined'){
            var _Products = [];
            response2.data.products.edges.map((row, i)=>{
              var _id = row.node.id;
              _id = _id.replace("gid://shopify/Product/", "");
              
              var _image = row?.node?.images?.edges[0]?.node?.src;
              if(!_image){
                _image = noImageSRC;
              }
              _Products.push({id: _id, photo: _image, name: row.node.title, vendor: row.node.vendor, status: row.node.status});
            });
            setProducts(_Products);
            // console.log(98, response2.data.products.edges);
          }
        } // end if

      }
      
      // if(response2.success){
        // setIsConnect(response2.data.is_connect);
        // if(!response2.data.is_connect){
        //   setIsConnectError("Please connect your account to use the App.");
        // }else{
          // "id"=>$row->id,
          // "photo"=>@$row->image->src,
          // "name"=>$row->title,
          // "vendor"=>$row->vendor,
          // "status"=>$row->status,
          
          // setProducts(response2.data.products);
        // }
      // }
    });
  } // END fetchProducts

  // useEffect(()=>{
  //   fetchProducts();
  //     // fetch('/api/kd/products?shop='+_s, {
  //     //   method: 'get',
  //     // })
  //     // .then(response2 => response2.json())
  //     // .then((response2)=>{
  
  //     //   if(response2.success){
  //     //     setIsConnect(response2.data.is_connect);
  //     //     if(!response2.data.is_connect){
  //     //       setIsConnectError("Please connect your account to use the App.");
  //     //     }else{
  //     //       setProducts(response2.data.products);
  //     //     }
  //     //   }
  //     // });
  // }, []);  
  useEffect(()=>{
      fetchProducts();
  }, []);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(Products);

  const openModal = (id) => {
    setActiveModal(true);
    if(id != ProductId){
      setIsActiveModalLoading(true);
      setProductId(id);
    }
  };
  
  useEffect(() => {
    console.log("kd id productId", ProductId);
    setProduct('');
    if(ProductId){
      fetch('/api/kd/product/' + ProductId+'?shop='+_s, {
        method: 'get',
      })
      .then(response2 => response2.json())
      .then((response2) => {
        setIsActiveModalLoading(false);
        if (response2.success) {
          setIsConnect(response2.data.is_connect);
          if (!response2.data.is_connect) {
            setIsConnectError("Please connect your account to use the App.")
          } else {
            setProduct(response2.data.product);
            setProductVariations(response2.data.variations);
            console.log(response2.data.variations);
          }
        }
      });
    }
  }, [ProductId]);

  const getProductDimensions = (value) => {
    setProductVariation(value);
    let variant_id = value.replace(/'/g, "");
    setIsActiveModalLoading(true);
    fetch(`/api/kd/getProductDimensions/${ProductId}/${variant_id}?shop=${_s}`, {
      method: 'get',
    })
    .then(response2 => response2.json())
    .then((response2) => {
      setIsActiveModalLoading(false);
      if (response2.success) {
        setIsConnect(response2.data.is_connect);
        if (!response2.data.is_connect) {
          setIsConnectError("Please connect your account to use the App.")
        } else {
          setPackageDimensions(response2.data.dimensions);
          console.log(response2.data.dimensions);
        }
      }
    });
  };
  
  useEffect(() => {
    if(ProductId){
      fetch(`/api/kd/product/${ProductId}?shop=${_s}`, {
        method: 'get',
      })
      .then(response2 => response2.json())
      .then((response2) => {
        setIsActiveModalLoading(false);
        if (response2.success) {
          setIsConnect(response2.data.is_connect);
          if (!response2.data.is_connect) {
            setIsConnectError("Please connect your account to use the App.")
          } else {
            setProduct(response2.data.product);
            setProductVariations(response2.data.variations);
            console.log(response2.data.variations);
          }
        }
      });
    }
  }, [ProductId]);

  const removeItem = (index) => {
    var confirm = window.confirm("Are you sure to remove?");
    if(confirm){
      setPackageDimensions([
        ...PackageDimensions.slice(0, index),
        ...PackageDimensions.slice(index+1, PackageDimensions.length),
      ]);
      if(PackageDimensions[index].id){
        // delete from db too
        var formData = new FormData();
        formData.append("id", PackageDimensions[index].id);
        fetch('/api/kd/deleteProductDimensions?shop='+_s, {
          method: 'post',
          body: formData,
        })
        .then(response2 => response2.json())
        .then((response2) => {
  
        });
      }
    }
    return confirm;
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
    setIsActiveModalLoading(true);
    var formData = new FormData();
    formData.append("dimension_type", DimensionType);
    formData.append("product_id", ProductId);
    formData.append("variant_id", ProductVariation.replace(/'/g, ""));
    formData.append("PackageDimensions", JSON.stringify(PackageDimensions));
    fetch('/api/kd/saveProductDimensions?shop='+_s, {
      method: 'post',
      body: formData,
    })
    .then(response => response.json())
    .then((response)=>{
      getProductDimensions(ProductVariation);
      // setIsSavingInformation(false);
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

  const rowMarkup = Products.map(
    ({id, photo, name, vendor, status}, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Thumbnail
            source={photo}
            alt="Photo"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Link
            dataPrimaryLink
            // url={`/ProductPackings/?id=${id}`}
            onClick={() => {
                console.log(`Clicked ${name}`);
                openModal(id);
            }}
          >
            <Text fontWeight="bold" as="span">
              {name}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{vendor}</IndexTable.Cell>
        <IndexTable.Cell>
          {
            (status=='ACTIVE') ? (
              <Badge status="success">{status}</Badge>
            ) : (
              <Badge >{status}</Badge>
            )
          }
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

    
  return (
    <Page fullWidth >
      <TitleBar title={t("HomePage.title")} primaryAction={null} />
      <Layout>
        <HorizontalGrid columns={['oneThird', 'twoThirds']} >
          <Layout.Section>
            <Header />
          </Layout.Section>  
          <Layout.Section >
            <Page title="Products" > 
              <Modal
              loading={IsActiveModalLoading}
              large
                instant
                open={ActiveModal}
                onClose={()=>{ 
                  setActiveModal(false);
                  setPackageDimensions([]);
                  // setProductId(0);
                }}
                title={(Product?.title) ? Product?.title : ' '}
                primaryAction={{
                  content: 'Save',
                  onAction: () => {
                    // setActiveModal(false)
                    saveInformation();
                  },
                }}
                secondaryActions={[
                  {
                    content: '+ Add',
                    onAction: () => {
                      // setActiveModal(false)
                      setPackageDimensions([...PackageDimensions, {id: 0, width: '', height: '', length: '', weight: ''}]);
                    },
                  },
                ]}
              >
                <Modal.Section>
                  {
                    (IsActiveModalLoading) ? (
                      <SkeletonBodyText />
                    ) : (
                      <FormLayout style={{marginTop:20}} containerStyle={{marginTop:20}} >
                        <Select
                          label="Dimension Type"
                          options={DimensionTypes}
                          onChange={(value)=>{
                            console.log("value", value);
                            setDimensionType(value)
                          }}
                          value={DimensionType}
                        />

                        <Select
                          label="Variant"
                          options={ProductVariations}
                          onChange={(value)=>{
                            console.log("value", value);
                            getProductDimensions(value);
                            // setProductVariation(value);
                          }}
                          value={ProductVariation}
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
                    </FormLayout>
                    )
                  }
                </Modal.Section>
              </Modal>

              {
                (IsConnect) ? (
                  <Page  title="Products" > 
                    <IndexTable
                      fullWidth
                      resourceName={resourceName}
                      itemCount={Products.length}
                      selectedItemsCount={
                        allResourcesSelected ? 'All' : selectedResources.length
                      }
                      onSelectionChange={handleSelectionChange}
                      headings={[
                        {title: 'Photo'},
                        {title: 'Name'},
                        {title: 'Vendor'},
                        {title: 'Status'},
                      ]}
                      selectable={false}
                    >
                      {rowMarkup}
                    </IndexTable>
                    <div style={{marginTop:30}}>
                      <Pagination
                        hasPrevious={(StartCursor) ? true : false}
                        onPrevious={() => {
                          fetchProducts({StartCursor:StartCursor});
                        }}
                        hasNext={(EndCursor) ? true : false}
                        onNext={() => {
                          fetchProducts({EndCursor:EndCursor});
                        }}
                      />
                    </div>
                  </Page>
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
