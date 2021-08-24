import axios from 'axios';

const sendEmail = () => {
    axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [
            {
                to: [
                    {
                        email: 'johnt.champion@gmail.com',
                        name: 'John Champion'
                    }
                ],
                subject: 'Test Email'
            }
        ],
        content: [
            {
                type: 'text/html',
                value: `
                <html>
                <head></head>
                <body>SendGrid Test!</body>
                </html>
                `
            }
        ],
        from: {
            email: 'noreply@messengerhawk.chat',
            name: 'Messenger Hawk'
        }
    }, {
        headers: {
            Authorization: 'Bearer ' + process.env.SENDGRID_API_KEY,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log(response);
    }).catch(error => {
        console.error(error);
    })
}

export default sendEmail;