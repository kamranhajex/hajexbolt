import {Frame, Navigation, Thumbnail} from '@shopify/polaris';
import {HomeMinor, OrdersMinor, ProductsMinor} from '@shopify/polaris-icons';
import {React, useState, useCallback, useEffect} from 'react';
import { BASE_URL, storeURL, logoSRC, pageNAME} from '../constants';

const _s = storeURL();
export function Header() {
  console.log("_s",_s);
  console.log("pageNAME", pageNAME());

  const [ActivePage, setActivePage] = useState(pageNAME());

  const handleNavigation = (newPath) => {
    setActivePage(newPath);
    console.log('Navigation: ' + newPath); // Alert to verify if the event is firing
  };

  return (
    <Frame>
      <Thumbnail
        source={logoSRC}
        alt="Logo"
        size="large"
      />
      <Navigation location={"/"} >
        <Navigation.Section
        items={[
            {
              selected:(pageNAME()=='/' || ActivePage == '') ? true : false,
              url: `/?shop=${_s}`,
              label: 'General Settings',
              icon: HomeMinor,
              onClick: () => handleNavigation(`/?shop=${_s}`),
            },
            {
              selected:(pageNAME()=='PickupLocation') ? true : false,
              url: '/PickupLocation?shop='+_s,
              label: 'Pickup Location',
              icon: OrdersMinor,
              onClick: () => handleNavigation(`/PickupLocation?shop=${_s}`),
            },
            {
              selected:(pageNAME()=='Products') ? true : false,
              url: '/Products?shop='+_s,
              label: 'Products',
              icon: OrdersMinor,
              onClick: () => handleNavigation(`/Products?shop=${_s}`),
            },
            /*{
              url: '/?shop='+_s,
              excludePaths: ['#'],
              label: 'Connect',
              icon: ProductsMinor,
            },
            {
              url: '#',
              excludePaths: ['#'],
              label: 'Amazon',
              icon: ProductsMinor,
            },
            {
              url: '#',
              excludePaths: ['#'],
              label: 'Walmart',
              icon: ProductsMinor,
            },
            {
              url: '#',
              excludePaths: ['#'],
              label: 'Ebay',
              icon: ProductsMinor,
            },
            {
              url: '#',
              excludePaths: ['#'],
              label: 'Best Buy',
              icon: ProductsMinor,
            },*/
          ]}
        />
      </Navigation>
    </Frame>
  );
}