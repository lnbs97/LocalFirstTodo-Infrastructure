import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
    jwksUri: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

export async function handler(event) {
    const token = event.headers?.Authorization?.split("Bearer ")[1];

    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({message: "Unauthorized"}),
        };
    }

    return new Promise((resolve) => {
        jwt.verify(
            token,
            getKey,
            {algorithms: ["RS256"]},
            (err, decoded) => {
                if (err) {
                    resolve({
                        statusCode: 401,
                        body: JSON.stringify({message: "Unauthorized"}),
                    });
                } else {
                    resolve({
                        principalId: decoded.uid,
                        policyDocument: {
                            Version: "2012-10-17",
                            Statement: [
                                {
                                    Action: "execute-api:Invoke",
                                    Effect: "Allow",
                                    Resource: event.methodArn,
                                },
                            ],
                        },
                        context: decoded,
                    });
                }
            });
    });
}
