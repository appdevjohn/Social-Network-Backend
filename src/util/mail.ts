import axios, { AxiosResponse } from 'axios';

const sendEmail = (toEmail: string, toName: string, subject: string, content: string): Promise<AxiosResponse<any>> => {
    return axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [
            {
                to: [
                    {
                        email: toEmail,
                        name: toName
                    }
                ],
                subject: subject
            }
        ],
        content: [
            {
                type: 'text/html',
                value: content
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
    });
}

export default sendEmail;