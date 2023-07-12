import {Frame, Navigation, Thumbnail} from '@shopify/polaris';
import {HomeMinor, OrdersMinor, ProductsMinor} from '@shopify/polaris-icons';
import {React, useState, useCallback, useEffect} from 'react';
import { BASE_URL, storeURL } from '../constants';

const _s = storeURL();
export function Header() {
  console.log("_s",_s);

  const [ActivePage, setActivePage] = useState('/');

  return (
    <Frame>
      <Thumbnail
        source="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAAhCAYAAADnNyYYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAArvSURBVHgB7Zx5jCRVHce/r6pmdskMMoiiomIDBjwwO0TFRGO2xxMlKusfHjHCEC/E3ZnFWzx2RryP7DGAgMfORiXGhDBrvIPMbNR4Z1ezIcZoaMQg8eyVGVmmu+r5+3ZVYc/0e6/6mu5eqE/2tzOp97peTXX93u94v1dATk5OTk5OTk5OTk5OTs7DAyXyPUvbx0V+gub5rMj5huMlkbejPW4UOdPSdpvI59FbXiqy09L2dZGvIZtzRZ4v8lSR05JjmxOxsdky1hdECpbPHBV5D5rnHMTf4UmW9r0i319/cHQ63I1IjcOBhi652pWHsgr1oSiKSivXDx9BC4zt1GOVsDIJ+FsU1JhWelwe6jHEklKWUUpyISV4usSx7rs2WMg698iOcH/jtXrl5b3qKjQJr68aVRueGa21XJNXRocEIhdZ2m5EazxLpGg43tIXUsdbE7HxIpFDIr9G7zgL9vv1C8fnLhR5k8grRB6HzknH+rTI7cl1rYfXOSwyjWwKyTlPs7RfA4Py1qDyKl2EA4UMtPzz1E7l+RiZCqloS0O+d1V5j7I+4CNXro4rP9hVjaKiUv5YeiLLWNKu5Toxno6VjhNWVmeP33BSyfQhpTDZcExH7Nu0Aler1XF43i7DubuCh8HkCSJXZ/Th5PMVDDaPEfkhYuXgZNQN5a2nJDKR/DQxhdhyuiiILMKtvB9Bj5DnukDFqUTR4c1X3F8w9Rmd0rtU4B8WbboEay1ty+MEw8OHxdLuxAlKgMGED82Tmuj3DJF3i3wOg8d5Ij8SeXwTff8hsozmqbdMdyH2fJZgdqepxKHIOw1t7L8Iuxs+IzKLPkAFC4Y20YWdqD8+Oq13Q0dZCsf7IxZWx/dJ1Vx8m6KPiSLvlknhlOV9qi9/aycMogK/UGTScPyXiF3R9XxQhPHMHzE4FBBbXpvyrorcIPJdkd8gVuBOoBLzQWde4BxDO12+isj7sPYab4ddeWfRgfJKjHe50u7Yl/GqBJUSs6rLjB2knTFk6kqPTOlpt/JGexFhYfnaoaX1LaPbK0VxnSetYyGakT6HTJ/thCAIjlTC8HKldMHaSftbjWGIVktQ4SG4zo/BgsmaLxmO/03ktSKckYvr2jiz3iTyAgwOe2BPvpVELha5A92lhDgvYFPi94r8F7FSnpH0O8tyrk8itr5tE0b+4vHr1F0Z3Zb4nyjOvMSJi4b2sQoqBfl5ZPNOUQAqr27spPm3V8NtrgRYophLJ2+vLogi32rqoz2Pz5ftnrRFMvnMu/qMTlVmJJotNjSI8i7vG5pxfXbQYuAPw2wRGIOVRC61fI7W53UYDKg8r7K08fGjknVbeVNKcMfEM4gzzT+FWckJlTcr/9BVXFZPVVXN9fXDsKi0xVvQerbZ7DWzz1qHxiQU3XZaapxADJICny3yAcPxEmILS+5GnHk1cZ3Iqeg/rqWbm0X+hI2F94jLVCVLO3MGBUsbrXNPlZfUrKsFyeKW+FPBM7u+Wi+tzAXzaIGVuWF6SMYMt1aWcQYUlwvNNc9WMnxtZQPr+BbMKw60vvWO06dE3ojYDaznkYhd135/ARc62u4TuQRuAmSHNkcTsfEXkechTlCdi+ag8s6gx9QsnpbElJFo74NLPIyXDWhEB9EGsjZ90BQPe8q4FDqwuB6UKxLpBVwjfbrhOF29r647xpmTSm2KlS9N+t+G/uFaKurWPaWyHc3ocw/iSfgHyFZiutUz6CKBH5VGp0JrO+NWlXoC2hTYqoXluaFawqpmoaPIaCCUVu3VGejoCJR/meG6OjVEPWUQXOgC4rjLhK2Q48tIEiAGmN21VRP1gsdicCiJvFzkr44+TBDuQY9Rdje+zBh1ec7blh7wVytWparq4E60hbUKKlfgFqFL/GjD8evhTvZwSeR+w3EmZ65Bf/BFqhgcWIlFb8XlFZyO2NU+AwOArnlYnZcYZpG1xHWi4HKhWWf7OzQPFaqA1ng94uUhE2cn1+DiOMzWllnGW0R+hu4ynNFOn/HvsCvMPOLyz05pxm18hMgXRV7TRF+62FRiZrDvQRfQ9iQaDLXK9W0FKLV/dCqaDjw1wWWYcHioHESR8Vz+UIWJy6zlqsbri2umTZTdn1MbPrm0gkuBWYiwgOahIhZa6D8KdwXVRWgfehaMkZ+JWMm7xZmOtrSS6s+wK/BhZKwJdgl6AvzuJizt1Ib13leqxFzmuhsdsrLPz1xPrRX612qF/d21WuU16PFqCK7XThzfoxhPU3EalT6sJZ1ajoOVUgXj8QwFFsvddRdbQxUU2qOfLjR3O22k2/Y0xFVa3T6njbQS7BZHn23YePiA/Rx25eUy0hssbakSPxE9gNaVa8BVT5nvi9LFze/QaUltydhFeUW0hbfVdFSfYK51vxT4OYhrdDea96N1t94GH+6XWdqYRk13CHHN+j+WfkWRd2HjoDv5Y8Q7w0xwQuMWzG/Avl7NHELPlJjQwsJi+XyvkkxEtuUitdW26cHGydurXMqzLEvhwIO/q8ZJQ9oL9BwwIPRDgYdg3zfLZaNT25CLLedjiLAfncO1XVc4QaubZnqPIfYubDBsmEP3FaSAODN/vqV9RuQTWHsdH7P07akSJ4UcRqXwdJzQqnq1Yg2Tko8Fw5tubVaJOVbkq9229vqiEAVtdM1N+3v7RT9qoWmBnmxpexsyYhAL3BTA/aqmuLmIeE9suq2OD0rWWizvCycGFofQ8j7X0ZfWdr0147oq42DbF71d5C2IJywmjVrNXNMa1U8oDEX4959n6U9FNW1MYOnqCMz7W1Ml5uYSe5JIma2RqyRRR7ocRmE5CIICvGCr1tGkrW+lWqkpURwHV8Q6eob9zXrcHx5eHNlRnXVVZUn7pAy+y1qSiWjNPVIhDmjPVHjjTY9OaV1dPX7Atpe4VzB21pY2xiWtJLH4ZRcNx/kFXJD8XhD5vcgmQz9mnK9E+1DRfgvzmy2oJKxMKiXX0ObaYQP/RPw324oqqCBXw/22jXaor5pijLgEe6jwUZFdcMMJ4ZWWNt4rurFGJR6ZDu+0K0SHKHVkea+XPjvJ2y30YmPCaw1lsLjDE+upo2NQ3inJSwdcWwqTwhGvIRYf3REtul5YEBekSGZaOwyP0oeW9/kztuaRqeq8eZdUNJu1maHXFvibMCvvishn0Bl/QFwPbYoxaaE+JPJmdAfu6vk2Yst+r6Mf16NZGTaD2M1/FLoLk2rfgV156XVkKS95tciv8P+Jth5mk9MlppaXazqgXH3ggTUKxaSXKPFELTttV6qxWpvmxOrF5klp50Aa+sCQ7xm9pcBX21zjxQUp2vnaEa3tS2qd0ssYmEmrZ1vaGBOW0DlUmH9b2liu+RK0Bpdb/oU4w8zN+fQSuDGea9RcNru3iXOUEO9vpofA7C+rzujuUmG4D7jdwg8qFkOHgqWdyttsrMb1a7rKdzjGohI385KFTqEFXaiurl5gck9rmes5b4L7jU1JppbQeonnWdkXTNpe39PV8TYAWmBb2WGrD9aL4bborKy6qUtj2WAC6XTHdVQTabbUsptryJxYbra0NbOBoZ70fj3F0afVa+f1bcm4jobvSenooNbipnaAUtGxePnGKw/5/oLrXVgpSaw7z4yy9mhx1ZaMN28QmRzEtRaXVqbmpVY273M8sf4LYRgWZbzx2ng1a6/Gsuqnlao9ly2j0zeKuM6NnJyHEK5sdL8TTjk5OTk5OTk5OTk5OTk5OTk5OTk5OTknFv8DixZfYF4wCA0AAAAASUVORK5CYII="
        alt="Logo"
        size="large"
      />
      <Navigation location={ActivePage} 
      
      onClick={() => {
        console.log("onClick");
      }}
      >

        <Navigation.Section
          onClick={() => {
            console.log("onClick");
          }}

          items={[
            {
              url: `/?shop=${_s}`,
              label: 'General Settings',
              icon: HomeMinor,
              onClick: () => {
                console.log("onClick");
              }
            },
            {
              url: '/PickupLocation?shop='+_s,
              label: 'Pickup Location',
              icon: OrdersMinor,
              // badge: '15',
            },
            {
              url: '/Products?shop='+_s,
              label: 'Products',
              icon: OrdersMinor,
              // badge: '15',
            },
            {
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
            },
          ]}
        />
      </Navigation>
    </Frame>
  );
}