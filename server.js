const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const serviceAccount = require('./service.json'); // Adjust path as necessary

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://database-48dad-default-rtdb.firebaseio.com" // Replace with your Firebase database URL
});

const db = admin.database();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Nodemailer transporter setup
// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Replace with your email address
        pass: process.env.EMAIL_PASS // Replace with your email password
    }
});

console.log(process.env.EMAIL_USER);

// Endpoint to fetch member emails
app.get('/api/members/emails', async (req, res) => {
    try {
        const snapshot = await db.ref('members').once('value');
        const emails = [];

        snapshot.forEach((childSnapshot) => {
            const { email } = childSnapshot.val();
            emails.push(email);
        });

        res.status(200).json({ emails });
    } catch (error) {
        console.error('Error fetching member emails:', error);
        res.status(500).send('Failed to fetch member emails');
    }
});

// Endpoint to send email to members
app.post('/api/send-email', async (req, res) => {
    const { emails, subject, content } = req.body;

    // Configure email options with HTML content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(','),
        subject: subject,
        html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles here */
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        background-color: #f0f0f0;
                        padding: 20px;
                    }
                    .email-container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        padding: 20px;
                        margin: 20px;
                    }
                    h1 {
                        color: #333333;
                    }
                    p {
                        color: #555555;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <h1>${subject}</h1>
                    <p>${content}</p>
                    <p>Click <a href="#">here</a> to visit our website.</p>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).send('Emails sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send emails');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
