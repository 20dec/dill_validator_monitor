const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

const entries = [
{pubkey: '0x920fc3f6f568cdf4bfc41c70d421f073d4e993016bbbb52386fba37be516ac01c491f9564a9032f31b3284bbc61d8b2c'},
{pubkey: '0x8e496e01a42cb536580e51543fc13623f81add34f7479214e8659595ddc023c784060503ad683689a6ef40e4588dbd60'},

];

const fetchValidatorData = async (pubkey, port) => {
    const url = `https://alps.dill.xyz/api/trpc/stats.getAllValidators?input=%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A25%2C%22pubkey%22%3A%22${pubkey}%22%7D%7D`;

    try {
        const response = await axios.get(url);
        return response.data.result.data.json.data[0];
    } catch (error) {
        console.error(`Error fetching data for pubkey ${pubkey}:`, error);
        return null;
    }
};

app.use(cors());
app.get('/dill_validators', async (req, res) => {
    try {
        // Create an array of promises for all 35 requests
        const fetchPromises = entries.map(entry => fetchValidatorData(entry.pubkey, entry.port));

        // Wait for all requests to complete concurrently
        const validatorDataArray = await Promise.all(fetchPromises);

        // Process the results
        const validatorData = [];
        let totalBalance = 0;
        let totalWithdrawalAmount = 0;

        validatorDataArray.forEach((data, index) => {
            if (data) {
                validatorData.push({
                    pubkey: `${data.validator.pubkey.slice(0, 5)}...${data.validator.pubkey.slice(-6)}`,
                    index: data.index,
                    status: data.status,
                    balance: (parseInt(data.balance) / 1e9).toFixed(9),
                    withdrawal_amount: (parseInt(data.withdrawal_amount) / 1e9).toFixed(9)
                });

                totalBalance += parseInt(data.balance);
                totalWithdrawalAmount += parseInt(data.withdrawal_amount);
            }
        });

        res.json({
            totalBalance: (totalBalance / 1e9).toFixed(9),
            totalWithdrawalAmount: (totalWithdrawalAmount / 1e9).toFixed(9),
            validators: validatorData
        });
    } catch (error) {
        console.error('Error processing requests:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});