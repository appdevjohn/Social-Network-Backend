class RequestError extends Error {
    code?: number

    static withMessageAndCode = (message: string, code: number) => {
        const error = new RequestError(message);
        error.code = code;
        return error;
    }

    static notAuthorized = () => {
        const error = new RequestError('Not Authorized.');
        error.code = 401;
        return error;
    }

    static accountDoesNotExist = () => {
        const error = new RequestError('This account does not exist.');
        error.code = 404;
        return error;
    }

    static passwordIncorrect = () => {
        const error = new RequestError('Password is incorrect.');
        error.code = 401;
        return error;
    }
}

export default RequestError;