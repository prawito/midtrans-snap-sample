require('dotenv').config()

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const db = getFirestore();

exports.charge = onRequest(async (request, response) => {
  console.log(request.body);
  const midtransUrl = `${process.env.MIDTRANS_API_URL}/snap/v1/transactions`;
  const midtransResponse = await fetch(midtransUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MIDTRANS_SERVER_AUTHORIZATION,
    },
    body: request.body
  }).then((res) => res.json())
  console.log(midtransResponse);
  response.send(midtransResponse);
});


exports.notify = onRequest(async (request, response) => {
  const requestBody = request.body
  console.log(requestBody);
  const transactionId = requestBody.order_id
  const docRef = db.collection('transactions').doc(transactionId);

  await docRef.update({
    payment_method: requestBody.payment_type,
    status: requestBody.transaction_status,
  });

  const result = "Done"
  console.log(result);
  response.send(result)
});
