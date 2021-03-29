const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://burj:burj12345@cluster0.qinpn.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 3001
const app = express()


app.use(cors())
app.use(bodyParser.json())

const serviceAccount = require("./configs/burj-al-arad-firebase-adminsdk-41hhv-242ad0d7cd.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    console.log('db connected successfully now')

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        // console.log(newBooking)
        bookings.insertOne(newBooking)
            .then(result => {
                // console.log(result)
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/bookings', (req, res) => {
        // console.log(req.headers.authorization)
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // console.log({ idToken })
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    // console.log(tokenEmail, queryEmail)
                    if (tokenEmail === queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send('un-authorized access')
                    }

                }).catch((error) => {
                    res.status(401).send('un-authorized access')
                });
        }
        else {
            res.status(401).send('un-authorized access')
        }

    })

});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port);

