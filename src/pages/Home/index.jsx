import { useState, useEffect } from "react";
import { Header } from "./Header";
import { ItemProduct } from "./ItemProduct";
import { FloatingCheckout } from "./FloatingCheckout";
import './home.css';
import { productCollection } from '../../utils/firebase';
import { getDocs } from 'firebase/firestore/lite';
import { useCallback } from "react";

function Home() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);

    const getCartFromLocalStorage = useCallback(async () => {
      const cart = await JSON.parse(localStorage.getItem('cart')) ?? [];
      setCart(cart);
      return cart;
    }, [])

    const getProducts = useCallback(async () => {
      var productSnapshot = null
      try {
        productSnapshot = await getDocs(productCollection);
      } catch ({ name, message }) {
        return alert(message)
      }

      const cart = await getCartFromLocalStorage();
      const products = productSnapshot.docs.map((item) => {
        let data = item.data();
        const itemFoundInCart = cart.find((product) => product.id === item.id);
        let qtySelected = 0;
        if(itemFoundInCart) {
          qtySelected = itemFoundInCart.count;
        }
        return {
          id: item.id,
          name: data.name,
          price: data.price,
          image: data.image,
          count: qtySelected
        }
      })
      setProducts(products);
  }, [getCartFromLocalStorage])

    useEffect(() => {
      getProducts();
    }, [getProducts]);

    const handleProductChange = async (product, value) => {
      let newCart = [...cart];
      if(value === 0) {
        newCart = cart.filter(item => item.id !== product.id);
      } else {
        const productItem = cart.find(item => item.id === product.id);
        const findIndex = cart.findIndex(item => item.id === product.id);
        if(productItem) {
          productItem.count = value;
          newCart[findIndex] = productItem;
        } else if(value > 0) {
          newCart.push({
            ...product,
            count: value
          })
        }
      }
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    }

    return (
      <div className='container'>
        <Header />
        <div className='main-content'>
          {products.map((product) => (
            <ItemProduct key={product.id} defaultCount={product.count} name={product.name} price={product.price} image={product.image} onProductChange={(value) => handleProductChange(product, value)} />
          ))}
        </div>
        {cart.length > 0 && (
          <FloatingCheckout cart={cart} />
        )}
      </div>
    );
  }
  
  export default Home;