import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Layout } from "../../components/Layout";
import { Product } from "./Product";
import { numberToRupiah } from "../../utils/number-to-rupiah";
import './checkout.css';
import useSnap from "../../hooks/useSnap";
import { transactionCollection } from '../../utils/firebase';
import { addDoc } from 'firebase/firestore/lite';
import { BACKEND_API_URL, MIDTRANS_API_URL, MIDTRANS_SERVER_AUTHORIZATION } from '../../utils/const';

function Checkout() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({
        name: '',
        email: ''
    });
    
    const {snapEmbed} = useSnap();
    const [snapShow, setSnapShow] = useState(false);

    const getCart = useCallback(async () => {
        const cart = await localStorage.getItem('cart')
        if(cart) {
            setCart(JSON.parse(cart))
        } else {
            setCart([])
        }
    }, []);

    const handleChange = (e) => {
        setCustomer({
            ...customer,
            [e.target.name]: e.target.value
        })
    }

    const pay = async () => {
        if(!customer.name || !customer.email) {
            alert(`${!customer.name ? 'Nama' : 'Email'} harus diisi`)
            return
        }

        const transactionTimestamp = Date.now();
        const total = cart.map((item) => item.price * item.count)
                        .reduce((accu, curr) => accu + curr, 0);
        const products = cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.count
        }));
        const transaction = {
            customer_name: customer.name,
            customer_email: customer.email,
            products: products,
            total: total,
            transaction_timestamp: transactionTimestamp
        };

        var transactionSnapshot = null 
        try {
            transactionSnapshot = await addDoc(transactionCollection, transaction);
        } catch ({ name, message }) {
            return alert(message)
        }

        const transactionId = transactionSnapshot.id

        const midtransResponse = await fetch(`${MIDTRANS_API_URL}/snap/v1/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Authorization': MIDTRANS_SERVER_AUTHORIZATION,
            },
            body: JSON.stringify({
                transaction_details: {
                    order_id: transactionId,
                    gross_amount: total
                },
                credit_card: {
                    secure: "true"
                },
                customer_details: {
                    first_name: customer.name,
                    email: customer.email
                },
                item_details: products
            })
        }).then((res) => res.json())

        if(!response || response.status != 'success') {
            return alert(response.errors.map((msg) => msg.msg).join(', '))
        }

        await localStorage.removeItem('cart')

        // midtrans snap start here
        setSnapShow(true);
        snapEmbed(response.token, 'snap-container', {
            onSuccess: function (result) {
                console.log('success', result);
                navigate(`/order-status?transaction_id=${transactionId}`)
                setSnapShow(false);
            },
            onPending: function(result){
                console.log('pending', result);
                navigate(`/order-status?transaction_id=${transactionId}`)
                setSnapShow(false)
            },
            onClose: function () {
                navigate(`/order-status?transaction_id=${transactionId}`)
                setSnapShow(false)
            }
        });
        // midtrans snap end here
    }

    useEffect(() => {
        getCart()
    }, [getCart])

    const totalOrder = cart.reduce((total, item) => total + (item.count * item.price), 0);

    return (
        <Layout title="Checkout" onBack={() => navigate('/')} full={snapShow} noHeader={snapShow}>
            {!snapShow && (
                <>
                    <p className="section-title">Detail Produk</p>
                    <div className="summary">
                        {cart.map((item) => (
                            <Product key={item.id} item={item} />
                        ))}
                        <div className="item">
                            <p>Total Order</p>
                            <p>{numberToRupiah(totalOrder)}</p>
                        </div>
                    </div>
                    <p className="section-title">Detail Pelanggan</p>
                    <Input label="Nama Lengkap" value={customer.name} onChange={handleChange} name="name" />
                    <Input label="Email" value={customer.email} onChange={handleChange} name="email" />
                    <div className="action-pay">
                        <Button onClick={pay}>Bayar Sekarang</Button>
                    </div>
                </>
            )}
            <div id="snap-container"></div>
        </Layout>
    );
}

export default Checkout;
